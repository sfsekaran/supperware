require "json"
require_relative "orchestrator"

module RecipeParser
  # Runs a focused LLM pass to assign section labels to already-extracted
  # ingredients and steps. Used on the async URL path after JSON-LD extraction,
  # where the structured data is reliable but section information is often absent.
  #
  # On any Ollama failure the original ParseResult is returned unchanged —
  # section refinement is best-effort and must never break the parse pipeline.
  module SectionRefiner
    OLLAMA_URL   = ENV.fetch("OLLAMA_URL", "http://localhost:11434")
    OLLAMA_MODEL = ENV.fetch("OLLAMA_MODEL", "llama3.1:8b")

    def self.refine(result)
      ingredients = result.raw_ingredients
      steps       = result.steps

      return result if already_sectioned?(ingredients, steps)
      return result if ingredients.empty? && steps.empty?

      response = call_ollama(ingredients, steps)
      apply_sections(result, response, ingredients, steps)
    rescue => e
      Rails.logger.warn("[SectionRefiner] Skipping section refinement: #{e.message}")
      result
    end

    private

    def self.already_sectioned?(ingredients, steps)
      ingredients.any? { |i| i[:group_name].present? } ||
        steps.any? { |s| s[:section].present? }
    end

    def self.call_ollama(ingredients, steps)
      ing_list  = ingredients.each_with_index.map { |i, n| "#{n + 1}. #{i[:text]}" }.join("\n")
      step_list = steps.each_with_index.map { |s, n| "#{n + 1}. #{s[:text]}" }.join("\n")

      prompt = <<~PROMPT
        You are a recipe section detector. Identify logical sections in the ingredients and steps below.

        Return ONLY a valid JSON object with exactly two keys:
        - "ingredient_sections": array with one entry per ingredient — a section name string or null
        - "step_sections": array with one entry per step — a section name string or null

        Rules:
        - Use the same section name for consecutive items that belong together
        - Only identify sections clearly implied by the recipe structure
        - If there are no distinct sections, return all nulls
        - Never invent section names not supported by the recipe content

        INGREDIENTS (#{ingredients.length}):
        #{ing_list}

        STEPS (#{steps.length}):
        #{step_list}
      PROMPT

      conn = Faraday.new(url: OLLAMA_URL) do |f|
        f.options.timeout = 120
        f.request :json
        f.response :json
      end

      res = conn.post("/api/chat", {
        model:      OLLAMA_MODEL,
        stream:     false,
        format:     "json",
        keep_alive: ENV.fetch("OLLAMA_KEEP_ALIVE", "30m"),
        messages:   [ { role: "user", content: prompt } ],
        options:    { num_ctx: 2048, num_predict: 512, temperature: 0.0 }
      })

      raise "Ollama error #{res.status}: #{res.body.dig("error") || res.body}" unless res.success?
      content = res.body.dig("message", "content") or raise "Empty response from Ollama"
      Rails.logger.debug("[SectionRefiner] Response: #{content.truncate(300)}")

      cleaned = content.gsub(/```(?:json)?/, "").strip
      start   = cleaned.index("{")
      finish  = cleaned.rindex("}")
      raise "No JSON object found in Ollama response" unless start && finish
      JSON.parse(cleaned[start..finish])
    end

    def self.apply_sections(result, response, ingredients, steps)
      ing_sections  = Array(response["ingredient_sections"])
      step_sections = Array(response["step_sections"])

      new_ingredients = ingredients.each_with_index.map do |ing, i|
        label = ing_sections[i]
        label.present? ? ing.merge(group_name: label) : ing
      end

      new_steps = steps.each_with_index.map do |step, i|
        label = step_sections[i]
        label.present? ? step.merge(section: label) : step
      end

      ParseResult.new(**result.to_h.merge(raw_ingredients: new_ingredients, steps: new_steps))
    end
  end
end

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

      return result if ingredients.empty? && steps.empty?

      response = call_ollama(ingredients, steps, result.page_text)
      apply_sections(result, response, ingredients, steps)
    rescue => e
      Rails.logger.warn("[SectionRefiner] Skipping section refinement: #{e.message}")
      result
    end

    private

    def self.call_ollama(ingredients, steps, page_text = nil)
      ing_list = ingredients.each_with_index.map do |i, n|
        section = i[:group_name].present? ? " [section: #{i[:group_name]}]" : ""
        "#{n + 1}. #{i[:text]}#{section}"
      end.join("\n")
      step_list = steps.each_with_index.map do |s, n|
        hint = s[:section].present? ? " [existing: #{s[:section]}]" : ""
        "#{n + 1}. #{s[:text]}#{hint}"
      end.join("\n")

      page_text_section = page_text.present? ? <<~TEXT : ""

        ORIGINAL PAGE TEXT (use headings and bold markers to infer sections):
        #{page_text}
      TEXT

      prompt = <<~PROMPT
        You are a recipe section detector. Group ingredients and steps into their logical sections.

        Return ONLY a valid JSON object with exactly two keys:
        - "ingredient_sections": array with one entry per ingredient — a section name string or null
        - "step_sections": array with one entry per step — a section name string or null

        CRITICAL rules:
        - The array length must EXACTLY match the number of ingredients/steps listed below
        - Assign the SAME section name to ALL consecutive ingredients/steps that belong to that section
        - Do NOT cycle through section names one per item — a section covers multiple items
        - Ingredients marked [section: X] already have a confirmed section — return that exact section name for them
        - Ingredients with no [section:] marker need a section assigned based on the page text
        - Steps marked [existing: X] already have a section from the recipe structure — return that EXACT section name for them unchanged
        - For steps WITHOUT an [existing:] marker: only create a section if 2 or more consecutive unsectioned steps clearly form a distinct cooking phase. A single isolated step should get null
        - Returning null for steps is perfectly fine — do not force sections where none are obvious
        - Use section names from page headings or recipe structure, not from ingredient/step content

        Example of CORRECT output for 5 ingredients in 2 sections, 3 steps where only 2 form a group:
        {"ingredient_sections":["Cake","Cake","Cake","Frosting","Frosting"],"step_sections":[null,"Bake","Bake"]}

        Example of WRONG output (do not do this — one section per item):
        {"ingredient_sections":["Cake","Frosting","Topping","Cake","Frosting"],"step_sections":["Mix","Bake","Cool"]}
        #{page_text_section}
        INGREDIENTS (#{ingredients.length}):
        #{ing_list}

        STEPS (#{steps.length}):
        #{step_list}
      PROMPT

      # Use larger context window when page_text is provided for heading context
      num_ctx = page_text.present? ? 8192 : 2048

      conn = Faraday.new(url: OLLAMA_URL) do |f|
        f.options.timeout = 120
        f.request :json
        f.response :json
      end

      res = conn.post("/api/chat", {
        model:      OLLAMA_MODEL,
        stream:     false,
        format:     "json",
        think:      false,
        keep_alive: ENV.fetch("OLLAMA_KEEP_ALIVE", "30m"),
        messages:   [ { role: "user", content: prompt } ],
        options:    { num_ctx: num_ctx, num_predict: 512, temperature: 0.0 }
      })

      raise "Ollama error #{res.status}: #{res.body.dig("error") || res.body}" unless res.success?
      content = res.body.dig("message", "content") or raise "Empty response from Ollama"
      Rails.logger.debug("[SectionRefiner] Response: #{content.truncate(300)}")

      # Strip <think>...</think> reasoning blocks emitted by Qwen 3 and similar models
      cleaned = content.gsub(/<think>.*?<\/think>/m, "").gsub(/```(?:json)?/, "").strip
      start   = cleaned.index("{")
      finish  = cleaned.rindex("}")
      raise "No JSON object found in Ollama response" unless start && finish
      JSON.parse(cleaned[start..finish])
    end

    def self.apply_sections(result, response, ingredients, steps)
      ing_sections  = Array(response["ingredient_sections"])
      step_sections = Array(response["step_sections"])

      new_ingredients = ingredients.each_with_index.map do |ing, i|
        next ing if ing[:group_name].present?  # heuristic already classified this; trust it over LLM
        label = ing_sections[i]
        label.present? ? ing.merge(group_name: label) : ing
      end

      new_steps = steps.each_with_index.map do |step, i|
        next step if step[:section].present?  # preserve JSON-LD sections always
        label = step_sections[i]
        label.present? ? step.merge(section: label) : step
      end

      ParseResult.new(**result.to_h.merge(raw_ingredients: new_ingredients, steps: new_steps))
    end
  end
end

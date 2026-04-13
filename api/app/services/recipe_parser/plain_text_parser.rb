require "json"

module RecipeParser
  module PlainTextParser
    OLLAMA_URL  = ENV.fetch("OLLAMA_URL", "http://localhost:11434")
    OLLAMA_MODEL = ENV.fetch("OLLAMA_MODEL", "llama3.1:8b")

    PROMPT = <<~PROMPT
      You are a recipe data extractor. Extract the recipe from the text the user provides and return it as JSON.

      Return ONLY a valid JSON object. No markdown, no code fences, no explanation.

      Here is a short demonstration of the expected input and output format:

      INPUT EXAMPLE:
      ---
      Nav Home About
      Garlic Pasta
      Recipe by Jane Smith
      A quick weeknight pasta with plenty of garlic.
      Prep: 5 mins. Cook: 15 mins. Serves 2.
      Ingredients
      For the pasta:
      200g spaghetti
      4 cloves garlic, sliced
      For the sauce:
      3 tbsp olive oil
      1 tbsp butter
      Instructions
      Make the pasta
      1. Cook spaghetti in salted boiling water until al dente.
      2. Drain and set aside.
      Finish the dish
      3. Fry the garlic in olive oil over low heat until golden.
      4. Toss pasta with garlic oil, season and serve.
      ---

      OUTPUT EXAMPLE:
      {"title":"Garlic Pasta","description":"A quick weeknight pasta with plenty of garlic.","cuisine":null,"prep_time_minutes":5,"cook_time_minutes":15,"total_time_minutes":20,"yield_quantity":2,"yield_unit":"servings","yield_description":null,"ingredients":[{"text":"200g spaghetti","section":"For the pasta"},{"text":"4 cloves garlic, sliced","section":"For the pasta"},{"text":"3 tbsp olive oil","section":"For the sauce"},{"text":"1 tbsp butter","section":"For the sauce"}],"steps":[{"text":"Cook spaghetti in salted boiling water until al dente.","section":"Make the pasta"},{"text":"Drain and set aside.","section":"Make the pasta"},{"text":"Fry the garlic in olive oil over low heat until golden.","section":"Finish the dish"},{"text":"Toss pasta with garlic oil, season and serve.","section":"Finish the dish"}]}

      Now extract from the user's text, following these rules:
      - Each numbered instruction must be its own separate entry in the steps array
      - Include EVERY ingredient and EVERY step — never skip, summarise, or truncate
      - Copy ingredient text VERBATIM, word for word, in the original order — do not rearrange or reword
      - Ignore navigation, ads, reviews, and any non-recipe content
      - The title is the dish name (near "Recipe by" or before the ingredients) — never a brand or site name
      - Use null for any field not present in the text
      - If there are no sections, use null for the section field on every item
      - Never invent section names — only use section headings that appear in the original text
    PROMPT

    def self.parse(text)
      response = call_ollama(text)
      json = extract_json(response)
      build_result(json, original_text: text)
    rescue => e
      { error: "Plain text parsing failed: #{e.message}" }
    end

    private

    def self.call_ollama(text)
      conn = Faraday.new(url: OLLAMA_URL) do |f|
        f.options.timeout = 180
        f.request :json
        f.response :json
      end

      res = conn.post("/api/chat", {
        model:      OLLAMA_MODEL,
        stream:     false,
        format:     "json",
        keep_alive: ENV.fetch("OLLAMA_KEEP_ALIVE", "30m"),
        messages: [
          { role: "system", content: PROMPT },
          { role: "user",   content: "Extract the recipe from this text:\n\n#{text}" }
        ],
        options: {
          num_ctx:     8192,
          num_predict: 4096,
          temperature: 0.0
        }
      })

      raise "Ollama error #{res.status}: #{res.body.dig("error") || res.body}" unless res.success?
      content = res.body.dig("message", "content") or raise "Empty response from Ollama"
      Rails.logger.debug("[PlainTextParser] Ollama raw response: #{content.truncate(500)}")
      content
    end

    def self.extract_json(raw)
      cleaned = raw.gsub(/```(?:json)?/, "").strip
      start   = cleaned.index("{")
      finish  = cleaned.rindex("}")
      raise "No JSON object found in Ollama response" unless start && finish
      JSON.parse(cleaned[start..finish])
    rescue JSON::ParserError => e
      raise "Could not parse Ollama JSON response: #{e.message}"
    end

    def self.parse_ingredients(raw)
      Array(raw).filter_map do |item|
        next if item.blank?
        if item.is_a?(Hash)
          text = item["text"].to_s.presence
          next unless text
          { text: text, group_name: item["section"] }
        else
          text = item.to_s.presence
          next unless text
          { text: text, group_name: nil }
        end
      end
    end

    def self.split_steps(steps)
      steps.flat_map do |s|
        if s.is_a?(Hash)
          text    = s["text"].to_s.strip
          section = s["section"]
        else
          text    = s.to_s.strip
          section = nil
        end
        next [] if text.empty?

        if text.match?(/\d+\.\s+\S/)
          text.split(/(?=\d+\.\s+)/).map { |p| p.gsub(/\A\d+\.\s*/, "").strip }.reject(&:empty?)
              .map { |t| { text: t, section: section } }
        else
          [ { text: text, section: section } ]
        end
      end
    end

    def self.build_result(json, original_text: nil)
      nav_pattern = /\A(skip|view|sign|search|shop|learn|recipes?|categories|collections|features|impact|visit|save \$|recipe by)\b/i
      fallback_title = original_text&.each_line
        &.map(&:strip)
        &.reject(&:empty?)
        &.reject { |l|
          words = l.split
          l.length < 4 ||
          l.match?(nav_pattern) ||
          (words.length == 1 && l == l.upcase) ||
          words.length > 1 && words == words.each_slice(words.length / 2).to_a.uniq.flatten
        }
        &.first

      {
        recipe_attrs: {
          title:              json["title"].presence || fallback_title,
          description:        json["description"].presence,
          cuisine:            json["cuisine"].presence,
          prep_time_minutes:  json["prep_time_minutes"]&.to_i,
          cook_time_minutes:  json["cook_time_minutes"]&.to_i,
          total_time_minutes: json["total_time_minutes"]&.to_i,
          yield_quantity:     json["yield_quantity"]&.to_f,
          yield_unit:         json["yield_unit"].presence,
          yield_description:  json["yield_description"].presence,
          parsed_format:      "text_paste",
          parse_confidence:   nil
        },
        ingredients: parse_ingredients(json["ingredients"]),
        steps:       split_steps(Array(json["steps"])),
        warnings:    [],
        error:       nil
      }
    end
  end
end

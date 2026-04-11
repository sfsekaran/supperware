require "cgi"

module RecipeParser
  # Maps a raw schema.org Recipe hash to our internal attribute shape.
  module Normalizer
    def self.normalize(raw, source_url: nil)
      {
        recipe_attrs:  build_recipe_attrs(raw, source_url),
        ingredients:   extract_ingredients(raw),
        steps:         extract_steps(raw),
        warnings:      [],
      }
    end

    private

    def self.build_recipe_attrs(raw, source_url)
      {
        title:              text(raw["name"]).presence || text(raw["headline"]),
        description:        text(raw["description"]),
        source_url:         source_url,
        source_author:      extract_author(raw["author"]),
        primary_image_url:  extract_image(raw["image"]),
        prep_time_minutes:  parse_duration(raw["prepTime"]),
        cook_time_minutes:  parse_duration(raw["cookTime"]),
        total_time_minutes: parse_duration(raw["totalTime"]),
        yield_raw:          text(raw["recipeYield"]),
        yield_quantity:     extract_yield_quantity(raw["recipeYield"]),
        yield_unit:         extract_yield_unit(raw["recipeYield"]),
        yield_description:  extract_yield_description(raw["recipeYield"]),
        cuisine:            text_or_first(raw["recipeCuisine"]),
        category:           text_or_first(raw["recipeCategory"]),
        keywords:           extract_keywords(raw["keywords"]),
        nutrition:          extract_nutrition(raw["nutrition"]),
        raw_scraped_json:   raw,
        parsed_format:      "json_ld",
      }
    end

    # ISO 8601 duration → minutes (e.g. "PT1H30M" → 90)
    def self.parse_duration(str)
      return nil if str.blank?
      str = str.to_s
      hours   = str.match(/(\d+)H/)&.captures&.first.to_i
      minutes = str.match(/(\d+)M/)&.captures&.first.to_i
      total   = hours * 60 + minutes
      total > 0 ? total : nil
    end

    def self.extract_author(author)
      return nil if author.nil?
      return author["name"] if author.is_a?(Hash)
      return author.first["name"] if author.is_a?(Array) && author.first.is_a?(Hash)
      author.to_s.presence
    end

    def self.extract_image(image)
      return nil if image.nil?
      return image if image.is_a?(String)
      return image["url"] if image.is_a?(Hash)
      return image.first["url"] if image.is_a?(Array) && image.first.is_a?(Hash)
      image.first.to_s if image.is_a?(Array)
    end

    def self.extract_yield_description(raw)
      return nil if raw.blank?
      # recipeYield may be an array — find the element that contains letters
      # (the descriptive one, e.g. "one 13x18 inch pizza") vs a plain number ("16")
      Array(raw).map(&:to_s).find { |v| v.match?(/[a-z]/i) }&.strip&.presence
    end

    def self.extract_yield_quantity(raw)
      return nil if raw.blank?
      val = Array(raw).first.to_s
      val.scan(/[\d.]+/).first&.to_f
    end

    def self.extract_yield_unit(raw)
      return nil if raw.blank?
      val = Array(raw).first.to_s
      val.gsub(/[\d.]+/, "").strip.presence
    end

    def self.extract_keywords(raw)
      return [] if raw.blank?
      return raw if raw.is_a?(Array)
      raw.to_s.split(/,\s*/)
    end

    def self.extract_ingredients(raw)
      Array(raw["recipeIngredient"]).filter_map do |item|
        next if item.blank?
        # Some sites use PropertyValue objects instead of plain strings
        text = item.is_a?(Hash) ? (item["value"] || item["name"]) : item.to_s
        text.strip.presence
      end
    end

    def self.extract_steps(raw)
      instructions = raw["recipeInstructions"]
      return [] if instructions.blank?

      # Plain string — split on newline or numbered pattern
      if instructions.is_a?(String)
        return instructions.split(/\n+|\r\n+/).filter_map(&:presence).map do |s|
          { text: s.gsub(/\A\d+\.\s*/, "").strip, section: nil }
        end
      end

      steps = []
      current_section = nil

      Array(instructions).each do |item|
        # Plain string step (array of strings format)
        if item.is_a?(String)
          t = item.strip.presence
          steps << { text: t, section: current_section } if t
          next
        end

        next unless item.is_a?(Hash)

        case item["@type"]
        when "HowToSection"
          current_section = text(item["name"])
          Array(item["itemListElement"]).each do |step|
            if step.is_a?(String)
              t = step.strip.presence
              steps << { text: t, section: current_section } if t
            elsif step.is_a?(Hash)
              steps << { text: extract_step_text(step), section: current_section }
            end
          end
        when "HowToStep"
          steps << { text: extract_step_text(item), section: current_section }
        else
          # Unknown object — try to get any text out of it
          t = extract_step_text(item).presence
          steps << { text: t, section: current_section } if t
        end
      end

      steps
    end

    def self.extract_step_text(step)
      CGI.unescapeHTML((step["text"] || step["name"] || "").strip)
    end

    def self.extract_nutrition(raw)
      return nil if raw.nil?
      return nil unless raw.is_a?(Hash)
      raw.reject { |k, _| k == "@type" }
    end

    def self.text(val)
      return nil if val.nil?
      raw = val.is_a?(Hash) ? val["@value"] || val["name"] : val.to_s.presence
      raw ? CGI.unescapeHTML(raw) : nil
    end

    def self.text_or_first(val)
      return nil if val.nil?
      raw = val.is_a?(Array) ? val.first.to_s.presence : val.to_s.presence
      raw ? CGI.unescapeHTML(raw) : nil
    end
  end
end

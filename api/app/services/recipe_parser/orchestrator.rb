require_relative "fetcher"
require_relative "json_ld_extractor"
require_relative "normalizer"
require_relative "plain_text_parser"

module RecipeParser
  ParseResult = Struct.new(
    :recipe_attrs, :raw_ingredients, :steps,
    :parse_confidence, :parsed_format, :warnings, :error,
    keyword_init: true
  )

  module Orchestrator
    def self.call(url: nil, html: nil, text: nil)
      if url && html.nil?
        fetch_result = Fetcher.fetch(url)
        html = fetch_result.html
      end

      if html
        call_html(html, url)
      elsif text
        call_text(text)
      else
        ParseResult.new(error: "No input provided")
      end
    rescue FetchError => e
      ParseResult.new(error: e.message, warnings: [e.reason.to_s])
    end

    private

    def self.call_html(html, url)
      # Priority 1: JSON-LD
      raw = JsonLdExtractor.extract(html)

      if raw
        normalized = Normalizer.normalize(raw, source_url: url)
        confidence = compute_confidence(normalized, format: :json_ld)

        ParseResult.new(
          recipe_attrs:     normalized[:recipe_attrs].merge(parse_confidence: confidence, parsed_format: "json_ld"),
          raw_ingredients:  normalized[:ingredients],
          steps:            normalized[:steps],
          parse_confidence: confidence,
          parsed_format:    "json_ld",
          warnings:         normalized[:warnings]
        )
      else
        # TODO: Phase 2 — add Microdata, RDFa, HTML heuristic extractors
        ParseResult.new(
          error:    "Could not extract recipe data. Try pasting the recipe text instead.",
          warnings: ["no_structured_data"]
        )
      end
    end

    def self.call_text(text)
      result = PlainTextParser.parse(text)

      if result[:error]
        return ParseResult.new(error: result[:error])
      end

      attrs = result[:recipe_attrs]
      confidence = compute_confidence(result, format: :text_paste)

      ParseResult.new(
        recipe_attrs:     attrs.merge(parse_confidence: confidence),
        raw_ingredients:  result[:ingredients],
        steps:            result[:steps],
        parse_confidence: confidence,
        parsed_format:    "text_paste",
        warnings:         result[:warnings]
      )
    end

    def self.compute_confidence(normalized, format:)
      attrs = normalized[:recipe_attrs]
      score = 0.0
      score += 0.25 if attrs[:title].present?
      score += 0.25 if Array(normalized[:ingredients]).any?
      score += 0.25 if Array(normalized[:steps]).any?
      score += 0.15 if attrs[:total_time_minutes] || attrs[:cook_time_minutes]
      score += 0.10 if attrs[:primary_image_url].present?
      score.round(3)
    end
  end
end

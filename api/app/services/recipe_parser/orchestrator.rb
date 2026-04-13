require_relative "fetcher"
require_relative "json_ld_extractor"
require_relative "section_detector"
require_relative "normalizer"
require_relative "plain_text_parser"

module RecipeParser
  ParseResult = Struct.new(
    :recipe_attrs, :raw_ingredients, :steps,
    :parse_confidence, :parsed_format, :warnings, :error, :page_text,
    keyword_init: true
  )

  module Orchestrator
    def self.call(url: nil, html: nil, json_ld: nil, text: nil)
      # Path 1: pre-parsed JSON-LD from extension (fastest — skip fetch + extraction)
      if json_ld
        normalized = Normalizer.normalize(json_ld, source_url: url)
        confidence = compute_confidence(normalized, format: :json_ld)
        return ParseResult.new(
          recipe_attrs:     normalized[:recipe_attrs].merge(parse_confidence: confidence, parsed_format: "json_ld"),
          raw_ingredients:  normalized[:ingredients],
          steps:            normalized[:steps],
          parse_confidence: confidence,
          parsed_format:    "json_ld",
          warnings:         normalized[:warnings]
        )
      end

      # Path 2: pre-fetched HTML from extension — skip fetch, parse directly
      # Path 3: URL only — fetch HTML first
      # Don't fetch if text is provided (treat url as source metadata only)
      if url && html.nil? && text.nil?
        fetch_result = Fetcher.fetch(url)
        html = fetch_result.html
      end

      if html
        call_html(html, url)
      elsif text
        result = call_text(text)
        # Attach source URL when text paste comes from extension with a known URL
        result.recipe_attrs[:source_url] = url if url && result.recipe_attrs[:source_url].blank?
        result
      else
        ParseResult.new(error: "No input provided")
      end
    rescue FetchError => e
      ParseResult.new(error: e.message, warnings: [ e.reason.to_s ])
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
          warnings:         normalized[:warnings],
          page_text:        extract_page_text(html)
        )
      else
        # TODO: Phase 2 — add Microdata, RDFa, HTML heuristic extractors
        ParseResult.new(
          error:    "Could not extract recipe data. Try pasting the recipe text instead.",
          warnings: [ "no_structured_data" ]
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

    # Converts HTML to structured plain text preserving heading hierarchy for
    # section context. Uses node.text (full subtree) so headings with nested
    # <span> tags are captured. Selects only semantic leaf-ish elements to avoid
    # duplicating text from parent/child pairs. Strips noise first.
    def self.extract_page_text(html, max_chars: 6000)
      doc = Nokogiri::HTML(html)
      doc.css("script, style, nav, footer, header, aside, " \
              "[aria-hidden='true'], .ad, .ads, .advertisement, " \
              ".social-share, .comments").remove

      output = []
      # Select headings, direct list items, and short paragraphs only.
      # ul>li / ol>li avoids double-counting deeply nested lists.
      doc.css("h1, h2, h3, h4, h5, h6, ul > li, ol > li, p").each do |node|
        text = node.text.gsub(/\s+/, " ").strip
        next if text.empty?

        case node.name.downcase
        when "h1" then output << "\n# #{text}"
        when "h2" then output << "\n## #{text}"
        when "h3" then output << "\n### #{text}"
        when "h4", "h5", "h6" then output << "\n#### #{text}"
        when "li"  then output << "- #{text}"
        when "p"   then output << text if text.length < 400
        end
      end

      output.join("\n").squeeze("\n").strip.truncate(max_chars, omission: "…")
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

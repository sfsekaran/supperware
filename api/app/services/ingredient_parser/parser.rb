require_relative "fraction_normalizer"
require_relative "unit_registry"

module IngredientParser
  ParsedIngredient = Struct.new(
    :raw_text, :quantity, :quantity_max, :unit, :unit_normalized,
    :ingredient_name, :preparation_notes, :is_optional, :parse_confidence,
    keyword_init: true
  )

  module Parser
    # Optional indicator words
    OPTIONAL_PATTERN = /\b(optional|to taste|as needed|as desired|if desired)\b/i

    # Quantity range pattern: "1-2" or "1 to 2"
    RANGE_PATTERN = /\A([\d.]+)\s*(?:-|to)\s*([\d.]+)\s*/

    # Standalone quantity at start of string
    QUANTITY_PATTERN = /\A([\d.]+)\s*/

    def self.parse(raw_text)
      return nil_result(raw_text) if raw_text.blank?

      text = FractionNormalizer.normalize(raw_text.strip)

      is_optional = OPTIONAL_PATTERN.match?(text)
      text_clean  = text.gsub(OPTIONAL_PATTERN, "").strip

      quantity, quantity_max, text_after_quantity = extract_quantity(text_clean)
      unit, unit_normalized, text_after_unit     = extract_unit(text_after_quantity)
      name, notes                                 = extract_name_and_notes(text_after_unit)

      confidence = compute_confidence(quantity, unit, name)

      ParsedIngredient.new(
        raw_text:          raw_text,
        quantity:          quantity,
        quantity_max:      quantity_max,
        unit:              unit,
        unit_normalized:   unit_normalized,
        ingredient_name:   name.presence,
        preparation_notes: notes.presence,
        is_optional:       is_optional,
        parse_confidence:  confidence
      )
    end

    private

    def self.extract_quantity(text)
      if (m = RANGE_PATTERN.match(text))
        [m[1].to_f, m[2].to_f, text[m.end(0)..]]
      elsif (m = QUANTITY_PATTERN.match(text))
        [m[1].to_f, nil, text[m.end(0)..]]
      else
        [nil, nil, text]
      end
    end

    def self.extract_unit(text)
      m = UNIT_PATTERN.match(text)
      return [nil, nil, text] unless m

      entry = UnitRegistry.lookup(m[1])
      return [nil, nil, text] unless entry

      # Remove matched unit from text (handle leading/trailing spaces)
      remaining = (text[0...m.begin(0)] + text[m.end(0)..]).strip

      [entry[:canonical], entry[:normalized], remaining]
    end

    def self.extract_name_and_notes(text)
      text = text.strip

      # Split on comma: "all-purpose flour, sifted" → name + notes
      if (comma_idx = text.index(","))
        name  = text[0...comma_idx].strip
        notes = text[(comma_idx + 1)..].strip
      # Split on em-dash or parenthetical
      elsif (m = text.match(/\s+[-–—(]/))
        name  = text[0...m.begin(0)].strip
        notes = text[m.begin(0)..].gsub(/\A[-–—(\s]+|[)\s]+\z/, "").strip
      else
        name  = text
        notes = nil
      end

      [name, notes]
    end

    def self.compute_confidence(quantity, unit, name)
      score = 0.0
      score += 0.3 if quantity
      score += 0.3 if unit
      score += 0.4 if name.present?
      score.round(3)
    end

    def self.nil_result(raw_text)
      ParsedIngredient.new(
        raw_text: raw_text, quantity: nil, quantity_max: nil,
        unit: nil, unit_normalized: nil, ingredient_name: nil,
        preparation_notes: nil, is_optional: false, parse_confidence: 0.0
      )
    end
  end
end

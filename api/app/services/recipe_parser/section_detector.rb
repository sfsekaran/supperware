module RecipeParser
  # Heuristic detection of section headers embedded as pseudo-ingredient strings.
  # Sites sometimes include lines like "For the frosting:", "**Dough**", or "---Sauce---"
  # inside recipeIngredient arrays. This module promotes those to group_name labels
  # and removes them from the ingredient list.
  module SectionDetector
    SECTION_PATTERNS = [
      /\Afor\s+the\s+/i,
      /\Afor\s+\w/i,
      /\Ato\s+make\b/i,
      /\Amake\s+the\b/i
    ].freeze

    # Takes an array of raw ingredient strings.
    # Returns [{ text: String, group_name: String | nil }].
    def self.detect(strings)
      current_section = nil
      result = []

      strings.each do |raw|
        if header?(raw)
          current_section = clean_header(raw)
        else
          result << { text: raw, group_name: current_section }
        end
      end

      result
    end

    private

    def self.header?(raw)
      return false if raw.blank?
      clean = raw.gsub(/[\*\_]+/, "").strip
      return true if clean.end_with?(":")
      return true if SECTION_PATTERNS.any? { |p| clean.match?(p) }
      return true if raw.match?(/\A\*{1,2}[^\*]+\*{1,2}\z/)  # **Bold** or *Bold*
      return true if raw.match?(/\A-{2,}.+-{2,}\z/)           # ---Section---
      false
    end

    def self.clean_header(raw)
      raw.gsub(/[\*\_\-]+/, "").strip.chomp(":").strip
    end
  end
end

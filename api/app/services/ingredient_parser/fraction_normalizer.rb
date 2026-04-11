module IngredientParser
  module FractionNormalizer
    # Unicode vulgar fractions → decimal
    VULGAR_FRACTIONS = {
      "¼" => 0.25, "½" => 0.5,  "¾" => 0.75,
      "⅓" => 1.0/3, "⅔" => 2.0/3,
      "⅛" => 0.125, "⅜" => 0.375, "⅝" => 0.625, "⅞" => 0.875,
      "⅙" => 1.0/6, "⅚" => 5.0/6,
      "⅕" => 0.2,  "⅖" => 0.4,  "⅗" => 0.6,  "⅘" => 0.8
    }.freeze

    VULGAR_PATTERN = Regexp.new(VULGAR_FRACTIONS.keys.map { |k| Regexp.escape(k) }.join("|"))

    # "1 1/2" → "1.5", "3/4" → "0.75", "1½" → "1.5"
    def self.normalize(str)
      str = str.dup

      # Handle digit immediately followed by vulgar fraction (e.g. "1½" → "1.5")
      str.gsub!(/(\d)(#{VULGAR_PATTERN.source})/) { ($1.to_f + VULGAR_FRACTIONS[$2]).to_s }
      # Replace any remaining standalone vulgar fractions
      str.gsub!(VULGAR_PATTERN) { |m| VULGAR_FRACTIONS[m].to_s }

      # Replace slash fractions: whole + fraction "1 3/4" or standalone "3/4"
      str.gsub!(/(\d+)\s+(\d+)\/(\d+)/) do
        whole = $1.to_f
        frac  = $2.to_f / $3.to_f
        (whole + frac).to_s
      end

      str.gsub!(/\b(\d+)\/(\d+)\b/) do
        ($1.to_f / $2.to_f).to_s
      end

      str
    end
  end
end

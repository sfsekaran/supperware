module IngredientParser
  # Maps unit strings (and common abbreviations/misspellings) to a canonical form
  # and a normalized SI unit for scaling calculations.
  UNIT_REGISTRY = {
    # Volume
    "teaspoon"    => { canonical: "teaspoon",    normalized: "ml",  factor: 4.929 },
    "teaspoons"   => { canonical: "teaspoon",    normalized: "ml",  factor: 4.929 },
    "tsp"         => { canonical: "teaspoon",    normalized: "ml",  factor: 4.929 },
    "t"           => { canonical: "teaspoon",    normalized: "ml",  factor: 4.929 },
    "tablespoon"  => { canonical: "tablespoon",  normalized: "ml",  factor: 14.787 },
    "tablespoons" => { canonical: "tablespoon",  normalized: "ml",  factor: 14.787 },
    "tbsp"        => { canonical: "tablespoon",  normalized: "ml",  factor: 14.787 },
    "tbs"         => { canonical: "tablespoon",  normalized: "ml",  factor: 14.787 },
    "tb"          => { canonical: "tablespoon",  normalized: "ml",  factor: 14.787 },
    "cup"         => { canonical: "cup",         normalized: "ml",  factor: 236.588 },
    "cups"        => { canonical: "cup",         normalized: "ml",  factor: 236.588 },
    "c"           => { canonical: "cup",         normalized: "ml",  factor: 236.588 },
    "fluid ounce" => { canonical: "fl oz",       normalized: "ml",  factor: 29.574 },
    "fluid ounces"=> { canonical: "fl oz",       normalized: "ml",  factor: 29.574 },
    "fl oz"       => { canonical: "fl oz",       normalized: "ml",  factor: 29.574 },
    "floz"        => { canonical: "fl oz",       normalized: "ml",  factor: 29.574 },
    "pint"        => { canonical: "pint",        normalized: "ml",  factor: 473.176 },
    "pints"       => { canonical: "pint",        normalized: "ml",  factor: 473.176 },
    "pt"          => { canonical: "pint",        normalized: "ml",  factor: 473.176 },
    "quart"       => { canonical: "quart",       normalized: "ml",  factor: 946.353 },
    "quarts"      => { canonical: "quart",       normalized: "ml",  factor: 946.353 },
    "qt"          => { canonical: "quart",       normalized: "ml",  factor: 946.353 },
    "gallon"      => { canonical: "gallon",      normalized: "ml",  factor: 3785.41 },
    "gallons"     => { canonical: "gallon",      normalized: "ml",  factor: 3785.41 },
    "gal"         => { canonical: "gallon",      normalized: "ml",  factor: 3785.41 },
    "liter"       => { canonical: "liter",       normalized: "ml",  factor: 1000 },
    "liters"      => { canonical: "liter",       normalized: "ml",  factor: 1000 },
    "litre"       => { canonical: "liter",       normalized: "ml",  factor: 1000 },
    "litres"      => { canonical: "liter",       normalized: "ml",  factor: 1000 },
    "l"           => { canonical: "liter",       normalized: "ml",  factor: 1000 },
    "milliliter"  => { canonical: "ml",          normalized: "ml",  factor: 1 },
    "milliliters" => { canonical: "ml",          normalized: "ml",  factor: 1 },
    "millilitre"  => { canonical: "ml",          normalized: "ml",  factor: 1 },
    "ml"          => { canonical: "ml",          normalized: "ml",  factor: 1 },

    # Weight
    "gram"        => { canonical: "gram",        normalized: "g",   factor: 1 },
    "grams"       => { canonical: "gram",        normalized: "g",   factor: 1 },
    "g"           => { canonical: "gram",        normalized: "g",   factor: 1 },
    "kilogram"    => { canonical: "kilogram",    normalized: "g",   factor: 1000 },
    "kilograms"   => { canonical: "kilogram",    normalized: "g",   factor: 1000 },
    "kg"          => { canonical: "kilogram",    normalized: "g",   factor: 1000 },
    "ounce"       => { canonical: "ounce",       normalized: "g",   factor: 28.3495 },
    "ounces"      => { canonical: "ounce",       normalized: "g",   factor: 28.3495 },
    "oz"          => { canonical: "ounce",       normalized: "g",   factor: 28.3495 },
    "pound"       => { canonical: "pound",       normalized: "g",   factor: 453.592 },
    "pounds"      => { canonical: "pound",       normalized: "g",   factor: 453.592 },
    "lb"          => { canonical: "pound",       normalized: "g",   factor: 453.592 },
    "lbs"         => { canonical: "pound",       normalized: "g",   factor: 453.592 },

    # Count / descriptive
    "pinch"       => { canonical: "pinch",       normalized: nil,   factor: nil },
    "pinches"     => { canonical: "pinch",       normalized: nil,   factor: nil },
    "dash"        => { canonical: "dash",        normalized: nil,   factor: nil },
    "dashes"      => { canonical: "dash",        normalized: nil,   factor: nil },
    "handful"     => { canonical: "handful",     normalized: nil,   factor: nil },
    "handfuls"    => { canonical: "handful",     normalized: nil,   factor: nil },
    "clove"       => { canonical: "clove",       normalized: nil,   factor: nil },
    "cloves"      => { canonical: "clove",       normalized: nil,   factor: nil },
    "slice"       => { canonical: "slice",       normalized: nil,   factor: nil },
    "slices"      => { canonical: "slice",       normalized: nil,   factor: nil },
    "piece"       => { canonical: "piece",       normalized: nil,   factor: nil },
    "pieces"      => { canonical: "piece",       normalized: nil,   factor: nil },
    "sprig"       => { canonical: "sprig",       normalized: nil,   factor: nil },
    "sprigs"      => { canonical: "sprig",       normalized: nil,   factor: nil },
    "stalk"       => { canonical: "stalk",       normalized: nil,   factor: nil },
    "stalks"      => { canonical: "stalk",       normalized: nil,   factor: nil },
    "can"         => { canonical: "can",         normalized: nil,   factor: nil },
    "cans"        => { canonical: "can",         normalized: nil,   factor: nil },
    "jar"         => { canonical: "jar",         normalized: nil,   factor: nil },
    "jars"        => { canonical: "jar",         normalized: nil,   factor: nil },
    "package"     => { canonical: "package",     normalized: nil,   factor: nil },
    "packages"    => { canonical: "package",     normalized: nil,   factor: nil },
    "pkg"         => { canonical: "package",     normalized: nil,   factor: nil },
    "sheet"       => { canonical: "sheet",       normalized: nil,   factor: nil },
    "sheets"      => { canonical: "sheet",       normalized: nil,   factor: nil },
    "stick"       => { canonical: "stick",       normalized: nil,   factor: nil },
    "sticks"      => { canonical: "stick",       normalized: nil,   factor: nil },
    "head"        => { canonical: "head",        normalized: nil,   factor: nil },
    "heads"       => { canonical: "head",        normalized: nil,   factor: nil },
    "bunch"       => { canonical: "bunch",       normalized: nil,   factor: nil },
    "bunches"     => { canonical: "bunch",       normalized: nil,   factor: nil },
    "drop"        => { canonical: "drop",        normalized: nil,   factor: nil },
    "drops"       => { canonical: "drop",        normalized: nil,   factor: nil },
  }.freeze

  # Sorted longest-first so multi-word units match before single-word ones
  UNIT_PATTERN = Regexp.new(
    "\\b(" + UNIT_REGISTRY.keys.sort_by { |k| -k.length }.map { |k| Regexp.escape(k) }.join("|") + ")\\b",
    Regexp::IGNORECASE
  )

  module UnitRegistry
    def self.lookup(str)
      UNIT_REGISTRY[str.downcase.strip]
    end
  end
end

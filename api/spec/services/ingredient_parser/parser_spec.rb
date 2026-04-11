require 'rails_helper'

RSpec.describe IngredientParser::Parser do
  def parse(text)
    described_class.parse(text)
  end

  describe ".parse" do
    context "with blank input" do
      it "returns a nil result for empty string" do
        result = parse("")
        expect(result.quantity).to be_nil
        expect(result.ingredient_name).to be_nil
        expect(result.parse_confidence).to eq(0.0)
      end
    end

    context "quantity parsing" do
      it "parses a simple integer quantity" do
        result = parse("2 eggs")
        expect(result.quantity).to eq(2.0)
        expect(result.ingredient_name).to eq("eggs")
      end

      it "parses a decimal quantity" do
        result = parse("1.5 cups flour")
        expect(result.quantity).to eq(1.5)
      end

      it "parses a vulgar fraction" do
        result = parse("½ cup milk")
        expect(result.quantity).to eq(0.5)
      end

      it "parses a mixed number" do
        result = parse("1½ cups flour")
        expect(result.quantity).to eq(1.5)
      end

      it "parses a range quantity" do
        result = parse("1-2 cloves garlic")
        expect(result.quantity).to eq(1.0)
        expect(result.quantity_max).to eq(2.0)
      end

      it "parses 'X to Y' range" do
        result = parse("2 to 3 tablespoons olive oil")
        expect(result.quantity).to eq(2.0)
        expect(result.quantity_max).to eq(3.0)
      end
    end

    context "approximate prefix stripping" do
      %w[about approximately around roughly nearly].each do |prefix|
        it "strips '#{prefix}' before quantity" do
          result = parse("#{prefix} 2 cups water")
          expect(result.quantity).to eq(2.0)
          expect(result.ingredient_name).to eq("water")
        end
      end
    end

    context "unit parsing" do
      it "parses 'cup'" do
        result = parse("1 cup flour")
        expect(result.unit).to eq("cup")
      end

      it "parses plural 'cups'" do
        result = parse("2 cups flour")
        expect(result.unit).to eq("cup")
      end

      it "parses abbreviation 'tbsp'" do
        result = parse("1 tbsp butter")
        expect(result.unit).to eq("tablespoon")
      end

      it "parses 'tsp'" do
        result = parse("½ tsp salt")
        expect(result.unit).to eq("teaspoon")
      end

      it "parses 'g' as grams" do
        result = parse("200g flour")
        expect(result.unit).to eq("gram")
      end

      it "returns nil unit for no-unit ingredients" do
        result = parse("3 eggs")
        expect(result.unit).to be_nil
        expect(result.ingredient_name).to eq("eggs")
      end
    end

    context "gram weight annotation" do
      it "extracts gram weight from parenthetical" do
        result = parse("2.5 cups (300g) flour")
        expect(result.weight_grams).to eq(300.0)
        expect(result.ingredient_name).to eq("flour")
      end

      it "extracts gram weight with 'about'" do
        result = parse("1 cup (about 240g) milk")
        expect(result.weight_grams).to eq(240.0)
      end

      it "does not include the gram annotation in the ingredient name" do
        result = parse("2 cups (480g) all-purpose flour")
        expect(result.ingredient_name).not_to include("g")
        expect(result.ingredient_name).not_to include("480")
      end
    end

    context "preparation notes" do
      it "splits on comma into name + notes" do
        result = parse("2 cups flour, sifted")
        expect(result.ingredient_name).to eq("flour")
        expect(result.preparation_notes).to eq("sifted")
      end

      it "splits on em-dash" do
        result = parse("1 cup butter — softened")
        expect(result.ingredient_name).to eq("butter")
        expect(result.preparation_notes).to eq("softened")
      end
    end

    context "optional flag" do
      it "marks 'optional' ingredients" do
        result = parse("1 tsp vanilla extract (optional)")
        expect(result.is_optional).to be true
      end

      it "marks 'to taste' ingredients" do
        result = parse("salt, to taste")
        expect(result.is_optional).to be true
      end

      it "does not mark regular ingredients as optional" do
        result = parse("2 cups flour")
        expect(result.is_optional).to be false
      end
    end

    context "confidence scoring" do
      it "scores 1.0 for quantity + unit + name" do
        result = parse("2 cups flour")
        expect(result.parse_confidence).to eq(1.0)
      end

      it "scores 0.7 for quantity + name, no unit" do
        result = parse("3 eggs")
        expect(result.parse_confidence).to eq(0.7)
      end

      it "scores 0.4 for name only" do
        result = parse("salt")
        expect(result.parse_confidence).to eq(0.4)
      end

      it "scores 0.0 for blank input" do
        result = parse("")
        expect(result.parse_confidence).to eq(0.0)
      end
    end
  end
end

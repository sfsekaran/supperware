require "rails_helper"

RSpec.describe RecipeParser::SectionDetector do
  describe ".detect" do
    it "passes through a flat list with no section headers" do
      input = [ "2 cups flour", "1 tsp salt", "3 tbsp olive oil" ]
      expect(described_class.detect(input)).to eq([
        { text: "2 cups flour",    group_name: nil },
        { text: "1 tsp salt",      group_name: nil },
        { text: "3 tbsp olive oil", group_name: nil }
      ])
    end

    it "detects a colon-terminated header and assigns subsequent ingredients to it" do
      input = [ "For the cake:", "2 cups flour", "1 cup sugar", "For the frosting:", "1 cup butter" ]
      result = described_class.detect(input)
      expect(result).to eq([
        { text: "2 cups flour", group_name: "For the cake" },
        { text: "1 cup sugar",  group_name: "For the cake" },
        { text: "1 cup butter", group_name: "For the frosting" }
      ])
    end

    it "detects 'For the X' pattern without colon" do
      input = [ "For the dough", "300g flour", "200ml water" ]
      result = described_class.detect(input)
      expect(result.first[:group_name]).to eq("For the dough")
    end

    it "detects **Bold** markdown section headers" do
      input = [ "**Sauce**", "2 tbsp butter", "1 cup cream" ]
      result = described_class.detect(input)
      expect(result).to eq([
        { text: "2 tbsp butter", group_name: "Sauce" },
        { text: "1 cup cream",   group_name: "Sauce" }
      ])
    end

    it "detects ---Marker--- section headers" do
      input = [ "---Base---", "200g biscuits", "100g butter" ]
      result = described_class.detect(input)
      expect(result.first[:group_name]).to eq("Base")
    end

    it "does not treat a regular ingredient as a header" do
      input = [ "salt", "pepper", "olive oil" ]
      result = described_class.detect(input)
      expect(result.map { |i| i[:group_name] }).to all(be_nil)
    end

    it "handles an empty list" do
      expect(described_class.detect([])).to eq([])
    end
  end
end

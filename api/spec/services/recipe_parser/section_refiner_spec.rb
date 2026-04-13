require "rails_helper"
require "webmock/rspec"

RSpec.describe RecipeParser::SectionRefiner do
  let(:ollama_url) { ENV.fetch("OLLAMA_URL", "http://localhost:11434") }

  let(:ingredients) do
    [
      { text: "2 cups flour",  group_name: nil },
      { text: "1 cup sugar",   group_name: nil },
      { text: "1 cup butter",  group_name: nil },
      { text: "2 cups cream",  group_name: nil }
    ]
  end

  let(:steps) do
    [
      { text: "Mix flour and sugar.", section: nil },
      { text: "Bake at 350F.",        section: nil },
      { text: "Whip the cream.",      section: nil }
    ]
  end

  let(:base_result) do
    RecipeParser::ParseResult.new(
      recipe_attrs:     { title: "Layer Cake" },
      raw_ingredients:  ingredients,
      steps:            steps,
      parse_confidence: 0.9,
      parsed_format:    "json_ld",
      warnings:         []
    )
  end

  def stub_ollama(ingredient_sections:, step_sections:)
    stub_request(:post, "#{ollama_url}/api/chat")
      .to_return(
        status:  200,
        body:    {
          "message" => {
            "content" => { "ingredient_sections" => ingredient_sections, "step_sections" => step_sections }.to_json
          }
        }.to_json,
        headers: { "Content-Type" => "application/json" }
      )
  end

  describe ".refine" do
    context "when Ollama returns section labels" do
      before do
        stub_ollama(
          ingredient_sections: [ "For the cake", "For the cake", "For the frosting", "For the frosting" ],
          step_sections:       [ "Make the cake", "Make the cake", "Make the frosting" ]
        )
      end

      it "assigns group_name to ingredients" do
        result = described_class.refine(base_result)
        expect(result.raw_ingredients.map { |i| i[:group_name] }).to eq(
          [ "For the cake", "For the cake", "For the frosting", "For the frosting" ]
        )
      end

      it "assigns section to steps" do
        result = described_class.refine(base_result)
        expect(result.steps.map { |s| s[:section] }).to eq(
          [ "Make the cake", "Make the cake", "Make the frosting" ]
        )
      end

      it "preserves all other ParseResult fields" do
        result = described_class.refine(base_result)
        expect(result.recipe_attrs[:title]).to eq("Layer Cake")
        expect(result.parse_confidence).to eq(0.9)
      end
    end

    context "when Ollama returns all nulls (no sections)" do
      before do
        stub_ollama(
          ingredient_sections: [ nil, nil, nil, nil ],
          step_sections:       [ nil, nil, nil ]
        )
      end

      it "leaves group_names nil" do
        result = described_class.refine(base_result)
        expect(result.raw_ingredients.map { |i| i[:group_name] }).to all(be_nil)
      end
    end

    context "when sections are already present from heuristic" do
      let(:pre_sectioned) do
        RecipeParser::ParseResult.new(
          recipe_attrs:     { title: "Cake" },
          raw_ingredients:  [ { text: "2 cups flour", group_name: "For the cake" } ],
          steps:            [ { text: "Bake.", section: nil } ],
          parse_confidence: 0.9,
          parsed_format:    "json_ld",
          warnings:         []
        )
      end

      it "skips the Ollama call and returns the result unchanged" do
        expect(Faraday).not_to receive(:new)
        result = described_class.refine(pre_sectioned)
        expect(result).to eq(pre_sectioned)
      end
    end

    context "when Ollama is unavailable" do
      before do
        stub_request(:post, "#{ollama_url}/api/chat").to_timeout
      end

      it "returns the original result unchanged" do
        result = described_class.refine(base_result)
        expect(result.raw_ingredients).to eq(ingredients)
        expect(result.steps).to eq(steps)
      end
    end

    context "when ingredients and steps are both empty" do
      let(:empty_result) do
        RecipeParser::ParseResult.new(
          recipe_attrs: { title: "Empty" }, raw_ingredients: [], steps: [],
          parse_confidence: 0.5, parsed_format: "json_ld", warnings: []
        )
      end

      it "skips the Ollama call" do
        expect(Faraday).not_to receive(:new)
        described_class.refine(empty_result)
      end
    end
  end
end

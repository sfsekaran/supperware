require "rails_helper"

RSpec.describe RecipeParser::Orchestrator do
  let(:json_ld_data) do
    {
      "@type" => "Recipe",
      "name"  => "Chocolate Cake",
      "recipeIngredient" => ["2 cups flour", "1 cup sugar"],
      "recipeInstructions" => [
        { "@type" => "HowToStep", "text" => "Mix ingredients." },
        { "@type" => "HowToStep", "text" => "Bake at 350F for 30 minutes." }
      ]
    }
  end

  describe "json_ld: path (extension sync path)" do
    it "returns a ParseResult without fetching" do
      expect(RecipeParser::Fetcher).not_to receive(:fetch)
      result = described_class.call(json_ld: json_ld_data, url: "https://example.com/cake")
      expect(result.error).to be_nil
      expect(result.recipe_attrs[:title]).to eq("Chocolate Cake")
      expect(result.parsed_format).to eq("json_ld")
      expect(result.recipe_attrs[:source_url]).to eq("https://example.com/cake")
    end

    it "returns ingredient strings" do
      result = described_class.call(json_ld: json_ld_data)
      expect(result.raw_ingredients).to include("2 cups flour", "1 cup sugar")
    end

    it "returns steps" do
      result = described_class.call(json_ld: json_ld_data)
      expect(result.steps.map { |s| s[:text] }).to include("Mix ingredients.")
    end
  end

  describe "html: path (pre-fetched HTML)" do
    let(:html_with_json_ld) do
      <<~HTML
        <html><head>
        <script type="application/ld+json">
        #{json_ld_data.to_json}
        </script>
        </head><body></body></html>
      HTML
    end

    it "parses JSON-LD from HTML without fetching" do
      expect(RecipeParser::Fetcher).not_to receive(:fetch)
      result = described_class.call(html: html_with_json_ld, url: "https://example.com/cake")
      expect(result.error).to be_nil
      expect(result.recipe_attrs[:title]).to eq("Chocolate Cake")
    end

    it "returns error when HTML has no structured data" do
      result = described_class.call(html: "<html><body>No recipe here</body></html>")
      expect(result.error).to be_present
      expect(result.warnings).to include("no_structured_data")
    end
  end

  describe "url: path (fetch + parse)" do
    it "fetches the URL and extracts JSON-LD" do
      html = "<html><head><script type=\"application/ld+json\">#{json_ld_data.to_json}</script></head><body></body></html>"
      fetch_result = RecipeParser::FetchResult.new(html: html, final_url: "https://example.com/cake", status_code: 200)
      allow(RecipeParser::Fetcher).to receive(:fetch).and_return(fetch_result)

      result = described_class.call(url: "https://example.com/cake")
      expect(result.error).to be_nil
      expect(result.recipe_attrs[:title]).to eq("Chocolate Cake")
    end

    it "returns error when fetch raises FetchError" do
      allow(RecipeParser::Fetcher).to receive(:fetch)
        .and_raise(RecipeParser::FetchError.new("Paywalled site", reason: :paywall))

      result = described_class.call(url: "https://cooking.nytimes.com/recipe/123")
      expect(result.error).to eq("Paywalled site")
      expect(result.warnings).to include("paywall")
    end
  end

  describe "text: path (plain text paste)" do
    it "calls PlainTextParser and returns result" do
      allow(RecipeParser::PlainTextParser).to receive(:parse).and_return({
        recipe_attrs:    { title: "Pasta", source_url: nil },
        raw_ingredients: ["200g pasta"],
        steps:           [{ text: "Boil pasta.", section: nil }]
      })

      result = described_class.call(text: "Pasta recipe text")
      expect(result.error).to be_nil
      expect(result.recipe_attrs[:title]).to eq("Pasta")
    end

    it "attaches source_url from extension when text comes with url" do
      allow(RecipeParser::PlainTextParser).to receive(:parse).and_return({
        recipe_attrs:    { title: "Pasta", source_url: nil },
        raw_ingredients: [],
        steps:           []
      })

      result = described_class.call(text: "Pasta recipe", url: "https://example.com/pasta")
      expect(result.recipe_attrs[:source_url]).to eq("https://example.com/pasta")
    end

    it "does NOT fetch url when text is also provided" do
      allow(RecipeParser::PlainTextParser).to receive(:parse).and_return({
        recipe_attrs: { title: "Pasta" }, raw_ingredients: [], steps: []
      })
      expect(RecipeParser::Fetcher).not_to receive(:fetch)
      described_class.call(text: "some text", url: "https://example.com")
    end

    it "returns error when PlainTextParser returns error" do
      allow(RecipeParser::PlainTextParser).to receive(:parse).and_return({
        error: "Plain text parsing failed: Ollama timeout"
      })

      result = described_class.call(text: "some text")
      expect(result.error).to eq("Plain text parsing failed: Ollama timeout")
    end
  end

  describe "no input" do
    it "returns error when nothing is provided" do
      result = described_class.call
      expect(result.error).to eq("No input provided")
    end
  end
end

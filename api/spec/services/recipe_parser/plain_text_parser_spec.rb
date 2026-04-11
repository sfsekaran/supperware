require "rails_helper"
require "webmock/rspec"

RSpec.describe RecipeParser::PlainTextParser do
  let(:ollama_url) { ENV.fetch("OLLAMA_URL", "http://localhost:11434") }

  let(:ollama_response) do
    {
      "message" => {
        "content" => {
          "title"       => "Simple Pasta",
          "description" => "Quick weeknight pasta.",
          "ingredients" => ["200g pasta", "2 cloves garlic", "3 tbsp olive oil"],
          "steps"       => ["Boil pasta.", "Fry garlic.", "Toss and serve."]
        }.to_json
      }
    }
  end

  before do
    stub_request(:post, "#{ollama_url}/api/chat")
      .to_return(
        status:  200,
        body:    ollama_response.to_json,
        headers: { "Content-Type" => "application/json" }
      )
  end

  describe ".parse" do
    it "returns recipe_attrs with title from Ollama response" do
      result = described_class.parse("Some pasted recipe text")
      expect(result[:recipe_attrs][:title]).to eq("Simple Pasta")
    end

    it "returns ingredient strings" do
      result = described_class.parse("Some pasted recipe text")
      expect(result[:ingredients]).to include("200g pasta", "2 cloves garlic")
    end

    it "returns steps as hashes with text and nil section" do
      result = described_class.parse("Some pasted recipe text")
      expect(result[:steps].first).to eq({ text: "Boil pasta.", section: nil })
    end

    it "returns description" do
      result = described_class.parse("Some pasted recipe text")
      expect(result[:recipe_attrs][:description]).to eq("Quick weeknight pasta.")
    end

    context "when Ollama returns an error status" do
      before do
        stub_request(:post, "#{ollama_url}/api/chat")
          .to_return(status: 500, body: { "error" => "model not loaded" }.to_json,
                     headers: { "Content-Type" => "application/json" })
      end

      it "returns error key" do
        result = described_class.parse("text")
        expect(result[:error]).to be_present
      end
    end

    context "when Ollama is unavailable" do
      before do
        stub_request(:post, "#{ollama_url}/api/chat").to_timeout
      end

      it "returns error key on network failure" do
        result = described_class.parse("text")
        expect(result[:error]).to be_present
      end
    end

    context "when Ollama returns invalid JSON in content" do
      before do
        stub_request(:post, "#{ollama_url}/api/chat")
          .to_return(
            status:  200,
            body:    { "message" => { "content" => "not json at all" } }.to_json,
            headers: { "Content-Type" => "application/json" }
          )
      end

      it "returns error key" do
        result = described_class.parse("text")
        expect(result[:error]).to be_present
      end
    end
  end
end

require 'rails_helper'

RSpec.describe RecipeParser::Normalizer do
  def normalize(raw, source_url: nil)
    described_class.normalize(raw, source_url: source_url)
  end

  describe ".normalize" do
    let(:base_raw) do
      {
        "name"             => "Sourdough Bread",
        "description"      => "A crusty loaf",
        "recipeIngredient" => ["2 cups flour", "1 tsp salt"],
        "recipeInstructions" => [
          { "@type" => "HowToStep", "text" => "Mix ingredients." },
          { "@type" => "HowToStep", "text" => "Bake at 450°F." }
        ],
        "prepTime"     => "PT30M",
        "cookTime"     => "PT1H",
        "totalTime"    => "PT1H30M",
        "recipeYield"  => "1 loaf",
        "recipeCuisine" => "American"
      }
    end

    it "extracts the title" do
      expect(normalize(base_raw)[:recipe_attrs][:title]).to eq("Sourdough Bread")
    end

    it "uses headline as fallback when name is absent" do
      raw = base_raw.merge("name" => nil, "headline" => "Focaccia")
      expect(normalize(raw)[:recipe_attrs][:title]).to eq("Focaccia")
    end

    it "extracts description" do
      expect(normalize(base_raw)[:recipe_attrs][:description]).to eq("A crusty loaf")
    end

    it "attaches source_url" do
      result = normalize(base_raw, source_url: "https://example.com/recipe")
      expect(result[:recipe_attrs][:source_url]).to eq("https://example.com/recipe")
    end

    it "parses ISO 8601 durations" do
      attrs = normalize(base_raw)[:recipe_attrs]
      expect(attrs[:prep_time_minutes]).to eq(30)
      expect(attrs[:cook_time_minutes]).to eq(60)
      expect(attrs[:total_time_minutes]).to eq(90)
    end

    it "parses durations with hours and minutes" do
      raw = base_raw.merge("prepTime" => "PT1H15M")
      expect(normalize(raw)[:recipe_attrs][:prep_time_minutes]).to eq(75)
    end

    it "extracts ingredients as plain strings" do
      expect(normalize(base_raw)[:ingredients]).to eq(["2 cups flour", "1 tsp salt"])
    end

    it "extracts steps" do
      steps = normalize(base_raw)[:steps]
      expect(steps.length).to eq(2)
      expect(steps.first[:text]).to eq("Mix ingredients.")
    end

    it "handles HowToSection with nested steps" do
      raw = base_raw.merge("recipeInstructions" => [
        {
          "@type" => "HowToSection",
          "name"  => "Prep",
          "itemListElement" => [
            { "@type" => "HowToStep", "text" => "Do prep." }
          ]
        }
      ])
      steps = normalize(raw)[:steps]
      expect(steps.first[:section]).to eq("Prep")
      expect(steps.first[:text]).to eq("Do prep.")
    end

    it "decodes HTML entities in text fields" do
      raw = base_raw.merge("name" => "It&#39;s Bread")
      expect(normalize(raw)[:recipe_attrs][:title]).to eq("It's Bread")
    end

    it "decodes HTML entities in step text" do
      raw = base_raw.merge("recipeInstructions" => [
        { "@type" => "HowToStep", "text" => "Set the oven&#39;s dial." }
      ])
      expect(normalize(raw)[:steps].first[:text]).to eq("Set the oven's dial.")
    end

    it "extracts image URL from a string" do
      raw = base_raw.merge("image" => "https://example.com/bread.jpg")
      expect(normalize(raw)[:recipe_attrs][:primary_image_url]).to eq("https://example.com/bread.jpg")
    end

    it "extracts image URL from a hash" do
      raw = base_raw.merge("image" => { "url" => "https://example.com/bread.jpg" })
      expect(normalize(raw)[:recipe_attrs][:primary_image_url]).to eq("https://example.com/bread.jpg")
    end

    it "extracts image URL from an array" do
      raw = base_raw.merge("image" => [{ "url" => "https://example.com/bread.jpg" }])
      expect(normalize(raw)[:recipe_attrs][:primary_image_url]).to eq("https://example.com/bread.jpg")
    end

    it "extracts yield quantity" do
      expect(normalize(base_raw)[:recipe_attrs][:yield_quantity]).to eq(1.0)
    end

    it "extracts yield unit" do
      expect(normalize(base_raw)[:recipe_attrs][:yield_unit]).to eq("loaf")
    end

    it "extracts cuisine" do
      expect(normalize(base_raw)[:recipe_attrs][:cuisine]).to eq("American")
    end

    it "handles nil gracefully" do
      result = normalize({})
      expect(result[:recipe_attrs][:title]).to be_nil
      expect(result[:ingredients]).to eq([])
      expect(result[:steps]).to eq([])
    end
  end
end

require 'rails_helper'

RSpec.describe RecipeParser::JsonLdExtractor do
  def extract(html)
    described_class.extract(html)
  end

  def ld_script(data)
    "<html><head><script type=\"application/ld+json\">#{data.to_json}</script></head></html>"
  end

  describe ".extract" do
    it "extracts a plain Recipe object" do
      html = ld_script({ "@type" => "Recipe", "name" => "Bread" })
      result = extract(html)
      expect(result["name"]).to eq("Bread")
    end

    it "extracts a Recipe from an @graph array" do
      data = {
        "@graph" => [
          { "@type" => "WebPage", "name" => "Home" },
          { "@type" => "Recipe", "name" => "Pizza" }
        ]
      }
      result = extract(ld_script(data))
      expect(result["name"]).to eq("Pizza")
    end

    it "extracts a Recipe from an array of LD blocks" do
      html = "<html><head>" \
             "<script type=\"application/ld+json\">{\"@type\":\"WebSite\"}</script>" \
             "<script type=\"application/ld+json\">{\"@type\":\"Recipe\",\"name\":\"Pasta\"}</script>" \
             "</head></html>"
      result = extract(html)
      expect(result["name"]).to eq("Pasta")
    end

    it "handles schema.org URL prefix in @type" do
      html = ld_script({ "@type" => "http://schema.org/Recipe", "name" => "Soup" })
      expect(extract(html)["name"]).to eq("Soup")
    end

    it "handles https schema.org prefix" do
      html = ld_script({ "@type" => "https://schema.org/Recipe", "name" => "Stew" })
      expect(extract(html)["name"]).to eq("Stew")
    end

    it "handles @type as an array" do
      html = ld_script({ "@type" => [ "Article", "Recipe" ], "name" => "Cake" })
      expect(extract(html)["name"]).to eq("Cake")
    end

    it "returns nil when no Recipe type found" do
      html = ld_script({ "@type" => "Article", "name" => "News" })
      expect(extract(html)).to be_nil
    end

    it "returns nil for HTML with no ld+json scripts" do
      expect(extract("<html><body>nothing</body></html>")).to be_nil
    end

    it "skips invalid JSON blocks without raising" do
      html = "<html><head>" \
             "<script type=\"application/ld+json\">NOT JSON</script>" \
             "<script type=\"application/ld+json\">{\"@type\":\"Recipe\",\"name\":\"Valid\"}</script>" \
             "</head></html>"
      expect(extract(html)["name"]).to eq("Valid")
    end
  end
end

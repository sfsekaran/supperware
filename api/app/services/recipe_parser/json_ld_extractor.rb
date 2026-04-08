require "nokogiri"
require "json"

module RecipeParser
  module JsonLdExtractor
    def self.extract(html)
      doc = Nokogiri::HTML(html)
      scripts = doc.css('script[type="application/ld+json"]')

      scripts.each do |script|
        data = JSON.parse(script.content)
        recipe = find_recipe_node(data)
        return recipe if recipe
      rescue JSON::ParserError
        next
      end

      nil
    end

    private

    def self.find_recipe_node(data)
      return nil if data.nil?

      # Array of LD blocks
      if data.is_a?(Array)
        data.each do |item|
          found = find_recipe_node(item)
          return found if found
        end
        return nil
      end

      return nil unless data.is_a?(Hash)

      # @graph wrapper
      if data["@graph"].is_a?(Array)
        data["@graph"].each do |node|
          found = find_recipe_node(node)
          return found if found
        end
        return nil
      end

      recipe_type?(data["@type"]) ? data : nil
    end

    def self.recipe_type?(type)
      return false if type.nil?
      types = Array(type)
      types.any? do |t|
        t.to_s.gsub(%r{https?://schema\.org/}, "").downcase == "recipe"
      end
    end
  end
end

require 'rails_helper'

RSpec.describe "Api::V1::Ingredients", type: :request do
  let(:user)    { create(:user) }
  let(:recipe)  { create(:recipe, user: user) }
  let(:headers) { { "X-Api-Token" => user.api_token } }

  describe "GET /api/v1/recipes/:recipe_id/ingredients" do
    it "returns ingredients ordered by position" do
      create(:ingredient, recipe: recipe, raw_text: "2 cups flour", position: 2)
      create(:ingredient, recipe: recipe, raw_text: "1 tsp salt",   position: 1)

      get "/api/v1/recipes/#{recipe.id}/ingredients", headers: headers
      body = JSON.parse(response.body)
      expect(response).to have_http_status(:ok)
      expect(body.first["raw_text"]).to eq("1 tsp salt")
    end
  end

  describe "POST /api/v1/recipes/:recipe_id/ingredients" do
    it "creates and parses an ingredient" do
      post "/api/v1/recipes/#{recipe.id}/ingredients", headers: headers,
        params: { ingredient: { raw_text: "2 cups flour", position: 1 } }

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body["raw_text"]).to eq("2 cups flour")
      expect(body["quantity"].to_f).to eq(2.0)
      expect(body["unit"]).to eq("cup")
      expect(body["ingredient_name"]).to eq("flour")
    end
  end

  describe "PATCH /api/v1/recipes/:recipe_id/ingredients/:id" do
    let(:ingredient) { create(:ingredient, recipe: recipe, raw_text: "1 cup sugar") }

    it "updates and re-parses the ingredient" do
      patch "/api/v1/recipes/#{recipe.id}/ingredients/#{ingredient.id}", headers: headers,
        params: { ingredient: { raw_text: "2 tablespoons butter" } }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["raw_text"]).to eq("2 tablespoons butter")
      expect(body["quantity"].to_f).to eq(2.0)
      expect(body["unit"]).to eq("tablespoon")
      expect(body["ingredient_name"]).to eq("butter")
    end
  end

  describe "DELETE /api/v1/recipes/:recipe_id/ingredients/:id" do
    let!(:ingredient) { create(:ingredient, recipe: recipe) }

    it "deletes the ingredient" do
      delete "/api/v1/recipes/#{recipe.id}/ingredients/#{ingredient.id}", headers: headers
      expect(response).to have_http_status(:no_content)
      expect(Ingredient.find_by(id: ingredient.id)).to be_nil
    end
  end
end

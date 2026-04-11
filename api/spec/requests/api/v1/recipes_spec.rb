require 'rails_helper'

RSpec.describe "Api::V1::Recipes", type: :request do
  let(:user)    { create(:user) }
  let(:headers) { { "X-Api-Token" => user.api_token } }

  describe "GET /api/v1/recipes" do
    it "returns the user's recipes" do
      create_list(:recipe, 3, user: user)
      create(:recipe)  # another user's recipe

      get "/api/v1/recipes", headers: headers
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).length).to eq(3)
    end

    it "excludes soft-deleted recipes" do
      create(:recipe, user: user)
      create(:recipe, user: user, deleted_at: Time.current)

      get "/api/v1/recipes", headers: headers
      expect(JSON.parse(response.body).length).to eq(1)
    end

    it "requires authentication" do
      get "/api/v1/recipes"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/recipes/:id" do
    let(:recipe) { create(:recipe, :with_ingredients, :with_steps, user: user) }

    it "returns the recipe with ingredients and steps" do
      get "/api/v1/recipes/#{recipe.id}", headers: headers
      body = JSON.parse(response.body)
      expect(response).to have_http_status(:ok)
      expect(body["title"]).to eq(recipe.title)
      expect(body["ingredients"]).to be_present
      expect(body["steps"]).to be_present
    end

    it "returns 404 for another user's recipe" do
      other = create(:recipe)
      get "/api/v1/recipes/#{other.id}", headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/recipes" do
    it "creates a recipe" do
      post "/api/v1/recipes", headers: headers,
        params: { recipe: { title: "New Recipe", visibility: "private" } }
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body)["title"]).to eq("New Recipe")
    end

    it "generates a slug" do
      post "/api/v1/recipes", headers: headers,
        params: { recipe: { title: "My Great Dish" } }
      expect(JSON.parse(response.body)["slug"]).to eq("my-great-dish")
    end

    it "returns 422 without a title" do
      post "/api/v1/recipes", headers: headers,
        params: { recipe: { visibility: "private" } }
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "PATCH /api/v1/recipes/:id" do
    let(:recipe) { create(:recipe, user: user, title: "Old Title") }

    it "updates the recipe" do
      patch "/api/v1/recipes/#{recipe.id}", headers: headers,
        params: { recipe: { title: "New Title" } }
      expect(response).to have_http_status(:ok)
      expect(recipe.reload.title).to eq("New Title")
    end

    it "returns 404 for another user's recipe" do
      other = create(:recipe)
      patch "/api/v1/recipes/#{other.id}", headers: headers,
        params: { recipe: { title: "Hack" } }
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /api/v1/recipes/:id" do
    let(:recipe) { create(:recipe, user: user) }

    it "soft-deletes the recipe" do
      delete "/api/v1/recipes/#{recipe.id}", headers: headers
      expect(response).to have_http_status(:no_content)
      expect(recipe.reload.deleted_at).to be_present
    end
  end
end

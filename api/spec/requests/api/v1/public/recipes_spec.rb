require 'rails_helper'

RSpec.describe "Api::V1::Public::Recipes", type: :request do
  let(:user)   { create(:user, username: "chefmike", public_profile: true) }
  let(:recipe) { create(:recipe, :public, :with_ingredients, :with_steps, user: user, title: "Great Soup") }

  describe "GET /api/v1/public/users/:username/recipes" do
    it "returns public recipes for the user" do
      recipe  # ensure created
      create(:recipe, user: user, visibility: "private")  # should be excluded

      get "/api/v1/public/users/#{user.username}/recipes"
      body = JSON.parse(response.body)
      expect(response).to have_http_status(:ok)
      expect(body.length).to eq(1)
      expect(body.first["title"]).to eq("Great Soup")
    end

    it "returns 404 for non-public user" do
      private_user = create(:user, username: "hidden", public_profile: false)
      get "/api/v1/public/users/#{private_user.username}/recipes"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/public/users/:username/recipes/:slug" do
    it "returns the full recipe detail" do
      get "/api/v1/public/users/#{user.username}/recipes/#{recipe.slug}"
      body = JSON.parse(response.body)
      expect(response).to have_http_status(:ok)
      expect(body["title"]).to eq("Great Soup")
      expect(body["ingredients"]).to be_an(Array)
      expect(body["steps"]).to be_an(Array)
    end

    it "returns 404 for a private recipe" do
      private_recipe = create(:recipe, user: user, visibility: "private")
      get "/api/v1/public/users/#{user.username}/recipes/#{private_recipe.slug}"
      expect(response).to have_http_status(:not_found)
    end

    it "returns 404 for unknown slug" do
      get "/api/v1/public/users/#{user.username}/recipes/no-such-recipe"
      expect(response).to have_http_status(:not_found)
    end
  end
end

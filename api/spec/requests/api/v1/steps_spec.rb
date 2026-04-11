require 'rails_helper'

RSpec.describe "Api::V1::Steps", type: :request do
  let(:user)    { create(:user) }
  let(:recipe)  { create(:recipe, user: user) }
  let(:headers) { { "X-Api-Token" => user.api_token } }

  describe "GET /api/v1/recipes/:recipe_id/steps" do
    it "returns steps ordered by position" do
      create(:step, recipe: recipe, instruction: "Second", position: 2)
      create(:step, recipe: recipe, instruction: "First",  position: 1)

      get "/api/v1/recipes/#{recipe.id}/steps", headers: headers
      body = JSON.parse(response.body)
      expect(body.first["instruction"]).to eq("First")
    end
  end

  describe "POST /api/v1/recipes/:recipe_id/steps" do
    it "creates a step" do
      post "/api/v1/recipes/#{recipe.id}/steps", headers: headers,
        params: { step: { instruction: "Preheat the oven.", position: 1 } }

      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body)["instruction"]).to eq("Preheat the oven.")
    end
  end

  describe "PATCH /api/v1/recipes/:recipe_id/steps/:id" do
    let(:step) { create(:step, recipe: recipe, instruction: "Old text.") }

    it "updates the step" do
      patch "/api/v1/recipes/#{recipe.id}/steps/#{step.id}", headers: headers,
        params: { step: { instruction: "New text." } }

      expect(response).to have_http_status(:ok)
      expect(step.reload.instruction).to eq("New text.")
    end
  end

  describe "DELETE /api/v1/recipes/:recipe_id/steps/:id" do
    let!(:step) { create(:step, recipe: recipe) }

    it "deletes the step" do
      delete "/api/v1/recipes/#{recipe.id}/steps/#{step.id}", headers: headers
      expect(response).to have_http_status(:no_content)
      expect(Step.find_by(id: step.id)).to be_nil
    end
  end
end

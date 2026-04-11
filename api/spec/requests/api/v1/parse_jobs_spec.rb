require 'rails_helper'

RSpec.describe "Api::V1::ParseJobs", type: :request do
  let(:user)    { create(:user) }
  let(:headers) { { "X-Api-Token" => user.api_token } }

  describe "GET /api/v1/parse_jobs/:id" do
    let(:job) { user.parse_jobs.create!(status: "pending", url: "https://example.com/recipe") }

    it "returns job status" do
      get "/api/v1/parse_jobs/#{job.id}", headers: headers
      body = JSON.parse(response.body)
      expect(response).to have_http_status(:ok)
      expect(body["status"]).to eq("pending")
      expect(body["url"]).to eq("https://example.com/recipe")
    end

    it "returns 404 for another user's job" do
      other_job = create(:user).parse_jobs.create!(status: "pending")
      get "/api/v1/parse_jobs/#{other_job.id}", headers: headers
      expect(response).to have_http_status(:not_found)
    end

    it "includes result_recipe_id when done" do
      recipe = create(:recipe, user: user)
      job.complete!(recipe)
      get "/api/v1/parse_jobs/#{job.id}", headers: headers
      expect(JSON.parse(response.body)["result_recipe_id"]).to eq(recipe.id)
    end
  end
end

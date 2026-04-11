require 'rails_helper'

RSpec.describe "Api::V1::Settings", type: :request do
  let(:user)    { create(:user) }
  let(:headers) { { "X-Api-Token" => user.api_token } }

  describe "GET /api/v1/settings" do
    it "returns the user's settings including api_token" do
      get "/api/v1/settings", headers: headers
      body = JSON.parse(response.body)
      expect(response).to have_http_status(:ok)
      expect(body["api_token"]).to eq(user.api_token)
      expect(body["email"]).to eq(user.email)
    end

    it "requires authentication" do
      get "/api/v1/settings"
      expect(response).to have_http_status(:unauthorized)
    end
  end
end

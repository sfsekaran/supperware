require 'rails_helper'

RSpec.describe "Api::V1::Public::Profiles", type: :request do
  let(:user) { create(:user, username: "chefmike", public_profile: true, bio: "I cook things.") }

  describe "GET /api/v1/public/users/:username" do
    it "returns the public profile" do
      get "/api/v1/public/users/#{user.username}"
      body = JSON.parse(response.body)
      expect(response).to have_http_status(:ok)
      expect(body["username"]).to eq("chefmike")
      expect(body["bio"]).to eq("I cook things.")
    end

    it "returns 404 for a non-public profile" do
      private_user = create(:user, username: "secretchef", public_profile: false)
      get "/api/v1/public/users/#{private_user.username}"
      expect(response).to have_http_status(:not_found)
    end

    it "returns 404 for an unknown username" do
      get "/api/v1/public/users/nobody"
      expect(response).to have_http_status(:not_found)
    end
  end
end

require 'rails_helper'

RSpec.describe "Api::V1::Auth", type: :request do
  describe "POST /api/v1/auth/sign_up" do
    it "creates a user and returns a token" do
      post "/api/v1/auth/sign_up", params: {
        user: { email: "new@example.com", password: "password123",
                password_confirmation: "password123", username: "newuser" }
      }
      expect(response).to have_http_status(:created)
      expect(response.headers["Authorization"]).to be_present
      expect(JSON.parse(response.body)["user"]["username"]).to eq("newuser")
    end

    it "rejects duplicate username" do
      create(:user, username: "taken")
      post "/api/v1/auth/sign_up", params: {
        user: { email: "x@example.com", password: "password123",
                password_confirmation: "password123", username: "taken" }
      }
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "POST /api/v1/auth/sign_in" do
    let!(:user) { create(:user, email: "login@example.com", password: "password123") }

    it "returns a JWT token on success" do
      post "/api/v1/auth/sign_in", params: {
        user: { email: "login@example.com", password: "password123" }
      }
      expect(response).to have_http_status(:ok)
      expect(response.headers["Authorization"]).to match(/\ABearer /)
    end

    it "rejects invalid credentials" do
      post "/api/v1/auth/sign_in", params: {
        user: { email: "login@example.com", password: "wrong" }
      }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /api/v1/auth/sign_out" do
    it "signs out successfully" do
      post "/api/v1/auth/sign_in", params: {
        user: { email: create(:user).email, password: "password123" }
      }
      token = response.headers["Authorization"]
      delete "/api/v1/auth/sign_out", headers: { "Authorization" => token }
      expect(response).to have_http_status(:ok)
    end
  end
end

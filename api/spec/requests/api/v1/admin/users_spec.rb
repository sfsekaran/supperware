require "rails_helper"

RSpec.describe "Api::V1::Admin::Users", type: :request do
  let(:admin)      { create(:user, admin: true) }
  let(:non_admin)  { create(:user, admin: false) }
  let(:admin_headers)     { { "X-Api-Token" => admin.api_token } }
  let(:non_admin_headers) { { "X-Api-Token" => non_admin.api_token } }

  describe "GET /api/v1/admin/users" do
    context "as a non-admin" do
      it "returns 403" do
        get "/api/v1/admin/users", headers: non_admin_headers
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "unauthenticated" do
      it "returns 401" do
        get "/api/v1/admin/users"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "as an admin" do
      let!(:user_with_recipes) do
        u = create(:user, public_profile: true)
        create_list(:recipe, 3, user: u)
        u
      end
      let!(:user_no_recipes) { create(:user, public_profile: false) }

      it "returns 200 with a users array" do
        get "/api/v1/admin/users", headers: admin_headers
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body["users"]).to be_an(Array)
      end

      it "includes all users" do
        get "/api/v1/admin/users", headers: admin_headers
        body = JSON.parse(response.body)
        ids = body["users"].map { |u| u["id"] }
        expect(ids).to include(user_with_recipes.id, user_no_recipes.id)
      end

      it "includes recipe_count for each user" do
        get "/api/v1/admin/users", headers: admin_headers
        body = JSON.parse(response.body)
        found = body["users"].find { |u| u["id"] == user_with_recipes.id }
        expect(found["recipe_count"]).to eq(3)
      end

      it "returns recipe_count 0 for a user with no recipes" do
        get "/api/v1/admin/users", headers: admin_headers
        body = JSON.parse(response.body)
        found = body["users"].find { |u| u["id"] == user_no_recipes.id }
        expect(found["recipe_count"]).to eq(0)
      end

      it "returns meta with total and pagination info" do
        get "/api/v1/admin/users", headers: admin_headers
        body = JSON.parse(response.body)
        expect(body["meta"]).to include("total", "page", "per_page", "pages")
        expect(body["meta"]["page"]).to eq(1)
      end

      it "does not count soft-deleted recipes" do
        recipe = create(:recipe, user: user_with_recipes)
        recipe.update_column(:deleted_at, Time.current)

        get "/api/v1/admin/users", headers: admin_headers
        body = JSON.parse(response.body)
        found = body["users"].find { |u| u["id"] == user_with_recipes.id }
        expect(found["recipe_count"]).to eq(3)
      end

      it "exposes public_profile and admin flags" do
        get "/api/v1/admin/users", headers: admin_headers
        body = JSON.parse(response.body)
        found = body["users"].find { |u| u["id"] == user_with_recipes.id }
        expect(found).to include("public_profile" => true, "admin" => false)
      end
    end
  end

  describe "GET /api/v1/admin/users/:id" do
    let(:target) { create(:user, bio: "I love cooking.", public_profile: true) }

    context "as a non-admin" do
      it "returns 403" do
        get "/api/v1/admin/users/#{target.id}", headers: non_admin_headers
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "as an admin" do
      before { create_list(:recipe, 2, user: target) }

      it "returns 200 with user detail" do
        get "/api/v1/admin/users/#{target.id}", headers: admin_headers
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body["user"]["username"]).to eq(target.username)
        expect(body["user"]["bio"]).to eq("I love cooking.")
        expect(body["user"]["recipe_count"]).to eq(2)
      end

      it "returns the user's recipes" do
        get "/api/v1/admin/users/#{target.id}", headers: admin_headers
        body = JSON.parse(response.body)
        expect(body["recipes"].length).to eq(2)
        expect(body["recipes"].first).to include("title", "slug", "visibility", "status")
      end

      it "excludes soft-deleted recipes" do
        recipe = create(:recipe, user: target)
        recipe.update_column(:deleted_at, Time.current)

        get "/api/v1/admin/users/#{target.id}", headers: admin_headers
        body = JSON.parse(response.body)
        expect(body["recipes"].length).to eq(2)
      end

      it "returns 404 for unknown user" do
        get "/api/v1/admin/users/999999", headers: admin_headers
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end

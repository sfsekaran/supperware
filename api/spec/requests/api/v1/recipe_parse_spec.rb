require "rails_helper"

RSpec.describe "Api::V1::RecipeParse", type: :request do
  let(:user)    { create(:user) }
  let(:headers) { { "X-Api-Token" => user.api_token } }

  let(:json_ld_data) do
    {
      "@type"             => "Recipe",
      "name"              => "Chocolate Cake",
      "recipeIngredient"  => [ "2 cups flour", "1 cup sugar" ],
      "recipeInstructions" => [
        { "@type" => "HowToStep", "text" => "Mix and bake." }
      ]
    }
  end

  let(:success_result) do
    RecipeParser::ParseResult.new(
      recipe_attrs:     { title: "Chocolate Cake", source_url: "https://example.com" },
      raw_ingredients:  [
        { text: "2 cups flour", group_name: nil },
        { text: "1 cup sugar",  group_name: nil }
      ],
      steps:            [ { text: "Mix and bake.", section: nil } ],
      parse_confidence: 0.9,
      parsed_format:    "json_ld",
      warnings:         []
    )
  end

  describe "POST /api/v1/recipes/parse" do
    context "with no params" do
      it "returns 400 bad request" do
        post "/api/v1/recipes/parse", headers: headers
        expect(response).to have_http_status(:bad_request)
      end
    end

    context "sync path — json_ld param provided" do
      before do
        allow(RecipeParser::Orchestrator).to receive(:call).and_return(success_result)
      end

      it "creates a recipe and returns 201" do
        post "/api/v1/recipes/parse", headers: headers,
          params: { json_ld: json_ld_data.to_json, url: "https://example.com" }

        expect(response).to have_http_status(:created)
        body = JSON.parse(response.body)
        expect(body["recipe_id"]).to be_present
        expect(body["status"]).to eq("saved")
      end

      it "creates ingredients from the parse result" do
        expect {
          post "/api/v1/recipes/parse", headers: headers,
            params: { json_ld: json_ld_data.to_json }
        }.to change(Ingredient, :count).by(2)
      end

      it "creates steps from the parse result" do
        expect {
          post "/api/v1/recipes/parse", headers: headers,
            params: { json_ld: json_ld_data.to_json }
        }.to change(Step, :count).by(1)
      end

      it "uses og_image as fallback primary_image_url" do
        result_no_image = RecipeParser::ParseResult.new(
          recipe_attrs:    { title: "Cake", source_url: nil, primary_image_url: nil },
          raw_ingredients: [], # no ingredients
          steps:           [],
          parse_confidence: 0.8,
          parsed_format:   "json_ld",
          warnings:        []
        )
        allow(RecipeParser::Orchestrator).to receive(:call).and_return(result_no_image)

        post "/api/v1/recipes/parse", headers: headers,
          params: { json_ld: json_ld_data.to_json, og_image: "https://example.com/image.jpg" }

        recipe = Recipe.last
        expect(recipe.primary_image_url).to eq("https://example.com/image.jpg")
      end
    end

    context "sync path — orchestrator returns error" do
      before do
        allow(RecipeParser::Orchestrator).to receive(:call).and_return(
          RecipeParser::ParseResult.new(error: "Could not extract recipe data.")
        )
      end

      it "returns 422 unprocessable_content" do
        post "/api/v1/recipes/parse", headers: headers,
          params: { json_ld: json_ld_data.to_json }
        expect(response).to have_http_status(:unprocessable_content)
        expect(JSON.parse(response.body)["error"]).to be_present
      end
    end

    context "async path — url param provided" do
      it "enqueues a RecipeParseJob and returns 202 with job_id" do
        expect {
          post "/api/v1/recipes/parse", headers: headers,
            params: { url: "https://example.com/recipe" }
        }.to have_enqueued_job(RecipeParseJob)

        expect(response).to have_http_status(:accepted)
        body = JSON.parse(response.body)
        expect(body["job_id"]).to be_present
        expect(body["status"]).to eq("pending")
      end
    end

    context "async path — text param provided" do
      it "enqueues a RecipeParseJob and returns 202" do
        expect {
          post "/api/v1/recipes/parse", headers: headers,
            params: { text: "Pasta recipe: boil water, add pasta..." }
        }.to have_enqueued_job(RecipeParseJob)

        expect(response).to have_http_status(:accepted)
      end
    end

    context "unauthenticated" do
      it "returns 401" do
        post "/api/v1/recipes/parse", params: { url: "https://example.com" }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end

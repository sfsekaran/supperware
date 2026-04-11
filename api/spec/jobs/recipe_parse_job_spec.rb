require "rails_helper"

RSpec.describe RecipeParseJob, type: :job do
  let(:user)      { create(:user) }
  let(:parse_job) { user.parse_jobs.create!(url: "https://example.com/recipe", status: "pending") }

  let(:success_result) do
    RecipeParser::ParseResult.new(
      recipe_attrs:    {
        title:       "Chocolate Cake",
        source_url:  "https://example.com/recipe",
        description: nil
      },
      raw_ingredients:  [ "2 cups flour", "1 cup sugar" ],
      steps:            [ { text: "Mix and bake.", section: nil } ],
      parse_confidence: 0.9,
      parsed_format:    "json_ld",
      warnings:         []
    )
  end

  describe "#perform" do
    context "on success" do
      before do
        allow(RecipeParser::Orchestrator).to receive(:call).and_return(success_result)
      end

      it "transitions parse job to done" do
        described_class.perform_now(parse_job.id)
        expect(parse_job.reload.status).to eq("done")
      end

      it "creates a recipe for the user" do
        expect {
          described_class.perform_now(parse_job.id)
        }.to change(user.recipes, :count).by(1)
      end

      it "sets result_recipe_id on the parse job" do
        described_class.perform_now(parse_job.id)
        expect(parse_job.reload.result_recipe_id).to be_present
      end

      it "creates ingredients" do
        expect {
          described_class.perform_now(parse_job.id)
        }.to change(Ingredient, :count).by(2)
      end

      it "creates steps" do
        expect {
          described_class.perform_now(parse_job.id)
        }.to change(Step, :count).by(1)
      end

      it "marks parse job as processing before completing" do
        statuses = []
        allow(RecipeParser::Orchestrator).to receive(:call) do
          statuses << parse_job.reload.status
          success_result
        end

        described_class.perform_now(parse_job.id)
        expect(statuses).to include("processing")
      end
    end

    context "when orchestrator returns an error" do
      before do
        allow(RecipeParser::Orchestrator).to receive(:call).and_return(
          RecipeParser::ParseResult.new(error: "Could not extract recipe data.")
        )
      end

      it "transitions parse job to failed" do
        described_class.perform_now(parse_job.id)
        expect(parse_job.reload.status).to eq("failed")
      end

      it "stores the error message" do
        described_class.perform_now(parse_job.id)
        expect(parse_job.reload.error_message).to eq("Could not extract recipe data.")
      end

      it "does not create a recipe" do
        expect {
          described_class.perform_now(parse_job.id)
        }.not_to change(Recipe, :count)
      end
    end

    context "when orchestrator raises an exception" do
      before do
        allow(RecipeParser::Orchestrator).to receive(:call).and_raise(RuntimeError, "Something exploded")
      end

      it "fails the parse job" do
        expect {
          described_class.perform_now(parse_job.id)
        }.to raise_error(RuntimeError)

        expect(parse_job.reload.status).to eq("failed")
      end
    end
  end
end

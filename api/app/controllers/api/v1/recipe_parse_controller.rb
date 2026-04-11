module Api
  module V1
    class RecipeParseController < ApplicationController
      before_action :authenticate_user!

      def create
        url     = params[:url].presence
        text    = params[:text].presence
        html    = params[:html].presence
        json_ld = params[:json_ld].presence

        unless url || text || html || json_ld
          return render json: { error: "Provide a url, text, html, or json_ld param" }, status: :bad_request
        end

        # Sync path: json_ld or html provided — process inline, no job queue needed
        if json_ld || html
          return process_sync(url: url, html: html, json_ld: json_ld)
        end

        # Async path: url-only or text — use Sidekiq job
        job = current_user.parse_jobs.create!(url: url, raw_text: text, status: "pending")
        RecipeParseJob.perform_later(job.id)
        render json: { job_id: job.id, status: job.status }, status: :accepted
      end

      private

      def process_sync(url:, html:, json_ld:)
        parsed_json_ld = json_ld.is_a?(String) ? JSON.parse(json_ld) : json_ld.to_unsafe_h

        result = RecipeParser::Orchestrator.call(url: url, html: html, json_ld: parsed_json_ld)

        if result.error
          return render json: { error: result.error }, status: :unprocessable_entity
        end

        recipe = ActiveRecord::Base.transaction do
          r = current_user.recipes.create!(result.recipe_attrs.merge(status: "saved"))

          result.raw_ingredients.each_with_index do |raw_text, i|
            parsed = IngredientParser::Parser.parse(raw_text)
            r.ingredients.create!(
              raw_text:          parsed.raw_text,
              position:          i,
              quantity:          parsed.quantity,
              quantity_max:      parsed.quantity_max,
              unit:              parsed.unit,
              unit_normalized:   parsed.unit_normalized,
              weight_grams:      parsed.weight_grams,
              ingredient_name:   parsed.ingredient_name,
              preparation_notes: parsed.preparation_notes,
              is_optional:       parsed.is_optional,
              parse_confidence:  parsed.parse_confidence
            )
          end

          result.steps.each_with_index do |step, i|
            r.steps.create!(
              instruction:  step[:text],
              section_name: step[:section],
              position:     i
            )
          end

          r
        end

        render json: { recipe_id: recipe.id, status: "saved" }, status: :created
      rescue JSON::ParserError
        render json: { error: "Invalid json_ld param" }, status: :bad_request
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end
    end
  end
end

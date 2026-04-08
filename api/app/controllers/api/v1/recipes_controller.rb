module Api
  module V1
    class RecipesController < ApplicationController
      before_action :authenticate_user!
      before_action :set_recipe, only: [:show, :update, :destroy]

      def index
        recipes = current_user.recipes.active.order(created_at: :desc)
        render json: serialize(recipes)
      end

      def show
        render json: serialize(@recipe, include_details: true)
      end

      def create
        recipe = current_user.recipes.create!(recipe_params.merge(status: "saved"))
        render json: serialize(recipe), status: :created
      end

      def update
        @recipe.update!(recipe_params)
        render json: serialize(@recipe)
      end

      def destroy
        @recipe.soft_delete!
        head :no_content
      end

      private

      def set_recipe
        @recipe = current_user.recipes.active.find(params[:id])
      end

      def recipe_params
        params.require(:recipe).permit(
          :title, :description, :visibility, :status,
          :cuisine, :category, :cooking_method,
          :prep_time_minutes, :cook_time_minutes, :total_time_minutes,
          :yield_quantity, :yield_unit, :yield_raw,
          :personal_notes, :user_rating, :is_favorite,
          :primary_image_url, :source_url,
          diet_tags: [], keywords: []
        )
      end

      def serialize(recipes_or_recipe, include_details: false)
        if recipes_or_recipe.respond_to?(:each)
          recipes_or_recipe.map { |r| recipe_json(r, include_details: false) }
        else
          recipe_json(recipes_or_recipe, include_details: include_details)
        end
      end

      def recipe_json(r, include_details: false)
        json = {
          id:                 r.id,
          title:              r.title,
          description:        r.description,
          slug:               r.slug,
          visibility:         r.visibility,
          status:             r.status,
          cuisine:            r.cuisine,
          category:           r.category,
          diet_tags:          r.diet_tags,
          keywords:           r.keywords,
          prep_time_minutes:  r.prep_time_minutes,
          cook_time_minutes:  r.cook_time_minutes,
          total_time_minutes: r.total_time_minutes,
          yield_quantity:     r.yield_quantity,
          yield_unit:         r.yield_unit,
          yield_raw:          r.yield_raw,
          primary_image_url:  r.primary_image_url,
          source_url:         r.source_url,
          source_host:        r.source_host,
          is_favorite:        r.is_favorite,
          user_rating:        r.user_rating,
          times_cooked:       r.times_cooked,
          parse_confidence:   r.parse_confidence,
          parsed_format:      r.parsed_format,
          created_at:         r.created_at,
          updated_at:         r.updated_at,
        }

        if include_details
          json[:ingredients]    = r.ingredients.map { |i| ingredient_json(i) }
          json[:steps]          = r.steps.map { |s| step_json(s) }
          json[:personal_notes] = r.personal_notes
          json[:nutrition]      = r.nutrition
        end

        json
      end

      def ingredient_json(i)
        {
          id:                i.id,
          position:          i.position,
          group_name:        i.group_name,
          raw_text:          i.raw_text,
          quantity:          i.quantity,
          quantity_max:      i.quantity_max,
          unit:              i.unit,
          unit_normalized:   i.unit_normalized,
          ingredient_name:   i.ingredient_name,
          preparation_notes: i.preparation_notes,
          is_optional:       i.is_optional,
          parse_confidence:  i.parse_confidence,
        }
      end

      def step_json(s)
        {
          id:              s.id,
          position:        s.position,
          section_name:    s.section_name,
          instruction:     s.instruction,
          duration_minutes: s.duration_minutes,
          temperature:     s.temperature,
          tip:             s.tip,
          image_url:       s.image_url,
        }
      end
    end
  end
end

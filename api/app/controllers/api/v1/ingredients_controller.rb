module Api
  module V1
    class IngredientsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_recipe

      def index
        render json: @recipe.ingredients.map { |i| ingredient_json(i) }
      end

      def create
        attrs = build_ingredient_attrs(params.require(:ingredient).permit(:raw_text, :position, :group_name))
        ingredient = @recipe.ingredients.create!(attrs)
        render json: ingredient_json(ingredient), status: :created
      end

      def update
        ingredient = @recipe.ingredients.find(params[:id])
        attrs = build_ingredient_attrs(params.require(:ingredient).permit(:raw_text, :position, :group_name))
        ingredient.update!(attrs)
        render json: ingredient_json(ingredient)
      end

      def destroy
        @recipe.ingredients.find(params[:id]).destroy!
        head :no_content
      end

      private

      def set_recipe
        @recipe = current_user.recipes.active.find(params[:recipe_id])
      end

      # When raw_text is provided, re-parse it so structured fields stay in sync.
      def build_ingredient_attrs(permitted)
        attrs = permitted.to_h
        if attrs.key?("raw_text") && attrs["raw_text"].present?
          parsed = IngredientParser::Parser.parse(attrs["raw_text"])
          attrs.merge!(
            quantity:          parsed.quantity,
            quantity_max:      parsed.quantity_max,
            unit:              parsed.unit,
            unit_normalized:   parsed.unit_normalized,
            weight_grams:      parsed.weight_grams,
            ingredient_name:   parsed.ingredient_name,
            preparation_notes: parsed.preparation_notes,
            is_optional:       parsed.is_optional,
            parse_confidence:  parsed.parse_confidence,
          )
        end
        attrs
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
          ingredient_name:   i.ingredient_name,
          preparation_notes: i.preparation_notes,
          is_optional:       i.is_optional,
          parse_confidence:  i.parse_confidence
        }
      end
    end
  end
end

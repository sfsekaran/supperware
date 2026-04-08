module Api
  module V1
    class IngredientsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_recipe

      def index
        render json: @recipe.ingredients.map { |i| ingredient_json(i) }
      end

      def update
        ingredient = @recipe.ingredients.find(params[:id])
        ingredient.update!(ingredient_params)
        render json: ingredient_json(ingredient)
      end

      private

      def set_recipe
        @recipe = current_user.recipes.active.find(params[:recipe_id])
      end

      def ingredient_params
        params.require(:ingredient).permit(
          :raw_text, :quantity, :quantity_max, :unit, :unit_normalized,
          :ingredient_name, :preparation_notes, :is_optional, :position, :group_name
        )
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
          parse_confidence:  i.parse_confidence,
        }
      end
    end
  end
end

module Api
  module V1
    class StepsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_recipe

      def index
        render json: @recipe.steps.order(:position).map { |s| step_json(s) }
      end

      def create
        step = @recipe.steps.create!(step_params)
        render json: step_json(step), status: :created
      end

      def update
        step = @recipe.steps.find(params[:id])
        step.update!(step_params)
        render json: step_json(step)
      end

      def destroy
        @recipe.steps.find(params[:id]).destroy!
        head :no_content
      end

      private

      def set_recipe
        @recipe = current_user.recipes.active.find(params[:recipe_id])
      end

      def step_params
        params.require(:step).permit(:instruction, :position, :section_name, :duration_minutes, :tip)
      end

      def step_json(s)
        {
          id:               s.id,
          position:         s.position,
          section_name:     s.section_name,
          instruction:      s.instruction,
          duration_minutes: s.duration_minutes,
        }
      end
    end
  end
end

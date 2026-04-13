module Api
  module V1
    module Public
      class RecipesController < ApplicationController
        def index
          user = User.find_by!(username: params[:username], public_profile: true)
          recipes = user.public_recipes.order(created_at: :desc)
          render json: recipes.map { |r| recipe_summary(r) }
        end

        def show
          user = User.find_by!(username: params[:username], public_profile: true)
          recipe = user.public_recipes.find_by!(slug: params[:slug])
          render json: recipe_detail(recipe)
        end

        private

        def recipe_summary(r)
          {
            id: r.id, title: r.title, slug: r.slug,
            primary_image_url: r.primary_image_url,
            cuisine: r.cuisine, total_time_minutes: r.total_time_minutes,
            description: r.description
          }
        end

        def recipe_detail(r)
          {
            id: r.id, title: r.title, slug: r.slug,
            description: r.description,
            primary_image_url: r.primary_image_url,
            source_url: r.source_url, source_host: r.source_host,
            prep_time_minutes: r.prep_time_minutes,
            cook_time_minutes: r.cook_time_minutes,
            total_time_minutes: r.total_time_minutes,
            yield_quantity: r.yield_quantity, yield_unit: r.yield_unit,
            cuisine: r.cuisine, diet_tags: r.diet_tags,
            ingredients: r.ingredients.map { |i|
              { id: i.id, position: i.position, group_name: i.group_name,
                raw_text: i.raw_text, quantity: i.quantity, quantity_max: i.quantity_max,
                unit: i.unit, weight_grams: i.weight_grams, ingredient_name: i.ingredient_name,
                preparation_notes: i.preparation_notes, is_optional: i.is_optional }
            },
            steps: r.steps.map { |s|
              { id: s.id, position: s.position, section_name: s.section_name,
                instruction: s.instruction }
            }
          }
        end
      end
    end
  end
end

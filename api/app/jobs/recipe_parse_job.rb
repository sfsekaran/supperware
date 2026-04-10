class RecipeParseJob < ApplicationJob
  queue_as :default

  def perform(parse_job_id)
    job = ParseJob.find(parse_job_id)
    job.update!(status: "processing")

    result = RecipeParser::Orchestrator.call(url: job.url, text: job.raw_text)

    if result.error
      job.fail!(result.error)
      return
    end

    recipe = ActiveRecord::Base.transaction do
      r = job.user.recipes.create!(result.recipe_attrs.merge(status: "saved"))

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

    job.complete!(recipe)
  rescue => e
    ParseJob.find_by(id: parse_job_id)&.fail!(e.message)
    raise # re-raise so Sidekiq can retry
  end
end

module Api
  module V1
    class RecipeParseController < ApplicationController
      before_action :authenticate_user!

      def create
        url  = params[:url].presence
        text = params[:text].presence

        unless url || text
          return render json: { error: "Provide a url or text param" }, status: :bad_request
        end

        job = current_user.parse_jobs.create!(url: url, raw_text: text, status: "pending")
        RecipeParseJob.perform_later(job.id)

        render json: { job_id: job.id, status: job.status }, status: :accepted
      end
    end
  end
end

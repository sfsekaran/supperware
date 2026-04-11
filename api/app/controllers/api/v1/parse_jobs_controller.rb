module Api
  module V1
    class ParseJobsController < ApplicationController
      before_action :authenticate_user!

      def show
        job = current_user.parse_jobs.find(params[:id])
        render json: {
          id:               job.id,
          status:           job.status,
          url:              job.url,
          result_recipe_id: job.result_recipe_id,
          error_message:    job.error_message,
          completed_at:     job.completed_at
        }
      end
    end
  end
end

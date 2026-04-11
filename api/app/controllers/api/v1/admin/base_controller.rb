module Api
  module V1
    module Admin
      class BaseController < ApplicationController
        before_action :authenticate_user!
        before_action :require_admin!

        private

        def require_admin!
          render json: { error: "Forbidden" }, status: :forbidden unless current_user&.admin?
        end
      end
    end
  end
end

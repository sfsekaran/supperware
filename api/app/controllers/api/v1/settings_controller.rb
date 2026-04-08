module Api
  module V1
    class SettingsController < ApplicationController
      before_action :authenticate_user!

      def show
        render json: {
          api_token:    current_user.api_token,
          email:        current_user.email,
          username:     current_user.username,
          display_name: current_user.display_name,
          public_profile: current_user.public_profile,
        }
      end
    end
  end
end

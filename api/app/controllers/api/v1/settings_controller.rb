module Api
  module V1
    class SettingsController < ApplicationController
      before_action :authenticate_user!

      def show
        render json: settings_json
      end

      def update
        current_user.update!(settings_params)
        render json: settings_json
      end

      private

      def settings_json
        {
          api_token:      current_user.api_token,
          email:          current_user.email,
          username:       current_user.username,
          display_name:   current_user.display_name,
          public_profile: current_user.public_profile
        }
      end

      def settings_params
        params.require(:settings).permit(:public_profile)
      end
    end
  end
end

module Api
  module V1
    module Public
      class ProfilesController < ApplicationController
        def show
          user = User.find_by!(username: params[:username], public_profile: true)
          render json: {
            username:     user.username,
            display_name: user.display_name,
            bio:          user.bio,
            avatar_url:   user.avatar_url,
          }
        end
      end
    end
  end
end

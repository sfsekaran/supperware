class ApplicationController < ActionController::API
  before_action :configure_permitted_parameters, if: :devise_controller?

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid,  with: :unprocessable

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:username, :display_name])
  end

  private

  def authenticate_user!
    # API token fallback (for browser extension via X-Api-Token header)
    api_token = request.headers["X-Api-Token"]
    if api_token
      user = User.find_by(api_token: api_token)
      if user
        @current_user = user
        return
      end
    end

    # Standard Devise-JWT Bearer token flow
    super
  end

  def current_user
    @current_user || super
  end

  def not_found
    render json: { error: "Not found" }, status: :not_found
  end

  def unprocessable(e)
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
  end
end

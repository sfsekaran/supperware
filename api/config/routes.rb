Rails.application.routes.draw do
  devise_for :users,
    path: "api/v1/auth",
    path_names: {
      sign_in:  "sign_in",
      sign_out: "sign_out",
      registration: "sign_up"
    },
    controllers: {
      sessions:      "api/v1/auth/sessions",
      registrations: "api/v1/auth/registrations"
    }

  namespace :api do
    namespace :v1 do
      # Recipe parsing (async)
      post "recipes/parse",            to: "recipe_parse#create"
      get  "parse_jobs/:id",           to: "parse_jobs#show"

      resources :recipes do
        resources :ingredients, only: [ :index, :create, :update, :destroy ]
        resources :steps,       only: [ :index, :create, :update, :destroy ]
      end

      resources :collections do
        post   "recipes",              to: "collection_recipes#create"
        delete "recipes/:recipe_id",   to: "collection_recipes#destroy"
      end

      get "search",   to: "search#index"
      get "settings", to: "settings#show"

      # Public (unauthenticated)
      namespace :public do
        get "users/:username",               to: "profiles#show"
        get "users/:username/recipes",       to: "recipes#index"
        get "users/:username/recipes/:slug", to: "recipes#show"
        get "collections/:id",               to: "collections#show"
      end
    end
  end

  get "up", to: "rails/health#show", as: :rails_health_check
end

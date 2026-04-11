module Api
  module V1
    module Admin
      class UsersController < BaseController
        PER_PAGE = 25

        def index
          page  = [ (params[:page] || 1).to_i, 1 ].max
          total = User.count

          users = User
            .select("users.*, COUNT(recipes.id) AS recipe_count")
            .left_joins(:recipes)
            .where("recipes.id IS NULL OR recipes.deleted_at IS NULL")
            .group("users.id")
            .order(created_at: :desc)
            .offset((page - 1) * PER_PAGE)
            .limit(PER_PAGE)

          render json: {
            users: users.map { |u| user_summary(u) },
            meta:  { total: total, page: page, per_page: PER_PAGE, pages: (total.to_f / PER_PAGE).ceil }
          }
        end

        def show
          user    = User.find(params[:id])
          recipes = user.recipes.where(deleted_at: nil).order(created_at: :desc).to_a

          render json: {
            user:    user_detail(user, recipe_count: recipes.size),
            recipes: recipes.map { |r| recipe_summary(r) }
          }
        end

        private

        def user_summary(u, recipe_count: u.recipe_count.to_i)
          {
            id:             u.id,
            email:          u.email,
            username:       u.username,
            display_name:   u.display_name,
            public_profile: u.public_profile,
            admin:          u.admin,
            recipe_count:   recipe_count,
            created_at:     u.created_at
          }
        end

        def user_detail(u, recipe_count: u.recipe_count.to_i)
          user_summary(u, recipe_count: recipe_count).merge(
            bio:        u.bio,
            avatar_url: u.avatar_url
          )
        end

        def recipe_summary(r)
          {
            id:         r.id,
            title:      r.title,
            slug:       r.slug,
            visibility: r.visibility,
            status:     r.status,
            created_at: r.created_at
          }
        end
      end
    end
  end
end

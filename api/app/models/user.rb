class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  has_many :recipes, dependent: :destroy
  has_many :collections, dependent: :destroy
  has_many :parse_jobs, dependent: :destroy

  validates :username, presence: true, uniqueness: { case_sensitive: false },
                       format: { with: /\A[a-z0-9_-]+\z/, message: "only lowercase letters, numbers, hyphens and underscores" },
                       length: { minimum: 2, maximum: 30 }

  before_create :generate_api_token

  def public_recipes
    recipes.where(visibility: "public", deleted_at: nil)
  end

  private

  def generate_api_token
    self.api_token = SecureRandom.hex(32)
  end
end

class Collection < ApplicationRecord
  belongs_to :user
  has_many :collection_recipes, -> { order(:position) }, dependent: :destroy
  has_many :recipes, through: :collection_recipes

  VISIBILITIES = %w[private unlisted public].freeze

  validates :name, presence: true
  validates :visibility, inclusion: { in: VISIBILITIES }
  validates :slug, presence: true, uniqueness: { scope: :user_id }

  before_validation :derive_slug

  private

  def derive_slug
    self.slug ||= name&.downcase&.gsub(/[^a-z0-9]+/, "-")&.gsub(/\A-|-\z/, "")
  end
end

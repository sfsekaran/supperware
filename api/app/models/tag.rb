class Tag < ApplicationRecord
  has_many :recipe_tags, dependent: :destroy
  has_many :recipes, through: :recipe_tags

  validates :name, presence: true, uniqueness: true
  validates :slug, presence: true, uniqueness: true

  before_validation :derive_slug

  def self.find_or_create_by_name(name)
    slug = name.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-|-\z/, "")
    find_or_create_by(slug: slug) { |t| t.name = name.strip }
  end

  private

  def derive_slug
    self.slug ||= name&.downcase&.gsub(/[^a-z0-9]+/, "-")&.gsub(/\A-|-\z/, "")
  end
end

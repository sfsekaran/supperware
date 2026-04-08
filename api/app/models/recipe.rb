class Recipe < ApplicationRecord
  belongs_to :user
  has_many :ingredients, -> { order(:position) }, dependent: :destroy
  has_many :steps, -> { order(:position) }, dependent: :destroy
  has_many :recipe_tags, dependent: :destroy
  has_many :tags, through: :recipe_tags
  has_many :collection_recipes, dependent: :destroy
  has_many :collections, through: :collection_recipes

  STATUSES = %w[draft saved archived].freeze
  VISIBILITIES = %w[private unlisted public].freeze
  PARSED_FORMATS = %w[json_ld microdata rdfa opengraph html_heuristic manual text_paste].freeze

  validates :title, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :visibility, inclusion: { in: VISIBILITIES }

  scope :active, -> { where(deleted_at: nil) }
  scope :visible_to_public, -> { active.where(visibility: "public") }

  before_validation :derive_source_host
  before_create :generate_slug

  def soft_delete!
    update!(deleted_at: Time.current)
  end

  def deleted?
    deleted_at.present?
  end

  private

  def derive_source_host
    return if source_url.blank?
    self.source_host = URI.parse(source_url).host.sub(/\Awww\./, "")
  rescue URI::InvalidURIError
    nil
  end

  def generate_slug
    return if slug.present?
    base = title.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-|-\z/, "")
    self.slug = unique_slug(base)
  end

  def unique_slug(base)
    candidate = base
    n = 1
    while user.recipes.where(slug: candidate).exists?
      candidate = "#{base}-#{n}"
      n += 1
    end
    candidate
  end
end

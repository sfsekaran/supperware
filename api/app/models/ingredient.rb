class Ingredient < ApplicationRecord
  belongs_to :recipe

  validates :raw_text, presence: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end

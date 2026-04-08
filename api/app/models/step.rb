class Step < ApplicationRecord
  belongs_to :recipe

  validates :instruction, presence: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end

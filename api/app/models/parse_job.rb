class ParseJob < ApplicationRecord
  belongs_to :user
  belongs_to :result_recipe, class_name: "Recipe", optional: true

  STATUSES = %w[pending processing done failed].freeze

  validates :status, inclusion: { in: STATUSES }

  scope :pending,    -> { where(status: "pending") }
  scope :processing, -> { where(status: "processing") }
  scope :done,       -> { where(status: "done") }
  scope :failed,     -> { where(status: "failed") }

  def complete!(recipe)
    update!(status: "done", result_recipe: recipe, completed_at: Time.current)
  end

  def fail!(message)
    update!(status: "failed", error_message: message, completed_at: Time.current)
  end
end

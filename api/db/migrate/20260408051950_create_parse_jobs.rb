class CreateParseJobs < ActiveRecord::Migration[8.1]
  def change
    create_table :parse_jobs do |t|
      t.references :user,          null: false, foreign_key: true
      t.references :result_recipe, foreign_key: { to_table: :recipes }
      t.string  :url
      t.string  :status,        null: false, default: "pending"
      t.text    :error_message
      t.datetime :completed_at
      t.timestamps
    end

    add_index :parse_jobs, :status
    add_index :parse_jobs, [:user_id, :status]
  end
end

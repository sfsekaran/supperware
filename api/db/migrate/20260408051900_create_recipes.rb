class CreateRecipes < ActiveRecord::Migration[8.1]
  def change
    create_table :recipes do |t|
      t.references :user, null: false, foreign_key: true

      t.string :title, null: false
      t.text   :description
      t.string :source_url
      t.string :source_host
      t.string :source_author
      t.string :slug

      t.string :status,     null: false, default: "saved"
      t.string :visibility, null: false, default: "private"

      # Timing (minutes)
      t.integer :prep_time_minutes
      t.integer :cook_time_minutes
      t.integer :total_time_minutes
      t.integer :rest_time_minutes

      # Yield
      t.decimal :yield_quantity, precision: 8, scale: 2
      t.string  :yield_unit
      t.string  :yield_raw

      # Classification
      t.string :cuisine
      t.string :category
      t.string :cooking_method
      t.text   :diet_tags,  array: true, default: []
      t.text   :keywords,   array: true, default: []

      # Parsing metadata
      t.string  :parsed_format
      t.decimal :parse_confidence, precision: 4, scale: 3
      t.jsonb   :raw_scraped_json
      t.jsonb   :parse_warnings, default: []

      # User annotations
      t.text    :personal_notes
      t.integer :user_rating
      t.integer :times_cooked, null: false, default: 0
      t.date    :last_cooked_at
      t.boolean :is_favorite, null: false, default: false

      # Images
      t.string :primary_image_url
      t.jsonb  :images, default: []

      # Nutrition
      t.jsonb :nutrition

      t.datetime :deleted_at
      t.timestamps
    end

    add_index :recipes, [ :user_id, :slug ], unique: true
    add_index :recipes, :status
    add_index :recipes, :visibility
    add_index :recipes, :deleted_at
    add_index :recipes, :raw_scraped_json, using: :gin
  end
end

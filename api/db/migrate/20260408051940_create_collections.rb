class CreateCollections < ActiveRecord::Migration[8.1]
  def change
    create_table :collections do |t|
      t.references :user, null: false, foreign_key: true
      t.string  :name,        null: false
      t.text    :description
      t.string  :slug,        null: false
      t.string  :visibility,  null: false, default: "private"
      t.string  :cover_image_url
      t.timestamps
    end

    add_index :collections, [:user_id, :slug], unique: true

    create_table :collection_recipes do |t|
      t.references :collection, null: false, foreign_key: true
      t.references :recipe,     null: false, foreign_key: true
      t.integer    :position,   null: false, default: 0
      t.datetime   :added_at,   null: false, default: -> { "CURRENT_TIMESTAMP" }
    end

    add_index :collection_recipes, [:collection_id, :recipe_id], unique: true
    add_index :collection_recipes, [:collection_id, :position]
  end
end

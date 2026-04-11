class CreateTags < ActiveRecord::Migration[8.1]
  def change
    create_table :tags do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.timestamps
    end

    add_index :tags, :name, unique: true
    add_index :tags, :slug, unique: true

    create_table :recipe_tags do |t|
      t.references :recipe, null: false, foreign_key: true
      t.references :tag,    null: false, foreign_key: true
    end

    add_index :recipe_tags, [ :recipe_id, :tag_id ], unique: true
  end
end

class CreateIngredients < ActiveRecord::Migration[8.1]
  def change
    create_table :ingredients do |t|
      t.references :recipe, null: false, foreign_key: true
      t.integer :position, null: false, default: 0
      t.string  :group_name

      # Raw (always present)
      t.text :raw_text, null: false

      # Parsed (filled by IngredientParser)
      t.decimal :quantity,     precision: 10, scale: 3
      t.decimal :quantity_max, precision: 10, scale: 3
      t.string  :unit
      t.string  :unit_normalized
      t.string  :ingredient_name
      t.string  :preparation_notes
      t.boolean :is_optional, null: false, default: false
      t.decimal :parse_confidence, precision: 4, scale: 3

      t.timestamps
    end

    add_index :ingredients, [ :recipe_id, :position ], name: "index_ingredients_on_recipe_id_and_position"
  end
end

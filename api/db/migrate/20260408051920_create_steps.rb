class CreateSteps < ActiveRecord::Migration[8.1]
  def change
    create_table :steps do |t|
      t.references :recipe, null: false, foreign_key: true
      t.integer :position, null: false, default: 0
      t.string  :section_name
      t.text    :instruction, null: false
      t.integer :duration_minutes
      t.string  :temperature
      t.string  :image_url
      t.text    :tip

      t.timestamps
    end

    add_index :steps, [:recipe_id, :position], name: "index_steps_on_recipe_id_and_position"
  end
end

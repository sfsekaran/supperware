class AddYieldDescriptionToRecipes < ActiveRecord::Migration[8.1]
  def change
    add_column :recipes, :yield_description, :string
  end
end

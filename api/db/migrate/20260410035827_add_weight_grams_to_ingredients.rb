class AddWeightGramsToIngredients < ActiveRecord::Migration[8.1]
  def change
    add_column :ingredients, :weight_grams, :decimal
  end
end

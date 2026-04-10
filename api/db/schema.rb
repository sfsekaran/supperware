# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_10_035827) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "collection_recipes", force: :cascade do |t|
    t.datetime "added_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.bigint "collection_id", null: false
    t.integer "position", default: 0, null: false
    t.bigint "recipe_id", null: false
    t.index ["collection_id", "position"], name: "index_collection_recipes_on_collection_id_and_position"
    t.index ["collection_id", "recipe_id"], name: "index_collection_recipes_on_collection_id_and_recipe_id", unique: true
    t.index ["collection_id"], name: "index_collection_recipes_on_collection_id"
    t.index ["recipe_id"], name: "index_collection_recipes_on_recipe_id"
  end

  create_table "collections", force: :cascade do |t|
    t.string "cover_image_url"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.string "visibility", default: "private", null: false
    t.index ["user_id", "slug"], name: "index_collections_on_user_id_and_slug", unique: true
    t.index ["user_id"], name: "index_collections_on_user_id"
  end

  create_table "ingredients", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "group_name"
    t.string "ingredient_name"
    t.boolean "is_optional", default: false, null: false
    t.decimal "parse_confidence", precision: 4, scale: 3
    t.integer "position", default: 0, null: false
    t.string "preparation_notes"
    t.decimal "quantity", precision: 10, scale: 3
    t.decimal "quantity_max", precision: 10, scale: 3
    t.text "raw_text", null: false
    t.bigint "recipe_id", null: false
    t.string "unit"
    t.string "unit_normalized"
    t.datetime "updated_at", null: false
    t.decimal "weight_grams"
    t.index ["recipe_id", "position"], name: "index_ingredients_on_recipe_id_and_position"
    t.index ["recipe_id"], name: "index_ingredients_on_recipe_id"
  end

  create_table "jwt_denylist", force: :cascade do |t|
    t.datetime "exp", null: false
    t.string "jti", null: false
    t.index ["jti"], name: "index_jwt_denylist_on_jti"
  end

  create_table "parse_jobs", force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.text "error_message"
    t.text "raw_text"
    t.bigint "result_recipe_id"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.string "url"
    t.bigint "user_id", null: false
    t.index ["result_recipe_id"], name: "index_parse_jobs_on_result_recipe_id"
    t.index ["status"], name: "index_parse_jobs_on_status"
    t.index ["user_id", "status"], name: "index_parse_jobs_on_user_id_and_status"
    t.index ["user_id"], name: "index_parse_jobs_on_user_id"
  end

  create_table "recipe_tags", force: :cascade do |t|
    t.bigint "recipe_id", null: false
    t.bigint "tag_id", null: false
    t.index ["recipe_id", "tag_id"], name: "index_recipe_tags_on_recipe_id_and_tag_id", unique: true
    t.index ["recipe_id"], name: "index_recipe_tags_on_recipe_id"
    t.index ["tag_id"], name: "index_recipe_tags_on_tag_id"
  end

  create_table "recipes", force: :cascade do |t|
    t.string "category"
    t.integer "cook_time_minutes"
    t.string "cooking_method"
    t.datetime "created_at", null: false
    t.string "cuisine"
    t.datetime "deleted_at"
    t.text "description"
    t.text "diet_tags", default: [], array: true
    t.jsonb "images", default: []
    t.boolean "is_favorite", default: false, null: false
    t.text "keywords", default: [], array: true
    t.date "last_cooked_at"
    t.jsonb "nutrition"
    t.decimal "parse_confidence", precision: 4, scale: 3
    t.jsonb "parse_warnings", default: []
    t.string "parsed_format"
    t.text "personal_notes"
    t.integer "prep_time_minutes"
    t.string "primary_image_url"
    t.jsonb "raw_scraped_json"
    t.integer "rest_time_minutes"
    t.string "slug"
    t.string "source_author"
    t.string "source_host"
    t.string "source_url"
    t.string "status", default: "saved", null: false
    t.integer "times_cooked", default: 0, null: false
    t.string "title", null: false
    t.integer "total_time_minutes"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.integer "user_rating"
    t.string "visibility", default: "private", null: false
    t.decimal "yield_quantity", precision: 8, scale: 2
    t.string "yield_raw"
    t.string "yield_unit"
    t.index ["deleted_at"], name: "index_recipes_on_deleted_at"
    t.index ["raw_scraped_json"], name: "index_recipes_on_raw_scraped_json", using: :gin
    t.index ["status"], name: "index_recipes_on_status"
    t.index ["user_id", "slug"], name: "index_recipes_on_user_id_and_slug", unique: true
    t.index ["user_id"], name: "index_recipes_on_user_id"
    t.index ["visibility"], name: "index_recipes_on_visibility"
  end

  create_table "steps", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "duration_minutes"
    t.string "image_url"
    t.text "instruction", null: false
    t.integer "position", default: 0, null: false
    t.bigint "recipe_id", null: false
    t.string "section_name"
    t.string "temperature"
    t.text "tip"
    t.datetime "updated_at", null: false
    t.index ["recipe_id", "position"], name: "index_steps_on_recipe_id_and_position"
    t.index ["recipe_id"], name: "index_steps_on_recipe_id"
  end

  create_table "tags", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_tags_on_name", unique: true
    t.index ["slug"], name: "index_tags_on_slug", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "api_token"
    t.string "avatar_url"
    t.text "bio"
    t.datetime "created_at", null: false
    t.string "display_name"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.boolean "public_profile", default: true, null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.datetime "updated_at", null: false
    t.string "username", default: "", null: false
    t.index ["api_token"], name: "index_users_on_api_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "collection_recipes", "collections"
  add_foreign_key "collection_recipes", "recipes"
  add_foreign_key "collections", "users"
  add_foreign_key "ingredients", "recipes"
  add_foreign_key "parse_jobs", "recipes", column: "result_recipe_id"
  add_foreign_key "parse_jobs", "users"
  add_foreign_key "recipe_tags", "recipes"
  add_foreign_key "recipe_tags", "tags"
  add_foreign_key "recipes", "users"
  add_foreign_key "steps", "recipes"
end

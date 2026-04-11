FactoryBot.define do
  factory :ingredient do
    association :recipe
    sequence(:raw_text)  { |n| "#{n} cup flour" }
    sequence(:position)  { |n| n }
    ingredient_name { "flour" }
    quantity        { 1.0 }
    unit            { "cup" }
  end
end

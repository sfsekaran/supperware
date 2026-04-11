FactoryBot.define do
  factory :recipe do
    association :user
    sequence(:title) { |n| "Recipe #{n}" }
    status     { "saved" }
    visibility { "private" }

    trait :public do
      visibility { "public" }
    end

    trait :with_ingredients do
      after(:create) do |recipe|
        create_list(:ingredient, 3, recipe: recipe)
      end
    end

    trait :with_steps do
      after(:create) do |recipe|
        create_list(:step, 3, recipe: recipe)
      end
    end
  end
end

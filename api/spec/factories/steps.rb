FactoryBot.define do
  factory :step do
    association :recipe
    sequence(:instruction) { |n| "Step #{n}: do the thing." }
    sequence(:position)    { |n| n }
  end
end

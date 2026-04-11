FactoryBot.define do
  factory :user do
    sequence(:email)    { |n| "user#{n}@example.com" }
    sequence(:username) { |n| "user#{n}" }
    password { "password123" }
    display_name { "Test User" }
  end
end

require 'rails_helper'

RSpec.describe User, type: :model do
  subject(:user) { build(:user) }

  describe "associations" do
    it { is_expected.to have_many(:recipes).dependent(:destroy) }
    it { is_expected.to have_many(:collections).dependent(:destroy) }
    it { is_expected.to have_many(:parse_jobs).dependent(:destroy) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:username) }
    it { is_expected.to validate_uniqueness_of(:username).case_insensitive }
    it { is_expected.to validate_length_of(:username).is_at_least(2).is_at_most(30) }

    it "accepts valid usernames" do
      expect(build(:user, username: "jane_doe-99")).to be_valid
    end

    it "rejects uppercase in username" do
      expect(build(:user, username: "JaneDoe")).not_to be_valid
    end

    it "rejects usernames with spaces" do
      expect(build(:user, username: "jane doe")).not_to be_valid
    end
  end

  describe "#generate_api_token" do
    it "sets api_token before create" do
      user = create(:user)
      expect(user.api_token).to be_present
      expect(user.api_token.length).to eq(64)
    end

    it "generates unique tokens" do
      tokens = create_list(:user, 3).map(&:api_token)
      expect(tokens.uniq.length).to eq(3)
    end
  end

  describe "#public_recipes" do
    let(:user) { create(:user) }

    it "returns only public, non-deleted recipes" do
      public_recipe  = create(:recipe, :public, user: user)
      private_recipe = create(:recipe, user: user, visibility: "private")
      deleted        = create(:recipe, :public, user: user, deleted_at: Time.current)

      expect(user.public_recipes).to include(public_recipe)
      expect(user.public_recipes).not_to include(private_recipe)
      expect(user.public_recipes).not_to include(deleted)
    end
  end
end

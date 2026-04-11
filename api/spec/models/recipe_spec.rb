require 'rails_helper'

RSpec.describe Recipe, type: :model do
  subject(:recipe) { build(:recipe) }

  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to have_many(:ingredients).dependent(:destroy) }
    it { is_expected.to have_many(:steps).dependent(:destroy) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:title) }
    it { is_expected.to validate_inclusion_of(:status).in_array(%w[draft saved archived]) }
    it { is_expected.to validate_inclusion_of(:visibility).in_array(%w[private unlisted public]) }
  end

  describe "slug generation" do
    it "generates a slug from the title on create" do
      recipe = create(:recipe, title: "Sourdough Bread")
      expect(recipe.slug).to eq("sourdough-bread")
    end

    it "generates a unique slug when one already exists" do
      user = create(:user)
      create(:recipe, user: user, title: "Chocolate Cake")
      recipe2 = create(:recipe, user: user, title: "Chocolate Cake")
      expect(recipe2.slug).to eq("chocolate-cake-1")
    end

    it "strips leading/trailing hyphens from slug" do
      recipe = create(:recipe, title: "---Best Pizza---")
      expect(recipe.slug).not_to start_with("-")
      expect(recipe.slug).not_to end_with("-")
    end
  end

  describe "source_host derivation" do
    it "extracts host from source_url on save" do
      recipe = create(:recipe, source_url: "https://www.kingarthurbaking.com/recipes/sourdough")
      expect(recipe.source_host).to eq("kingarthurbaking.com")
    end

    it "strips www from host" do
      recipe = create(:recipe, source_url: "https://www.example.com/recipe")
      expect(recipe.source_host).to eq("example.com")
    end

    it "handles blank source_url" do
      recipe = create(:recipe, source_url: nil)
      expect(recipe.source_host).to be_nil
    end
  end

  describe "#soft_delete!" do
    it "sets deleted_at" do
      recipe = create(:recipe)
      expect { recipe.soft_delete! }.to change { recipe.deleted_at }.from(nil)
    end
  end

  describe "scopes" do
    let(:user) { create(:user) }

    describe ".active" do
      it "excludes soft-deleted recipes" do
        live    = create(:recipe, user: user)
        deleted = create(:recipe, user: user, deleted_at: Time.current)
        expect(Recipe.active).to include(live)
        expect(Recipe.active).not_to include(deleted)
      end
    end

    describe ".visible_to_public" do
      it "returns only public, non-deleted recipes" do
        pub     = create(:recipe, :public, user: user)
        priv    = create(:recipe, user: user, visibility: "private")
        deleted = create(:recipe, :public, user: user, deleted_at: Time.current)
        expect(Recipe.visible_to_public).to include(pub)
        expect(Recipe.visible_to_public).not_to include(priv, deleted)
      end
    end
  end
end

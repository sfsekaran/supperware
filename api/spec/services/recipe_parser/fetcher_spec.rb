require "rails_helper"
require "webmock/rspec"

RSpec.describe RecipeParser::Fetcher do
  describe ".fetch" do
    context "with a valid URL returning HTML" do
      before do
        stub_request(:get, "https://example.com/recipe")
          .to_return(status: 200, body: "<html><body>Recipe page</body></html>",
                     headers: { "Content-Type" => "text/html" })
      end

      it "returns a FetchResult with html and status 200" do
        result = described_class.fetch("https://example.com/recipe")
        expect(result).to be_a(RecipeParser::FetchResult)
        expect(result.html).to include("Recipe page")
        expect(result.status_code).to eq(200)
      end
    end

    context "with a known paywall domain" do
      it "raises FetchError with :paywall reason before making a request" do
        expect {
          described_class.fetch("https://cooking.nytimes.com/recipe/123")
        }.to raise_error(RecipeParser::FetchError) { |e|
          expect(e.reason).to eq(:paywall)
          expect(e.message).to eq("Paywalled site")
        }
      end

      it "also blocks epicurious" do
        expect {
          described_class.fetch("https://www.epicurious.com/recipes/food/views/test")
        }.to raise_error(RecipeParser::FetchError) { |e| expect(e.reason).to eq(:paywall) }
      end
    end

    context "with an invalid scheme" do
      it "raises FetchError with :invalid_url reason for ftp://" do
        expect {
          described_class.fetch("ftp://example.com/recipe")
        }.to raise_error(RecipeParser::FetchError) { |e| expect(e.reason).to eq(:invalid_url) }
      end
    end

    context "with a 404 response" do
      before do
        stub_request(:get, "https://example.com/missing")
          .to_return(status: 404, body: "Not Found")
      end

      it "raises FetchError with :not_found reason" do
        expect {
          described_class.fetch("https://example.com/missing")
        }.to raise_error(RecipeParser::FetchError) { |e| expect(e.reason).to eq(:not_found) }
      end
    end

    context "with a 403 response" do
      before do
        stub_request(:get, "https://example.com/forbidden")
          .to_return(status: 403, body: "Forbidden")
      end

      it "raises FetchError with :paywall reason" do
        expect {
          described_class.fetch("https://example.com/forbidden")
        }.to raise_error(RecipeParser::FetchError) { |e| expect(e.reason).to eq(:paywall) }
      end
    end

    context "with a network timeout" do
      before do
        stub_request(:get, "https://example.com/slow")
          .to_timeout
      end

      it "raises FetchError with :network_error reason" do
        expect {
          described_class.fetch("https://example.com/slow")
        }.to raise_error(RecipeParser::FetchError) { |e| expect(e.reason).to eq(:network_error) }
      end
    end

    context "with a private IP address" do
      it "raises FetchError with :invalid_url reason for localhost" do
        expect {
          described_class.fetch("http://127.0.0.1/secret")
        }.to raise_error(RecipeParser::FetchError) { |e| expect(e.reason).to eq(:invalid_url) }
      end

      it "raises FetchError for internal 10.x.x.x addresses" do
        expect {
          described_class.fetch("http://10.0.0.1/secret")
        }.to raise_error(RecipeParser::FetchError) { |e| expect(e.reason).to eq(:invalid_url) }
      end
    end
  end
end

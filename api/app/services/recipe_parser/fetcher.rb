require "faraday"
require "faraday/follow_redirects"

module RecipeParser
  FetchResult = Struct.new(:html, :final_url, :status_code, keyword_init: true)

  class FetchError < StandardError
    attr_reader :reason
    def initialize(msg, reason:)
      super(msg)
      @reason = reason
    end
  end

  module Fetcher
    # Sites that are known to block bots — return paywall error immediately
    KNOWN_PAYWALLS = %w[cooking.nytimes.com www.epicurious.com].freeze

    USER_AGENT = "Mozilla/5.0 (compatible; Supperware/1.0; +https://supperware.app)"

    def self.fetch(url)
      uri = URI.parse(url)
      if KNOWN_PAYWALLS.include?(uri.host)
        raise FetchError.new("Paywalled site", reason: :paywall)
      end

      conn = Faraday.new do |f|
        f.use Faraday::FollowRedirects::Middleware, limit: 5
        f.adapter Faraday.default_adapter
      end

      response = conn.get(url) do |req|
        req.headers["User-Agent"] = USER_AGENT
        req.headers["Accept"]     = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        req.headers["Accept-Language"] = "en-US,en;q=0.5"
        req.options.timeout      = 15
        req.options.open_timeout = 10
      end

      case response.status
      when 200
        FetchResult.new(html: response.body, final_url: url, status_code: 200)
      when 401, 403
        raise FetchError.new("Access denied (#{response.status})", reason: :paywall)
      when 404
        raise FetchError.new("Page not found", reason: :not_found)
      else
        raise FetchError.new("HTTP #{response.status}", reason: :fetch_error)
      end
    rescue Faraday::TimeoutError, Faraday::ConnectionFailed => e
      raise FetchError.new("Network error: #{e.message}", reason: :network_error)
    rescue URI::InvalidURIError
      raise FetchError.new("Invalid URL", reason: :invalid_url)
    end
  end
end

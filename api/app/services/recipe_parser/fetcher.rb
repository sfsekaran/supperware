require "faraday"
require "faraday/follow_redirects"
require "ipaddr"
require "resolv"

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

    # RFC 1918 / loopback / link-local ranges — never fetch these
    PRIVATE_RANGES = [
      IPAddr.new("127.0.0.0/8"),
      IPAddr.new("10.0.0.0/8"),
      IPAddr.new("172.16.0.0/12"),
      IPAddr.new("192.168.0.0/16"),
      IPAddr.new("169.254.0.0/16"),   # link-local / AWS metadata endpoint
      IPAddr.new("::1/128"),
      IPAddr.new("fc00::/7")
    ].freeze

    def self.fetch(url)
      uri = URI.parse(url)

      raise FetchError.new("Invalid URL", reason: :invalid_url) unless %w[http https].include?(uri.scheme)
      raise FetchError.new("Paywalled site", reason: :paywall) if KNOWN_PAYWALLS.include?(uri.host)

      block_private_host!(uri.host)

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

    private

    def self.block_private_host!(host)
      addresses = Resolv.getaddresses(host)
      raise FetchError.new("Could not resolve host", reason: :invalid_url) if addresses.empty?

      addresses.each do |addr|
        ip = IPAddr.new(addr)
        if PRIVATE_RANGES.any? { |range| range.include?(ip) }
          raise FetchError.new("URL resolves to a private address", reason: :invalid_url)
        end
      end
    rescue IPAddr::InvalidAddressError
      raise FetchError.new("Invalid host address", reason: :invalid_url)
    end
  end
end

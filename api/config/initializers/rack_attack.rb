class Rack::Attack
  # Rate limits commented out temporarily — can bring back later when needed.
  #
  # Original configs:
  # throttle("parse/ip", limit: 10, period: 1.minute) do |req|
  #   req.ip if req.path == "/api/v1/recipes/parse" && req.post?
  # end
  #
  # throttle("auth/ip", limit: 50, period: 5.minutes) do |req|
  #   req.ip if req.path.start_with?("/api/v1/auth")
  # end
  #
  # Rack::Attack.cache.store = Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
  # self.throttled_responder = lambda do |req|
  #   [ 429, { "Content-Type" => "application/json" }, [ { error: "Too many requests. Please try again later." }.to_json ] ]
  # end
end

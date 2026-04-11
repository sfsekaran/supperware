class Rack::Attack
  # Throttle parse endpoint — it's expensive (external HTTP fetch + parsing)
  throttle("parse/ip", limit: 10, period: 1.minute) do |req|
    req.ip if req.path == "/api/v1/recipes/parse" && req.post?
  end

  # Throttle auth endpoints to prevent brute force
  throttle("auth/ip", limit: 20, period: 5.minutes) do |req|
    req.ip if req.path.start_with?("/api/v1/auth")
  end

  # Return 429 as JSON
  self.throttled_responder = lambda do |req|
    [ 429, { "Content-Type" => "application/json" }, [ { error: "Too many requests. Please try again later." }.to_json ] ]
  end
end

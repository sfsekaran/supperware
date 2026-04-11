.PHONY: help dev api web db sidekiq setup migrate seed logs ps stop reset install-hooks

# Default target
help:
	@echo "Supperware dev tasks:"
	@echo ""
	@echo "  make dev       Start API + web dev servers (requires tmux)"
	@echo "  make dev-bg    Start API + web in background processes"
	@echo "  make api       Start Rails API only (port 3000)"
	@echo "  make web       Start Vite frontend only (port 3001)"
	@echo "  make sidekiq   Start Sidekiq worker"
	@echo ""
	@echo "  make setup     Full first-time setup (docker, bundle, npm, db)"
	@echo "  make db        Start Docker services (postgres + redis)"
	@echo "  make migrate   Run pending migrations"
	@echo "  make rollback  Rollback last migration"
	@echo "  make seed      Run db:seed"
	@echo "  make reset     Drop, create, and migrate the database"
	@echo ""
	@echo "  make logs      Tail Docker service logs"
	@echo "  make ps        Show Docker service status"
	@echo "  make stop      Stop Docker services"
	@echo "  make console   Open Rails console"
	@echo "  make routes    Print Rails routes"
	@echo "  make test      Run RSpec tests"
	@echo "  make install-hooks  Install git pre-push hook"

# ── Dev servers ───────────────────────────────────────────────────────────────

# Start all three (API, Sidekiq, web) in tmux panes. Falls back to dev-bg.
dev:
	@if command -v tmux >/dev/null 2>&1 && [ -n "$$TMUX" ]; then \
		tmux split-window -h "cd api && bundle exec rails server -p 3000"; \
		tmux split-window -v "cd api && bundle exec sidekiq"; \
		tmux select-pane -t 0; \
		cd web && npm run dev; \
	else \
		$(MAKE) dev-bg; \
	fi

# Start in background using simple shell jobs (logs go to .log files)
dev-bg: db
	@echo "Starting API server (log: api/log/development.log)..."
	@cd api && bundle exec rails server -p 3000 >> log/development.log 2>&1 &
	@echo "Starting Sidekiq (log: api/log/sidekiq.log)..."
	@cd api && bundle exec sidekiq >> log/sidekiq.log 2>&1 &
	@echo "Starting Vite (log: web/vite.log)..."
	@cd web && npm run dev >> vite.log 2>&1 &
	@echo ""
	@echo "All services started. Logs:"
	@echo "  API:     api/log/development.log"
	@echo "  Sidekiq: api/log/sidekiq.log"
	@echo "  Web:     web/vite.log"
	@echo ""
	@echo "Run 'make stop-bg' to kill background processes."

stop-bg:
	@pkill -f "rails server" 2>/dev/null || true
	@pkill -f "sidekiq" 2>/dev/null || true
	@pkill -f "vite" 2>/dev/null || true
	@echo "Background processes stopped."

api: db
	cd api && bundle exec rails server -p 3000

web:
	cd web && npm run dev

sidekiq: db
	cd api && bundle exec sidekiq

# ── Docker ────────────────────────────────────────────────────────────────────

db:
	docker compose up -d
	@echo "Waiting for postgres..."
	@sleep 2

stop:
	docker compose stop

ps:
	docker compose ps

logs:
	docker compose logs -f

# ── Database ──────────────────────────────────────────────────────────────────

migrate: db
	cd api && bundle exec rails db:migrate

rollback:
	cd api && bundle exec rails db:rollback

seed:
	cd api && bundle exec rails db:seed

reset: db
	cd api && bundle exec rails db:drop db:create db:migrate

console:
	cd api && bundle exec rails console

routes:
	cd api && bundle exec rails routes

# ── Setup ─────────────────────────────────────────────────────────────────────

setup: db
	@echo "==> Installing Ruby gems..."
	cd api && bundle install
	@echo "==> Installing npm packages..."
	cd web && npm install
	@echo "==> Setting up database..."
	cd api && bundle exec rails db:create db:migrate
	@echo "==> Installing git hooks..."
	$(MAKE) install-hooks
	@echo ""
	@echo "Setup complete. Run 'make dev' to start."

# ── Tests ─────────────────────────────────────────────────────────────────────

test:
	cd api && bundle exec rspec

install-hooks:
	cp scripts/pre-push .git/hooks/pre-push
	chmod +x .git/hooks/pre-push
	@echo "pre-push hook installed."

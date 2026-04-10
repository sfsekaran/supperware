# Supperware

A recipe keeper for people who actually cook. Save recipes from any URL or paste them in as text — they're stored cleanly, scaled to any serving size, and shown in a calm, kitchen-friendly view.

## Stack

| Layer | Tech |
|---|---|
| API | Rails 8.1, PostgreSQL, Sidekiq + Redis |
| Auth | Devise + devise-jwt (Bearer token) |
| Frontend | React 18, Vite, TanStack Query, Zustand, Tailwind CSS v4 |
| Parsing | schema.org JSON-LD (primary), HTML heuristics (fallback), Ollama LLM (text paste) |

## Structure

```
supperware/
  api/          Rails API-only app (port 3000)
  web/          React + Vite frontend (port 3001)
  extension/    Browser extension scaffold (deferred)
  docs/         Notes, feature ideas, domain options
  Makefile      All dev tasks
```

## Setup

**Prerequisites:** Ruby (via RVM), Node 18+, Docker, [Ollama](https://ollama.com)

```bash
# 1. Clone and enter the repo
git clone <repo> supperware && cd supperware

# 2. Install dependencies and create the database
make setup

# 3. Copy and fill in environment variables
cp api/.env.example api/.env
# Edit api/.env — set OLLAMA_MODEL to a model you have pulled

# 4. Pull an Ollama model for text paste parsing
ollama pull qwen2.5:14b

# 5. Start everything
make dev
```

## Running

```bash
make dev        # API + Sidekiq + Vite in tmux panes (or background if no tmux)
make api        # Rails API only
make web        # Vite frontend only
make sidekiq    # Sidekiq worker only
```

API is at `http://localhost:3000`, frontend at `http://localhost:3001`.

## Environment variables

All variables live in `api/.env` (gitignored). See `api/.env.example` for the full list.

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `qwen2.5:14b` | Model used for text paste parsing |
| `OLLAMA_KEEP_ALIVE` | `30m` | How long to keep the model loaded between calls |
| `CORS_ORIGINS` | `http://localhost:3001` | Comma-separated allowed origins for the API |

## Other tasks

```bash
make migrate    # Run pending DB migrations
make rollback   # Rollback last migration
make reset      # Drop, recreate, and migrate the database
make console    # Rails console
make routes     # Print all routes
make test       # Run RSpec
make logs       # Tail Docker logs (postgres + redis)
```

## Recipe parsing

Supperware uses a parser chain in priority order:

1. **JSON-LD** — schema.org/Recipe embedded in page `<script>` tags (covers ~80% of recipe sites)
2. **Microdata / RDFa** — structured markup fallbacks
3. **HTML heuristics** — WordPress recipe plugin CSS classes (`wprm-*`, `tasty-*`, `mv-create-*`)
4. **Text paste** — if a URL fails or is paywalled, users paste the recipe text and an Ollama LLM extracts it

Ingredient quantities with gram weights (e.g. `2.5 cups (300g) flour`) use grams as the primary measurement for scaling. Volume units are shown as reference.

## License

[GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html)

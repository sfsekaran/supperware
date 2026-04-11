# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
make dev        # Start API (port 3000) + Sidekiq + Vite (port 3001) — tmux or background
make test       # Run RSpec
make console    # Rails console
make routes     # Print all routes
make migrate    # Run pending migrations
make reset      # Drop/recreate/migrate the database
```

Run a single spec: `cd api && bundle exec rspec spec/path/to/file_spec.rb`

The Vite dev server proxies `/api/v1/*` to `localhost:3000`. The proxy allowlist is explicit in `web/vite.config.ts` — add new API path prefixes there when adding controllers.

## Architecture

### API (`api/`)

Rails 8.1 API-only. Auth has two paths, both handled in `ApplicationController#authenticate_user!`:
- **JWT Bearer** (web app): Devise-jwt; token returned in the `Authorization` response header on sign-in
- **X-Api-Token** (extension): static token stored on the `User` model, checked first before JWT

### Recipe parse pipeline

`POST /api/v1/recipes/parse` accepts four input modes, handled by `RecipeParseController`:

| Param | Path | Processing |
|---|---|---|
| `json_ld` | Extension found JSON-LD in page | Sync — Normalizer → save, returns `{recipe_id}` |
| `html` | Extension sent raw HTML | Sync — JsonLdExtractor → Normalizer → save |
| `url` | Web app URL input | Async — Sidekiq job fetches + parses, returns `{job_id}` |
| `text` | Text paste | Async — Sidekiq job → Ollama LLM → parse, returns `{job_id}` |

The orchestrator lives at `app/services/recipe_parser/orchestrator.rb`. Parser chain: JSON-LD extraction → (Microdata/RDFa/HTML heuristics are stubs, TODO) → text paste via Ollama.

`og_image` param is accepted as a fallback for `primary_image_url` when JSON-LD has no image.

### Ingredient parsing

`IngredientParser::Parser.parse(raw_text)` returns a struct with all structured fields. It's called:
- On initial save (sync and async paths)
- On every ingredient `create`/`update` in `IngredientsController` — so editing `raw_text` always re-parses and keeps quantity/unit/name in sync

Gram weights embedded in parentheses (e.g. `2 cups (300g)`) are extracted and stored as `weight_grams`; displayed as the primary measurement in the UI.

### Frontend (`web/src/`)

- `lib/api.ts` — fetch wrapper; token injected via a getter set by the auth store
- `stores/authStore.ts` — Zustand + localStorage persistence; wires token into the api client at import time
- `router.tsx` — all routes; `RequireAuth` / `RequireGuest` guards
- `layouts/AppLayout.tsx` — sidebar (desktop) + bottom tab bar (mobile); uses explicit CSS classes in `index.css` with `@media` rules rather than Tailwind responsive variants (required due to Tailwind v4 specificity)
- Pages under `pages/public/` are unauthenticated

### Chrome extension (`extension/`)

MV3, no build step. Loaded as unpacked from `extension/`. Content script (`content_scripts/recipe_extractor.js`) is injected on-demand via `chrome.scripting.executeScript` when the popup opens — it's not a persistent content script. Auth uses `X-Api-Token` from `chrome.storage.sync` (configured in Options). Host permission is locked to `https://supperware.sathyasekaran.com`.

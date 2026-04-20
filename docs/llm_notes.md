# LLM Notes

This document tracks known limitations, future improvements, and operational notes
for the Ollama-based LLM integrations in Supperware.

## Current setup

- **Runtime:** Ollama, running locally
- **Model:** `qwen3.5:9b` (configured via `OLLAMA_MODEL` env var)

### Disabling Qwen3 thinking mode

Qwen3 models use an extended thinking mode by default. To disable it via the API, pass
`think: false` as a **top-level key** in the `/api/chat` request body (not inside `options`).
This maps to the `--think=false` CLI flag.

`num_think: 0` does not reliably disable thinking — it caps the thinking token budget but
the model still emits thinking tokens and may exhaust the budget before producing content.

With `think: false` at the top level, `qwen3.5:35b-a3b` responds in ~10s with correct
sections and zero thinking overhead.

**`qwen3.5:35b-a3b`** is a Mixture of Experts model: 35B total params, ~3B active per token.
Its Ollama model ID is identical to `qwen3.5:35b` (same file, different tag).
- **Uses:**
  - `PlainTextParser` — full recipe extraction from pasted text (`text:` async job path)
  - `SectionRefiner` — section label detection for JSON-LD/HTML parsed recipes (`url:` async job path)

## Known issues / future work

### Use a smaller, faster model for SectionRefiner

`SectionRefiner` uses the same `llama3.1:8b` model as `PlainTextParser` to avoid loading
multiple models into memory. The section detection task is much simpler than full recipe
extraction and would work well with a 3B model (e.g. `qwen2.5:3b`, `llama3.2:3b`).

**When to revisit:** If section refinement latency becomes noticeable on the URL parse path,
or if memory constraints are lifted (e.g. running on a beefier machine or a dedicated
inference server).

**How to implement:**
- Add `OLLAMA_SECTION_MODEL` env var, defaulting to a 3B model
- Update `SectionRefiner::OLLAMA_MODEL` to read from it
- Pull the model: `ollama pull qwen2.5:3b`
- Tune `num_ctx: 2048` and `num_predict: 256` (already set in SectionRefiner, vs 8192/4096 for full extraction)

Expected speedup: 3–5× on the section pass alone (30–90s → 5–10s).

### Consider LLM post-processing for all parse paths

Currently, the LLM is only involved in:
1. Text paste path (full extraction)
2. URL path (section refinement only)

The JSON-LD/HTML extraction handles titles, times, yields, and images reliably from
structured data, but can miss sections, merge steps incorrectly, or have formatting quirks
that the LLM would clean up.

A future "LLM refinement" pass could take the fully structured parse result + the raw page
text and ask the LLM to fix specific issues (sections, merged steps, garbled ingredients)
without touching the reliable structured fields. This is distinct from `SectionRefiner`
which only handles section labels.

**Risk:** LLM could degrade reliable structured fields (times, image URLs). Would need
careful prompt design to limit the LLM to only the fields it genuinely improves.

### SectionRefiner only runs on json_ld parse format

The `url:` job path skips `SectionRefiner` if `parsed_format != "json_ld"` (e.g. if
a future HTML heuristic extractor is added). Update the condition in `RecipeParseJob`
when new parse formats are introduced that would also benefit from section refinement.

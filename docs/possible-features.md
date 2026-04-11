# Possible Features

Future enhancements worth revisiting when the time is right.

---

## Compound ingredient quantity parsing

**Problem:** Ingredient lines like `2.5 cups (300g) plus 1 tablespoon King Arthur '00' Pizza Flour` contain compound quantities (`2.5 cups + 1 tbsp`). The current parser only captures the first quantity (`2.5`) and drops the `plus 1 tablespoon` part, so the scaled volume display is slightly wrong.

**Current workaround:** When gram weight is available, grams are shown as the primary measurement and the volume is shown as unscaled reference. Good enough for weight-first cooking.

**Proper fix:** Normalize compound quantities to a single base unit at parse time (e.g. convert everything to tablespoons: `2.5 cups + 1 tbsp = 41 tbsp`), then scale and re-format for display. Would require extending `IngredientParser` to detect and sum `X unit plus Y unit` patterns before the main quantity extraction pass.

**Related:** The `or 2.5 cups King Arthur All-Purpose Flour` substitution on the same line is also silently dropped — that's a separate problem (ingredient alternatives/substitutions are not modelled at all yet).

---

## AI-assisted ingredient and step grouping

**Problem:** Some recipe sites display clear ingredient sections ("Dough", "Toppings", "Garlic-basil oil") in their UI, but don't encode them in their JSON-LD — `recipeIngredient` is just a flat list. King Arthur Baking is a known example of this. The parser has no signal to group from, so everything lands in one unsectioned list even when the original recipe has meaningful structure.

**Idea:** After parsing, if `group_name` is null on all ingredients (or `section_name` on all steps), run an LLM pass over the flat list and ask it to infer logical groupings. Since Ollama is already in the stack for text paste parsing, this could reuse the same infrastructure.

**Trigger:** Only run when the parsed result has no sections at all — don't touch recipes where the JSON-LD already provided structure.

**Scope:** Probably ingredients only to start; step sections are less commonly needed and harder to get right.

---

# Possible Features

Future enhancements worth revisiting when the time is right.

---

## Compound ingredient quantity parsing

**Problem:** Ingredient lines like `2.5 cups (300g) plus 1 tablespoon King Arthur '00' Pizza Flour` contain compound quantities (`2.5 cups + 1 tbsp`). The current parser only captures the first quantity (`2.5`) and drops the `plus 1 tablespoon` part, so the scaled volume display is slightly wrong.

**Current workaround:** When gram weight is available, grams are shown as the primary measurement and the volume is shown as unscaled reference. Good enough for weight-first cooking.

**Proper fix:** Normalize compound quantities to a single base unit at parse time (e.g. convert everything to tablespoons: `2.5 cups + 1 tbsp = 41 tbsp`), then scale and re-format for display. Would require extending `IngredientParser` to detect and sum `X unit plus Y unit` patterns before the main quantity extraction pass.

**Related:** The `or 2.5 cups King Arthur All-Purpose Flour` substitution on the same line is also silently dropped — that's a separate problem (ingredient alternatives/substitutions are not modelled at all yet).

---

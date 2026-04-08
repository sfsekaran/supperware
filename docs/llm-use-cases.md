# LLM Use Cases for Supperware

Places where an LLM would genuinely outperform deterministic code.

## High Value, Relatively Easy

**Plain-text paste parsing**
A structured output prompt (`extract title, ingredients, steps as JSON`) will handle recipe cards, blog prose, handwritten scans (via OCR), and foreign-language recipes far better than any regex pipeline.

**Ingredient normalization cleanup**
After parsing, an LLM pass could resolve ambiguities the regex can't: "2 sticks butter" → 226g, "a handful of basil" → ~10g, "one 15-oz can chickpeas" → properly splitting quantity/unit/name. Could run async after save and patch the ingredient rows.

**Recipe description generation**
Many scraped recipes have no description, or a long SEO-stuffed one. A one-sentence "what makes this dish worth making" would improve the dashboard cards.

## Medium Value, More Work

**Diet tag inference**
Look at the ingredients and infer `vegan`, `gluten-free`, `dairy-free`, etc. reliably. Schema.org `suitableForDiet` is rarely populated on real sites.

**Substitution suggestions**
"I'm out of buttermilk" → contextual swaps that account for the specific recipe, not just a generic lookup table.

**Scaling sanity checks**
Flag when scaled quantities become impractical ("0.25 eggs", "3 teaspoons of salt for 1 cookie").

## Lower Priority / Stretch

**Search query understanding**
Turn "something quick with chicken I can make on a weeknight" into structured filters rather than just full-text search.

**Meal planning**
Given a week's worth of recipes, identify shared ingredients to minimize grocery shopping.

## When to Use LLM vs. Deterministic Code

The common thread for what makes LLM involvement worthwhile: tasks where the input is **unstructured or ambiguous** and the output needs to be **structured and reliable**. Avoid using it where a deterministic lookup works (unit conversion, duration parsing) — those are faster, cheaper, and more predictable.

# Shopify draft

A draft of the editor runs inside the PhotoBook Press store for testing, in an **unpublished** theme named "Next Up Books - DRAFT (testing, do not publish)" (theme ID 181531607233, a copy of the clean Horizon theme). The live theme and store data were not changed.

Preview (staff only, must be signed in to the store admin):
`https://linemark-mediaclip.myshopify.com/pages/about-us?view=next-up&preview_theme_id=181531607233`

What was added to that theme:

| Theme file | Source in this repo |
|---|---|
| `sections/nub-editor.liquid` | `shopify/theme/sections/nub-editor.liquid` |
| `layout/nub.liquid` (standalone page: no PhotoBook Press header, footer or styles) | `shopify/theme/layout/nub.liquid` |
| `templates/page.next-up.json` | `shopify/theme/templates/page.next-up.json` |
| `assets/nub-storefront.js` | `shopify/dist/nub-storefront.js` (built by `node shopify/build.mjs`, needs esbuild) |
| `assets/nub-*-card.jpg`, `assets/nub-fixture-*` | `content/` |

The page template is reached with `?view=next-up` on an existing page, so no page or product was created in the store.

Limits of the draft:

- **No products are connected**, so the cart is a stand-in kept in the browser and checkout is off. To test the store's real cart and checkout, create two products (each with a Softcover and a Hardcover variant) and choose them in the section's settings. They must be active to be added to a cart, which also makes them purchasable; decide that deliberately.
- **Designs are not stored on a server.** The cart line carries only a random design code; nothing a print job could be built from is saved. The hosted design service described in `docs/SITE_AND_JOURNEY.md` is still to build.
- The review queue, test checkout and proofs exist only in the local prototype (`npm start`).

## Character layers in the draft

To avoid copying hundreds of files into the theme for each art batch, the draft bundle reads the character layers directly from this public GitHub repository at a fixed commit. Build with:

`NUB_CHAR_BASE=https://raw.githubusercontent.com/<owner>/<repo>/<commit>/content/characters/v1/ node shopify/build.mjs`

Page backgrounds, site art and the bundle itself still live in the theme's assets. Before launch, move the character layers into the store's own files and build without `NUB_CHAR_BASE`.

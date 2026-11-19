# Next Up Books — development prototype

A runnable local prototype of the Next Up Books storefront: choose a first-experience story, make the child's character, preview the whole book, pick an 8.5 × 8.5 in softcover or hardcover, and place a test order that produces a proof and a print job.

**Development only.** Sample data, test checkout, placeholder art. Nothing here touches a live store, takes a payment, or sends a job to production. This repository was empty when the work started, so the prototype stands alone; it is not a Shopify theme.

## Run it

Needs Node.js 20 or newer. There is nothing to install.

```bash
npm start
```

Open http://localhost:4173

```bash
npm test
```

```bash
npm run check:content
```

`npm test` runs 13 automated checks of the stories and the order flow. `npm run check:content` reports which finished art files have been delivered.

## Review it in ten minutes

1. **Stories.** The home page shows the two launch titles and two "coming next" cards (your concept art).
2. **Personalize the dentist book.** Enter a name, change skin, hair and outfit, add glasses or ear defenders, a comfort toy, or a wheelchair. The character updates as you go.
3. **Preview the book.** Page through all 24 pages with the buttons or arrow keys. Try **All pages**, **Text only**, and **Easy to read**.
4. **Cover and order.** Choose softcover or hardcover, tick the confirmation, add to cart.
5. **Same character, second story.** Use the **Haircut** button at the top of the editor. The character carries over. Add that book too.
6. **Cart → Checkout (test) → Place test order.** The form is pre-filled with made-up details.
7. **Open a proof** from the order page. Print → Save as PDF gives an 8.5 × 8.5 in review copy.
8. **Review queue.** Try "Resend paid message" (no duplicate job is made), "Refund / cancel", and "Simulate a paid order with a missing design" (the job is held).
9. **Content status.** Shows how much finished art has arrived, and a layering test using the supplied classroom background and child cutout.
10. **Referral link.** Open http://localhost:4173/?ref=demo-dental — the fictional partner's code follows the order into the review queue.

Screenshots of each step are in `docs/screenshots/`.

## Documents

| File | What it is |
|---|---|
| `docs/SITE_AND_JOURNEY.md` | Site map, the customer journey stage by stage, what is real and what is faked, and the questions that need an owner or Linemark answer |
| `docs/ASSET_SPEC.md` | File formats and naming for stories, page art, character layers, covers and videos, so new titles drop in without rebuilding the editor |
| `docs/LAUNCH_PLAN.md` | Parent-focused launch plan: channel comparison, outreach messages, budget, results to track |
| `docs/BUSINESS_PLAN.md` | Pricing and margins for both bindings, launch titles, demand tests, video add-on test |
| `docs/handoff/` | The original brief and artwork notes |

## What is real and what is a stand-in

| Real in this prototype | Stand-in |
|---|---|
| The editor, live character, full-book preview, easy-to-read and text-only views | Art: labeled placeholder drawings until finished files are added |
| Both 24-page stories with the same character; support-specific wording | Story words: drafts, not yet reviewed |
| Freezing exactly what was previewed under a random design code; only that code goes on the cart line | Cart and checkout: local stand-ins shaped like Shopify's |
| Checks for expired, missing, foreign or changed designs; one print job per order line; duplicate and tampered messages rejected | "Order paid" message: simulated locally |
| Proof built from the same data as the preview, verified against the approved fingerprint | Proof is trim-size only; no bleed, spine or color profile |
| Review queue with hold, refund and release states | "Release" sends nothing anywhere |

Data lives in memory and is cleared when the server stops.

## Layout

| Path | Contents |
|---|---|
| `content/` | **Everything the creative side delivers.** `catalog.json`, one folder per title (`title.json` + `art/`), `characters/v1/`, and the layering fixture |
| `shared/` | Code used by both the browser and the server: catalog and price fixtures, the page composer, and the placeholder character and scene drawings |
| `public/` | The storefront pages (`app.js`, styles, and `book.css`, which styles book pages identically in preview and proof) |
| `server/` | Local server, content loader and checker, and the order flow (`core.js`) |
| `test/` | Automated checks |

To add a title: add `content/titles/<handle>/title.json`, list the handle in `content/catalog.json`, and drop art into its `art/` folder. No code changes. Details in `docs/ASSET_SPEC.md`.

## Not built yet

- A real Shopify store, theme embed and checkout.
- Print-ready interior and cover files (waiting on Linemark's specification).
- A hosted database for designs, with retention and deletion rules.
- Waitlist sign-up for upcoming titles, the partner request form, and the companion video.
- A staff sign-in for the review queue (it is open in this local build).
- A full accessibility audit. The editor is keyboard-operable with visible focus, labeled controls, alt text, a text-only view and no motion, but it has not been tested with assistive technology or against WCAG 2.2 AA line by line.

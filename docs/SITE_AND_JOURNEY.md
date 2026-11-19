# Site map and customer journey

Next Up Books is its own direct-to-consumer site on its own domain. Parents and caregivers buy. Linemark prints and ships. This document maps the site, the journey from finding a story to a delivered book, and what the prototype already covers.

**Assumption to confirm:** the new site is a separate Shopify store (you mentioned dropping content into Shopify). Everything below holds for that. If you meant something other than Shopify, the editor and order logic still apply but the store pieces change.

## What exists today (read-only look at photobookpress.com, 19 Nov 2026)

Nothing was changed on the live store. Useful facts for the new brand:

| Finding | Why it matters |
|---|---|
| Shopify Advanced plan; live theme is Wokiee, with a Horizon rebuild in progress | The new store can start on the free Horizon theme your team already knows |
| 8.5 × 8.5 hardcover and softcover photo books are already sold (SKUs `PBP8.5x8.5HCP-GL`, `PBP8.5x8.5SCP-GL`; listed from $14.99 and $13.99) | Linemark already produces this trim in both bindings. It anchors the cost assumptions in the business plan |
| Mediaclip Hub runs the photo-book designer | Not reused. Mediaclip is for customer photos; Next Up is fixed art plus a character, so it uses its own lightweight editor |
| Klaviyo (email/SMS and reviews), Shopify Collabs, Shopify Flow, Smile.io, Freshdesk are installed | The team has working knowledge of each; the same tools are proposed for the new store |

## Site map

| Page | Purpose | Notes |
|---|---|---|
| Home | "A little story for a big first." Explain in one screen, show the two launch titles | Prototype: built |
| First Experiences collection | All titles, plus "coming next" cards that collect interest | Prototype: built (waitlist capture not yet) |
| Title page (one per story) | Sample spreads, what the story covers, price, **Personalize** | Prototype: folded into the editor |
| Editor: character → preview → cover | The core of the product | Prototype: built |
| Cart | One line per book; hidden design reference | Prototype: mock of Shopify's cart |
| Checkout | Shopify checkout | Prototype: test page with sample data |
| Order confirmation and status | What was ordered, when it prints | Prototype: built (test) |
| How it works | Three steps, sample pages, the read-first promise | To write |
| Who reviews our stories | Named autistic reviewers and professionals; how to give feedback | To write once reviewers are engaged |
| Guides (blog) | "What to expect at a first dentist visit", free printable version of each story as an email sign-up | Search and email channel; see launch plan |
| For partners | A dentist, school or salon requests a share link and a printable card with a QR code | Referral link is built (`?ref=`); request form is not |
| FAQ, Shipping and reprints, Privacy and children's information, Accessibility, Contact | Policies | To write; reprint policy and timing need Linemark's input |

## The journey, stage by stage

| # | Stage | What the customer does | What the system does | What to measure |
|---|---|---|---|---|
| 1 | Find | Arrives from search, a creator's post, a community recommendation, or a partner's link | Stores the referral code, if any, against the cart. No personal data | Sessions by source |
| 2 | Choose a story | Picks dentist or haircut; sees upcoming titles | Shows titles from the content folder | Title page views; "notify me" sign-ups for upcoming titles |
| 3 | Make the character | Optional name, pronouns and age band; skin, hair, eyes, outfit; glasses, hearing aids, ear defenders, AAC device; wheelchair; comfort item | Draws the character live. Choices stay in the browser tab only. No photo, birthday or diagnosis is asked for | Editor starts; completion rate |
| 4 | Preview the whole book | Reads every page, one at a time or all at once; can switch to easy-to-read words or a text-only view | Builds all pages from the same data the print file will use | Preview starts and completions |
| 5 | Choose the cover | Softcover or hardcover, both 8.5 × 8.5 in; sees price, shipping and timing; ticks "I checked every page" | Refuses a binding that cannot take the page count | Binding mix |
| 6 | Add to cart | Adds the book; can go back and make the other story with the same character | Freezes exactly what was previewed under a random design code; only that code goes on the cart line | Add-to-cart rate; books per order |
| 7 | Check out | Pays through Shopify | Blocks checkout if a design has expired or its binding was changed | Checkout completion |
| 8 | Order paid | Sees confirmation | Shopify's "order paid" message is verified, de-duplicated, and turned into one print job per book. A job with a missing or mismatched design is held for a person | Orders; held jobs |
| 9 | Review and print | Nothing | A person at Linemark checks the proof and releases the job. Refunds before release cancel the job | Time from order to release; remakes |
| 10 | Ship and follow up | Receives tracking, then the book | Shopify fulfillment and notifications; Klaviyo follow-up asking for a review and offering the next title | Delivery time; reviews; repeat orders |

## What the prototype proves and what it fakes

| Piece | In the prototype | For launch |
|---|---|---|
| Editor, preview, both stories, same character across titles | Real, working | Embed in the store's product page |
| Art | Labeled placeholder drawings; your concept art on the shop cards; the supplied classroom background and child cutout prove layering | Finished art dropped in by file name (see `ASSET_SPEC.md`) |
| Cart | A stand-in that behaves like Shopify's cart | Shopify's real cart; the theme must hide the design code from customers (properties starting with `_`) |
| Checkout and payment | Test page, sample data, no payment | Shopify checkout |
| "Order paid" message | Simulated, with real signature checking and duplicate handling | Shopify's webhook to a small hosted service |
| Design storage | In memory; cleared on restart | A small database with a retention and deletion policy |
| Proof | Web page at trim size, labeled PROOF, printable to PDF | Print-ready interior and cover files built to Linemark's specification |
| Production hand-off | A review queue; "release" does nothing | Agreed route into Linemark's workflow |

## What has to be decided or built to go from prototype to a small paid pilot

1. **Create the store** (new Shopify store, domain, Horizon theme, policies). Owner decision: plan level and domain.
2. **Host the small service** that stores designs and receives the paid-order message. It can be a Shopify app on a low-cost host. Needs an owner decision on where it lives and who maintains it.
3. **Linemark print specification** for both bindings (see questions below), then build the real print files.
4. **Finished art and reviewed words** for the two launch titles.
5. **Privacy review** with the owner before public launch: the site is addressed to adults and collects only an optional first name, but confirm against the current FTC COPPA guidance.
6. **Test order in the real store** in Shopify's test mode before any real payment.

## Questions only you or Linemark can answer

| Question | Why it blocks |
|---|---|
| Minimum and allowed page counts for 8.5 × 8.5 softcover and hardcover; saddle-stitched or perfect-bound softcover | A 22-page story may not be bindable; outside printers commonly need 24+ for hardcover and multiples of 4 for saddle stitch |
| Bleed, safe margin, color profile, cover template for each binding (spine, wrap, hinge, endpapers) | Needed before any print-ready file can be built |
| Internal cost per book for each binding at quantity one | The margin model uses placeholders |
| How a job should reach the plant (OnTrack, HP SiteFlow, hot folder, email) | Decides the hand-off build |
| Production time and the shipping service and rate to quote | Shown to customers before they buy |
| Is the new site a separate Shopify store, and on which plan? | Sets fees and setup steps |

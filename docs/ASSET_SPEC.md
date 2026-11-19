# Asset spec: what to deliver so a title drops in without touching the editor

This is the contract between the creative side (stories, characters, illustrations, covers, videos) and the site. The editor finds everything **by file name**. If a file is missing, the site shows a labeled placeholder in its place, so you can deliver a title a few pages at a time and watch it fill in.

Check a delivery at any time:

```bash
npm run check:content
```

It lists which pages are finished, which are still placeholders, and any file that is the wrong size or misnamed. The same report is on the **Content status** page of the prototype.

## 1. The one rule that shapes the art

The child is customizable, so **the child is never painted into the page background.** Each page is three stacked pieces:

1. **Background plate**: the full-bleed scene, including the room, props and other people (dentist, stylist, grown-up).
2. **Child**: placed on top by the editor from separate character layers.
3. **Foreground overlay** (optional): anything that must sit in front of the child, such as a chair arm or table edge.

Words are never part of the art. They stay as live text so names, pronouns and the easy-to-read setting work, and so the read-aloud text can sit at the bottom of every page.

## 2. Page art

| Item | Requirement |
|---|---|
| Size | **2625 × 2625 px** square (8.5 in trim + 0.125 in bleed on each side, at 300 ppi) |
| Format | JPEG (quality 90+) for plates; PNG with transparency for overlays |
| Color | sRGB. Linemark converts for press; do not deliver CMYK unless Linemark asks |
| Bleed | Art runs to the edge of the file. The outer 38 px on each side is trimmed off |
| Keep clear | No faces or important detail in the **bottom 26%** of the page (the text panel sits there) or within 115 px of any edge |
| No text | No lettering in the art except incidental signs. Titles and story text are added by the editor |

The bleed and resolution figures are working assumptions until Linemark confirms its specification. They are set in one place (`shared/catalog.js`).

### File names

All lowercase, hyphens only, no spaces. Names are unique across the whole brand because Shopify's file library is one flat list.

| File | Name | Example |
|---|---|---|
| Page background | `nub-<title>-p<NN>-bg.jpg` | `nub-dentist-p05-bg.jpg` |
| Page foreground overlay (optional) | `nub-<title>-p<NN>-fg.png` | `nub-dentist-p11-fg.png` |
| Wheelchair version of a page (only where the scene must change) | `nub-<title>-p<NN>-bg-wheelchair.jpg` | `nub-dentist-p11-bg-wheelchair.jpg` |
| Front cover background | `nub-<title>-cover-front-bg.jpg` | `nub-haircut-cover-front-bg.jpg` |
| Back cover background | `nub-<title>-cover-back-bg.jpg` | |
| Shop card image (1500 × 1000) | `nub-<title>-card.jpg` | `nub-dentist-card.jpg` |

`<title>` is the short code in the title's `title.json` (`dentist`, `haircut`). `<NN>` is the two-digit interior page number, `01` to `34`. Covers are separate from the interior page count.

Drop the files in `content/titles/<handle>/art/`. Reload the site; they appear.

## 3. Character layers

One set of character art serves every title. Each pose is a stack of transparent PNGs on an identical canvas, so any skin tone, hair, outfit and support can be combined.

| Item | Requirement |
|---|---|
| Canvas | **1500 × 2250 px**, transparent PNG, every layer of every pose |
| Anchor | The point on the ground between the feet is at **x 750, y 2100** on every canvas |
| Scale | A standing child is 1500 px from the ground to the top of the head |
| Alignment | Layers of one pose must register exactly when stacked |

File name: `nub-char-v1-<pose>-<part>.png`, in `content/characters/v1/`.

| Part | Name | Required? |
|---|---|---|
| Body: head, face, hands in a skin tone | `body-s1` … `body-s6` | Yes |
| Outfit | `outfit-cardigan`, `outfit-collar`, `outfit-leaf`, `outfit-flower`, `outfit-pocket` | Yes |
| Hair in front of the head | `hair-<style>-<color>` e.g. `hair-curls-black` | Yes |
| Hair behind the head | `hairback-<style>-<color>` | Only if the style needs it |
| Eye color | `eyes-hazel`, `eyes-green`, `eyes-blue`, `eyes-gray` (brown is painted into the body) | Yes, if offered |
| Supports | `acc-glasses`, `acc-hearingAids`, `acc-earDefenders`, `acc-aac` | Yes, if offered |
| Comfort item | `comfort-bunny`, `comfort-bear` | Yes, if offered |
| Wheelchair | `mobility-wheelchair` (behind the child), optional `mobility-wheelchair-front` | Yes for seated poses, if offered |
| Scene wear | `wear-bib`, `wear-cape` | Where a page uses it |

Stacking order, back to front: wheelchair, hairback, body, outfit, eyes, hair, wear, supports, comfort item.

Poses: `stand`, `wave`, `handUp`, `sit`, `sitWave`, `sitHandUp`. A child using a wheelchair is always drawn with the seated version of a pose.

Hair styles: `curls`, `bob`, `puffs`, `wavy`, `short`. Hair colors: `black`, `brown`, `red`, `blonde`.

A pose switches from placeholder to finished art only when every layer the customer's choices need is present. Until then that pose stays a placeholder, so a half-delivered set never shows a mismatched child.

### Launch set

The editor is trimmed to a launch set: **6 poses** (`stand`, `wave`, `handUp`, `sit`, `sitWave`, `sitHandUp`), 6 skin tones, 5 outfits, **5 hair styles** (`curls`, `bob`, `puffs`, `wavy`, `short`) in **4 colors** (`black`, `brown`, `red`, `blonde`), 4 eye-color overlays, 4 supports and 2 comfort toys. That is 41 layers per pose and 246 in all, plus bib and cape. Brown eyes are painted into the body layer; the other eye colors are small overlays (`eyes-hazel`, `eyes-green`, `eyes-blue`, `eyes-gray`) and are required when a customer picks them.

The first test set (one pose, 9 layers, 4 backgrounds) lined up correctly in the editor. The full list of what to make is in `ART_BRIEF_FULL.md`. Options can be added later without changing anything else.

## 4. Story file (`title.json`)

One file per title in `content/titles/<handle>/title.json`. Copy an existing one to start. The parts you write:

```json
{
  "id": "school", "code": "school", "handle": "my-first-day-of-school",
  "title": "My First Day of School", "short": "School",
  "storyVersion": "1.0.0", "copyStatus": "reviewed",
  "interiorPageCount": 24,
  "variants": [
    { "id": 0, "binding": "softcover", "sku": "NUB-SCHL-SC-85" },
    { "id": 0, "binding": "hardcover", "sku": "NUB-SCHL-HC-85" }
  ],
  "pages": [
    {
      "id": "p02",
      "layers": [ { "type": "child", "pose": "wave", "at": [400, 700] } ],
      "text": {
        "std": "My name is {name}. Soon I will go to school.",
        "easy": "I am {name}. I will go to school.",
        "noName": { "std": "Soon I will go to school.", "easy": "I will go to school." }
      },
      "alt": "{child} stands at home near a calendar."
    }
  ]
}
```

- **Page count:** 22 to 34 interior pages. `interiorPageCount` must match the number of pages. The site refuses to sell a count a binding cannot take; it never pads a story.
- **`layers`:** where the child stands. `at` is the spot between the feet, on a 1000 × 1000 grid measured from the top-left of the trimmed page. `scale` is optional (default 1.15). Add `"wheelchairAt"` if a wheelchair user should be placed elsewhere, `"wear"` for a bib or cape, `"flip": true` to mirror.
- **`text.std` / `text.easy`:** standard and easy-to-read words. One idea per page, short sentences.
- **`text.noName`:** required on any page that uses `{name}`, for books ordered without a name.
- **`text.variants`:** optional alternative words for a support, for example `{ "when": { "mobility": "wheelchair" }, "std": "…", "easy": "…" }`. Also `"support": "aac"` or `"support": "earDefenders"`.
- **`alt`:** one sentence describing the picture for screen readers. Use `{child}` for the name.
- **Tokens:** `{name}`, `{Name}`, `{child}`, `{they}`, `{them}`, `{their}`, and `{v:likes|like}` for verbs that change with they/them.
- **`availability`:** lists which supports this title has art for. Anything set to `false` is shown as unavailable in the editor.

If writing JSON is a nuisance, send the story as a table (page number, standard words, easy words, picture description, where the child stands) and I will convert it.

Then add the handle to `content/catalog.json` under `titles`. That is the whole process for a new title.

## 5. Covers

Front and back cover backgrounds follow the page-art rules. The editor adds the title, the "A story for …" line and the child. Spine, hardcover wrap and hinge areas are **not specified yet**; they depend on Linemark's cover templates for each binding. Expect a wider cover file per binding once those arrive.

## 6. Companion video (future add-on)

Not sold yet. When it is tested, deliver per title:

| Item | Requirement |
|---|---|
| Video | `nub-<title>-video.mp4`, 1920 × 1080, H.264, AAC audio, under 200 MB |
| Captions | `nub-<title>-video.en.vtt` (required) |
| Poster frame | `nub-<title>-video-poster.jpg`, 1920 × 1080 |

Videos would be the same for every customer at first (not personalized). Set `"video"` in `title.json` when ready.

## 7. Moving to Shopify

| Prototype | Shopify |
|---|---|
| `content/titles/<handle>/art/*` and `content/characters/v1/*` | Upload to **Content → Files**, same file names |
| `title.json` | A JSON metafield on the product (`nub.title`) |
| `variants` ids | Replace the `0` placeholders with the real variant IDs after creating the product |
| `content/catalog.json` | The First Experiences collection |

Replacing a file in Shopify keeps its name, so a corrected page goes live without any other change. Any book already approved by a customer is checked against the art it was approved with before printing.

## 8. Rights and review to record per title

- Who made each illustration and with which tool, and that commercial use is cleared.
- That the story text was reviewed (reviewer names and dates), then set `"copyStatus": "reviewed"`.
- Art at print resolution: generated images are often 1024 to 2048 px and need upscaling to 2625 px; check a printed proof before release.

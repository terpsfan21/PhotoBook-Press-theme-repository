# Two-profile, two-scene test: file and naming requirements

**Purpose.** Before painting six child profiles across a whole book, prove with two profiles and two dentist scenes that the look, the selectable support and the name on screen are exactly what would print.

The preview is already set up for this. Files are picked up by name. Until a file arrives, that page shows the earlier Avery sample as a stand-in, tagged "Placeholder art".

## How the painted-profile model works

- A **profile** is one fully painted child, with their own grown-up, who appears in every picture. Profiles are named `c1` to `c6` and are the same children in every book.
- A family chooses the profile closest to their child and types the name. The name is live text on the cover, title page and story pages; it is never painted into the art.
- A **support** (glasses, ear defenders, AAC device) is scene-specific. It only changes the pages where it would be seen, and each of those pages has a second painted version. The editor offers a support for a profile only when every page it changes has been painted for that profile.
- The **wheelchair story** will be its own book path with its own scenes and file names. It is not part of this test.

## The two scenes

Scene numbers follow the latest Avery sample.

| Scene | Page | Words | What it tests |
|---|---|---|---|
| Packing Fern | `p03` | "I pack Fern, my soft green rabbit. Mom says Fern can come with us." | Close interaction with the grown-up, Fern and the backpack; warmth and movement |
| The little tube | `p16` | "A little tube can slurp up water. The dentist shows me how it sounds." | The selectable support: the same scene with and without ear defenders |

When ear defenders are chosen, page 16 reads: "A little tube can slurp up water. I wear my ear defenders while the dentist shows me how it sounds." Change the wording if you prefer; it is in the story file, not the art.

## Files to deliver: 10

For each of the two profiles (`c1`, `c2`):

| File | What it is |
|---|---|
| `nub-profile-c1.jpg` | Portrait for the profile chooser. 800 × 800 px, head and shoulders, plain warm background |
| `nub-dentist-c1-cover-front-bg.jpg` | Front cover scene (as the Avery cover). Keep the **top 32%** calm and mid-to-dark so cream title lettering reads on it |
| `nub-dentist-c1-p03-bg.jpg` | Packing Fern |
| `nub-dentist-c1-p16-bg.jpg` | The little tube, **without** ear defenders |
| `nub-dentist-c1-p16-bg-earDefenders.jpg` | The same picture **with** ear defenders |

The same five for `c2`: replace `c1` with `c2` in each name.

## Picture requirements

| | |
|---|---|
| Size | **2625 × 2625 px** square (8.5 in trim plus 0.125 in bleed each side at 300 ppi). The portrait is 800 × 800 |
| Source size | Generate as large as the tool allows and tell me the size it was generated at. The Avery sample pictures were 404 to 605 px, which is far too small to print; 1254 px enlarged is about 143 ppi and is waiting on the Linemark proof |
| Format | JPEG, quality 90 or higher, sRGB |
| Full bleed | Art runs to every edge. The outer 38 px on each side is trimmed |
| Words band | The **bottom 28%** of every story page is covered by a soft dark band with the read-aloud words. Keep faces, hands, Fern and anything important above it. The picture should still continue behind the band |
| Edges | Keep faces and key detail at least 115 px from every edge |
| No lettering | No words in the art. Name, title and story text are added by the editor |

## Consistency rules

- **Same child, every file.** Face, hair, skin tone, build and outfit must match across a profile's cover, both scenes and portrait.
- **Same grown-up and same Fern** within a profile.
- **The support pair must match.** `p16-bg` and `p16-bg-earDefenders` should be the same composition, pose and lighting, with the ear defenders as the only real difference. This is what lets us check that turning the option on changes nothing else.
- **Two clearly different profiles.** Choose two that differ in skin tone and hair so the test is meaningful.
- If a child always wears glasses (as Avery does), that is part of the profile, not an option.

## Also send, as plain text

For each profile, a short label and a one-line description for screen readers and the chooser, for example: "Child 1: curly dark hair, warm brown skin, round glasses."

## File naming for the full set, for reference

| What | Pattern | Example |
|---|---|---|
| Page for a profile | `nub-<book>-<profile>-p<NN>-bg.jpg` | `nub-dentist-c3-p11-bg.jpg` |
| Same page with a support | add `-<support>` | `nub-dentist-c3-p11-bg-glasses.jpg` |
| Same page with two supports | supports in this order: `aac`, `earDefenders`, `glasses` | `nub-dentist-c3-p16-bg-earDefenders-glasses.jpg` |
| Front cover | `nub-<book>-<profile>-cover-front-bg.jpg` | |
| Back cover (shared by all profiles) | `nub-<book>-cover-back-bg.jpg` | |
| Portrait | `nub-profile-<profile>.jpg` | `nub-profile-c3.jpg` |

Lowercase, hyphens, no spaces, no "final" or "v2". Support names are spelled exactly `aac`, `earDefenders`, `glasses`.

A page that two chosen supports both change needs one picture showing both. That is why supports should be limited to the scenes where they matter.

## What I check when the files arrive

1. Each file is the right size and name (`npm run check:content` lists what arrived per profile).
2. In the preview: choosing each profile shows that child on the cover and both scenes; the typed name appears on the cover, title page and story pages; turning ear defenders on swaps page 16's picture and wording and nothing else.
3. A test order freezes the profile, support and name; the proof is rebuilt from that frozen record and compared with what was approved.
4. The two scenes are printed from the proof at Linemark at full size, so the on-screen pages can be held next to the printed ones.

## Decisions to settle while the art is made

- **The grown-up word.** The story says "Mom". Each profile's grown-up is painted, so the word should match the painting. Is it fixed per profile, or do families choose from words that fit (Mom, Mama, Grandma, and so on)?
- **Page 17, "I can try my headphones if the sound bothers me."** What does this page say and show for a child with no ear defenders chosen?
- **Six profiles.** Which six children, and which of them wear glasses as part of who they are?

# Codex Knowledge Base

> *"Codex tidak memberi jawaban. Codex memberi mata."*

Curated reference material across the six traditions Semar / 天人合一 Codex synthesizes. Authored as **descriptive prose** — never prescriptions, never "you should." The voice rules from `/workspace/semar/docs/voice-canon.md` apply to every page in this corpus.

## Structure

```
knowledge/
├── bazi/          (already populated — 42 files migrated 2026-05-17)
├── tarot/
│   ├── majors/    (22 cards)
│   ├── minors/{wands,cups,swords,pentacles}  (14 each)
│   ├── spreads/   (reading layouts)
│   ├── frameworks/ (interpretation approaches)
│   └── case-studies/
├── astrology/
│   ├── signs/     (12)
│   ├── planets/   (10)
│   ├── houses/    (12)
│   ├── aspects/   (5 major + theory)
│   ├── dignities/
│   ├── house-systems/
│   ├── frameworks/
│   └── case-studies/
└── bibliography/  (sources per tradition)
```

## Conventions

**File format.** Single Markdown file per entity (one card, one planet, one shen sha). Filename = slug of the entity's English name.

**Page structure (recommended).**

```markdown
# {Name} ({Glyph / Number})

## Image / Symbol
Brief description of what the card / glyph depicts.

## Core Meaning
2–4 sentences. The essential thing.

## Upright / Strength / Domicile (depending on tradition)
Detailed traits, themes, archetypal patterns.

## Reversed / Shadow / Detriment
The same archetype turned, blocked, or excessive.

## In a Reading / In a Chart
How this entity shows up in actual divinatory work.

## Keywords
comma, separated, quick, references

## Sources
- Author, *Title* (Publisher, year), p. NN
- One-line annotation
```

**Voice.**
- Plain prose. No bullet lists for the body. Bullets are allowed in **Keywords** only.
- No prescriptions. Replace "you should" with "the figure suggests," "the placement asks," "tradition reads this as."
- Metaphors from nature (rivers, seasons, fire, stone) over abstract psychology jargon.
- The sage prunes — three sharp sentences beat a paragraph of qualification.

**Sources.**
- Cite primary or canonical secondary sources. Avoid blog-of-blog citations.
- For tarot: Waite, Pollack, Bunning, Greer, Wen.
- For astrology: Hand, George, Greene, Forrest, Tompkins, Brennan.
- For BaZi: Master Yap, Master Sang, Joey Yap; Chinese sources where translated.
- Bibliography lives under `bibliography/`.

## Progress tracking

See `RESEARCH_PROGRESS.md` (next to this file) for the current status of the research effort.

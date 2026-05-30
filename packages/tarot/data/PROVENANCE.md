# Data Provenance — `tarot-interpretations.corpora.json`

- **Source:** [`dariusk/corpora`](https://github.com/dariusk/corpora) — file
  `data/divination/tarot_interpretations.json`
  (raw: `https://raw.githubusercontent.com/dariusk/corpora/master/data/divination/tarot_interpretations.json`).
- **License:** **CC0 1.0** (public domain dedication). No attribution legally
  required. Vendoring the file into this repo is permitted.
- **Retrieved:** 2026-05-30 (vendored verbatim; not modified).
- **Coverage:** all 78 cards — `keywords[]`, `meanings.light[]`, `meanings.shadow[]`,
  `fortune_telling[]`.

## ⚠️ Provenance caveat — verify before commercial resale

Per the research synthesis (`docs/research/tarot-reader-gaps-2026-05-30.md`, "Open
data & licensing"):

- The corpora **CC0 declaration lives only in the repo README** — there is **no
  standalone `LICENSE` file** asserting CC0 over this specific data file. The
  dedication is effective for our use, but is weaker evidence than a per-file license.
- The interpretation **text may be upstream-derived** (it closely tracks Brian Crick's
  `tarot-interpretations` corpus). Provenance of the *original* authorship was not
  fully traced.

**Action:** This data is fine for building and internal use. **Trace provenance
before monetizing / reselling** the meanings text as a commercial product. If a
clean chain of title cannot be established, re-author the meanings before sale.

## Schema mapping note (light/shadow → upright/reversed)

The corpora uses a **light / shadow** polarity model, NOT the **upright / reversed**
orientation model our deck uses (we draw explicit reversals). `src/meanings.ts`
maps `meanings.light → upright` and `meanings.shadow → reversed` **deliberately** —
these are a reasonable but not identical correspondence. See the doc-comment in
`meanings.ts` for the rationale.

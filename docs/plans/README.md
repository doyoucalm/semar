# Plans

Bite-sized implementation plans, one file per feature/refactor:

```
YYYY-MM-DD-<topic>.md
```

A plan is written from an approved [spec](../specs) and assumes the implementer has
**zero context and questionable taste** — so it spells out exact file paths, the test for
each step, and how to verify. Steps are 2–5 minutes each and use `- [ ]` checkboxes. TDD,
DRY, YAGNI, frequent commits. For refactors, every step follows the
`pin → change → prove → build → commit` loop from
[`.claude/skills/refactoring/SKILL.md`](../../.claude/skills/refactoring/SKILL.md).

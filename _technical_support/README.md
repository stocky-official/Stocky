# _technical_support

This directory is the dedicated location for all non-production, auxiliary, tooling, migration, and maintenance resources for the **Stocky** platform, in accordance with **Critical Rule 2**:

> **Critical Rule 2**: Any irrelevant or auxiliary files you need to create now or in the future must be in a dedicated folder inside `_technical_support`.

---

## Directory Organization

```
_technical_support/
├── scripts/              # Data parsers, spreadsheet processors, migration scripts
├── docs/                 # Internal architecture notes, schema diagrams, RFCs
└── tools/                # One-off testing utilities and developer helpers
```

## Guidelines for Using this Directory

1. **Data Processing**: When parsing or transforming files from `data/` (e.g. `data/fwdata.zip`), put conversion/seed scripts inside `_technical_support/scripts/`.
2. **Never Import in Production**: Code inside `_technical_support` must **never** be imported by `apps/web`, `apps/mobile`, or `packages/*`.
3. **Keep It Organized**: Every script added here should include a short header comment explaining its purpose and how to run it.

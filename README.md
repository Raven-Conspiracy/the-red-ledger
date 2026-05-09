# THE RED LEDGER

**Russian Ground Forces Order of Battle Intelligence Application** — Task Force Raven.

Interactive OOB application built on Drizzle ORM + SQLite, with a deck.gl-powered map frontend.

---

## What's in the repo

```
client/                     — Frontend (React + deck.gl map)
server/                     — Express backend
shared/schema.ts            — Drizzle schema (military_districts, armies,
                              divisions, brigades, unit_equipment, oryx_losses,
                              data_meta)
sqlite.db                   — Live SQLite database (Russian OOB)
script/                     — Seed + utility scripts
data/
  oob_structured/           — NEW: CN / IR / DPRK structured OOB extension
                              (static JSON + summaries; not yet wired into
                              the app DB — see data/oob_structured/README.md)
```

---

## Order of Battle coverage

| Country  | Source                              | Status                                    |
|----------|-------------------------------------|-------------------------------------------|
| Russia   | `sqlite.db` (live)                  | Wired into app — 5 districts, 20 armies, 15 divs, 36 brigades, 24 equipment lines, Oryx losses |
| China    | `data/oob_structured/china_oob.json`| **NEW** — static JSON, 5 theaters / 33 GAs+fleets+bases / 85 brigades   |
| Iran     | `data/oob_structured/iran_oob.json` | **NEW** — static JSON, 9 services (Artesh + IRGC bifurcated) / 46 regions / 79 bdes |
| DPRK     | `data/oob_structured/dprk_oob.json` | **NEW** — static JSON, 7 directorates / 30 corps+fleets / 42 brigades |

Combined: **488 unit records across 4 priority threat states.**

The CN/IR/DPRK extensions follow the same Drizzle schema pattern as the Russian OOB — see `data/oob_structured/SCHEMA_SPEC.md` for the country-specific hierarchy mappings, and `data/oob_structured/README.md` for full details, sources, and brutal-honesty guardrails.

---

## Run the app

```bash
npm install
npm run dev
```

The Russian OOB is the live data source. The new CN/IR/DPRK JSONs are static reference data — to wire them into the live app, extend `shared/schema.ts` with country-tagged variants and seed from the JSONs.

---

## License & use

Internal Task Force Raven project. Sources listed per-unit in the data files.

# Structured OOB Extension — CN / IR / DPRK

**Project**: Task Force Raven — extension of the Red Ledger Russian Ground Forces OOB to three additional priority threat states (China, Iran, DPRK), built using the same Drizzle schema pattern.

**Status**: Static JSON data + curated summaries. Not yet wired into the app database. The live app continues to run on the existing Russian sqlite.db until/unless these are migrated in.

---

## What's here

| File | Purpose |
|------|---------|
| `SCHEMA_SPEC.md` | Spec defining how each country extends the Red Ledger pattern (5-tier PLA, bifurcated Iran, 4-tier KPA) |
| `china_oob.json` | PLA OOB — 5 Theater Commands, 33 Group Armies/Fleets/Bases, 85 brigades/divisions, 36 equipment lines |
| `china_oob_summary.md` | Hierarchy tree + per-unit provenance + gaps for PLA |
| `iran_oob.json` | Iranian armed forces — 9 service branches (Artesh + IRGC bifurcated), 46 regions/commands, 79 brigades/squadrons, 18 equipment lines |
| `iran_oob_summary.md` | Hierarchy tree + per-unit provenance + post-2024-strikes status notes |
| `dprk_oob.json` | KPA OOB — 7 directorates, 30 corps/fleets/air divs/missile bureaus, 42 brigades, 22 equipment lines |
| `dprk_oob_summary.md` | Hierarchy tree + per-unit provenance + post-2021 updates + Russia-DPRK cooperation impact |
| `ingest_oob_structured.py` | Renderer that converts each JSON into tagged text chunks for downstream RAG ingestion |

---

## Schema mapping

Each country's JSON conforms to:

```json
{
  "source": "Inquisitor curated OOB",
  "country": "China" | "Iran" | "DPRK",
  "snapshot_date": "2026-05-09",
  "schema_version": "v1",
  "tables": {
    "top_tier":       [...],
    "second_tier":    [...],
    "third_tier":     [...],
    "fourth_tier":    [],
    "unit_equipment": [...]
  },
  "sources_consulted": ["...", "..."]
}
```

Mapping back to the live Drizzle tables (`shared/schema.ts`):

| Red Ledger table  | China         | Iran                | DPRK                          |
|-------------------|---------------|---------------------|-------------------------------|
| military_districts| theater_commands | service_branches | general_staff_directorates    |
| armies            | group_armies / fleets / bases | regions / corps | corps / fleets / air_divs |
| divisions         | (mostly dissolved post-2017 reform) | divisions | divisions |
| brigades          | brigades      | brigades / squadrons | brigades                    |
| unit_equipment    | unit_equipment| unit_equipment      | unit_equipment                |

For full migration into the live app: extend `shared/schema.ts` with country-tagged variants of each table (or add a `country` column to existing tables and broaden the seed).

---

## Tier counts at a glance

|             | Top | Second | Third | Equip | Sources cited |
|-------------|----:|-------:|------:|------:|--------------:|
| **China**   |   5 |     33 |    85 |    36 |            24 |
| **Iran**    |   9 |     46 |    79 |    18 |            20 |
| **DPRK**    |   7 |     30 |    42 |    22 |            23 |

Combined with the Russian Red Ledger DB (5 districts / 20 armies / 15 divisions / 36 brigades): **488 unit records across 4 priority threat states.**

---

## Brutal-honesty guardrails

These OOBs were built under five non-negotiable rules — see `SCHEMA_SPEC.md` for full detail:

1. **No fabrication.** Unknown commanders / strength / unit names → `null` or generic placeholder + flag.
2. **Cite every unit.** Each unit's `notes` field ends with a source citation like `[DOD CMPR 2024 p.142]` or `[DIA NKMP 2021 fig 5]`.
3. **Flag gaps explicitly.** Where only theater-level data exists, populate top + second tier and leave third tier sparse with `_gaps` notes — do NOT invent brigades.
4. **Mark uncertainty.** Post-purge PLA leadership, post-2024-strike Iranian bases, post-2021 KPA changes all carry explicit `[POST-PURGE STATUS UNCERTAIN]` / `[POST-2024-STRIKES STATUS UNCERTAIN]` / `[POST-2021 UPDATE]` flags.
5. **Equipment counts are estimates.** Always.

DPRK in particular has the largest gap section — 24 of 27 infantry divisions have placeholder names (`"Infantry Division (unidentified, X Corps)"`) per spec, because their real designations are not in open sources. Honest gaps beat invented unit names.

---

## Primary sources

**China**: DOD CMPR 2024, Project 2049 PLARF orbat, CSIS ChinaPower, ASPI, USCC Annual Reports, US Army SSI, CASI/Air University, Heritage Foundation, NavalNews, CNS Middlebury PLARF OOB 2023.

**Iran**: DIA Iran Military Power 2019, WINEP (Knights et al.), Critical Threats Project, NTI, Iran Primer (USIP), IISS Iran's Networks of Influence, Long War Journal, Alma Research, Scramble.nl, ONI, Iran Watch.

**DPRK**: DIA North Korea Military Power 2021, 38 North, CSIS Beyond Parallel, ROK 2022/2024 Defense White Paper, NTI/CNS Middlebury, Joseph Bermudez (CSIS), Bruce Bennett (RAND), IISS Military Balance.

Wikipedia used as cross-check only — never as sole source.

---

## Renderer usage

```bash
python3 ingest_oob_structured.py
```

Reads the three `*_oob.json` files in this folder and emits one text chunk per unit (top tier / second tier / third tier / fourth tier) with consistent tradecraft tags:

```
[OOB-CN] [STRUCTURED] [LEVEL:THEATER|GA|BDE]
[OOB-IR] [STRUCTURED] [LEVEL:SVC|REGION|BDE]
[OOB-DPRK] [STRUCTURED] [LEVEL:GSD|CORPS|BDE]
```

This is the same tag convention used by the existing `ingest_red_ledger.py` for Russian units (`[OOB-RU] [LEVEL:MD|ARMY|DIV|BDE]`), so retrieval is consistent across all four countries.

Default output paths point to `/home/user/workspace/inquisitor_corpus/extracted/oob_*_structured/` — adjust `EXT_BASE` at the top of the script for your environment.

---

## Versioning

`schema_version: v1` — initial release.

Future bumps:
- `v1.1`: post-PLARF-purge replacement commanders confirmed, post-2024-strike Iranian fleet recount, post-2021 KPA missile brigade designations.
- `v2`: wire into live `shared/schema.ts` + `sqlite.db` + frontend with country tabs.

---

*Snapshot date: 2026-05-09 • Curated by Inquisitor (Intel Support to Targeting orchestrator)*

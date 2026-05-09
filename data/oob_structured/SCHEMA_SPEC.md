# OOB Schema Spec — CN/IR/DPRK Extension of Red Ledger

**Source pattern**: [github.com/Raven-Conspiracy/the-red-ledger](https://github.com/Raven-Conspiracy/the-red-ledger) `shared/schema.ts` (Drizzle ORM SQLite, "Task Force Raven" project).

**Goal**: Build structured OOBs for China (PLA), Iran (IRGC + Artesh + IRGCN), and DPRK (KPA) using the same hierarchy + equipment table pattern, so all 4 country OOBs ingest into the same Inquisitor corpus bucket family (`oob_*_structured`) with consistent tagging.

---

## Adapted hierarchy by country

The Red Ledger Russia model is `MilitaryDistrict → Army → Division → Brigade → unit_equipment`. Each country has its own organizational layering — we match the spirit, not the literal labels.

### China (PLA) — 5-tier
```
TheaterCommand        (5: Eastern, Southern, Western, Northern, Central)
  ├─ ServiceComponent (PLAA / PLAN / PLAAF / PLARF / PLASSF)
  │   ├─ GroupArmy / Fleet / Air-Force-Base / RocketForceBase
  │   │   ├─ Brigade / Division / Flotilla / Regiment
  │   │   │   └─ unit_equipment (per-platform authorized + estimated counts)
```

### Iran — Bifurcated regular + parallel IRGC
```
ServiceBranch         (Artesh, IRGC, IRGCN, IRGC-AF, Quds Force, Basij)
  ├─ Region / OperationalCommand
  │   ├─ Division / Brigade / NavalDistrict
  │   │   └─ unit_equipment
```

### DPRK (KPA) — 4-tier
```
GeneralStaffDirectorate  (KPA, KPN, KPAF, SOF, Strategic Forces, Reconnaissance Bureau)
  ├─ Corps / Front
  │   ├─ Division / Brigade
  │   │   └─ unit_equipment
```

---

## Common output schema (per country)

Each subagent emits:

1. **`<country>_oob.json`** — same shape as the Red Ledger `red_ledger_export.json` but adapted to the country hierarchy.

```json
{
  "source": "Inquisitor curated OOB",
  "country": "China" | "Iran" | "DPRK",
  "snapshot_date": "2026-05-09",
  "schema_version": "v1",
  "tables": {
    "top_tier":       [...],   // theater_commands / service_branches / general_staff_directorates
    "second_tier":    [...],   // group_armies / regions / corps
    "third_tier":     [...],   // divisions / brigades / fleets
    "fourth_tier":    [...],   // brigades_regiments where applicable
    "unit_equipment": [...]
  },
  "sources_consulted": [
    "DOD CMPR 2024 (https://...)",
    "DIA China Military Power 2019 (https://...)",
    ...
  ]
}
```

2. **A markdown summary** (`<country>_oob_summary.md`) showing the hierarchy, source provenance per unit, and any gaps.

---

## Field schema per tier

### Top tier (TheaterCommand / ServiceBranch / GeneralStaffDirectorate)
- `id` — short slug (e.g., `etc` Eastern Theater Command, `irgc`, `kpa_gs`)
- `name`
- `commander` (current 2024-2026 if known, else null)
- `hq` (city)
- `notes`
- `color` (hex, picked to differentiate on map)

### Second tier
- `id`
- `name`
- `parent_id` — id of parent top-tier
- `service` — e.g., "PLAA", "PLAN", "Artesh", "IRGC", "KPN"
- `hq`
- `type` — country-specific enum (e.g., `group_army`, `fleet`, `air_force_base`, `rocket_force_base`, `corps`, `front`)
- `strength_pct` — 0-100; default 100 unless an analyst-grade source flags attrition
- `notes`

### Third tier (Brigades/Divisions/Flotillas)
- `id`
- `name`
- `parent_id`
- `parent_type` — `second_tier` | `top_tier` (for direct subordinates)
- `type` — `motor_rifle`, `tank`, `mech_inf`, `mountain`, `airborne`, `marine`, `air_assault`, `artillery`, `mlrs`, `sam`, `naval_infantry`, `combined_arms_brigade`, `heavy_combined_arms_bde`, `medium_cab`, `light_cab`, `mountain_inf_bde`, `amphibious`, `submarine_flotilla`, `surface_flotilla`, `fighter_brigade`, `bomber_division`, `rocket_brigade`
- `hq`
- `strength_pct`
- `is_elite` — bool (Guards equivalent: PLA "first-tier" units, IRGC vs Artesh, KPA SOF / Strategic Forces)
- `notes`

### unit_equipment (same as Red Ledger)
- `unit_id`
- `unit_type` — `top_tier` | `second_tier` | `third_tier`
- `equipment_type` — `tank`, `ifv`, `apc`, `artillery_sp`, `artillery_towed`, `mlrs`, `sam`, `helicopter`, `fighter`, `bomber`, `transport`, `submarine`, `destroyer`, `frigate`, `corvette`, `lst`, `srbm`, `mrbm`, `irbm`, `icbm`, `cruise_missile`, `uav`
- `equipment_model` — comma-separated models (e.g., "Type 99A, Type 96B")
- `authorized_count` — int
- `estimated_lost` — int (0 unless active conflict)

---

## Sources to use per country (reference only)

### China (PLA)
- **Project 2049** PLARF brigade-level orbat (already in `oob_project2049_pla` bucket)
- **DOD China Military Power Report 2024** (already P1 in master sheet)
- **CNS Middlebury PLARF OOB 2023** (P1)
- **CSIS China Power Project** PLA composition pages
- **IISS Military Balance 2024** China chapter (paywalled — use what's public + Janes summaries)
- **CASI / Air University** PLA aerospace force studies
- **Wikipedia** PLA orbat pages (cross-check only, never sole source)

### Iran (IRGC + Artesh + IRGCN)
- **DIA Iran Military Power 2019** (latest unclas USG OOB)
- **WINEP Iran content** (Knights, Levitt, Stricker work on IRGC + proxies)
- **Critical Threats Project** IRGC + Houthi trackers
- **Long War Journal** IRGC-QF coverage
- **Alma Research** Hezbollah orbat (where Iran-controlled)
- **Wikipedia** IRGC ground forces orbat (cross-check only)
- Note: Iran ground forces structure has fewer pre-positioned divisional formations and more regional/border-province organization; reflect that in the schema.

### DPRK (KPA)
- **DIA North Korea Military Power 2021** (latest unclas USG OOB)
- **38 North** conventional forces analysis
- **CNS/MIIS** KPA missile force studies
- **CSIS Beyond Parallel** Choe Hyon-class destroyer + naval analysis
- **Bruce Bennett RAND** corpus of KPA studies
- **ROK 2022 Defense White Paper** (English version)
- **Wikipedia** KPA orbat (cross-check only)

---

## Output file layout

```
inquisitor_research/oob_structured/
  china_oob.json
  china_oob_summary.md
  iran_oob.json
  iran_oob_summary.md
  dprk_oob.json
  dprk_oob_summary.md
  ingest_oob_structured.py    (renders all three to chunks, mirrors Red Ledger ingester)
```

After all three are populated, the renderer ingests them into:
```
inquisitor_corpus/extracted/oob_china_structured/
inquisitor_corpus/extracted/oob_iran_structured/
inquisitor_corpus/extracted/oob_dprk_structured/
```

With tags `[OOB-CN] [STRUCTURED] [LEVEL:THEATER|GA|BDE]`, `[OOB-IR]`, `[OOB-DPRK]`.

---

## Critical guardrails (brutal-honesty mode)

1. **No fabrication.** If a unit's commander or strength % isn't sourced, leave it `null` — do NOT guess.
2. **Cite every unit.** `notes` field MUST include a source citation like `[DOD CMPR 2024 p.142]` or `[DIA NKMP 2021 fig 5]`.
3. **Flag gaps explicitly.** If only theater-level data exists for a country, populate top + second tier and leave third tier empty with a `_gaps` note, not invented brigades.
4. **Mark uncertainty.** If a unit is suspected disbanded / reorganized, set `notes: "[POSSIBLY DISBANDED 2023+; cross-check required]"`.
5. **Equipment counts are estimates.** Always.

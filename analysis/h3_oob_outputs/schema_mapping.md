# Red Ledger → H3 Belief Model — Field Mapping

This document maps every Red Ledger source column to the role it plays in the
H3 probabilistic OOB pipeline. Anything not in this table is **deliberately
unused** in this prototype.

## Source: `military_districts` (sqlite.db)

| Source column | Type | Belief-model role |
| --- | --- | --- |
| `id` | text PK | — (used only for join from `armies.district_id`) |
| `name` | text | passes through to `entities.csv` via `armies.district_id`; not used in scoring |
| `commander` | text | unused |
| `hq` | text | unused (district HQs are too high-level to be useful as evidence) |
| `color` | text | unused (UI only) |

## Source: `armies` (sqlite.db)

| Source column | Belief-model role |
| --- | --- |
| `id` | becomes `Entity.id`; key for `UNIT_POSITIONS` HQ lookup |
| `name` | passes through to `entities.csv` and belief rows |
| `district_id` | `Entity.district_id`; carried down to subordinate brigades for indexing |
| `hq` | informational (city name); not used directly — coords come from `UNIT_POSITIONS` |
| `type` | `Entity.type` — passes through; reserved for future doctrine-aware footprint sizing |
| `strength_pct` | drives `existence_prior = clip(strength_pct/100, 0.05, 0.99)` |
| `notes` | parsed for sector hits → `Observation(source='notes-deployment')` |

## Source: `divisions` (sqlite.db)

| Source column | Belief-model role |
| --- | --- |
| `id` | `Entity.id` |
| `name` | passes through |
| `army_id` | parent pointer; used to inherit parent's deployment hints when a division has none of its own |
| `type` | `Entity.type` |
| `strength_pct` | existence prior |
| `hq` | informational only; divisions are not in `UNIT_POSITIONS` |
| `notes` | parsed for sector hits |

## Source: `brigades` (sqlite.db)

| Source column | Belief-model role |
| --- | --- |
| `id` | `Entity.id` |
| `name` | passes through |
| `parent_id` + `parent_type` | parent pointer (army-or-division); used for parent-inheritance |
| `type` | `Entity.type` (reserved) |
| `strength_pct` | existence prior |
| `is_guards` | passes through to `entities.csv`; reserved for future weighting (Guards units are more often committed) |
| `notes` | parsed for sector hits |

## Source: `unit_equipment` (sqlite.db)

Currently **read but not used**. A future iteration would:
- attach `(authorized_count - estimated_lost)` per equipment type to each
  entity's hex belief, producing per-equipment density layers; and
- use total equipment loss ratio as a multiplier on `existence_prior`
  (severely attrited unit → more uncertain existence in a single hex).

## Source: `oryx_losses` (sqlite.db)

Currently unused. Could feed a global attrition prior on equipment density
layers.

## Source: `client/src/pages/TacticalMap.tsx → UNIT_POSITIONS`

A `Record<string, {lat, lng, label}>` keyed by army id. Parsed via regex.

| Field | Belief-model role |
| --- | --- |
| `lat`, `lng` | become an `Observation(source='garrison-hq')` for the army |
| `label` | informational only |
| (implicit) σ | hard-coded to **120 km** in pipeline — we deliberately blur garrison HQs heavily so they don't masquerade as AO claims |
| (implicit) reliability | **0.55** (MED) — public peacetime garrisons, not tactical evidence |
| (implicit) specificity | **0.25** — low; garrisons say almost nothing about current deployment |

## Source: `client/src/data/intel-feed.ts → INTEL_STORIES[*].reliability`

Defines the tier vocabulary `'HIGH' | 'MED-HIGH' | 'MED'` that the prototype
adopts numerically:

| Repo tier | Numeric reliability used in pipeline |
| --- | --- |
| HIGH | 0.95 — reserved; not yet emitted by the prototype |
| MED-HIGH | 0.80 — used for `notes-deployment` observations |
| MED | 0.65 — used for `parent-inheritance` (further × 0.65 dilution applied) |
| (implicit) | 0.55 — used for `garrison-hq` (one tier below MED) |

When intel-feed stories are wired in as observations in a follow-up, they
should map their explicit `reliability` field to this scale directly and
their `date` field to `Observation.observed_at` (driving recency decay).

## Source: `client/src/data/infrastructure.ts`

Inspected only. Contains rail and pipeline polylines with importance/traffic
tags. Not used in the OOB belief layer. Could power a separate "logistics
corridor" hex layer that would *not* be combined with unit beliefs in the
output (kept on a separate map for the same safety reasons).

## Sector dictionary (out-of-table)

Derived in `build_h3_oob.py` (`SECTOR_CENTROIDS` + `SECTOR_ALIASES`). Each
sector entry is `(lat, lon, σ_km)`. Coordinates are public-record city
centroids rounded to 0.01°. σ is intentionally large (30–100 km for AO
sectors, 200 km for Pacific) so that **after** the Gaussian kernel is applied,
no observation pins a unit to within a single H3 cell. Sectors covered:

- Donbas / Donetsk axis: kharkiv, north kharkiv, kupyansk, lyman, kreminna,
  siversk, donetsk, donetsk central, central donetsk, south donetsk,
  vuhledar, velyka novosilka, luhansk, donbas
- Southern axis: zaporozhye, kherson, dnieper, kherson / dnieper axis
- Northern axis: sumy, sumy oblast
- Russian rear (low weight): rostov, voronezh, belgorod, kursk
- Out-of-AO (filtered by AO bbox): kaliningrad, arctic, baltic, pacific,
  sakhalin, black sea fleet

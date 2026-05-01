# Red Ledger × H3 Probabilistic OOB — Ukraine AO

Prototype that reads the **Red Ledger** repository's order-of-battle data and
projects it onto an **H3 hex grid** as a probabilistic belief over where each
Russian formation is operating. Built to demonstrate the framework end-to-end
on the repo's real schema — not as a tactical product.

## Safety boundary

This is **broad-area uncertainty analysis only**. It is explicitly **not**:
targeting support, kinetic decisioning, live tactical recommendation, or a
geolocation tool for individual units.

Concretely:

| Constraint | How enforced |
| --- | --- |
| H3 resolution = 5 (~252 km² per cell, ~8.5 km edge) | hard-coded; no finer res used |
| No precise coordinates flow through | every observation is fuzzed by a Gaussian kernel with σ ≥ 30 km before projection |
| No external geocoding / LLM enrichment | pipeline is offline; only repo data is read |
| No automated targeting, no decisions | output is probabilities + uncertainty bands; consumers see entropy, evidence count, CI |
| Out-of-AO units are dropped | strict bounding box (44–53 N, 22–42.5 E) clips Arctic / Pacific garrisons |

`max P(unit ∈ hex)` across the entire output is ~0.02 — i.e. the most
"confident" cell still has 98% mass elsewhere. Median entropy of a unit's
location distribution is ~8 bits (≈ 256 equivalent hexes). Output is
deliberately diffuse.

## What repo data was used

Source: `/home/user/workspace/the-red-ledger-bd5d5be4`

| Repo file | Used for |
| --- | --- |
| `shared/schema.ts` | drizzle/SQLite schema for districts, armies, divisions, brigades, unit_equipment |
| `server/seed.ts` | reference for seed values that populate `sqlite.db` |
| `sqlite.db` | **canonical source** read at runtime — 5 districts / 20 armies / 15 divisions / 36 brigades / 24 unit_equipment / 95 oryx_losses rows |
| `client/src/pages/TacticalMap.tsx` | regex-extracted `UNIT_POSITIONS` dict — peacetime army garrison HQs (lat/lon/label) |
| `client/src/data/intel-feed.ts` | reference for the `HIGH / MED-HIGH / MED` reliability tiers used in the model |
| `client/src/data/infrastructure.ts` | inspected only — not yet wired in (see "Next steps") |

The repo contains **no precise unit coordinates** in the AO. Locations come
indirectly via two channels: free-text deployment hints in each unit's `notes`
column, and the static `UNIT_POSITIONS` dictionary for army-level peacetime
garrisons. Both channels are treated as low-reliability, high-uncertainty
evidence rather than as ground truth.

## Belief model

For each entity *e* and hex *h*:

```
score(e, h) = Σ_o reliability(o) · specificity(o) · recency_decay(o)
                · gaussian( dist(centroid(h), pos(o)) ; σ(o) )

P(loc=h | e exists) = score(e,h) / Σ_h' score(e,h')
P(e ∈ h)            = existence_prior(e) · P(loc=h | e exists)
```

Components:

- **`existence_prior(e)`** = `clip(strength_pct / 100, 0.05, 0.99)`. A
  formation reduced to 50% strength still exists, but is less concentrated.
- **`reliability(o)`** ∈ {0.55, 0.65, 0.80}. Garrison HQs (low), parent
  inheritance (medium-low), explicit deployment hints (medium-high). These
  brackets correspond conceptually to the `MED / MED-HIGH / HIGH` tiers used
  in `intel-feed.ts` — we deliberately do **not** assign HIGH to anything in
  this prototype because the underlying notes are open-source seed text, not
  vetted real-time reporting.
- **`specificity(o)`** ∈ [0.2, 1.0]. `1 − σ_km/100` clamped. A 35-km-σ hint
  ("Vuhledar") is ~0.65; a 75-km-σ hint ("Donbas") is ~0.25.
- **`recency_decay(o)`** = `0.5 ^ (age_days / 60)`. The Red Ledger seed has
  no per-row dates, so prototype observations all carry today's date and
  decay = 1. The decay term is wired in for when dated observations
  (intel-feed entries, append-only evidence rows) are added.
- **σ (spatial uncertainty)** is set per-sector (30–100 km). Garrison HQs
  use σ = 120 km — they should not pin a unit to its barracks.

For each (entity, hex) we also record:

- `evidence_count` — number of observations contributing weight to that cell
- `source_kinds` — count of distinct source channels (deployment / hq / inherited)
- `entity_loc_entropy_bits` — Shannon entropy of `P(loc=h | exists)` across the AO
- `latest_observation_at` — most-recent contributing observation timestamp
- `ci95_low`, `ci95_high` — 95% confidence band on `P(e ∈ h)` using a
  normal-approximation half-width that widens with thin evidence

## Output files

| File | Rows | What it is |
| --- | ---: | --- |
| `entities.csv` | 71 | one row per army/division/brigade — id, kind, parent, district, type, strength_pct, hq, notes, is_guards |
| `observations.csv` | 133 | derived evidence rows — `notes-deployment` (62), `garrison-hq` (20), `parent-inheritance` (51) — each with sector_key, lat, lon, σ_km, source, reliability, specificity, observed_at |
| `entity_hex_beliefs.csv` | 55,849 | the headline product — per (entity, hex) belief w/ existence prior, P(loc\|exists), P(e ∈ h), CI, evidence_count, source_kinds, entropy, latest_observation_at |
| `hex_aggregate_belief.csv` | 4,300 | per-hex collapse: Σ P over all entities (expected unit count), max P over any single unit, contributing-unit count |
| `ukraine_h3_oob_map.html` | — | folium map rendering the per-hex aggregate as a red density layer over Ukraine + adjacent rear |
| `manifest.json` | — | run metadata: H3 res, AO bbox, decay half-life, seed, file counts, safety constraints, source files |
| `build_h3_oob.py` | — | the (single-file, deterministic, network-free) generator |
| `schema_mapping.md` | — | field-by-field map from Red Ledger SQLite columns to the H3 belief model |

The HTML map's most-intense cells lie in the Donetsk corridor (~47.7–48.1 N,
37.3–37.9 E), consistent with the seed text where the bulk of armies note
deployments around Donetsk / South Donetsk / Vuhledar. The intensity is bounded
— max expected unit count per hex is ~0.19, max single-unit P ~0.02.

## Limitations

- **Sectors come from free text**. The keyword parser handles ~30 named
  sectors plus aliases. Notes referencing a sector with non-standard wording
  (e.g. ad-hoc oblast names) will be missed and the unit will receive only
  garrison-HQ or parent-inheritance evidence.
- **9 entities have no AO footprint** — Arctic / Pacific / Baltic-only units
  whose only sector hint falls outside the AO bbox. This is the desired
  behaviour: we do not invent locations to fill in missing data.
- **No timestamped evidence yet**. The Red Ledger seed is a snapshot — there
  is no per-row `observed_at`. Recency decay is wired in but currently a
  no-op. When append-only `intel_evidence` rows (e.g. from `intel-feed.ts`)
  are added with real dates, decay starts mattering.
- **No corroboration / contradiction logic yet**. Two observations placing a
  unit in mutually exclusive sectors (e.g. one says Sumy, another says
  Kherson) currently both contribute weight. A future iteration should
  detect this and either widen σ or split the entity into competing
  hypotheses.
- **Equipment is loaded but unused**. `unit_equipment` and `oryx_losses`
  rows exist in the DB but are not yet folded into the belief score. They
  could enrich the existence prior or contribute to a separate "equipment
  density" hex layer.

## Reproducing

```bash
python3 -m pip install h3 folium pandas
python3 build_h3_oob.py
```

Inputs: only `the-red-ledger-bd5d5be4/sqlite.db` and
`the-red-ledger-bd5d5be4/client/src/pages/TacticalMap.tsx`. No network calls.
Deterministic seed (`RANDOM_SEED = 20260501`).

## Next steps (if extended)

1. Wire `intel-feed.ts` rows in as proper `observations` with real dates,
   reliability tiers, and per-story sector parsing. Recency decay then bites.
2. Append-only `evidence` log so each observation is auditable, with
   contradiction detection between mutually exclusive sector hits.
3. Per-equipment-type belief layers (where are the T-90Ms? where are the
   2S19s?) by joining `unit_equipment` rows onto each entity's hex belief
   and weighting by `authorized_count − estimated_lost`.
4. Promote source reliability mapping to a typed table, not a literal in
   `make_observations`.
5. Move the sector dictionary out of the script into a checked-in
   `sectors.json` so it can be reviewed and version-controlled separately.

# BDA × Red Ledger × H3 OOB — Integration Design

**Status:** First-draft design document. Local-only; no implementation changes
to the running app.

**Companion documents:**

- `analysis/bda/BDA-Methodology-First-Draft.md` — the methodology this design implements against. All section references in this document (e.g. "§2.1") point into that paper unless prefixed with "Red Ledger".
- `analysis/h3_oob_outputs/README.md` — the H3 probabilistic OOB prototype this design extends. All `entity_hex_beliefs` / `observations` references point there.
- `analysis/bda/bda_schema.ts` — proposed Drizzle/SQLite + TypeScript shape for the ontology tables described in §4 below.

This document describes how the BDA methodology in
`BDA-Methodology-First-Draft.md` interfaces with the Red Ledger SQLite ontology
(`shared/schema.ts`) and the H3 probabilistic OOB outputs in
`analysis/h3_oob_outputs/`. The methodology is the source of truth for
ontological structure; this design specifies how that structure is realized in
a Foundry-free, Red-Ledger-native environment.

The methodology's central reframing — **BDA is a confidence-weighted risk
communication problem, not a truth discovery problem** (§1) — is preserved
end-to-end. Red Ledger and the H3 OOB layer already operate in this mode:
`existence_prior`, `P(loc | exists)`, `evidence_count`, `entity_loc_entropy_bits`
and the per-cell CI band are confidence-as-data, not confidence-as-prose. This
design extends that pattern to equipment BDA without breaking the safety
boundary in `analysis/h3_oob_outputs/README.md` ("broad-area uncertainty
analysis only … explicitly not targeting support").

---

## 1. Ontology mapping

The methodology specifies twelve Object Types in three layers (§2). The table
below maps each onto Red Ledger's existing data model and the new tables this
design proposes.

### 1.1 Data layer

| Methodology object | Red Ledger realization | Notes |
| --- | --- | --- |
| **Damage Event** (§2.1) | new table `damage_events` | Atomic, immutable observation. Min viable property set per §2.1. |
| **Source Report** (§2.2) | new table `source_reports` | Originating artifact. Many-to-many with damage events via `damage_event_sources`. |
| **Equipment Item** (§2.2) | new table `equipment_items` + existing `unitEquipment` | `unitEquipment` rows are *generic instances* (typed inventory tied to taxonomy). `equipment_items` holds *identified instances* (tail-numbered, named hulls). Distinction matters for double-counting (§2.2). |
| **Unit** (§2.2) | existing `armies` / `divisions` / `brigades` (+ districts) | Hierarchy already present via `armies.district_id`, `divisions.army_id`, `brigades.parent_id`+`parent_type`. The `Unit → Unit` link in §2.5 is already structurally expressed; no schema change needed here. |
| **Geographic Area** (§2.2) | new table `geographic_areas` + existing H3 cells | H3 res-5 cells from `entity_hex_beliefs` are first-class geographic areas, hierarchical via H3 parent/child. Named features (sectors, oblasts, AOs, infra polylines) are rows in `geographic_areas`. |
| **Engagement** (§2.2) | new table `engagements` | A friendly action that may have caused damage. Optional link to `damage_events`. |
| **Target** (§2.2) | new table `targets` | Pre-planned point or area target, independent of damage. Composition links to `equipment_items` and `units`. |

### 1.2 Reasoning layer

| Methodology object | Red Ledger realization | Notes |
| --- | --- | --- |
| **Working Baseline Version** (§2.3) | new table `working_baseline_versions` | Per-unit, version-controlled, branching. Capability profile stored as structured JSON column keyed by combat-function category. Replaces ad-hoc mutation of `armies.strength_pct` / `brigades.strength_pct` / `unitEquipment.estimatedLost`. Those columns become *cached projections* of the latest WBV on the main branch. |
| **Assessment** (§2.3) | new table `assessments` | Synthesized judgment at a defined scope. References a specific WBV plus the evidence base it was computed from. |

The H3 OOB layer (`entity_hex_beliefs`) is **not** a Working Baseline Version
in itself. It is a *spatial corroboration substrate* (§5.2) consumed by WBV
computation: it provides `P(unit ∈ hex)` and CI used to weight an equipment
Damage Event's attribution to that unit.

### 1.3 Operational layer

| Methodology object | Red Ledger realization | Notes |
| --- | --- | --- |
| **Correction Event** (§2.4) | new table `correction_events` | First-class invalidation record. Damage events are **never deleted**; a correction event marks them as non-contributing. |
| **Exception** (§2.4) | new table `exceptions` | Single uniform work surface. Category as property (one of seven values from §2.4 / §6.2), not as separate table. |
| **Case** (§2.4) | new table `cases` + `case_links` | Persistent investigation container with state lifecycle (open / under_investigation / pending_input / resolved / closed / reopened). |

---

## 2. Confidence as a property of links

§2.5 / §2.6 are emphatic: confidence lives on the **link**, not on the object,
so that the same Damage Event can hold multiple competing attributions
without forcing premature reconciliation. This design honors that strictly.

In the Red Ledger schema (see `bda_schema.ts`):

- `damage_events` has **no** `confidence` column. Severity and observation
  mode are properties of the event; confidence is not.
- Every link table — `damage_event_units`, `damage_event_equipment`,
  `damage_event_areas`, `damage_event_targets`, `damage_event_engagements` —
  carries a `confidence` real-valued column ∈ [0, 1].
- `damage_event_units` additionally carries an `echelon` column ∈ {`district`,
  `army`, `division`, `brigade`} per §2.5: "this dual-property structure
  supports both resolution to a specific echelon with confidence and resolution
  only to higher echelons when lower-echelon resolution is uncertain."
- `damage_event_sources` carries no confidence weight — it is factual citation
  per §2.5 ("Damage Event → Source Report: required, many-to-many, no
  confidence weight").
- A single damage event can hold simultaneous links to two competing units
  (e.g. a 40/40 split between two battalions, §5.2) without reconciliation.
  Spatial corroboration shifts the weights but does not collapse them.

This pattern is incompatible with mutating `brigades.strength_pct` directly
when a damage event lands. That number is now a **derived projection** of the
latest WBV on the unit's main branch.

---

## 3. Immutability and correction over deletion

§5.5 is explicit: "A Correction Event is a first-class object in the ontology,
not a deletion operation." This design enforces the rule structurally:

- `damage_events` has no `DELETE` workflow. Application code that needs to
  invalidate an event inserts a row in `correction_events` referencing the
  damage event id, with rationale ∈ {`misidentification`, `double_count`,
  `false_report`, `source_retraction`, `superseded`}.
- `correction_events` is itself append-only.
- WBV computation excludes any damage event whose `id` appears in the
  `correction_events.damage_event_id` column with disposition `active`. The
  correction event itself can later be retracted (a meta-correction) without
  reviving the Damage Event by deletion; instead a new correction event with
  rationale `retracted_correction` and a link to the prior one is inserted.
- The graph remains intact for audit and learning (§5.5: "patterns across
  Correction Events … become diagnostic information").
- `source_reports` is similarly immutable. A retracted source produces a
  correction event over each damage event derived from that source, not a
  modification of the source row.

Operationally this means: every WBV computation pulls
`damage_events LEFT JOIN correction_events` and filters where no active
correction is present. The audit trail of an Assessment is the union of its
constituent damage events plus the correction events that excluded any
candidates from contribution.

---

## 4. Equipment BDA event workflow

This section walks the methodology's end-to-end flow (§3 → §4 → §5) for an
*equipment damage* observation, from source ingestion through to a working
baseline update. Numbers in brackets are the section reference in the
methodology paper.

### 4.1 Ingestion (§3)

1. **Source arrival.** A new candidate damage observation enters via one of:
   - Manual analyst entry against a HUMINT report or imagery frame
     (`manual` pathway, §3.1).
   - Automated extraction from an Oryx scrape, an open-source intel feed
     (existing `client/src/data/intel-feed.ts` is the prototype channel),
     a SIGINT or imagery pipeline (`automated` pathway, §3.1).
2. **Source Report row.** A row is inserted into `source_reports` with the
   raw artifact reference (URL, file hash, frame id, intercept locator),
   source type ∈ {`humint`, `imagery`, `sigint`, `oryx`, `manual`,
   `osint_feed`}, ingest timestamp, and reporter identity.
3. **Action: Create Damage Event** (§3.2). A row is inserted in
   `damage_events` with the minimum viable property set: what (taxonomy ref),
   where (point, grid, or named area at available resolution), when
   (observation_time and report_time, both required, distinct per §3.3),
   observation_mode ∈ {`directly_observed`, `first_hand_reported`,
   `second_hand_reported`, `inferred`}, reporter_identity, and `state` ∈
   {`proposed`, `accepted`}. Manual entries default to `accepted`; automated
   entries default to `proposed` and are routed through extraction-confidence
   thresholds (§6.1) before promotion.
4. **Mandatory provenance.** A row in `damage_event_sources` links the new
   damage event to its source report. This link is required and immutable
   (§3.5).

### 4.2 Extraction & Enrichment (§4)

5. **Equipment resolution.** The equipment mention in the source is resolved
   against the controlled taxonomy. In Red Ledger, the taxonomy is the
   `unitEquipment.equipmentType` enum extended with model-level identifiers
   pulled from the Oryx source. Resolution produces a confidence-weighted
   link `damage_event_equipment(damage_event_id, equipment_item_id, confidence)`.
   Low-confidence resolutions are **not** stored as free text (§3.4); they
   either resolve to a candidate from the taxonomy with low confidence or
   raise an Exception of category `extraction`.
6. **Spatial enrichment.** The mention's location is resolved into one or more
   `damage_event_areas` links: an H3 res-5 cell (always), zero or more named
   `geographic_areas` rows (sector, oblast, AO), and optionally the
   infrastructure polyline if the damage is to fixed infrastructure. Each link
   is confidence-weighted.
7. **Unit attribution.** The methodology distinguishes non-spatial attribution
   (textual / visual / engagement-derived, §5.2) as primary, with spatial
   corroboration as a multiplier. Workflow:
   - Non-spatial attribution: parse unit identifiers from the source where
     present; otherwise propose unit candidates whose `unit_equipment` rows
     match the resolved equipment type.
   - Spatial corroboration: pull the H3 cell's row from
     `entity_hex_beliefs` and read each candidate unit's `P(loc=h | exists)`.
     Multiply the non-spatial confidence by a normalized spatial factor.
   - Insert one row per candidate into `damage_event_units` with `confidence`,
     `echelon`, and the rationale stored in a `corroboration_score` JSON
     column (§5.2 — the components: doctrinal spacing, terrain consistency,
     boundary inference).
   - If a strong non-spatial attribution is contradicted by H3 evidence
     (e.g. cell P near zero), raise an Exception of category
     `spatial_corroboration` rather than algorithmically overriding (§5.2).
8. **Severity progression.** `damage_events.severity` is initially `null` /
   `unknown` and is refined by enrichment as additional sources arrive (§4.2,
   "Severity assessment"). Each severity revision is captured as a new row in
   `damage_event_severity_history` rather than mutating the event.
9. **Corroboration linking.** When two damage events match on equipment type,
   spatial proximity, and temporal proximity above the threshold, a row is
   inserted in `damage_event_corroborations(event_a, event_b, score)`. Both
   events remain (§4.2, "When two events are determined to describe the same
   underlying occurrence, neither is deleted"). Downstream WBV computation
   treats the corroborated pair as a single observation with reinforced
   confidence rather than two independent observations.
10. **Engagement / Target association.** When spatial-temporal proximity to a
    known engagement crosses threshold, a `damage_event_engagements` link is
    proposed (§4.2). Confirmed by analyst review; remains optional per §2.5.

### 4.3 Fusion & Reasoning (§5)

11. **Reference baselines.** The current foundational baseline for each unit
    is the `unit_equipment.authorizedCount` per equipment type. Its staleness
    is exposed via a `data_meta` row keyed `foundational_baseline_refreshed_at`
    so consumers can see how recent it is (§5.1: "the system consumes it,
    references it with explicit provenance, and surfaces its staleness").
12. **WBV update decision.** When a damage event lands and survives the
    correction filter, the fusion layer evaluates whether it justifies a new
    Working Baseline Version for each candidate unit. Drivers (§5.3):
    - The equipment's mapped combat-function categories (long-range fires,
      short-range fires, air defense, maneuver, sustainment, C2,
      reconnaissance — taxonomy-extension column on the equipment item).
    - Severity-weighted attribution: `Σ confidence × severity_factor` over
      contributing damage events, *category by category* (no scalar
      composite; §5.3 "each category is tracked independently").
    - Echelon honesty: contribution to a brigade's profile is weighted by
      `damage_event_units.confidence` *at echelon=`brigade`*; contribution to
      its parent army is weighted by `damage_event_units.confidence` at
      `echelon=`army`*. The two are **not** summed mathematically across
      echelons (§5.4 "propagation with preservation").
13. **Action: Create WBV.** When the change crosses threshold, a new row in
    `working_baseline_versions` is inserted with `parent_version_id`, change
    rationale, contributing-event provenance (a join row per damage event in
    `wbv_evidence`), branch identifier (default `main`), and the updated
    capability profile JSON.
14. **Hypothesis branches.** When meaningful disagreement exists about
    whether a change occurred (e.g. severity contested, attribution
    contested), a *non-`main`* branch is opened on the WBV (§5.1 "competing
    branches can be maintained until evidence resolves the disagreement").
    Both branches remain queryable; commander surfaces show both with their
    evidence bases.
15. **Assessment generation.** An `assessments` row is produced on demand or
    on schedule, referencing the current WBV plus the evidence base. Per §5.6
    this is steady-state continuous, not a batch.

### 4.4 Operational layer (§6)

16. **Exception flagging.** Throughout the above, anything below the
    auto-acceptance threshold or contradicting current state raises an
    `exceptions` row with category ∈ {`extraction`, `contradiction`,
    `corroboration`, `attribution`, `spatial_corroboration`,
    `baseline_divergence`, `staleness`}. Single uniform queue per §6.2.
17. **Case opening.** When an exception or commander request requires
    multi-step investigation, a `cases` row is opened with state `open`,
    investigative scope as `case_links` rows, and the triggering exception as
    `case.opening_context`. Case state transitions are versioned (§6.4).
18. **Closure.** Cases close with structured rationale ∈ {
    `analytical_resolution`, `residual_uncertainty_accepted`,
    `reallocated_to_higher_priority`, `relevance_expired`,
    `superior_evidence_unnecessary`} per §6.4.

---

## 5. How BDA updates equipment / capability priors in `entity_hex_beliefs`

§4.4 of the H3 OOB README notes equipment is "loaded but unused"; this
section closes that gap **without** generating targeting-grade output. The
safety boundary in `analysis/h3_oob_outputs/README.md` remains the constraint:
H3 res-5, σ ≥ 30 km Gaussian fuzz on every observation, no precise
coordinates flow through, no automated targeting decisioning.

### 5.1 What changes in the OOB pipeline

The current pipeline computes one belief layer: `P(entity ∈ hex)`. The BDA
overlay produces a *second*, derivative layer: per-equipment-category
remaining-capability density, conditioned on the first layer.

For each unit `e`, each combat-function category `c`, and each hex `h`:

```
remaining(e, c)        = max(0, authorized(e, c) - severity_weighted_lost(e, c))
P(e ∈ h)               = (already in entity_hex_beliefs)
capability_density(c, h) = Σ_e remaining(e, c) · P(e ∈ h)
```

`severity_weighted_lost(e, c)` is computed from `damage_events` where:

- the resolved equipment maps to category `c` via the taxonomy,
- a `damage_event_units` link to `e` exists with non-zero confidence at
  *some* echelon,
- no active correction event excludes the damage event, and
- contribution is `Σ confidence × severity_factor` summed over those events,
  preserving the methodology's category-aware rollup (§5.3) and propagation
  with preservation (§5.4).

The output is a derivative CSV alongside `hex_aggregate_belief.csv` —
`hex_capability_density.csv` with columns `hex, category, density,
contributing_units, ci95_low, ci95_high`.

### 5.2 What does *not* change

- **Resolution stays at H3 res-5.** Per `manifest.json` and the safety table.
- **σ ≥ 30 km fuzz on every observation.** Damage events ingest at point,
  grid, or named area precision but project through the same Gaussian kernel
  before they touch a hex.
- **No per-event hex pinpointing in any consumer surface.** Consumers see
  `capability_density(c, h)` aggregated across many units and many events.
  The lineage drill-down (per §7.3 of the methodology) returns the *list of
  contributing damage events with their source artifacts*, not "this hex was
  hit at 17:42."
- **The `existence_prior` of a unit is not overwritten.** Severe attrition
  reduces `remaining(e, c)` per category, but `existence_prior` continues to
  reflect "does this formation still exist as a coherent organization,"
  which is a different question. (`unit_dissolved` is a separate WBV state
  transition with its own evidence threshold.)
- **No on-demand 'where to strike' query.** The capability density layer is
  defensive: it answers "what can this adversary still bring to bear in this
  area," not "where is the best target." Surfaces that present
  capability_density must include the H3 OOB `entity_loc_entropy_bits` and
  per-hex `evidence_count` so the user sees how diffuse the underlying
  belief is.

### 5.3 Attribution-weighted updates (concrete example)

A new HUMINT report mentions a destroyed T-90M near Vuhledar.

1. Source row inserted with `source_type='humint'`, observation_mode
   `second_hand_reported`.
2. Damage event inserted, severity initially `unknown`.
3. Equipment resolution: `T-90M` → equipment item with `category=tank`,
   confidence 0.85 (named-model match).
4. Spatial enrichment: location resolved to Vuhledar sector → H3 cell
   `H_xxx`. The Vuhledar centroid has σ_km=35 (per `build_h3_oob.py`), so
   the same Gaussian kernel is applied; damage event lands across multiple
   neighboring hexes with weights.
5. Unit attribution: `unit_equipment` rows show three candidate units carry
   T-90Ms. Pull each candidate's `P(loc=H_xxx | exists)` from
   `entity_hex_beliefs`. Suppose: Unit A 0.018, Unit B 0.012, Unit C 0.0006.
   Multiply non-spatial confidence (uniform 0.33 across the three candidates
   given no textual hint) by normalized spatial factor → confidences ~0.40 /
   0.27 / 0.013. Insert three rows in `damage_event_units` at echelon=
   `brigade`. Unit C is now near-zero contribution but **not** deleted.
6. Severity stays `unknown` until corroboration (§4.2). The capability
   density layer treats `severity_factor = 0.5` (mid-range default for
   unknown severity, configurable).
7. WBV update: each candidate unit's `tank` capability row produces a new
   WBV on its main branch (or a hypothesis branch if total damage exceeds
   the unit's authorized tank inventory across active branches, raising a
   `contradiction` exception).
8. `hex_capability_density.csv` regenerates: in cell `H_xxx`, the `tank`
   density decreases by Σ over the three candidates' weighted contributions.
   Confidence band on the cell widens because the contributing-event
   evidence is sparse.

The output is a slightly lower tank-capability density across a corridor of
hexes, with the contributing damage event traceable through provenance to
the original HUMINT artifact. No hex is presented as "this unit is here."

---

## 6. Integration points with existing Red Ledger artifacts

| Existing artifact | Role in BDA flow | Change required |
| --- | --- | --- |
| `oryx_losses` (§ `shared/schema.ts`) | Bulk attrition prior at the *category* level, not per unit. Remains as-is for top-line dashboards. | None. New `damage_events` rows derived from individual Oryx records carry `source_reports.source_type='oryx'` and link to the canonical Oryx URL. The aggregate `oryx_losses` row remains a separate cached projection. |
| `unit_equipment` | Foundational baseline (`authorizedCount`) and per-unit lost projection (`estimatedLost`). | `estimatedLost` becomes a *cached projection* of the latest WBV on `main`. A nightly job recomputes from `working_baseline_versions` + active corrections. Direct mutation of `estimatedLost` from app code is deprecated. |
| `armies.strength_pct` / `divisions.strength_pct` / `brigades.strength_pct` | Per-unit strength projection used by `existence_prior` in the H3 OOB pipeline. | Same pattern: cached projection of the latest WBV. Recomputed by the same nightly job. |
| `entity_hex_beliefs.csv` (H3 OOB) | Spatial corroboration substrate for unit attribution. | Read-only input to BDA fusion. The pipeline regenerates it from the current `unit_equipment` / `notes` / garrison data per existing logic; BDA does not mutate it. |
| `hex_aggregate_belief.csv` | Per-hex expected unit count. | Unchanged. Sits *alongside* the new `hex_capability_density.csv`, not replaced by it. |
| `intel-feed.ts` | Reliability tier vocabulary (`HIGH`, `MED-HIGH`, `MED`). Already referenced in `analysis/h3_oob_outputs/schema_mapping.md`. | Future: each intel feed entry becomes a `source_reports` row, with `reliability` mapped to numeric weights per the existing scale, and zero-or-more `damage_events` derived from each story. Nothing in this design assumes that wiring exists yet. |
| `infrastructure.ts` (rail / pipeline polylines) | Geographic Areas of category `infrastructure`. | Each polyline becomes one or more rows in `geographic_areas` so that infrastructure-targeting damage events can attach to them via `damage_event_areas`. Kept on a separate map layer per the existing safety-boundary convention. |
| Existing client `TacticalMap.tsx` | Consumer surface. | No change in this design. A subsequent PR could add a "capability density" toggle that reads `hex_capability_density.csv` with confidence bands surfaced. Per §7.1 the surface must show CI bands, not flatten them. |

---

## 7. Safety boundaries and analyst review gates

The methodology's confidence-transparency restraint (§6.1, §7.1, §7.4) and the
H3 OOB safety boundary are mutually reinforcing. This design holds both.

### 7.1 Hard rules (cannot be relaxed without revisiting this document)

1. **No targeting-grade output.** Capability density is per-hex
   (~252 km², σ ≥ 30 km Gaussian fuzz). No surface in this design produces
   per-hull location, per-vehicle status, or "engage here" recommendations.
2. **Damage events are immutable.** No `UPDATE` or `DELETE` on
   `damage_events` or `source_reports`. Corrections via
   `correction_events` only.
3. **Confidence is on links, not objects.** No `confidence` column on
   `damage_events`, `assessments` (the confidence band is on the *capability
   profile* JSON inside, computed from contributing link weights), or any
   primary object.
4. **Provenance is unbroken** (§3.5). Every damage event has at least one
   row in `damage_event_sources`. The `source_reports` row points to the
   raw artifact. Application code that creates damage events without a
   source link is rejected at the schema level (foreign-key + insertion
   trigger).
5. **No commander-facing decision adequacy.** Surfaces show capability
   profile, CI, evidence count, and provenance. They do not classify
   assessments as actionable / not actionable (§6.1).

### 7.2 Analyst review gates

| Trigger | Gate | Disposition |
| --- | --- | --- |
| Automated extraction confidence below threshold | Damage event written with `state='proposed'`; Exception category=`extraction` raised | Analyst promotes to `accepted` or invalidates via Correction Event. |
| Strong non-spatial attribution contradicted by H3 OOB cell P near zero | Exception category=`spatial_corroboration` | Analyst either accepts unit movement (re-runs OOB), accepts deception (notes in Case), or invalidates the attribution. Algorithm does **not** override (§5.2). |
| New evidence contradicts current WBV beyond threshold | Exception category=`contradiction` | Analyst opens a hypothesis branch on the WBV, or accepts the new state, or invalidates the new evidence. |
| Two damage events score above corroboration threshold | Exception category=`corroboration` | Analyst confirms or rejects the link. Both events remain regardless. |
| Foundational baseline refresh diverges substantially from working baseline | Exception category=`baseline_divergence` | Analyst opens a Case to reconcile. |
| Case open without new evidence past staleness threshold | Exception category=`staleness` | Analyst either closes with `residual_uncertainty_accepted` or escalates. |

### 7.3 What happens at consumption time

Per §7.1 and §7.3 of the methodology, consumer surfaces (e.g. a future
TacticalMap layer) must:

- Show capability profile across **all** combat-function categories tracked
  for the unit, not a composite scalar.
- Show the CI band on each category, not just the point estimate.
- Show staleness of the foundational baseline visibly.
- Surface competing WBV branches when present.
- Make provenance navigable: Assessment → WBV → contributing damage events
  → source reports → raw artifact reference, all reachable without leaving
  the surface.

A consumer surface that flattens any of these is a regression on §7.1 and
should be rejected at code review.

---

## 8. Deferred / out-of-scope for this design

The following are reachable from this architecture but deliberately not
specified here:

1. **Computer vision extraction pipeline** for imagery damage events (§4.1).
   Requires a model and a deployment surface; out of scope for a
   methodology-integration document.
2. **Workshop / Quiver-style consumer surfaces** (§7.5). The methodology's
   Foundry-native consumer layer maps loosely onto Red Ledger's existing
   React surfaces, but specific UI changes are a follow-up.
3. **Authoritative taxonomy for combat-function categories per equipment
   type** (§5.3). This is "an implementation requirement that the
   organization owns"; we reference but do not define it.
4. **Detailed AIP Logic / LLM-prompt designs** for HUMINT extraction (§4.3).
   Red Ledger has a client-side RAG chatbot but no extraction pipeline; a
   separate design is needed.
5. **Migration plan from current `strengthPct` / `estimatedLost` mutations to
   WBV-derived projections.** Trivial in concept (nightly recompute),
   non-trivial in code review. Track separately.

---

## 9. Summary

This design takes the BDA methodology's twelve-Object-Type ontology and
realizes it on top of Red Ledger's existing SQLite schema and the H3
probabilistic OOB outputs, holding three architectural commitments
throughout:

- **Confidence on links, not objects.**
- **Damage events and source reports immutable; correction events as
  first-class invalidation records.**
- **H3 OOB as spatial corroboration substrate, not as a targeting surface.**

The result is a path for equipment BDA — from source ingestion through
extraction, fusion, WBV update, and consumption — that updates capability
priors in `entity_hex_beliefs` without crossing the targeting-grade
boundary, and that makes analyst review a structural feature rather than a
patch over automation. Implementation lands in the new tables specified in
`analysis/bda/bda_schema.ts`.

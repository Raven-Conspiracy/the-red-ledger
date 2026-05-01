/**
 * BDA × Red Ledger schema spec — DESIGN DOCUMENT, NOT WIRED IN.
 *
 * This file is the proposed Drizzle/SQLite shape for the twelve Object Types
 * and their Link Types described in `analysis/bda/BDA-Methodology-First-Draft.md`
 * and integrated against Red Ledger in `analysis/bda/BDA-RedLedger-Integration.md`.
 *
 * It is intentionally NOT imported by `shared/schema.ts` and NOT registered
 * with `drizzle.config.ts`. Adopting it is a separate decision tracked in the
 * integration document's §8. The file lives under `analysis/` so that the
 * design and the schema travel together for review without affecting the
 * running application.
 *
 * Design commitments enforced below:
 *   1. Confidence is a property of links, never of primary objects.
 *      (BDA methodology §2.5, §2.6)
 *   2. Damage events and source reports are immutable. Invalidation is via
 *      `correctionEvents`, not deletion. (§5.5)
 *   3. Every damage event requires at least one source report link
 *      (`damageEventSources`). (§3.5)
 *   4. Damage event → unit links carry both `confidence` and `echelon` so the
 *      same event can hold competing attributions at multiple echelons
 *      without forced reconciliation. (§2.5, §5.4)
 *   5. Working baseline versions are version-controlled with a parent link
 *      and branch identifier so hypothesis branches survive ambiguity. (§5.1)
 *   6. Exception is one table with a `category` column, not seven tables. (§6.2)
 */

import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

/* ---------------------------------------------------------------------------
 * Data layer (BDA methodology §2.2)
 * ------------------------------------------------------------------------- */

/**
 * Damage Event — the atomic, immutable observation. (§2.1)
 *
 * NB: no `confidence` column. Confidence lives on link tables.
 * NB: no UPDATE/DELETE workflow — corrections via `correctionEvents`.
 */
export const damageEvents = sqliteTable("damage_events", {
  id: text("id").primaryKey(),
  // What was damaged — taxonomy reference (e.g. "tank", "T-90M", "bridge").
  // Not a free-text equipment field; resolved against the controlled taxonomy
  // at ingestion (§3.4). Free text triggers an extraction exception.
  taxonomyRef: text("taxonomy_ref").notNull(),
  // Where — point at native precision; spatial fuzz happens downstream.
  lat: real("lat"),
  lon: real("lon"),
  // Optional named-area reference — joined into geographic_areas. Always
  // additionally projected to an H3 cell via `damageEventAreas` rows.
  namedAreaId: text("named_area_id"),
  // When (§3.3) — explicit distinction between observation_time (when the
  // damage is reported to have occurred) and report_time (when the source
  // documented it).
  observationTime: text("observation_time").notNull(),
  reportTime: text("report_time").notNull(),
  // Observation mode (§2.1).
  observationMode: text("observation_mode").notNull(), // 'directly_observed' | 'first_hand_reported' | 'second_hand_reported' | 'inferred'
  // Reporter identity — analyst id, pipeline id, model id (§2.1).
  reporterIdentity: text("reporter_identity").notNull(),
  // Severity is an enrichment property; null/`unknown` at creation. (§2.1)
  // History of severity revisions lives in `damageEventSeverityHistory`.
  severity: text("severity"), // 'destroyed' | 'damaged' | 'mobility_killed' | 'repairable' | 'unknown' | null
  // Manual vs automated pathway state (§3.1).
  state: text("state").notNull().default("proposed"), // 'proposed' | 'accepted'
  createdAt: text("created_at").notNull(),
});

/**
 * Source Report — the originating artifact. (§2.2) Immutable.
 */
export const sourceReports = sqliteTable("source_reports", {
  id: text("id").primaryKey(),
  sourceType: text("source_type").notNull(), // 'humint' | 'imagery' | 'sigint' | 'oryx' | 'manual' | 'osint_feed'
  // Pointer to raw artifact (URL / file hash / frame id / intercept locator).
  artifactRef: text("artifact_ref").notNull(),
  // Reliability tier vocabulary inherited from `client/src/data/intel-feed.ts`
  // and the H3 OOB schema_mapping.md scale.
  reliabilityTier: text("reliability_tier").notNull(), // 'HIGH' | 'MED-HIGH' | 'MED'
  // Free-text title / description.
  title: text("title"),
  ingestedAt: text("ingested_at").notNull(),
});

/**
 * Equipment Item (§2.2) — *identified* instances only (tail-numbered hulls,
 * named vessels). Generic typed inventory continues to live in the existing
 * `unit_equipment` table.
 */
export const equipmentItems = sqliteTable("equipment_items", {
  id: text("id").primaryKey(),
  taxonomyRef: text("taxonomy_ref").notNull(), // e.g. "T-90M"
  // Unique identifier for identified items: tail number, hull number, etc.
  identifier: text("identifier").notNull().unique(),
  unitId: text("unit_id"), // optional current parent unit
  unitType: text("unit_type"), // 'army' | 'division' | 'brigade'
  notes: text("notes"),
});

/**
 * Geographic Area (§2.2) — named areas, sectors, AOs, infrastructure
 * polylines. H3 cells are referenced by the H3 index string directly on
 * link tables (no row needed per cell unless we want to attach metadata).
 */
export const geographicAreas = sqliteTable("geographic_areas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // 'sector' | 'oblast' | 'ao' | 'infrastructure_rail' | 'infrastructure_pipeline' | 'named_feature'
  category: text("category").notNull(),
  // Optional centroid — for sector-style entries. Polyline / polygon geometry
  // can hang off a separate column in a follow-up; not specced here.
  centroidLat: real("centroid_lat"),
  centroidLon: real("centroid_lon"),
  sigmaKm: real("sigma_km"), // matches the H3 OOB sector dictionary convention
  parentId: text("parent_id"), // hierarchical / overlapping areas (§2.2)
});

/**
 * Engagement (§2.2) — friendly action that may have caused observable damage.
 */
export const engagements = sqliteTable("engagements", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  occurredAt: text("occurred_at").notNull(),
  description: text("description"),
});

/**
 * Target (§2.2) — pre-planned point or area target.
 */
export const targets = sqliteTable("targets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  targetType: text("target_type").notNull(), // 'point' | 'area'
  description: text("description"),
});

/* ---------------------------------------------------------------------------
 * Reasoning layer (§2.3)
 * ------------------------------------------------------------------------- */

/**
 * Working Baseline Version — per-unit, version-controlled, branching. (§2.3, §5.1)
 *
 * `capabilityProfile` is structured JSON keyed by combat-function category,
 * each carrying a point estimate and confidence range. (§5.3)
 *
 *   {
 *     "long_range_fires":   { "estimate": 0.62, "ci_low": 0.51, "ci_high": 0.74 },
 *     "short_range_fires":  { "estimate": 0.80, "ci_low": 0.71, "ci_high": 0.88 },
 *     "air_defense":        { "estimate": 0.40, "ci_low": 0.22, "ci_high": 0.59 },
 *     "maneuver":           { ... },
 *     "sustainment":        { ... },
 *     "command_control":    { ... },
 *     "reconnaissance":     { ... }
 *   }
 *
 * No scalar composite score is stored. (§5.3, §7.1)
 */
export const workingBaselineVersions = sqliteTable(
  "working_baseline_versions",
  {
    id: text("id").primaryKey(),
    unitId: text("unit_id").notNull(),
    unitType: text("unit_type").notNull(), // 'army' | 'division' | 'brigade'
    parentVersionId: text("parent_version_id"), // null only for genesis version
    branch: text("branch").notNull().default("main"), // hypothesis branches
    changeRationale: text("change_rationale").notNull(),
    capabilityProfile: text("capability_profile").notNull(), // JSON, see above
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    byUnit: index("wbv_by_unit").on(t.unitType, t.unitId, t.branch, t.createdAt),
  }),
);

/**
 * WBV evidence link — provenance from a WBV to the damage events / corrections
 * / baseline refreshes that justified it. (§2.5)
 */
export const wbvEvidence = sqliteTable("wbv_evidence", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wbvId: text("wbv_id").notNull(),
  evidenceType: text("evidence_type").notNull(), // 'damage_event' | 'correction_event' | 'foundational_baseline_refresh'
  evidenceId: text("evidence_id").notNull(),
});

/**
 * Assessment — synthesized judgment at a defined scope. (§2.3)
 */
export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  scopeType: text("scope_type").notNull(), // 'unit' | 'area' | 'campaign'
  scopeId: text("scope_id").notNull(),
  wbvId: text("wbv_id").notNull(), // pinned to a specific WBV
  capabilityProfile: text("capability_profile").notNull(), // JSON, mirrors WBV
  // Versioning — assessments are themselves revisable per §2.3.
  parentAssessmentId: text("parent_assessment_id"),
  createdAt: text("created_at").notNull(),
});

/* ---------------------------------------------------------------------------
 * Operational layer (§2.4)
 * ------------------------------------------------------------------------- */

/**
 * Correction Event — first-class invalidation record. (§2.4, §5.5)
 * Append-only.
 */
export const correctionEvents = sqliteTable("correction_events", {
  id: text("id").primaryKey(),
  damageEventId: text("damage_event_id").notNull(),
  rationale: text("rationale").notNull(), // 'misidentification' | 'double_count' | 'false_report' | 'source_retraction' | 'superseded' | 'retracted_correction'
  // Pointer to a prior correction when this is a meta-correction.
  retractsCorrectionId: text("retracts_correction_id"),
  issuedBy: text("issued_by").notNull(), // analyst id or pipeline id
  issuedAt: text("issued_at").notNull(),
  // Active corrections suppress contribution; retracted corrections do not.
  disposition: text("disposition").notNull().default("active"), // 'active' | 'retracted'
});

/**
 * Exception — single uniform work surface. (§6.2)
 *
 * Category-as-property pattern; do NOT split into seven tables. The seven
 * categories are listed inline below for review reference.
 *
 *   'extraction'             — candidate event below auto-acceptance / failed entity resolution
 *   'contradiction'          — new evidence contradicts existing assessment
 *   'corroboration'          — candidate event linkage requiring analyst judgment
 *   'attribution'            — no meaningful unit attribution / close competing candidates
 *   'spatial_corroboration'  — strong non-spatial attribution contradicted by H3 evidence
 *   'baseline_divergence'    — foundational baseline refresh diverges from WBV
 *   'staleness'              — case approaches diminishing-returns threshold
 */
export const exceptions = sqliteTable("exceptions", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  // Triggering object — polymorphic reference.
  triggerType: text("trigger_type").notNull(), // 'damage_event' | 'wbv' | 'assessment' | 'case' | 'baseline_refresh'
  triggerId: text("trigger_id").notNull(),
  flaggedAt: text("flagged_at").notNull(),
  triggeringRule: text("triggering_rule").notNull(), // identifier for the rule / threshold that fired
  disposition: text("disposition").notNull().default("open"), // 'open' | 'in_review' | 'resolved' | 'dismissed'
  assignedAnalyst: text("assigned_analyst"),
  resolutionRationale: text("resolution_rationale"),
});

/**
 * Case — persistent investigation container. (§2.4, §6.3)
 */
export const cases = sqliteTable("cases", {
  id: text("id").primaryKey(),
  openingContextType: text("opening_context_type").notNull(), // 'exception' | 'commander_request' | 'planned_operation' | 'routine_review' | 'analyst_judgment'
  openingContextRef: text("opening_context_ref"), // optional pointer to the triggering object
  // Working content — analyst notes, hypotheses, lines of inquiry. Stored as
  // markdown / structured JSON; not specified here in detail.
  workingContent: text("working_content"),
  state: text("state").notNull().default("open"), // 'open' | 'under_investigation' | 'pending_input' | 'resolved' | 'closed' | 'reopened'
  assignedAnalyst: text("assigned_analyst"),
  closureRationale: text("closure_rationale"), // 'analytical_resolution' | 'residual_uncertainty_accepted' | 'reallocated_to_higher_priority' | 'relevance_expired' | 'superior_evidence_unnecessary' | null
  parentCaseId: text("parent_case_id"), // §2.4 — case provenance chain
  openedAt: text("opened_at").notNull(),
  closedAt: text("closed_at"),
});

/**
 * Case state history — every state transition versioned (§6.4).
 */
export const caseStateTransitions = sqliteTable("case_state_transitions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  caseId: text("case_id").notNull(),
  fromState: text("from_state"),
  toState: text("to_state").notNull(),
  rationale: text("rationale"),
  by: text("by").notNull(), // analyst id
  at: text("at").notNull(),
});

/**
 * Case scope — the ontology objects this case is investigating. Persistent
 * (§6.3 — "persistent links rather than ephemeral query results").
 */
export const caseLinks = sqliteTable("case_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  caseId: text("case_id").notNull(),
  // Polymorphic link target.
  targetType: text("target_type").notNull(), // 'damage_event' | 'source_report' | 'wbv' | 'assessment' | 'correction_event' | 'exception' | 'unit' | 'equipment_item'
  targetId: text("target_id").notNull(),
});

/* ---------------------------------------------------------------------------
 * Link tables (§2.5) — confidence lives here, not on objects.
 * ------------------------------------------------------------------------- */

/**
 * Damage Event → Source Report. Required, many-to-many, NO confidence.
 * Factual citation. (§2.5)
 */
export const damageEventSources = sqliteTable("damage_event_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  damageEventId: text("damage_event_id").notNull(),
  sourceReportId: text("source_report_id").notNull(),
});

/**
 * Damage Event → Equipment Item. Optional, many-to-one in practice but
 * many-to-many at the schema level to allow ambiguity. Confidence-weighted.
 * (§2.5)
 */
export const damageEventEquipment = sqliteTable("damage_event_equipment", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  damageEventId: text("damage_event_id").notNull(),
  equipmentItemId: text("equipment_item_id").notNull(),
  confidence: real("confidence").notNull(), // [0, 1]
});

/**
 * Damage Event → Unit. Optional, many-to-many. Confidence-weighted AND
 * echelon-tagged. (§2.5, §5.4)
 *
 * The dual-property structure is the structural support for "propagation
 * with preservation": a single event can hold high-confidence attribution at
 * the brigade echelon and lower-confidence attribution at the army echelon
 * (or vice versa) without forced mathematical reconciliation across
 * echelons.
 */
export const damageEventUnits = sqliteTable(
  "damage_event_units",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    damageEventId: text("damage_event_id").notNull(),
    unitId: text("unit_id").notNull(),
    unitType: text("unit_type").notNull(), // 'district' | 'army' | 'division' | 'brigade'
    echelon: text("echelon").notNull(), // matches unitType but explicit per §5.4
    confidence: real("confidence").notNull(), // [0, 1]
    // Spatial corroboration breakdown (§5.2). JSON for the multi-factor scoring
    // record so downstream UI can show *why* the link has the weight it does.
    corroborationScore: text("corroboration_score"),
  },
  (t) => ({
    byEvent: index("deu_by_event").on(t.damageEventId),
    byUnit: index("deu_by_unit").on(t.unitType, t.unitId),
  }),
);

/**
 * Damage Event → Geographic Area / H3 cell. Optional, many-to-many,
 * confidence-weighted. (§2.5)
 *
 * Two columns at the link level: `areaId` (named area row) OR `h3Index` (H3
 * res-5 cell). Exactly one must be non-null.
 */
export const damageEventAreas = sqliteTable("damage_event_areas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  damageEventId: text("damage_event_id").notNull(),
  areaId: text("area_id"), // FK -> geographic_areas.id
  h3Index: text("h3_index"), // H3 res-5 cell index
  confidence: real("confidence").notNull(),
});

/**
 * Damage Event → Engagement. Optional, many-to-one (§2.5).
 */
export const damageEventEngagements = sqliteTable("damage_event_engagements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  damageEventId: text("damage_event_id").notNull(),
  engagementId: text("engagement_id").notNull(),
  confidence: real("confidence").notNull(),
});

/**
 * Damage Event → Target. Optional, many-to-many, confidence-weighted (§2.5).
 */
export const damageEventTargets = sqliteTable("damage_event_targets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  damageEventId: text("damage_event_id").notNull(),
  targetId: text("target_id").notNull(),
  confidence: real("confidence").notNull(),
});

/**
 * Damage Event → Damage Event corroboration link (§4.2).
 * Both events remain in the graph — neither is deleted.
 */
export const damageEventCorroborations = sqliteTable(
  "damage_event_corroborations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventA: text("event_a").notNull(),
    eventB: text("event_b").notNull(),
    score: real("score").notNull(),
    establishedAt: text("established_at").notNull(),
    establishedBy: text("established_by").notNull(),
  },
);

/**
 * Damage Event severity history — append-only progression (§4.2).
 */
export const damageEventSeverityHistory = sqliteTable(
  "damage_event_severity_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    damageEventId: text("damage_event_id").notNull(),
    severity: text("severity").notNull(),
    rationale: text("rationale"),
    setBy: text("set_by").notNull(),
    setAt: text("set_at").notNull(),
  },
);

/**
 * Engagement → Target (§2.5). Typically present with high confidence when
 * a known engagement was directed at a known target.
 */
export const engagementTargets = sqliteTable("engagement_targets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engagementId: text("engagement_id").notNull(),
  targetId: text("target_id").notNull(),
  confidence: real("confidence").notNull(),
});

/**
 * Target composition — Target → Equipment Item / Unit. Many-to-many. (§2.5)
 */
export const targetComposition = sqliteTable("target_composition", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  targetId: text("target_id").notNull(),
  memberType: text("member_type").notNull(), // 'equipment_item' | 'unit'
  memberId: text("member_id").notNull(),
  memberUnitType: text("member_unit_type"), // when memberType='unit'
  confidence: real("confidence").notNull(),
});

/**
 * Exception → resolution products (§2.5). Links an exception to the ontology
 * changes its resolution produced.
 */
export const exceptionResolutions = sqliteTable("exception_resolutions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  exceptionId: text("exception_id").notNull(),
  productType: text("product_type").notNull(), // 'correction_event' | 'wbv' | 'assessment' | 'damage_event_units' | 'damage_event_corroborations'
  productId: text("product_id").notNull(),
});

/* ---------------------------------------------------------------------------
 * H3 OOB / capability density derived layer (BDA-RedLedger-Integration §5)
 * ------------------------------------------------------------------------- */

/**
 * Per-hex per-category remaining-capability density derived from
 * `unit_equipment` (foundational baseline) minus severity-weighted, attribution-
 * weighted contribution from `damage_events`, projected through `entity_hex_beliefs`.
 *
 * Regenerated by an offline job alongside the existing H3 OOB outputs.
 * Confidence band on each row matches the methodology's §7.1 commitment
 * that consumer surfaces show CI rather than a flattened point estimate.
 *
 * NB: this table is OUTPUT, not input. It is regenerated, not mutated.
 */
export const hexCapabilityDensity = sqliteTable(
  "hex_capability_density",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    h3Index: text("h3_index").notNull(),
    category: text("category").notNull(), // combat-function category
    density: real("density").notNull(),
    contributingUnits: integer("contributing_units").notNull(),
    ci95Low: real("ci95_low").notNull(),
    ci95High: real("ci95_high").notNull(),
    computedAt: text("computed_at").notNull(),
  },
  (t) => ({
    byHexCategory: index("hcd_by_hex_category").on(t.h3Index, t.category),
  }),
);

/* ---------------------------------------------------------------------------
 * Inferred TS types (Drizzle convention; not registered in shared/schema.ts)
 * ------------------------------------------------------------------------- */

export type DamageEvent = typeof damageEvents.$inferSelect;
export type SourceReport = typeof sourceReports.$inferSelect;
export type EquipmentItem = typeof equipmentItems.$inferSelect;
export type GeographicArea = typeof geographicAreas.$inferSelect;
export type Engagement = typeof engagements.$inferSelect;
export type Target = typeof targets.$inferSelect;
export type WorkingBaselineVersion = typeof workingBaselineVersions.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type CorrectionEvent = typeof correctionEvents.$inferSelect;
export type Exception = typeof exceptions.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type DamageEventUnit = typeof damageEventUnits.$inferSelect;
export type DamageEventArea = typeof damageEventAreas.$inferSelect;
export type HexCapabilityDensity = typeof hexCapabilityDensity.$inferSelect;

**A Methodology for Battle Damage Assessment**

*An Ontology-Driven Architecture for Confidence-Weighted Risk
Communication*

*Informational Paper*

First Draft

Executive Summary

This paper lays out a methodology for building a digital system to
support the Battle Damage Assessment (BDA) process. It is intended as
the conceptual blueprint for an implementation in Palantir Foundry, and
is written for a Foundry-literate audience.

The methodology is built around a single reframing of the problem. BDA
is not a truth discovery problem — it is a confidence-weighted risk
communication problem. The system does not exist to produce definitive
counts of adversary losses. It exists to communicate, with honest
representation of uncertainty, what an adversary can still do so that
commanders can make well-calibrated risk decisions.

Every architectural decision in this paper derives from that reframing.
An ontology of twelve Object Types structures the data, reasoning, and
operational layers of the system. Confidence is a property of links
rather than objects, allowing ambiguous attributions to be carried
honestly rather than collapsed prematurely. Damage Events are immutable
and version-controlled Working Baseline Versions track the evolving
capability profile of each adversary unit as evidence accumulates.
Correction Events make error handling a first-class analytical asset
rather than a cleanup operation. Cases preserve institutional knowledge
across personnel rotations and operational tempo shifts.

The methodology is end-to-end. It specifies how source material enters
the system through a hybrid manual and automated ingestion pathway, how
extraction and enrichment operate on source data to produce structured
ontological objects, how fusion and reasoning synthesize individual
events into unit-level capability assessments, how exceptions and cases
govern analyst workflow, and how decision support surfaces deliver the
system's output to commanders.

The paper's walk-away is a specification that maps directly to Foundry
Object Types, Link Types, and Action Types. An implementation team
reading this paper should be able to begin building in Foundry without a
translation layer.

1\. Problem Framing

Battle Damage Assessment as a Confidence-Weighted Risk Communication
System

Battle Damage Assessment is often misunderstood — by technologists
attempting to digitize it — as a truth discovery problem. The instinct
is to architect a system that resolves observations into facts, counts
destroyed equipment, and reports adversary losses as a definitive
ledger. This framing is wrong, and building against it produces systems
that fail at the moment of greatest operational need.

BDA is, at its core, a problem of communicating risk under irreducible
uncertainty. The fog of war is not a bug to be engineered away; it is a
structural feature of the operating environment. Commanders do not
require — and cannot wait for — perfect accounting of adversary losses
before acting. What they require is a well-calibrated understanding of
what the adversary can still do, expressed with enough confidence to
make a risk-weighted decision about their own course of action.

This reframing has significant architectural consequences. A system
built to produce definitive counts will hide its uncertainty, force
premature resolution of ambiguous evidence, and collapse contradictions
into single answers. A system built to communicate risk will preserve
uncertainty as a first-class property of every assessment, maintain
contradictory evidence without forcing reconciliation, and surface
confidence distributions rather than point estimates.

Three design principles follow directly from this framing.

**Assessments are perpetually revisable, but operationally bounded.**
Every assessment can and should update as new evidence arrives, but the
system must recognize a point of diminishing returns — where further
corroboration costs more in analyst effort and collection resources than
it contributes to decision quality. The system should surface this
threshold rather than requiring analysts to intuit it.

**Confidence is a property, not a label.** Every object in the ontology
— from a raw source report to a rolled-up brigade-level combat power
assessment — carries an explicit, computable confidence value.
Confidence is not communicated through prose caveats or footnotes; it is
structured data that propagates through the reasoning chain.

**Provenance is non-negotiable.** Every assessment the system produces
must trace, without a break in the chain, back to the specific source
observations that support it. When a commander asks why the system
believes what it believes, the answer is available immediately and in
full. Provenance is not an audit feature; it is the substrate on which
trust in the system is built.

These principles shape every ontological, procedural, and logical
decision in the sections that follow. The ontology described in Section
2 is the structural expression of these principles. The ingestion,
extraction, fusion, and lifecycle patterns in subsequent sections are
the operational expression of the same commitments.

2\. Ontological Foundations

The ontology described in this section is the structural expression of
the principles established in Section 1. Every Object Type, Link Type,
and property decision derives from the commitment to preserve
uncertainty as first-class data, maintain unbroken provenance, and
support perpetually revisable assessments bounded by operational value.

The ontology comprises twelve Object Types organized into three layers.
The data layer captures observed facts and their sources: Damage Event,
Source Report, Equipment Item, Unit, Geographic Area, Engagement, and
Target. The reasoning layer captures synthesized analytical products:
Working Baseline Version and Assessment. The operational layer captures
the structures that govern analyst interaction with the system and
preserve institutional knowledge: Correction Event, Exception, and Case.

The layered organization is conceptual rather than implementational. All
twelve Object Types coexist in a single ontology and are connected
through Link Types that cross layer boundaries. The layers describe the
analytical role of each Object Type, not a partitioning of the data.

2.1 The Damage Event as Foundational Object

The Damage Event is the atomic unit of the ontology. It represents a
single asserted observation — that something was damaged, somewhere, at
some time — created at the moment the observation enters the system and
thereafter never overwritten. Every downstream capability of the system
is built on aggregations of Damage Events.

The Damage Event carries a minimum viable property set: what was damaged
(expressed against the controlled equipment and infrastructure taxonomy
at whatever resolution is available), where the damage occurred
(coordinate, grid, or named location at available resolution), when it
occurred (with explicit distinction between observation time and report
time), observation mode (directly observed, first-hand reported,
second-hand reported, or inferred from abstract context), source
provenance (an unbroken pointer to originating source material), and
reporter identity (whether asserted by a named analyst, automated
extraction pipeline, or specific ML model).

Two properties are deliberately excluded from the minimum core.
Confidence is not assigned at creation; it is computed downstream from
observation mode, source reliability, corroboration state, and analyst
judgment. Damage extent — destroyed, damaged, mobility-killed,
repairable — is frequently unresolvable at first observation and is
treated as an enrichment property refined through subsequent evidence.

2.2 Data Layer Object Types

**Source Report** represents the originating artifact — an imagery
frame, a HUMINT report, a SIGINT intercept, a drone feed segment, a
manual analyst entry. Every Damage Event links to at least one Source
Report, and a single Source Report may generate multiple Damage Events.

**Equipment Item** represents adversary equipment being tracked. An
identity_resolution property distinguishes identified instances
(uniquely resolvable assets such as tail-numbered aircraft or named
naval vessels, which are rich persistent objects with their own
lifecycle) from generic instances (equipment of a known type without
persistent identity, effectively analytical placeholders tied to the
taxonomy). The distinction matters for downstream combat power
reasoning, which must avoid double-counting identified losses against
generic inventory.

**Unit** represents an adversary military organization at some echelon.
Unit objects are hierarchical with structural parent-child links
expressing the known adversary order of battle. The hierarchy is not
probabilistic; it reflects intelligence holdings revised when order of
battle changes but not per Damage Event.

**Geographic Area** represents named terrain features, unit boundaries,
areas of operations, and other spatial constructs. Geographic Areas can
be hierarchical and can overlap.

**Engagement** represents a friendly action — a strike, a fire mission,
a targeting operation — that may have caused observable damage. The link
to Damage Event is optional and enriching. When present, it enables
strike effectiveness analysis; when absent, the Damage Event remains
fully valid.

**Target** represents a pre-planned object of analytical or operational
interest that exists independently of any damage. A target_type property
distinguishes point targets (specific equipment or installations engaged
with precision) from area targets (semi-elastic groupings engaged with
area effects). Target composition and target geography properties
capture what the target is believed to contain and where. The Target
Object Type enables the Engagement → Target → Damage Event chain that
closes the loop on whether intended effects were achieved.

2.3 Reasoning Layer Object Types

**Working Baseline Version** represents the system's current best
estimate of a Unit's combat power at a specific point in time. It is a
version-controlled object with a branching structure analogous to source
code repositories. Each version has a parent-version link, a change
rationale, a timestamp, and provenance to the specific Damage Events,
intelligence updates, foundational baseline refreshes, or other evidence
that justified the change. The current working baseline is the latest
version on the main branch; prior versions remain queryable as part of
the audit history.

The Working Baseline Version carries the capability profile as
structured data: distinct combat function categories (long-range fires,
short-range fires, air defense, maneuver, sustainment, command and
control, reconnaissance, and additional categories defined by the
organization's doctrine) each tracked independently with their own
estimated strength and confidence range. The multi-dimensional profile
replaces any notion of a single composite effectiveness score.

Working Baseline Versions can decrement in response to damage evidence
or increment in response to reinforcement, resupply, repair, or the
introduction of newer equipment. The branching capability supports
hypothesis reasoning: when meaningful analytical disagreement exists
about whether a change has occurred, competing branches can be
maintained until evidence resolves the disagreement rather than forcing
premature commitment to one interpretation.

**Assessment** represents a synthesized judgment about combat power at a
defined scope — a specific unit, a geographic area, a campaign
timeframe. Assessments are derived objects that reference a specific
Working Baseline Version alongside the evidence base from which they are
computed. Assessments are versioned and revisable, with each version
carrying forward the evidence base from which it was produced.

2.4 Operational Layer Object Types

**Correction Event** represents a first-class record of a Damage Event
determined to be incorrect. Rather than deleting invalidated events, the
system preserves them in the graph alongside a Correction Event that
flags them as no longer contributing to Working Baseline Version
computation or Assessment synthesis. The Correction Event carries the
rationale for invalidation (misidentification, double-count, false
report, source retraction, superseded by better evidence), the issuing
analyst or automated process, and the timestamp of correction.
Correction Events are the structural foundation of the system's learning
architecture, providing the diagnostic information needed to improve
extraction models, confidence calibration, and analytical practice over
time.

**Exception** represents a situation requiring human analytical
attention. Exceptions carry a category property with one of seven
values: extraction (candidate Damage Events below auto-acceptance
confidence or with failed entity resolution), contradiction (new
evidence contradicting existing assessments), corroboration (candidate
event linkages requiring analyst judgment), attribution (events without
meaningful unit attribution or with close competing candidates), spatial
corroboration (strong non-spatial attribution contradicted by geographic
evidence), baseline divergence (foundational baseline refreshes
diverging substantially from the working baseline), and staleness (cases
approaching the diminishing-returns threshold). Beyond the category,
Exceptions share common properties: triggering event or object, flagging
timestamp, triggering rule or threshold, current disposition, assigned
analyst, resolution rationale, and links to the Correction Events or
ontology changes produced by resolution.

The category-as-property pattern keeps the analyst work surface uniform.
An analyst sees all Exceptions in one place, filters by category as
needed, and applies consistent resolution workflows regardless of type.

**Case** represents the persistent container for analytical reasoning
across an investigation. Cases are full Object Types with their own
lifecycle rather than ephemeral workspaces, because the system operates
in conditions where humans rotate or are removed and investigative
reasoning must survive personnel changes. A Case captures opening
context (what triggered it — an Exception, a commander's request, a
planned operation, a routine review, or analyst judgment), investigative
scope (persistent links to the ontology objects being worked), working
content (analyst notes, hypotheses under investigation, intermediate
conclusions, lines of inquiry considered), state and disposition
(current status, assigned analyst, handoff history, state transition
rationales), resolution record (closure rationale, resulting ontology
changes, residual uncertainty accepted), and provenance chain
(relationships to prior related cases that split, merged, or succeeded
each other).

Cases transition through states — open, under investigation, pending
input, resolved, closed, reopened — with each transition captured as a
versioned state change. Closure occurs when the marginal value of
pursuing the case further falls below the operational cost of continued
pursuit, with closure rationale captured as structured data. When new
evidence justifies resumption, the Case transitions from closed back to
open as a state change on the same persistent object, preserving the
continuity of working content and investigative context.

The Case Object Type is what makes the combination of Correction Events
and institutional learning operationally meaningful. Correction Events
reveal what errors occurred; Cases linked to those Corrections reveal
how analysts were reasoning when the errors occurred. The second
question drives genuine analytical improvement.

2.5 Link Types and the Expression of Uncertainty

The Link Types connecting these Object Types are where the probabilistic
and hierarchical reasoning of BDA gets expressed structurally. The
ontology supports patterns that a relational schema cannot cleanly
express, which is why a graph-based ontology is essential rather than
merely convenient.

- **Damage Event → Source Report:** required, many-to-many, no
  confidence weight. Factual citation.

- **Damage Event → Equipment Item:** optional, many-to-one,
  confidence-weighted.

- **Damage Event → Unit:** optional, many-to-many. Each link carries a
  confidence weight AND an echelon level. This dual-property structure
  supports both resolution to a specific echelon with confidence and
  resolution only to higher echelons when lower-echelon resolution is
  uncertain. Competing low-confidence subordinate attributions can
  coexist with high-confidence parent attributions without being forced
  to mathematically reconcile.

- **Damage Event → Geographic Area:** optional, many-to-many,
  confidence-weighted. Supports multiple overlapping spatial constructs.

- **Damage Event → Engagement:** optional, many-to-one. Typically high
  confidence when present.

- **Damage Event → Target:** optional, many-to-many,
  confidence-weighted.

- **Unit → Unit:** required structural link expressing order of battle
  hierarchy.

- **Engagement → Target:** typically present with high confidence.

- **Target → Equipment Item and Target → Unit:** many-to-many, capturing
  target composition and ownership.

- **Working Baseline Version → Working Baseline Version:**
  parent-version link expressing branching version history.

- **Working Baseline Version → Unit:** scope link identifying which unit
  the baseline applies to.

- **Working Baseline Version → evidence objects (Damage Event,
  Correction Event, etc.):** provenance links identifying what justified
  each version.

- **Assessment → Working Baseline Version and Assessment → Damage
  Event:** reference and aggregation links that define the Assessment's
  evidence base.

- **Correction Event → Damage Event:** links an invalidation to the
  event it invalidates.

- **Exception → triggering object:** links an exception to whatever
  triggered it.

- **Exception → resolution products (Correction Event, Assessment,
  Working Baseline Version):** links an exception to the ontology
  changes produced by its resolution.

- **Case → Exception, Damage Event, Source Report, Working Baseline
  Version, Assessment, Correction Event:** define the investigative
  scope of each case.

- **Case → Analyst identity:** captures assignment and handoff history.

- **Case → Case:** captures parent, child, and sibling relationships
  across related cases.

2.6 Structural Properties of the Ontology

Three structural properties deserve explicit naming because they enable
the analytical behaviors in later sections.

**Immutability of Damage Events and Source Reports** ensures that the
evidence base is stable even as interpretation evolves. Enrichment
happens through additional links and derived objects; corrections happen
through Correction Events; neither modifies the original assertions.

**Confidence as a property of links rather than objects** allows the
same Damage Event to hold multiple competing attributions simultaneously
without forcing premature reconciliation. The graph carries ambiguity
honestly, and downstream reasoning operates on the full distribution.

**Versioning across reasoning and operational objects** — Working
Baseline Versions, Assessments, Case state transitions — preserves the
historical trajectory of analytical judgment. Current state is
queryable, and full history is preserved. This is the foundation for the
perpetual revisability principle from Section 1 made operational.

The ontology as specified here is directly implementable in Foundry's
Object Type and Link Type constructs. Confidence-weighted links and
hierarchical echelon properties are standard Link Type properties.
Version-controlled branching on Working Baseline Versions is expressed
through parent-version links and state properties. The Action Types that
create, enrich, and aggregate these objects are addressed in Sections 3
and 6.

3\. Ingestion and Event Generation

With the ontological foundation established, the next architectural
question is how objects get created in the first place. Ingestion is
where the system meets reality — where raw source material from
heterogeneous collection streams becomes structured ontological objects
that downstream reasoning can operate against.

The central design commitment of this section is schema-first ingestion:
every pathway that creates objects in the ontology, whether operated by
a human or an automated pipeline, writes against the same Object Type
definitions and is bound by the same Action Type contracts. This
commitment prevents the most common failure mode in systems of this
kind, where manual and automated ingestion paths diverge over time and
produce structurally incompatible data that must be reconciled
downstream at enormous cost.

3.1 The Dual-Pathway Pattern

The ingestion architecture supports two distinct operational patterns
that share a single ontological target.

**The manual pathway** serves the analyst who is working a source
directly — reading a HUMINT report, reviewing imagery, listening to a
SIGINT intercept — and identifies a damage event that requires capture.
The analyst needs a low-friction interface that enforces the minimum
viable property set of the Damage Event while adapting intelligently to
the source type being worked. An imagery-derived event entry should
surface fields relevant to imagery analysis; a HUMINT-derived event
entry should surface fields relevant to textual reporting. The
underlying Action Type is the same — create Damage Event — but the form
presentation is source-type aware.

**The automated pathway** serves the continuous ingestion of source
material at scale, where extraction models identify candidate damage
events from unstructured content and propose them for acceptance into
the ontology. The automated pathway produces the same Object Type
through the same Action Type, but it typically does so with a proposed
state that requires validation rather than an accepted state that is
immediately live. The distinction between proposed and accepted events
is carried as a property on the Damage Event itself, ensuring that
analysts and downstream reasoning can distinguish reviewed from
unreviewed evidence without special-case logic.

3.2 Action Types as the Ingestion Contract

The enforcement mechanism for schema-first ingestion is the Action Type.
Every ingestion pathway invokes the same Action Types against the
ontology, and the Action Type definition is the single source of truth
for what a valid object creation or enrichment operation requires.

Three Action Types carry most of the ingestion workload.

**Create Damage Event** establishes a new event from any source. It
requires the minimum viable property set defined in Section 2 and
establishes the mandatory link to Source Report. It is invoked
identically by manual pathways, automated pipelines, and bulk import
operations.

**Enrich Damage Event** adds corroborating evidence, refines severity
assessment, adjusts confidence-weighted links to Equipment Items, Units,
or Geographic Areas, and updates the observation context. Enrichment
never overwrites the original event; it extends the graph of links and
properties around it.

**Link Damage Event to Engagement or Target** establishes the connection
between observed damage and friendly operational intent. This Action
Type is typically invoked later in the event lifecycle, once analysis
has associated observed damage with a pre-planned target or a known
friendly action.

Additional Action Types govern the Assessment objects, the Source Report
lifecycle, and the exception management flows addressed in Section 6.
The principle is consistent across all of them: the Action Type defines
what the operation requires, what it produces, and what business rules
apply, and every pathway invokes it identically.

3.3 Source-Type Adaptation

While the ingestion contract is uniform, the practical experience of
ingestion is not. Different source types present different extraction
challenges and different analyst workflows, and the ingestion layer must
accommodate this without compromising ontological consistency.

**Imagery ingestion** emphasizes spatial and visual fidelity. The
analyst or extraction pipeline is working against a georeferenced image,
and the Damage Event created from it inherits a relatively precise
location and timestamp directly from the source metadata. The extraction
challenge is interpretive — identifying what type of damage is visible
and what equipment or infrastructure was affected — and this is where
computer vision models fit into the automated pathway. The manual
pathway for imagery typically presents the analyst with the image,
candidate annotations from any automated extraction that has already
run, and a form that prefills spatial and temporal properties from the
image metadata.

**SIGINT ingestion** divides into two sub-patterns that share little
beyond their source category. Emissions data is structurally similar to
sensor telemetry — continuous, geolocated, timestamped — and the
extraction challenge is pattern recognition rather than content
interpretation. Intercepted communications are unstructured text where
damage-relevant information may be buried in context, requiring natural
language extraction in the automated pathway and careful reading in the
manual pathway. The ingestion layer must treat these as distinct
sub-types within the SIGINT category, routing each to appropriate
extraction logic while still producing identical Damage Event objects
downstream.

**HUMINT ingestion** is almost entirely unstructured text with the
highest interpretive burden and the richest contextual nuance. The
automated pathway relies heavily on natural language processing to
identify candidate damage mentions, extract equipment types and
locations from surrounding context, and estimate observation mode from
linguistic cues. The manual pathway must support the analyst who is
working deeply through a report and identifying events that automated
extraction may have missed or misinterpreted. HUMINT ingestion also
frequently surfaces temporal ambiguity — reports often describe events
that occurred days or weeks before the report date — and the ingestion
layer must capture both observation time and report time explicitly.

3.4 Entity Resolution at the Point of Ingestion

A core discipline of ingestion is entity resolution — the binding of
textual or observed references to the correct objects in the ontology.
When a HUMINT report mentions a tank destroyed near a named village, the
ingestion pathway must resolve the equipment mention against the
controlled taxonomy and the location mention against known Geographic
Areas. When an imagery analyst annotates a destroyed vehicle, the
annotation must resolve against the equipment taxonomy rather than being
captured as free text.

This resolution discipline is the difference between an ontology that
supports graph-based reasoning and one that degrades into text search.
The manual pathway enforces resolution through autocomplete and
controlled-vocabulary fields. The automated pathway enforces it through
extraction models that output resolved entity references, with
unresolved extractions routed to analyst review rather than accepted as
free text.

Entity resolution at ingestion time is imperfect and will sometimes
produce errors. The ontology accommodates this by treating resolution as
a link with confidence weight rather than a fact. A low-confidence
equipment resolution is a weak link that invites corroboration; a
high-confidence resolution is a strong link that anchors downstream
reasoning. The ingestion layer is responsible for honestly reporting the
confidence of its resolutions rather than forcing false certainty.

3.5 Provenance as an Ingestion Invariant

Every Damage Event created by any pathway carries a mandatory,
unbreakable link to its Source Report, and every Source Report carries
the raw artifact reference — the imagery frame identifier, the HUMINT
report document reference, the SIGINT intercept record locator. This
chain is established at ingestion time and is invariant thereafter.

The operational consequence is that any assessment the system produces,
at any level of synthesis, can be traced back through its constituent
Damage Events to the specific source material that supports it. A
commander who questions an assessment does not receive a prose
explanation; they receive the evidence chain itself. This is the
structural foundation of the trust principle established in Section 1.

3.6 Ingestion Output and the Handoff to Enrichment

The ingestion layer's responsibility ends with the creation of
well-formed, provenance-linked, resolution-attempted Damage Events in
the ontology. It does not perform fusion, it does not compute unit-level
rollups, and it does not produce Assessments. Those operations belong to
the enrichment, fusion, and reasoning layers addressed in Sections 4 and
5.

What ingestion produces is a continuously updating population of Damage
Event objects, each carrying its source provenance, its initial
resolution attempts, its observation mode, and its
proposed-versus-accepted state. Downstream processes operate against
this population to produce the synthesized analytical output the system
exists to deliver.

4\. Extraction and Enrichment

Ingestion, as described in Section 3, establishes the pathways by which
source material becomes Damage Events in the ontology. Extraction and
enrichment are the analytical operations that happen along those
pathways — the techniques that turn raw source material into structured,
resolved, confidence-weighted objects. This section addresses the
machine learning and data processing techniques that power the automated
pathway and augment the manual pathway, organized by source type and by
the enrichment operations that apply across sources.

The distinction between extraction and enrichment is worth naming up
front. Extraction is the act of identifying and structuring a candidate
Damage Event from source material — finding the signal in the noise.
Enrichment is the act of adding analytical value to an existing Damage
Event — resolving its entities more precisely, establishing links to
other objects, refining its confidence, associating it with engagements
or targets. Extraction creates; enrichment elaborates.

4.1 Extraction by Source Type

Each primary source category presents a distinct extraction problem that
requires distinct techniques. The commitment to a shared ontology means
that these disparate techniques must all produce the same Object Type at
the end of their processing chains, but the machinery that gets them
there looks very different.

Imagery Extraction

Imagery extraction is fundamentally a computer vision problem. The core
techniques are object detection and change detection. Object detection
models identify candidate equipment or infrastructure within an image
and classify them against the controlled taxonomy. Change detection
compares imagery of the same location across time windows to identify
what has been damaged, destroyed, or displaced. Modern implementations
typically combine these — object detection establishes what is present
in a current image, and change detection against prior imagery
establishes what has changed.

The extraction output for imagery is relatively structured by nature of
the source. Spatial coordinates are inherited directly from image
georeferencing, timestamps come from image metadata, and equipment
classification comes from the vision model's output against the
taxonomy. The primary uncertainty in imagery extraction is interpretive
rather than spatial or temporal — the model may be confident about the
location of something but uncertain whether it's damaged or merely
obscured, destroyed or repairable. These interpretive uncertainties must
be preserved as confidence weights on the resulting Damage Event
properties rather than collapsed into binary judgments.

A particular discipline for imagery extraction is handling the
not-conclusive case. An imagery analyst — human or model — often cannot
determine from a single image whether observed change constitutes
damage. The extraction pipeline must be able to create Damage Events
with explicit interpretive uncertainty rather than either forcing a
determination or discarding the observation. This is why the Damage
Event ontology from Section 2 treats severity as an enrichment property
rather than a required field.

SIGINT Extraction

SIGINT extraction requires different techniques for its two
sub-patterns. For emissions data, the core techniques are signal
classification, pattern recognition over time, and geolocation through
time-difference-of-arrival or similar methods. The extraction question
is typically not 'is damage observable' but rather 'does the expected
emission pattern persist, and if not, does the absence itself constitute
evidence of damage.' Continued radar emissions from a target after a
strike, for example, can be evidence against successful damage. The
extraction pipeline must be able to create Damage Events with negative
or contradicting evidence, where the source report supports a hypothesis
that no damage occurred or that prior damage assessments were incorrect.

For intercepted communications, the extraction problem is natural
language understanding. The pipeline must identify mentions of damage,
losses, or equipment status within unstructured text; extract the
entities being discussed (what equipment, which unit, where, when); and
assess the observation mode from linguistic cues (is the speaker
reporting something they saw, something they heard, something they
inferred). Modern language models are capable of this extraction, but
they must operate against the controlled taxonomy and known Unit and
Geographic Area populations to produce entity-resolved outputs rather
than free text. A mention of 'the artillery near the western bridge'
must be resolved to a specific Geographic Area and a specific equipment
type with appropriate confidence, or flagged for analyst resolution if
resolution is not possible.

HUMINT Extraction

HUMINT extraction is the most linguistically demanding and the most
context-dependent. Reports are often long, narrative, and contain
multiple damage-relevant mentions scattered among unrelated content. The
extraction pipeline must perform document-level processing that
identifies damage-relevant passages, extracts structured event
information from each passage, resolves entities against the ontology,
and assesses observation mode with particular attention to the
distinction between first-hand witness reporting and second-hand or
hearsay reporting.

The temporal extraction challenge is especially pronounced for HUMINT.
Reports routinely describe events that occurred significantly before the
report date, and the time information is often expressed in relative or
imprecise terms. The extraction pipeline must capture both the
observation time — when the damage is reported to have occurred — and
the report time — when the source documented it — and must honestly
represent temporal uncertainty when the source is imprecise. A report
describing damage 'last week' must not be stored with a false precision
that claims a specific date.

4.2 Cross-Source Enrichment Operations

Several enrichment operations apply regardless of source type and
typically execute after initial extraction has created a Damage Event in
the ontology.

**Entity resolution refinement** is the ongoing process of strengthening
or correcting the links from a Damage Event to Equipment Items, Units,
and Geographic Areas. Initial resolution at ingestion is often partial
or uncertain; subsequent enrichment brings in additional context — the
known disposition of adversary units, the geographic boundaries of
operational areas, the presence of identified Equipment Items nearby —
to refine those links. This is a continuous operation rather than a
one-time event, triggered whenever underlying intelligence holdings
change or when new corroborating evidence arrives.

**Corroboration linking** identifies when multiple Damage Events may
refer to the same underlying real-world occurrence. Two Damage Events
from different sources that describe damage to the same equipment type,
at similar locations, within overlapping time windows may represent the
same event observed twice or two distinct events. This is a fuzzy
matching problem requiring probabilistic reasoning over spatial
proximity, temporal proximity, equipment type similarity, and source
compatibility. Modern implementations use vector embeddings of event
properties to compute similarity scores, and candidate matches above a
threshold are either automatically linked or surfaced for analyst review
depending on confidence.

The corroboration operation is where the principle of immutability
becomes operationally important. When two events are determined to
describe the same underlying occurrence, neither is deleted. Instead, a
corroboration link is established between them, and downstream reasoning
treats them as mutually reinforcing evidence for a single observation
rather than as independent events. If the corroboration determination is
later reversed, the link is severed but both events remain intact.

**Engagement and Target association** enriches Damage Events by linking
them to friendly operational context when such context is available.
This enrichment is typically triggered by spatial and temporal proximity
between a Damage Event and known Engagements or pre-planned Targets.
When a Damage Event occurs at a location and time consistent with a
known Engagement, a candidate link is proposed with confidence
proportional to the closeness of the match. Analyst review resolves
ambiguous cases, and confirmed links enable the strike effectiveness
reasoning described in Section 2.

**Observation mode refinement** reassesses the initial observation mode
property as additional context becomes available. An event initially
captured as 'inferred from abstract context' may be upgraded to
'first-hand reported' when a corroborating HUMINT report arrives, or a
'directly observed' event may be qualified when the observing platform's
reliability comes into question. The property is revisable and
versioned, with the history of changes preserved.

**Severity assessment** progressively refines the damage extent property
as evidence accumulates. An initial imagery observation may indicate
only that damage is visible; subsequent imagery from a different angle,
a corroborating HUMINT report, or the cessation of expected emissions
may collectively resolve the severity to destroyed, mobility-killed, or
repairable. Severity assessment is typically rule-based with ML
augmentation — combining explicit analytical criteria with learned
patterns from prior adjudicated cases.

4.3 The Role of AIP and Foundry-Native ML Tooling

The techniques described above are conventional within modern data
science, but their operational deployment within Foundry uses the
platform's native ML tooling rather than external pipelines.
Language-based extraction operations — HUMINT processing, SIGINT
transcript analysis, narrative summarization — are well-suited to AIP
Logic, which provides structured LLM invocation against ontology objects
with explicit inputs, outputs, and business rule enforcement. Computer
vision operations for imagery extraction are typically deployed as
containerized models invoked through Pipeline Builder or Transforms,
with outputs written directly against the ontology through Action Types.

The architectural benefit of native tooling is that extraction and
enrichment operations are first-class citizens of the ontology rather
than external systems whose outputs must be reconciled. An AIP Logic
function that extracts damage mentions from a HUMINT report invokes the
same Create Damage Event Action Type that an analyst's manual form
submission invokes, producing identical ontological results. This
uniformity is what the schema-first commitment from Section 3 requires
in practice.

4.4 Confidence as an Extraction Output

A unifying discipline across all extraction and enrichment operations is
the explicit production of confidence values alongside structured
outputs. Every extraction result — an identified equipment type, a
resolved unit attribution, a corroboration link, a severity assessment —
must carry a confidence value that represents the model's or analyst's
calibrated judgment of correctness.

This discipline enables the confidence-weighted reasoning addressed in
Section 5. A unit-level combat power rollup that aggregates Damage
Events weighted by their attribution confidence produces a meaningfully
different result than one that treats all attributions as equally
certain. The ontology's capacity to carry confidence on every link,
described in Section 2, is only operationally useful if the extraction
and enrichment layers actually populate those confidence values honestly
rather than defaulting to false certainty.

The output of extraction and enrichment, then, is a continuously refined
population of Damage Events and their associated links, each carrying
source provenance, entity resolutions at appropriate confidence,
observation mode, severity assessment where available, and corroboration
and engagement linkages where applicable. This population is the input
to fusion and reasoning, where individual events are synthesized into
unit-level and area-level Assessments that commanders consume.

5\. Fusion and Reasoning

Sections 3 and 4 established how source material becomes Damage Events
in the ontology — well-formed, provenance-linked, entity-resolved
objects carrying confidence weights on their attributions. This section
addresses the analytical operations that synthesize individual events
into the operational meaning commanders consume: unit-level and
area-level capability assessments that communicate risk with calibrated
confidence.

The fusion and reasoning layer is the paper's intellectual center of
gravity. It is where the principles from Section 1 — uncertainty as
first-class data, perpetual revisability, provenance as substrate — are
operationalized into the reasoning operations that produce Assessments.
Five core analytical commitments shape this layer.

5.1 Baseline Reference and the Two-Tier Pattern

Every assessment operation begins with reference to a baseline — the
starting point against which damage is measured. The system operates
with two distinct baselines that serve different roles and carry
different maintenance patterns.

**The foundational baseline** represents authoritative intelligence
holdings about adversary unit composition, equipment, and manning. It
originates outside the BDA system, maintained by the organization
responsible for foundational military intelligence. The foundational
baseline is treated as versioned input data — the system consumes it,
references it with explicit provenance, and surfaces its staleness to
consumers of Assessments. When the foundational baseline's refresh
cadence is inconsistent, that inconsistency is architecturally absorbed
rather than solved; a commander reviewing an Assessment can see how
recently the foundational baseline was updated and factor that staleness
into their own risk judgment.

**The working baseline** represents the system's current best estimate
of a unit's combat power, expressed as the Working Baseline Version
object in the ontology. The working baseline defaults to assuming the
unit is mostly intact unless evidence contradicts that assumption. This
is a deliberate tactical commitment rather than a technical convenience
— military planning against the most dangerous adversary course of
action requires assuming enemy capability until evidence justifies
reducing that assumption. The system does not degrade the working
baseline through the passage of time alone; it degrades only in response
to evidence.

The working baseline can also increase. Reinforcement, resupply, repair,
or the introduction of newer equipment all produce upward revisions. The
Working Baseline Version object supports these revisions through a
version-controlled branching structure analogous to source code
repositories. Every change — decrement or increment — produces a new
version with a parent-version link, a change rationale, and provenance
to the specific events or intelligence updates that justified the
change. The branching capability additionally supports hypothesis
reasoning: when analytical disagreement exists about whether a change
has occurred, competing branches can be maintained until evidence
resolves the disagreement, rather than forcing premature commitment to
one interpretation.

5.2 Attribution Refinement and Spatial Corroboration

Damage Events enter the fusion layer carrying attribution links to
Units, Equipment Items, and Geographic Areas at whatever confidence the
extraction and enrichment layers produced. Attribution refinement is the
ongoing operation of strengthening, weakening, or redirecting those
links as evidence accumulates.

The primary attribution pathway is non-spatial. Source-derived evidence
— textual identification of the unit in HUMINT or SIGINT, visual
identification of unit markings in imagery, engagement records that
targeted known units — establishes the initial attribution. Spatial
reasoning enters as a corroboration layer rather than as the primary
attribution mechanism.

Spatial corroboration operates as a multi-factor scoring operation over
existing ontology objects. The factors include proximity to last known
positions of the unit's equipment and command posts, consistency with
doctrinal spacing for the unit's echelon and equipment type, terrain
consistency given the unit's operational capabilities, alignment with
the unit's recent operational pattern, and boundary inference when a
location falls in a zone where adjacent units might plausibly operate.
These factors reference objects already present in the ontology —
historical Damage Events, Unit properties, Geographic Area properties,
prior observational records — making spatial corroboration a structured
query operation rather than a specialized external reasoning engine.

The output of spatial corroboration is confidence weight refinement. A
geographically consistent attribution sees its confidence weight
strengthened. A geographically contradicting attribution sees its
confidence weight weakened and, in cases of strong contradiction, is
flagged for analyst review rather than algorithmically overridden. The
flagged case carries analytical value in its own right — a strong
non-spatial attribution with strongly contradicting geography may
indicate undetected unit movement, deception in the source material, or
misreading of the attribution. The system surfaces the contradiction for
human judgment rather than resolving it.

For events with competing attributions across multiple candidate units,
spatial corroboration can shift confidence weights across the candidates
independently. The 40/40 split between two battalions described in
Section 2 may, under spatial corroboration, shift to a 55/25 weighting
with residual uncertainty remaining. The result is refinement of the
probabilistic attribution, not collapse to a single answer.

5.3 Capability Profiles and Category-Aware Rollup

Combat effectiveness is not a scalar property and is not represented as
one. The system treats each unit's combat power as a multi-dimensional
capability profile across distinct combat function categories —
long-range fires, short-range fires, air defense, maneuver, sustainment,
command and control, reconnaissance, and additional categories defined
by the organization's doctrine. Each category is tracked independently
with its own baseline, its own evidence base of Damage Events, and its
own confidence range.

The category-aware pattern is not merely more accurate than a scalar; it
is operationally generative. A unit with severely degraded air defense
is exploitable by friendly air capability regardless of the state of its
other functions. A unit with depleted long-range fires is vulnerable to
standoff engagement regardless of its maneuver strength. These
exploitable weaknesses surface naturally from a capability vector but
are invisible in a monolithic effectiveness number. The Assessment
object reports the capability profile across categories, with confidence
ranges on each, and highlights weaknesses against friendly capability
overmatch thresholds when relevant to commander decision-making.

The capability profile requires that the controlled equipment and
infrastructure taxonomy carry category mappings. Every entry in the
taxonomy must know which combat function category or categories it
contributes to, and the relative contribution where equipment serves
multi-role functions. This taxonomic discipline is an implementation
requirement that the organization owns; the paper notes its necessity
without dictating the specific category schema.

Rollup logic is category-aware aggregation. For each combat function
category, the fusion layer aggregates Damage Events affecting equipment
in that category, weights them by attribution confidence to the unit,
weights them by severity assessment, and computes the category's current
state against the baseline category inventory. This happens
independently across categories and produces the structured capability
profile that the Assessment carries.

5.4 Propagation with Preservation

Hierarchical rollup across echelons follows a specific pattern:
propagation with preservation rather than additive accumulation. The
distinction matters for epistemic honesty and affects how the system
responds to ambiguous attribution.

In propagation with preservation, each echelon's capability profile is
computed from Damage Events attributed to that specific echelon at that
echelon's attribution confidence, without summing from below. An event
attributed with high confidence to a brigade and with probabilistic
confidence to its subordinate battalions contributes fully to the
brigade's capability profile and partially to each candidate battalion's
capability profile. The subordinate probabilities do not need to sum to
the brigade's certain loss, because they are expressing a different
epistemic state: known loss at the brigade level, probabilistic
candidate loss at the battalion level.

The implication is that capability assessments at different echelons are
internally consistent without being mathematically reconciled across the
hierarchy. A brigade-level Assessment reports the complete picture of
losses known to have affected the brigade. A battalion-level Assessment
reports the probabilistic picture of losses weighted by attribution
confidence to that battalion. A commander viewing either Assessment sees
an honest representation of what is known at that echelon. Forcing
mathematical reconciliation across echelons would require either
artificially precise subordinate attributions or artificially imprecise
parent attributions, either of which would compromise the honesty of the
underlying evidence.

The ontology's Damage Event to Unit link, with its confidence weight and
echelon property, structurally supports this pattern. Rollup logic
respects the echelon property when aggregating, pulling events with
meaningful attribution confidence at the queried echelon rather than
traversing the hierarchy and summing.

5.5 Correction as Learning Architecture

The fusion and reasoning layer depends on the integrity of the evidence
base, which depends on the system's ability to detect, capture, and
propagate corrections when Damage Events are determined to be incorrect.
The Correction Event Object Type introduced in the ontology addresses
this requirement with structural rigor.

A Correction Event is a first-class object in the ontology, not a
deletion operation. It links to the invalidated Damage Event, carries a
rationale for invalidation, identifies who or what issued the
correction, and timestamps the correction. The invalidated Damage Event
remains in the graph; the Correction Event alongside it flags the Damage
Event as no longer contributing to Working Baseline Version computation
or Assessment synthesis.

This pattern serves three distinct purposes. It preserves the full
analytical history including errors, supporting audit and retrospective
review. It enables clean propagation of corrections through Working
Baseline Version updates, producing new versions that reflect the
corrected evidence base without mutating prior versions. And it turns
corrections into training signal for the extraction and enrichment
layers, making the system organizationally adaptive rather than merely
accumulative.

The feedback loop from Correction Events to extraction and enrichment is
an architectural commitment that the paper names explicitly. Patterns
across Correction Events — concentrations of misidentifications from a
specific extraction model, disproportionate false reports from a
specific source type, recurring double-counts in a specific spatial or
temporal context — become diagnostic information. The system can surface
these patterns to support retraining decisions, confidence
recalibration, and analytical practice refinement. A learning
organization requires a mechanism for learning from its own errors; the
Correction Event pattern provides that mechanism structurally.

5.6 The Integrated Reasoning Flow

The five analytical commitments described above operate as a continuous,
integrated reasoning layer rather than a strict pipeline. The logical
sequence of operations on any given Damage Event is:

The event is evaluated against the Working Baseline Version of the unit
or units it may be attributed to, with reference to the foundational
baseline's age and source. Extraction-derived attribution links are
refined through corroboration operations including spatial inference.
The equipment or infrastructure involved is mapped to its combat
function categories via the taxonomy. The event's impact propagates to
each relevant echelon at the echelon's own attribution confidence,
preserving the epistemic state at each level rather than forcing
cross-echelon sums. When the evidence justifies a change in the unit's
capability profile, a new Working Baseline Version is produced with
explicit provenance to the contributing events. The current Working
Baseline Version combined with the evidence base produces an Assessment
object that commanders consume, with capability profiles across combat
function categories, confidence ranges on each, and highlighted
exploitable weaknesses.

This sequence runs continuously as new evidence arrives, as corrections
are applied, as the foundational baseline is refreshed, and as
hypothesis branches are resolved. It is not a batch process with a
defined start and end; it is the steady-state operation of the system.

The output of the fusion and reasoning layer is the input to the
confidence, exception, and case lifecycle management addressed in
Section 6, and ultimately to the decision support surfaces addressed in
Section 7.

6\. Confidence, Exceptions, and Case Lifecycle

Sections 3 through 5 described how source material becomes Damage
Events, how Damage Events accumulate into confidence-weighted evidence,
and how that evidence synthesizes into capability assessments. This
section addresses the operational layer that sits on top of the
reasoning layer: the mechanisms by which analysts know what to work on,
how they work it, and when to stop.

Three operational problems are resolved in this section. How the system
handles confidence thresholds without overreaching into decision
adequacy judgments. How exceptions are structured, surfaced, and
cleared. How cases are opened, worked, and closed while preserving
institutional knowledge across personnel changes and operational tempo
shifts.

6.1 Confidence Transparency Over Decision Adequacy

The system maintains and surfaces the full confidence picture of every
Assessment, but it does not classify Assessments as actionable or
provisional. The threshold judgment — whether a given Assessment is
confident enough to support a specific decision — belongs to the
commander making the decision, not to the system producing the
Assessment.

This architectural restraint is deliberate. A minute difference in
assessment confidence for a routine friendly action carries little
operational weight. The same minute difference in the assessment of a
critical piece of equipment or infrastructure may carry tremendous
operational weight when the operation depends on that equipment's state.
A bridge assessed with analytical uncertainty is a minor matter unless
the operation is to cross the bridge and fight, in which case the
uncertainty is decisive. The system cannot know in advance which
decisions its Assessments will support, and attempting to encode
decision-contextualized thresholds would require the system to hold
information it cannot hold: the commander's risk tolerance, the
strategic context, the available alternatives, the political
constraints. None of that belongs in the BDA system.

What the BDA system owes the commander is speed, completeness, and
honest representation of confidence. Commanders perform their own
threshold judgment against whatever question they are wrestling with,
and the system's responsibility is to make that judgment fast and
well-informed. This framing has two operational consequences.

**Query responsiveness becomes a first-class operational requirement.**
Commanders performing their own threshold judgments cannot wait minutes
for synthesized responses. Assessments must be either precomputed
against the current ontology state or computable on demand within
operationally relevant timeframes. The specific performance targets
belong to implementation, but the architectural commitment to speed
belongs to the methodology.

**The consumption surfaces addressed in Section 7 must expose the full
confidence picture.** The decision support layer cannot flatten
confidence ranges into reassuring summaries. A commander asking about
the capability of a unit defending a specific terrain feature needs to
see the confidence ranges on each relevant capability category with
enough specificity to reason about whether the uncertainty matters for
their decision.

The restraint on commander-facing thresholds does not mean the system
operates without thresholds internally. Two categories of threshold are
operationally necessary, and both are system-internal rather than
commander-facing.

**Extraction and enrichment confidence thresholds** govern when
automated processes accept their own outputs versus route them to
analyst review. A candidate Damage Event produced with high extraction
confidence may be auto-accepted into the ontology. The same candidate
produced at lower confidence is routed to an analyst queue for
validation. These thresholds govern the flow of work between automated
and human pathways.

**Corroboration and contradiction thresholds** govern when the system
flags evidence for analyst attention. Events that overlap strongly in
time, location, and equipment type may cross a threshold for proposed
corroboration linking. Evidence that contradicts a current Working
Baseline Version strongly enough may cross a threshold for exception
flagging. These thresholds determine what lands in analyst queues as
exceptions.

The confidence threshold discussion at the operational layer, then, is
about workflow triggers rather than about the adequacy of Assessments
for commander decisions.

6.2 Exceptions as Uniform Work Surface

The Exception is a first-class Object Type in the ontology. It is the
mechanism by which the system surfaces situations requiring human
analytical attention, and it provides the uniform work surface through
which analysts interact with the system's automated reasoning.

Every Exception carries a category property that takes one of seven
values:

- **Extraction exceptions** arise when candidate Damage Events are
  identified below the auto-acceptance confidence threshold, or when
  entity resolution fails and the event cannot be placed in the ontology
  without human judgment.

- **Contradiction exceptions** arise when new evidence contradicts an
  existing assessment with enough force to warrant review.

- **Corroboration exceptions** arise when multiple events meet the
  threshold for proposed linking but the determination requires analyst
  judgment.

- **Attribution exceptions** arise when an event cannot be attributed to
  any unit at meaningful confidence, or when competing attribution
  candidates require analyst refinement.

- **Spatial corroboration exceptions** arise when a strong non-spatial
  attribution is strongly contradicted by geographic evidence, flagging
  potential unit movement, deception, or misread attribution.

- **Baseline divergence exceptions** arise when a foundational baseline
  refresh produces a state that diverges substantially from the working
  baseline.

- **Staleness exceptions** arise when a case has been open without new
  evidence for long enough that the diminishing-returns threshold may
  have been reached.

Beyond the category property, all Exceptions share a common structure:
the triggering event or object, the timestamp of flagging, the system
rule or threshold that produced the exception, the current disposition,
the assigned analyst where applicable, the resolution rationale when
closed, and links to any Correction Events or ontology changes produced
by the resolution.

The category-as-property pattern, rather than
exception-type-as-distinct-Object-Type, keeps the analyst queue uniform.
An analyst working exceptions sees them in a single work surface,
filters by category when focus is needed, and applies consistent
resolution workflows regardless of type. Type-specific behavior is
governed by business logic that references the category property rather
than by separate schemas. The ontology remains lean and the analyst
ergonomics remain consistent.

Exception resolution is itself an analytical activity that may produce
Correction Events, refined attribution links, accepted corroborations,
updated Working Baseline Versions, or new Assessments. The resolution is
captured as links from the Exception to the objects it produced or
modified, preserving the chain from trigger to outcome.

6.3 The Case as Institutional Knowledge Container

Cases are the mechanism by which analytical reasoning becomes
institutional knowledge. Damage Events capture observed facts.
Assessments capture synthesized judgments. Correction Events capture
learned errors. But the reasoning that connects observations to
judgments — the analyst's investigative trajectory, the hypotheses
considered, the lines of inquiry pursued and abandoned, the intermediate
conclusions reached — exists only as institutional knowledge if it is
structurally captured. The Case Object Type exists to capture it.

The operational imperative behind this design is personnel continuity.
The system operates in conditions where humans rotate or are removed
from the process, sometimes with little warning. An investigative
approach that relies on analyst memory, ad hoc notes, or ephemeral
workspace bindings loses its reasoning content when the analyst leaves.
The Case Object Type prevents that loss by making investigative
reasoning a persistent, structured, auditable component of the ontology.

A Case carries the following properties and linkages.

**Opening context** records what triggered the case — an Exception, a
commander's request for information, a planned operation requiring
focused assessment, a routine review cycle, or an analyst's judgment
that a thread required investigation. The triggering reason is captured
as structured data so that the case's purpose survives the analyst who
opened it.

**Investigative scope** maintains the set of ontology objects the case
is investigating as persistent links rather than ephemeral query
results. The working boundary of the case is explicit and stable across
analyst transitions.

**Working content** captures analyst notes, hypotheses under
investigation, intermediate conclusions, open questions, and lines of
inquiry that have been considered. This is the content that cannot live
on any underlying object because it represents analytical reasoning
rather than facts about specific objects. Without persistent capture,
this content is lost when the analyst rotates.

**State and disposition** records the case's current status, the
assigned analyst, the handoff history across analyst transitions, and
the rationale for state transitions. When a case changes hands, the
reason for the change and contextual notes from the departing analyst
are structurally preserved.

**Resolution record** captures the closure rationale, the ontology
changes that resulted from the case, and the residual uncertainty
accepted at closure. The closure rationale is structured and
audit-ready.

**Provenance chain** records the case's relationships to prior related
cases — parent, child, sibling — supporting the structural expression of
institutional memory across cases that split, merge, or succeed each
other over time.

Linkages from the Case to Exceptions, Damage Events, Source Reports,
Working Baseline Versions, Assessments, Correction Events, and analyst
identities make the case a connective object that binds its working
content to the underlying evidence and products of the investigation.

6.4 Case Lifecycle and Closure

Cases transition through states across their lifecycle: open, under
investigation, pending input, resolved, closed, and reopened. Each
transition is a versioned state change captured on the Case object,
producing a structured audit trail of the case's history over time.

Closure occurs when the value of pursuing the case further is marginal
compared to the continued movement of operations. This is not a
statement that the investigation reached analytical resolution; it is a
statement that the operational cost of further pursuit exceeds the
expected analytical value. The war goes on whether every case has been
adjudicated. Analysts are a finite resource, collection assets are
finite, and every open case draws attention that could be applied to
more valuable work elsewhere.

The closure rationale captured on the Case object accommodates several
valid reasons for closure: analytical resolution reached within
acceptable confidence, residual uncertainty accepted as operationally
tolerable, higher-priority demands reallocated analyst attention, the
operational relevance of the investigated objects expired, or superior
evidence made further investigation unnecessary. These are structured
categories supporting audit and retrospective review of the system's
analytical practice over time.

When new evidence arrives after closure and justifies resumption, the
Case transitions from closed back to open as a state change on the same
persistent Case object. The prior closure record and rationale are
preserved in the state history. The case itself remains a single object
across its lifecycle, preserving the continuity of its working content
and investigative context for whoever resumes the work.

6.5 The Connection to Learning Architecture

The Case Object Type closes the loop on the learning architecture
commitment established in Section 5. Correction Events capture that the
system got something wrong. Cases capture how analysts were reasoning
when the error occurred — what evidence was being weighed, what
hypotheses were under consideration, what lines of inquiry were pursued.
The combination is what lets the organization actually learn from its
errors rather than merely recording them.

A retrospective review of Correction Events in isolation reveals what
errors occurred. A retrospective review of Correction Events linked to
the Cases in which they were produced reveals why those errors occurred.
This second question is the one that drives genuine analytical
improvement — in extraction models, in confidence calibration, in source
reliability assessments, in analytical practice, in training for new
analysts. The system supports that second question structurally through
the Case Object Type.

The output of Section 6 is a set of operational constructs — Exceptions,
Cases, state transitions, closure rationales — that sit on top of the
reasoning layer and make the system operable by human analysts under
real conditions. The consumption of the system's output by commanders,
the final piece of the methodology, is addressed in Section 7.

7\. Decision Support Surfaces

The system's purpose, established in Section 1, is to communicate risk
to commanders making decisions under irreducible uncertainty. The
ontological, ingestion, extraction, reasoning, and operational layers
described in Sections 2 through 6 exist to support that purpose, but
they do not fulfill it. Fulfillment happens at the consumption layer —
the surfaces through which commanders and their staffs interrogate the
ontology to inform their decisions. This section addresses the
principles that govern those surfaces without prescribing specific
interface designs, since the specific applications and dashboards that
serve consumers of BDA output are implementation decisions that depend
on the organization's tools, commander preferences, and operational
context.

Four design commitments govern the consumption layer.

7.1 Confidence Transparency as the Primary Commitment

The consumption layer must not flatten confidence ranges into reassuring
summaries. This is the most consequential design commitment of the
consumption layer and the one most likely to be compromised under
pressure from users who want simpler outputs. It must be held.

A commander asking about the capability of a specific adversary unit
must see the capability profile across combat function categories with
confidence ranges on each category, not a single effectiveness score
that hides the underlying uncertainty. A commander asking about a
critical piece of infrastructure must see the analytical uncertainty if
it exists, not a binary assessment that forces a false certainty. The
system's value to operational decision-making depends on its commitment
to honest representation of what is known and what is uncertain. A
surface that presents false certainty is actively harmful because
commanders calibrate their decisions to the confidence they perceive; if
the displayed confidence is higher than the actual confidence, decisions
get made against uncertainty that is not visible.

This commitment operationalizes as several specific design disciplines.
Confidence ranges are displayed alongside point estimates rather than
replaced by them. Capability profiles are shown across all tracked
combat function categories rather than aggregated into composite scores.
The staleness of the foundational baseline is visible when it matters to
the Assessment being consumed. Competing attribution hypotheses and
competing Working Baseline Version branches are surfaced rather than
hidden in favor of a single prevailing narrative. The consumption
surface is a window into the ontology's honesty, not a filter that
prettifies it.

7.2 Speed as an Architectural Commitment

The confidence transparency principle is only operationally valuable if
commanders can actually query the system fast enough to support their
decision cycles. A commander who cannot get an answer in operationally
relevant timeframes will work from memory, intuition, or stale briefings
— and the system's investment in ontological rigor is wasted.

Speed at the consumption layer depends on architectural decisions made
throughout the system, not on optimization work at the surface layer.
Assessments that are precomputed against the current ontology state are
available instantly; Assessments that are computed on demand depend on
the query performance of the underlying ontology and the efficiency of
the rollup logic. The right mixture of precomputation and on-demand
computation is an implementation decision, but the architectural
commitment that consumption-layer latency is a first-order requirement
belongs to the methodology.

In operational terms, this means the system must be able to answer the
question a commander is working on — what is the current capability
assessment of this unit, what do we know about the state of this
infrastructure, what exceptions are currently open in this area of
operations — within timeframes measured in seconds, not minutes.
Failures to meet this bar result in commanders bypassing the system for
faster but lower-quality information sources, and once that bypass
becomes habit, the system's operational utility collapses.

7.3 Provenance Availability at the Point of Consumption

The provenance principle established in Section 1 becomes operationally
meaningful at the consumption layer. A commander who questions an
Assessment must be able to trace its evidence base immediately and in
full, without requesting a separate analytical product or waiting for a
staff response. The chain from Assessment to Working Baseline Version to
contributing Damage Events to Source Reports must be navigable at the
consumption surface, with each layer revealing the next on demand.

This availability is not a debugging feature; it is the structural basis
for commander trust in the system. Commanders who cannot verify the
reasoning behind an Assessment have no basis for calibrating their
confidence in it. Commanders who can drill from a synthesized judgment
to the specific imagery frame, HUMINT report paragraph, or SIGINT
intercept that supports it gain the ability to apply their own
operational judgment to the evidence — which is precisely the role the
commander plays in a risk communication architecture.

The consumption layer must therefore support navigation at multiple
levels of abstraction. Summary views communicate Assessments and their
confidence profiles. Intermediate views expose the Working Baseline
Versions, their version histories, and the events that produced them.
Detail views surface the individual Damage Events and their source
material. The commander or staff officer moves between these levels as
their questions require, without leaving the consumption surface and
without requesting separate products.

7.4 Consumer-Contextualized Views Without Consumer-Contextualized
Thresholds

The restraint from Section 6 — the system does not classify Assessments
as actionable or provisional because decision adequacy depends on
factors the system cannot know — applies equally to the consumption
layer. The system does not tell commanders what decision their
Assessments are adequate to support.

But the consumption layer can and should support different consumer
contexts in how Assessments are presented. A commander preparing for a
specific operation against a specific target has a different
informational need than a commander conducting a broad situational
review across a theater. A staff officer building a current intelligence
estimate has a different need than an operations planner assessing
alternative courses of action. The consumption layer should support
these different consumer contexts through different query paths,
different aggregation views, and different surfacing of exceptions and
open cases relevant to each context.

Critically, this consumer contextualization is about which information
is surfaced, not which conclusions are drawn. A commander preparing for
a bridge-crossing operation sees assessments relevant to that bridge and
the units defending it, with full confidence transparency on each. The
system does not tell the commander whether the confidence is adequate
for the operation; it surfaces the relevant information in a form that
supports the commander's own threshold judgment.

This distinction matters because it keeps the system in its proper role.
The system is an information fusion and risk communication layer. The
commander is the decision maker. The consumption surface is the
interface between them, and it must respect the boundary between what
the system knows and what the commander decides.

7.5 Integration with Foundry-Native Surfaces

In a Foundry-implemented BDA system, the consumption layer naturally
aligns with Foundry's application development surfaces. Workshop
applications can provide role-tailored views for different commander and
staff contexts. Quiver dashboards can provide precomputed views of
capability profiles, exception queues, and case status at relevant
operational echelons. Object Views provide the deep-drill capability
that supports the provenance navigation principle. AIP-powered
interfaces can provide natural language querying against the ontology
for commanders and staff who prefer conversational interrogation over
dashboard navigation.

The specific mixture of surfaces appropriate for a given organization
depends on operational factors, commander preferences, and existing
tooling patterns. What the methodology commits to is that whichever
surfaces are built, they must embody the four design commitments above:
confidence transparency, speed, provenance availability, and consumer
contextualization without consumer-contextualized thresholds.

7.6 What Consumption Is Not

Three things that the consumption layer is not are worth naming to
complete the methodology.

The consumption layer is not a product generation system. It surfaces
the current state of the ontology and supports interactive querying, but
it does not produce the formal analytical products — assessment reports,
situation briefings, formal intelligence estimates — that downstream
analytical processes generate. Product generation is a distinct workflow
that may draw from the same ontology but follows different authoring and
review patterns.

The consumption layer is not a decision recording system. When
commanders make decisions based on Assessments they consume, those
decisions are recorded in operational command and control systems, not
in the BDA system. The BDA system's responsibility ends at providing the
information; the decision itself and its rationale belong elsewhere.

The consumption layer is not a replacement for analytical briefing.
Commanders continue to receive briefings from intelligence staff, and
those briefings draw from and complement the consumption surfaces. The
system's role is to make briefings better-informed and to support the
commander's independent interrogation of the evidence base between
briefings, not to eliminate the analytical conversation between
commanders and their staffs.

8\. Closing: The Completion of the Methodology

With the consumption layer established, the methodology describes an
end-to-end architecture for a BDA system built on modern data
constructs. Raw source material enters through the ingestion layer and
becomes Damage Events in the ontology. Extraction and enrichment resolve
those events to other ontology objects with appropriate confidence.
Fusion and reasoning synthesize individual events into capability
profiles and Assessments through baseline referencing, attribution
refinement, category-aware rollup, propagation with preservation, and
correction propagation. Exceptions and Cases provide the operational
layer through which analysts work the system and preserve institutional
knowledge. The consumption layer delivers the system's output to
commanders as confidence-transparent, provenance-backed,
speed-responsive risk communication.

The methodology is ontology-driven throughout. Every architectural
decision traces to an Object Type, Link Type, or Action Type
specification that can be implemented directly in Foundry. The paper's
walk-away is a specification that maps to Foundry primitives rather than
a methodology that requires translation into implementation.

Twelve Object Types constitute the complete ontology: Damage Event,
Source Report, Equipment Item, Unit, Geographic Area, Engagement, and
Target in the data layer; Working Baseline Version and Assessment in the
reasoning layer; Correction Event, Exception, and Case in the
operational layer. Together with the Link Types and Action Types
specified across Sections 2, 3, and 6, these Object Types define a
complete structural blueprint for implementation.

What remains beyond this paper is the work of implementation: specifying
the detailed property schemas against the organization's controlled
taxonomies, building the extraction pipelines against the organization's
source streams, configuring the AIP Logic functions against the
organization's language and imagery models, and designing the Workshop
applications and Quiver dashboards that will serve the organization's
commanders and staff. That work is substantial, but it is implementation
work against a conceptual architecture that is complete.

The methodology's fundamental commitment, named in Section 1 and held
throughout, is that BDA is not a truth discovery problem but a
confidence-weighted risk communication problem. If that commitment is
preserved through implementation, the system will serve commanders well.
If it is compromised — if confidence gets flattened, if uncertainty gets
hidden, if provenance gets weakened, if analytical reasoning gets
trapped in individual heads rather than captured structurally — the
system will fail at the moment of greatest operational need, regardless
of how sophisticated its underlying technology is. The architecture
exists to serve the commitment; the commitment does not bend to the
architecture.

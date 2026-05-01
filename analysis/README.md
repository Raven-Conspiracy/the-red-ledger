# analysis/

Out-of-band analytical artifacts and design documents that travel with the
Red Ledger codebase but are **not wired into the running application**.

Nothing in this tree is imported by `client/`, `server/`, or `shared/`.
Adding any of it to the runtime is a separate, reviewed decision.

## Contents

### `bda/`

BDA (Battle Damage Assessment) methodology and integration design.

| File | What it is |
| --- | --- |
| `BDA-Methodology-First-Draft.md` | Source methodology paper. Treat as the upstream specification. |
| `BDA-RedLedger-Integration.md` | Design document mapping the methodology onto Red Ledger + the H3 OOB outputs in `analysis/h3_oob_outputs/`. |
| `bda_schema.ts` | Proposed Drizzle/SQLite schema for the twelve Object Types. Not imported anywhere. |

### `h3_oob_outputs/`

Outputs of the Red Ledger × H3 probabilistic order-of-battle prototype.
Broad-area uncertainty analysis only — see the safety boundary in
`h3_oob_outputs/README.md`.

| File | What it is |
| --- | --- |
| `README.md` | Pipeline description, safety boundary, belief model. |
| `schema_mapping.md` | Field-by-field map from Red Ledger SQLite columns to belief-model inputs. |
| `build_h3_oob.py` | Single-file deterministic generator (offline, no network). |
| `entities.csv` | One row per army/division/brigade. |
| `observations.csv` | Derived evidence rows. |
| `entity_hex_beliefs.csv` | Per (entity, hex) belief — the headline product. |
| `hex_aggregate_belief.csv` | Per-hex collapsed view. |
| `ukraine_h3_oob_map.html` | Folium rendering of the aggregate belief. |
| `manifest.json` | Run metadata. |

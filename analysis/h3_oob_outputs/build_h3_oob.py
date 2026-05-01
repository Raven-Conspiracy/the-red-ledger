"""
Red Ledger -> H3 Probabilistic Order-of-Battle Pipeline
========================================================

Reads the Red Ledger (the-red-ledger-bd5d5be4) repository's SQLite OOB plus
the static UNIT_POSITIONS dictionary embedded in client/src/pages/TacticalMap.tsx,
maps deployment-sector hints from each unit's `notes` field to broad Ukraine AO
centroids, and produces an H3 (resolution 5) probabilistic belief grid:

    P(entity_in_hex) = P(entity_exists) * P(location=hex | exists)

Safety boundary (HARD):
- Output H3 resolution is 5 (~252 km^2 / cell, ~8.5 km edge). Belief is broad-AO
  uncertainty analysis, not targeting. No precise coordinates pass through to the
  belief grid: every observation is fuzzed via a large Gaussian spatial kernel
  (>= 30 km sigma) before being projected onto the hex grid.
- No live tactical recommendations, no automated targeting, no kinetic
  decisioning. Outputs label entropy and confidence so consumers see
  uncertainty.
- Source data (deployment hints in `notes`, reliability tiers from intel feed)
  is open-source / OSINT level. We do NOT enrich with any external geocoding
  service.

Reproducible: deterministic seed, no network access.
"""

from __future__ import annotations

import csv
import json
import math
import os
import random
import re
import sqlite3
import sys
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import h3

REPO = Path("/home/user/workspace/the-red-ledger-bd5d5be4")
OUT = Path("/home/user/workspace/ukraine_h3_oob_outputs_redledger")
OUT.mkdir(parents=True, exist_ok=True)

H3_RES = 5  # ~252 km^2 cells; deliberately broad
RANDOM_SEED = 20260501
random.seed(RANDOM_SEED)

# Reference "now" — taken from the Red Ledger CLAUDE.md note (2026-05-01)
NOW = datetime(2026, 5, 1, tzinfo=timezone.utc)
RECENCY_HALF_LIFE_DAYS = 60.0  # exponential half-life on observation age


# ─────────────────────────────────────────────────────────────────────────────
# Sector dictionary
# ─────────────────────────────────────────────────────────────────────────────
# Broad AO centroids covering the Ukraine theatre and adjacent Russian rear.
# Coordinates are public-record city/sector centroids, intentionally rounded
# to ~0.01 degree (~1 km) and then fuzzed via the Gaussian kernel before being
# projected onto H3. We do NOT use these as "unit locations".
SECTOR_CENTROIDS: dict[str, tuple[float, float, float]] = {
    # name : (lat, lon, sigma_km) — sigma sets spatial uncertainty
    "kharkiv":          (49.99, 36.23, 45.0),
    "north kharkiv":    (50.40, 36.50, 45.0),
    "kupyansk":         (49.71, 37.62, 35.0),
    "lyman":            (48.98, 37.81, 35.0),
    "kreminna":         (49.05, 38.21, 35.0),
    "siversk":          (48.89, 38.11, 35.0),
    "donetsk":          (48.02, 37.80, 40.0),
    "donetsk central":  (48.05, 37.85, 40.0),
    "central donetsk":  (48.10, 37.75, 40.0),
    "south donetsk":    (47.70, 37.20, 50.0),
    "vuhledar":         (47.78, 37.26, 35.0),
    "velyka novosilka": (47.85, 36.87, 40.0),
    "zaporozhye":       (47.40, 35.70, 55.0),
    "zaporozhye axis":  (47.40, 35.70, 55.0),
    "kherson":          (46.64, 32.62, 50.0),
    "dnieper":          (46.90, 33.50, 60.0),
    "kherson / dnieper axis": (46.80, 33.10, 55.0),
    "sumy":             (50.91, 34.80, 55.0),
    "sumy oblast":      (50.91, 34.80, 55.0),
    "luhansk":          (48.57, 39.31, 45.0),
    "donbas":           (48.30, 38.30, 75.0),
    # Russian rear / depth (lower weight since reflects garrison, not AO):
    "rostov":           (47.22, 39.69, 60.0),
    "voronezh":         (51.67, 39.18, 80.0),
    "belgorod":         (50.60, 36.59, 60.0),
    "kursk":            (51.73, 36.19, 70.0),
    # Out-of-theatre / non-AO (used only with very low weight — Baltic, Arctic,
    # Far East). Kept to demonstrate that the kernel correctly down-weights
    # garrison locations far from the Ukraine AO.
    "kaliningrad":      (54.71, 20.51, 50.0),
    "arctic":           (68.97, 33.08, 100.0),
    "baltic":           (55.50, 25.00, 100.0),
    "pacific":          (46.96, 142.74, 200.0),
    "sakhalin":         (46.96, 142.74, 200.0),
    "black sea fleet":  (44.62, 33.52, 60.0),
}

# Aliases that may appear in notes
SECTOR_ALIASES = {
    "n kharkiv":        "north kharkiv",
    "kreminna":         "kreminna",
    "kapitalna":        None,  # ignore
    "deployed lyman sector": "lyman",
    "siversk sector":   "siversk",
    "kupyansk sector":  "kupyansk",
    "donetsk main effort": "donetsk",
    "donetsk; incl. chechen elements": "donetsk",
    "south donetsk / velyka novosilka": "south donetsk",
    "south donetsk / zaporozhye": "south donetsk",
    "vuhledar / zaporozhye": "vuhledar",
    "vuhledar axis":    "vuhledar",
    "lyman / kreminna sector": "lyman",
    "zaporozhye axis":  "zaporozhye",
    "kherson / dnieper axis": "kherson / dnieper axis",
    "sumy / kherson":   "sumy",
    "baltic / kaliningrad": "kaliningrad",
    "baltic defense posture": "baltic",
    "arctic / northern fleet": "arctic",
    "arctic trained":   "arctic",
    "sakhalin / pacific defense": "sakhalin",
    "newly raised 2024": None,
    "newly formed 2022; n kharkiv": "north kharkiv",
}


def parse_sectors_from_notes(notes: str | None) -> list[tuple[str, float]]:
    """Extract sector hints from the free-text `notes` field.

    Returns a list of (sector_key, specificity) where specificity in [0,1]
    rewards more specific sector mentions over broad ones.
    """
    if not notes:
        return []
    text = notes.lower()
    hits: list[tuple[str, float]] = []

    # Exact alias match first
    for alias, target in SECTOR_ALIASES.items():
        if target and alias in text:
            base_sigma = SECTOR_CENTROIDS[target][2]
            specificity = max(0.2, 1.0 - base_sigma / 100.0)
            hits.append((target, specificity))

    # Fall back to centroid-key substring scan
    for key in SECTOR_CENTROIDS:
        if key in text:
            base_sigma = SECTOR_CENTROIDS[key][2]
            specificity = max(0.2, 1.0 - base_sigma / 100.0)
            hits.append((key, specificity))

    # Dedup keeping highest specificity per sector
    best: dict[str, float] = {}
    for sec, spec in hits:
        if sec not in best or spec > best[sec]:
            best[sec] = spec
    return sorted(best.items(), key=lambda kv: -kv[1])


# ─────────────────────────────────────────────────────────────────────────────
# UNIT_POSITIONS extraction (peacetime garrison HQs only)
# ─────────────────────────────────────────────────────────────────────────────
def load_unit_positions() -> dict[str, tuple[float, float, str]]:
    src = (REPO / "client/src/pages/TacticalMap.tsx").read_text()
    # Capture the UNIT_POSITIONS object literal
    m = re.search(
        r"UNIT_POSITIONS\s*:\s*Record<[^>]+>\s*=\s*\{(.*?)\n\};",
        src,
        flags=re.DOTALL,
    )
    if not m:
        return {}
    body = m.group(1)
    out: dict[str, tuple[float, float, str]] = {}
    row_re = re.compile(
        r"'([\w-]+)'\s*:\s*\{\s*lat:\s*(-?[\d.]+)\s*,\s*lng:\s*(-?[\d.]+)\s*,\s*label:\s*'([^']+)'"
    )
    for rid, lat, lng, label in row_re.findall(body):
        out[rid] = (float(lat), float(lng), label)
    return out


# ─────────────────────────────────────────────────────────────────────────────
# OOB load from SQLite
# ─────────────────────────────────────────────────────────────────────────────
@dataclass
class Entity:
    id: str
    kind: str         # 'army' | 'division' | 'brigade'
    name: str
    parent_id: str | None
    parent_kind: str | None
    district_id: str | None
    type: str
    strength_pct: float
    hq: str | None
    notes: str | None
    is_guards: bool = False


def load_entities() -> list[Entity]:
    db = REPO / "sqlite.db"
    conn = sqlite3.connect(str(db))
    conn.row_factory = sqlite3.Row
    out: list[Entity] = []

    for r in conn.execute("SELECT * FROM armies").fetchall():
        out.append(Entity(
            id=r["id"], kind="army", name=r["name"],
            parent_id=r["district_id"], parent_kind="district",
            district_id=r["district_id"], type=r["type"],
            strength_pct=float(r["strength_pct"]), hq=r["hq"], notes=r["notes"],
        ))

    army_to_district = {r["id"]: r["district_id"] for r in conn.execute("SELECT id, district_id FROM armies").fetchall()}

    for r in conn.execute("SELECT * FROM divisions").fetchall():
        out.append(Entity(
            id=r["id"], kind="division", name=r["name"],
            parent_id=r["army_id"], parent_kind="army",
            district_id=army_to_district.get(r["army_id"]),
            type=r["type"],
            strength_pct=float(r["strength_pct"]),
            hq=r["hq"], notes=r["notes"],
        ))

    div_to_army = {r["id"]: r["army_id"] for r in conn.execute("SELECT id, army_id FROM divisions").fetchall()}

    for r in conn.execute("SELECT * FROM brigades").fetchall():
        parent_id = r["parent_id"]
        parent_kind = r["parent_type"]
        if parent_kind == "division":
            ancestor_army = div_to_army.get(parent_id)
            district = army_to_district.get(ancestor_army) if ancestor_army else None
        else:
            district = army_to_district.get(parent_id)
        out.append(Entity(
            id=r["id"], kind="brigade", name=r["name"],
            parent_id=parent_id, parent_kind=parent_kind,
            district_id=district, type=r["type"],
            strength_pct=float(r["strength_pct"]),
            hq=None, notes=r["notes"],
            is_guards=bool(r["is_guards"]),
        ))
    conn.close()
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Observations
# ─────────────────────────────────────────────────────────────────────────────
@dataclass
class Observation:
    obs_id: str
    entity_id: str
    sector_key: str
    lat: float
    lon: float
    sigma_km: float
    source: str          # 'notes-deployment' | 'garrison-hq' | 'parent-inheritance'
    reliability: float   # 0..1
    specificity: float   # 0..1 — how narrow the geo hint
    observed_at: str     # ISO date
    note: str = ""


# Rough date assumption: the Red Ledger seed is dated to current war state
# (2026-05-01). We treat sector hints as "current as of NOW" for this prototype,
# but knock specificity if the note hints at older formations.
DEFAULT_OBS_DATE = NOW.strftime("%Y-%m-%d")


def make_observations(
    entities: list[Entity],
    unit_positions: dict[str, tuple[float, float, str]],
) -> list[Observation]:
    obs: list[Observation] = []
    by_id = {e.id: e for e in entities}

    # 1) Deployment sector hints from notes (highest weight)
    for e in entities:
        sectors = parse_sectors_from_notes(e.notes)
        for sec_key, specificity in sectors:
            lat, lon, sigma = SECTOR_CENTROIDS[sec_key]
            obs.append(Observation(
                obs_id=f"deploy:{e.id}:{sec_key}",
                entity_id=e.id, sector_key=sec_key, lat=lat, lon=lon,
                sigma_km=sigma,
                source="notes-deployment",
                reliability=0.80,  # MED-HIGH — open-source seed cites ISW/OSINT
                specificity=specificity,
                observed_at=DEFAULT_OBS_DATE,
                note=f"sector parsed from notes='{(e.notes or '')[:80]}'",
            ))

    # 2) Garrison-HQ inheritance from UNIT_POSITIONS for armies (low weight, large sigma)
    for e in entities:
        if e.kind == "army" and e.id in unit_positions:
            lat, lng, label = unit_positions[e.id]
            obs.append(Observation(
                obs_id=f"hq:{e.id}",
                entity_id=e.id, sector_key="garrison-hq",
                lat=lat, lon=lng,
                sigma_km=120.0,  # peacetime garrison; not an AO claim
                source="garrison-hq",
                reliability=0.55,  # MED — garrisons are public but not tactical
                specificity=0.25,
                observed_at=DEFAULT_OBS_DATE,
                note=f"static garrison label={label}",
            ))

    # 3) Parent-inheritance: subordinate units (divisions / brigades without
    #    their own sector hits) inherit their parent's deployment hints, with
    #    diluted reliability and specificity.
    parent_obs_index: dict[str, list[Observation]] = defaultdict(list)
    for o in obs:
        if o.source == "notes-deployment":
            parent_obs_index[o.entity_id].append(o)

    for e in entities:
        if e.kind == "army":
            continue
        # Did this entity already receive direct sector observations?
        own = [o for o in obs if o.entity_id == e.id and o.source == "notes-deployment"]
        if own:
            continue
        # Resolve up to army
        ancestor_id = e.parent_id
        if e.parent_kind == "division":
            anc = by_id.get(ancestor_id)
            ancestor_id = anc.parent_id if anc else None
        anc_obs = parent_obs_index.get(ancestor_id, []) if ancestor_id else []
        for po in anc_obs:
            obs.append(Observation(
                obs_id=f"inherit:{e.id}:{po.sector_key}",
                entity_id=e.id, sector_key=po.sector_key,
                lat=po.lat, lon=po.lon,
                sigma_km=po.sigma_km * 1.5,  # widen uncertainty
                source="parent-inheritance",
                reliability=po.reliability * 0.65,
                specificity=po.specificity * 0.60,
                observed_at=po.observed_at,
                note=f"inherited from parent {ancestor_id}",
            ))

    return obs


# ─────────────────────────────────────────────────────────────────────────────
# H3 belief construction
# ─────────────────────────────────────────────────────────────────────────────
# Ukraine-AO bounding box for hex enumeration. Broad on purpose.
UKR_AO_BBOX = {"south": 44.0, "north": 53.0, "west": 22.0, "east": 42.5}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def enumerate_ao_hexes(res: int) -> list[str]:
    """Polyfill the Ukraine AO bbox at the given H3 resolution."""
    s, n, w, e = UKR_AO_BBOX["south"], UKR_AO_BBOX["north"], UKR_AO_BBOX["west"], UKR_AO_BBOX["east"]
    polygon = h3.LatLngPoly([(s, w), (s, e), (n, e), (n, w)])
    cells = h3.h3shape_to_cells(polygon, res)
    return list(cells)


def recency_decay(observed_at: str) -> float:
    try:
        d = datetime.fromisoformat(observed_at).replace(tzinfo=timezone.utc)
    except Exception:
        return 1.0
    age_days = max(0.0, (NOW - d).total_seconds() / 86400.0)
    return 0.5 ** (age_days / RECENCY_HALF_LIFE_DAYS)


def gaussian_weight(distance_km: float, sigma_km: float) -> float:
    if sigma_km <= 0:
        return 0.0
    return math.exp(-0.5 * (distance_km / sigma_km) ** 2)


def project_observations_to_hexes(
    entities: list[Entity],
    obs: list[Observation],
    hex_cells: list[str],
) -> list[dict]:
    """Compute per-(entity, hex) belief rows."""
    # Pre-cache hex centroids
    hex_centroids = {h: h3.cell_to_latlng(h) for h in hex_cells}

    obs_by_entity: dict[str, list[Observation]] = defaultdict(list)
    for o in obs:
        obs_by_entity[o.entity_id].append(o)

    rows: list[dict] = []
    for e in entities:
        ent_obs = obs_by_entity.get(e.id, [])
        if not ent_obs:
            continue

        # Existence prior comes from strength_pct (treat 100% strength as
        # essentially certain to exist in some hex; 0% as very uncertain).
        existence_prior = max(0.05, min(0.99, e.strength_pct / 100.0))

        # Compute unnormalized weights per hex
        per_hex_weight: dict[str, float] = defaultdict(float)
        per_hex_evidence_count: dict[str, int] = defaultdict(int)
        per_hex_sources: dict[str, set] = defaultdict(set)
        latest_obs: dict[str, str] = {}

        for o in ent_obs:
            decay = recency_decay(o.observed_at)
            base = o.reliability * o.specificity * decay
            if base <= 0:
                continue
            for hx in hex_cells:
                lat, lon = hex_centroids[hx]
                d = haversine_km(lat, lon, o.lat, o.lon)
                # Cap the kernel: skip far-tail negligible weight to keep matrix sparse
                if d > 4.0 * o.sigma_km:
                    continue
                w = base * gaussian_weight(d, o.sigma_km)
                if w < 1e-6:
                    continue
                per_hex_weight[hx] += w
                per_hex_evidence_count[hx] += 1
                per_hex_sources[hx].add(o.source)
                prev = latest_obs.get(hx)
                if prev is None or o.observed_at > prev:
                    latest_obs[hx] = o.observed_at

        if not per_hex_weight:
            continue

        # Normalize across hexes -> P(loc=hex | exists)
        total = sum(per_hex_weight.values())
        if total <= 0:
            continue

        # Entropy of the location distribution (bits)
        probs = [w / total for w in per_hex_weight.values()]
        entropy_bits = -sum(p * math.log2(p) for p in probs if p > 0)

        for hx, w in per_hex_weight.items():
            p_loc = w / total
            p_entity_in_hex = existence_prior * p_loc
            n_evidence = per_hex_evidence_count[hx]
            n_source_kinds = len(per_hex_sources[hx])

            # Confidence band: 95% CI half-width on a Beta-style estimate.
            # Treat 'effective trials' = 1 + scaled evidence count.
            # Wider when evidence is thin.
            n_eff = 1.0 + 1.5 * n_evidence + 1.0 * (n_source_kinds - 1)
            ci_half = 1.96 * math.sqrt(max(p_loc * (1 - p_loc), 1e-6) / n_eff)
            ci_low = max(0.0, p_loc - ci_half) * existence_prior
            ci_high = min(1.0, p_loc + ci_half) * existence_prior

            lat, lon = hex_centroids[hx]
            rows.append({
                "entity_id": e.id,
                "entity_kind": e.kind,
                "entity_name": e.name,
                "h3_index": hx,
                "h3_resolution": H3_RES,
                "hex_lat": round(lat, 4),
                "hex_lon": round(lon, 4),
                "p_entity_in_hex": round(p_entity_in_hex, 6),
                "p_location_given_exists": round(p_loc, 6),
                "existence_prior": round(existence_prior, 4),
                "ci95_low": round(ci_low, 6),
                "ci95_high": round(ci_high, 6),
                "evidence_count": n_evidence,
                "source_kinds": n_source_kinds,
                "entity_loc_entropy_bits": round(entropy_bits, 4),
                "latest_observation_at": latest_obs.get(hx, ""),
            })
    return rows


# ─────────────────────────────────────────────────────────────────────────────
# Output
# ─────────────────────────────────────────────────────────────────────────────
def write_csv(path: Path, rows: Iterable[dict], fieldnames: list[str]) -> int:
    rows = list(rows)
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    return len(rows)


def write_html_map(belief_rows: list[dict], out_path: Path) -> None:
    """Render a folium choropleth-style map of aggregated hex beliefs.

    To remain non-actionable, we aggregate ALL entities into a single
    'expected entity count per hex' density layer rather than per-unit overlays.
    """
    try:
        import folium
        from folium import Polygon as FoliumPoly
    except Exception:
        print("[map] folium unavailable, skipping HTML map", file=sys.stderr)
        return

    # Aggregate
    agg: dict[str, dict] = {}
    for r in belief_rows:
        a = agg.setdefault(r["h3_index"], {
            "exp_count": 0.0,
            "max_p": 0.0,
            "n_units": 0,
            "lat": r["hex_lat"], "lon": r["hex_lon"],
        })
        a["exp_count"] += r["p_entity_in_hex"]
        a["max_p"] = max(a["max_p"], r["p_entity_in_hex"])
        a["n_units"] += 1

    if not agg:
        print("[map] no rows to render", file=sys.stderr)
        return

    max_exp = max(v["exp_count"] for v in agg.values())
    fmap = folium.Map(location=[48.5, 35.0], zoom_start=6, tiles="cartodbpositron")

    folium.map.Marker(
        [52.0, 23.0],
        icon=folium.DivIcon(html=(
            "<div style='background:rgba(255,255,255,0.9);"
            "padding:6px 10px;border:1px solid #888;font:12px sans-serif;'>"
            f"<b>Red Ledger × H3 OOB belief</b><br>"
            f"H3 res {H3_RES} (~252 km²/cell) — broad-AO uncertainty.<br>"
            f"<i>Demonstration only. Aggregated expected unit count per hex.</i>"
            "</div>"
        )),
    ).add_to(fmap)

    for hx, v in agg.items():
        boundary = h3.cell_to_boundary(hx)  # list of (lat,lon)
        intensity = v["exp_count"] / max_exp if max_exp > 0 else 0.0
        # Red colormap, capped
        red = 220
        green = int(220 * (1 - intensity))
        blue = int(220 * (1 - intensity))
        color = f"#{red:02x}{green:02x}{blue:02x}"
        FoliumPoly(
            locations=[[lat, lon] for lat, lon in boundary],
            color="#444", weight=0.5, fill=True, fill_color=color,
            fill_opacity=0.55,
            popup=folium.Popup((
                f"<b>H3 {hx}</b><br>"
                f"Σ P(unit_in_hex) ≈ {v['exp_count']:.3f}<br>"
                f"max P over units = {v['max_p']:.3f}<br>"
                f"distinct units contributing = {v['n_units']}<br>"
                f"<i>broad-AO belief; not actionable</i>"
            ), max_width=320),
        ).add_to(fmap)

    fmap.save(str(out_path))


def main() -> None:
    print("[1/6] Loading entities from sqlite.db ...")
    entities = load_entities()
    print(f"      {len(entities)} entities ({sum(e.kind=='army' for e in entities)} armies, "
          f"{sum(e.kind=='division' for e in entities)} divisions, "
          f"{sum(e.kind=='brigade' for e in entities)} brigades)")

    print("[2/6] Parsing UNIT_POSITIONS from TacticalMap.tsx ...")
    unit_positions = load_unit_positions()
    print(f"      {len(unit_positions)} HQ positions")

    print("[3/6] Building observations from deployment notes + HQs ...")
    observations = make_observations(entities, unit_positions)
    print(f"      {len(observations)} observations "
          f"({sum(o.source=='notes-deployment' for o in observations)} sector, "
          f"{sum(o.source=='garrison-hq' for o in observations)} garrison, "
          f"{sum(o.source=='parent-inheritance' for o in observations)} inherited)")

    print(f"[4/6] Enumerating Ukraine AO H3 cells at resolution {H3_RES} ...")
    hex_cells = enumerate_ao_hexes(H3_RES)
    print(f"      {len(hex_cells)} hex cells across the AO bbox")

    print("[5/6] Projecting observations -> entity_hex_beliefs ...")
    rows = project_observations_to_hexes(entities, observations, hex_cells)
    print(f"      {len(rows)} (entity, hex) belief rows")

    # Write outputs
    print("[6/6] Writing CSVs and HTML map ...")
    n_ent = write_csv(
        OUT / "entities.csv",
        [asdict(e) for e in entities],
        ["id", "kind", "name", "parent_id", "parent_kind", "district_id",
         "type", "strength_pct", "hq", "notes", "is_guards"],
    )
    n_obs = write_csv(
        OUT / "observations.csv",
        [asdict(o) for o in observations],
        ["obs_id", "entity_id", "sector_key", "lat", "lon", "sigma_km",
         "source", "reliability", "specificity", "observed_at", "note"],
    )
    belief_fields = ["entity_id", "entity_kind", "entity_name",
                     "h3_index", "h3_resolution", "hex_lat", "hex_lon",
                     "p_entity_in_hex", "p_location_given_exists",
                     "existence_prior", "ci95_low", "ci95_high",
                     "evidence_count", "source_kinds",
                     "entity_loc_entropy_bits", "latest_observation_at"]
    n_belief = write_csv(OUT / "entity_hex_beliefs.csv", rows, belief_fields)

    # Summary aggregation (all entities collapsed) for quick consumption
    agg_rows: dict[str, dict] = {}
    for r in rows:
        a = agg_rows.setdefault(r["h3_index"], {
            "h3_index": r["h3_index"], "h3_resolution": H3_RES,
            "hex_lat": r["hex_lat"], "hex_lon": r["hex_lon"],
            "expected_unit_count": 0.0, "max_p_any_unit": 0.0,
            "contributing_units": 0,
        })
        a["expected_unit_count"] += r["p_entity_in_hex"]
        a["max_p_any_unit"] = max(a["max_p_any_unit"], r["p_entity_in_hex"])
        a["contributing_units"] += 1
    for a in agg_rows.values():
        a["expected_unit_count"] = round(a["expected_unit_count"], 6)
        a["max_p_any_unit"] = round(a["max_p_any_unit"], 6)
    n_agg = write_csv(
        OUT / "hex_aggregate_belief.csv",
        agg_rows.values(),
        ["h3_index", "h3_resolution", "hex_lat", "hex_lon",
         "expected_unit_count", "max_p_any_unit", "contributing_units"],
    )

    write_html_map(rows, OUT / "ukraine_h3_oob_map.html")

    # Manifest
    manifest = {
        "generated_at": NOW.isoformat(),
        "h3_resolution": H3_RES,
        "ao_bbox": UKR_AO_BBOX,
        "recency_half_life_days": RECENCY_HALF_LIFE_DAYS,
        "random_seed": RANDOM_SEED,
        "counts": {
            "entities": n_ent, "observations": n_obs,
            "entity_hex_beliefs": n_belief, "hex_aggregate_belief": n_agg,
            "ao_hexes_total": len(hex_cells),
        },
        "safety": {
            "h3_resolution_rationale": "res 5 (~252 km^2 / cell) — broad-AO scale, not targeting-grade",
            "min_sigma_km": min(s for _, _, s in SECTOR_CENTROIDS.values()),
            "no_external_geocoding": True,
            "no_targeting": True,
        },
        "source_repo_files": [
            "shared/schema.ts",
            "server/seed.ts",
            "sqlite.db (military_districts, armies, divisions, brigades, unit_equipment)",
            "client/src/pages/TacticalMap.tsx (UNIT_POSITIONS dict)",
            "client/src/data/intel-feed.ts (reliability tier reference)",
        ],
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print("Wrote:")
    for f in sorted(OUT.iterdir()):
        if f.is_file():
            print(f"  - {f.name}  ({f.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

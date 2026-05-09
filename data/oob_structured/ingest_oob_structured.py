"""
Ingest CN / IR / DPRK structured OOB JSON files (built from Red Ledger schema)
into the Inquisitor corpus.

Inputs (must exist before running):
  /home/user/workspace/inquisitor_research/oob_structured/china_oob.json
  /home/user/workspace/inquisitor_research/oob_structured/iran_oob.json
  /home/user/workspace/inquisitor_research/oob_structured/dprk_oob.json

Outputs (one chunk per unit, tier-tagged):
  /home/user/workspace/inquisitor_corpus/extracted/oob_china_structured/<slug>.txt
  /home/user/workspace/inquisitor_corpus/extracted/oob_iran_structured/<slug>.txt
  /home/user/workspace/inquisitor_corpus/extracted/oob_dprk_structured/<slug>.txt

Plus copy of source JSONs into raw/:
  /home/user/workspace/inquisitor_corpus/raw/oob_<country>_structured/<country>_oob.json

Tag pattern:
  [OOB-CN|IR|DPRK] [STRUCTURED] [LEVEL:THEATER|GA|DIV|BDE] [SOURCE: ... ]

Mirrors ingest_red_ledger.py — same one-chunk-per-unit pattern so retrieval works
identically across all four country OOBs (RU + CN + IR + DPRK).
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path("/home/user/workspace/inquisitor_research/oob_structured")
RAW_BASE = Path("/home/user/workspace/inquisitor_corpus/raw")
EXT_BASE = Path("/home/user/workspace/inquisitor_corpus/extracted")

# Country-specific config: file, country code for tags, tier labels (1=top, 2=second...)
COUNTRIES = {
    "china": {
        "json": ROOT / "china_oob.json",
        "code": "CN",
        "label": "Chinese PLA",
        "tier_labels": {
            "top_tier":     ("Theater Command",                   "THEATER"),
            "second_tier":  ("Group Army / Fleet / Base",          "GA"),
            "third_tier":   ("Brigade / Division / Flotilla",      "BDE"),
            "fourth_tier":  ("Regiment / Sub-unit",                "REGT"),
        },
        "raw_dir": RAW_BASE / "oob_china_structured",
        "ext_dir": EXT_BASE / "oob_china_structured",
        "default_source": "[SOURCE: Inquisitor curated PLA OOB v2026-05-09 | DOD CMPR 2024, Project 2049 PLARF, CSIS ChinaPower, ASPI, USCC Annual Reports]",
    },
    "iran": {
        "json": ROOT / "iran_oob.json",
        "code": "IR",
        "label": "Iranian Armed Forces",
        "tier_labels": {
            "top_tier":     ("Service Branch",                    "SVC"),
            "second_tier":  ("Region / Provincial Corps / Base",   "REGION"),
            "third_tier":   ("Division / Brigade / Squadron",      "BDE"),
            "fourth_tier":  ("Regiment / Sub-unit",                "REGT"),
        },
        "raw_dir": RAW_BASE / "oob_iran_structured",
        "ext_dir": EXT_BASE / "oob_iran_structured",
        "default_source": "[SOURCE: Inquisitor curated Iran OOB v2026-05-09 | DIA IMP 2019, WINEP, CTP, NTI, Iran Primer, IISS]",
    },
    "dprk": {
        "json": ROOT / "dprk_oob.json",
        "code": "DPRK",
        "label": "Korean People's Army",
        "tier_labels": {
            "top_tier":     ("General Staff Directorate",          "GSD"),
            "second_tier":  ("Corps / Fleet / Air Division / Missile Bureau", "CORPS"),
            "third_tier":   ("Division / Brigade / Flotilla",      "BDE"),
            "fourth_tier":  ("Regiment / Sub-unit",                "REGT"),
        },
        "raw_dir": RAW_BASE / "oob_dprk_structured",
        "ext_dir": EXT_BASE / "oob_dprk_structured",
        "default_source": "[SOURCE: Inquisitor curated KPA OOB v2026-05-09 | DIA NKMP 2021, 38 North, CSIS Beyond Parallel, ROK Defense White Paper, NTI]",
    },
}


def slugify(s: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "_", s).strip("_").lower()
    return s[:120] or "unit"


def fmt_field(val, default="—"):
    if val is None or val == "":
        return default
    return str(val)


def emit_chunk(out_dir: Path, prefix: str, unit_id: str, body: list, tag_line: str):
    body.append("")
    body.append(tag_line)
    text = "\n".join(body)
    path = out_dir / f"{prefix}_{slugify(unit_id)}.txt"
    path.write_text(text, encoding="utf-8")
    return 1


def ingest_country(country_key: str) -> int:
    cfg = COUNTRIES[country_key]
    src = cfg["json"]
    if not src.exists():
        print(f"[SKIP] {country_key}: {src} does not exist yet")
        return 0

    cfg["raw_dir"].mkdir(parents=True, exist_ok=True)
    cfg["ext_dir"].mkdir(parents=True, exist_ok=True)

    data = json.loads(src.read_text(encoding="utf-8"))
    tables = data.get("tables", {})
    code = cfg["code"]
    label = cfg["label"]

    top_tier    = tables.get("top_tier", []) or []
    second_tier = tables.get("second_tier", []) or []
    third_tier  = tables.get("third_tier", []) or []
    fourth_tier = tables.get("fourth_tier", []) or []
    equipment   = tables.get("unit_equipment", []) or []

    # Index lookups
    top_by_id    = {x["id"]: x for x in top_tier}
    second_by_id = {x["id"]: x for x in second_tier}
    third_by_id  = {x["id"]: x for x in third_tier}

    # Equipment per unit
    eq_by_unit = {}
    for e in equipment:
        eq_by_unit.setdefault(e.get("unit_id", "?"), []).append(e)

    chunks = 0
    cite = cfg["default_source"]

    # --- top_tier chunks ---
    top_label, top_tag = cfg["tier_labels"]["top_tier"]
    for x in top_tier:
        sub_seconds = [s for s in second_tier if s.get("parent_id") == x["id"]]
        body = [
            f"# {label} — {top_label}: {fmt_field(x.get('name'))}",
            "",
            f"**ID**: {fmt_field(x.get('id')).upper()}",
            f"**Headquarters**: {fmt_field(x.get('hq'))}",
            f"**Commander (current)**: {fmt_field(x.get('commander'))}",
            f"**Map color code**: {fmt_field(x.get('color'))}",
            f"**Notes**: {fmt_field(x.get('notes'))}",
            "",
        ]
        if sub_seconds:
            sec_label, _ = cfg["tier_labels"]["second_tier"]
            body.append(f"## Subordinate {sec_label}s")
            for s in sub_seconds:
                svc = f" [{s.get('service')}]" if s.get("service") else ""
                body.append(f"- **{s.get('name','?')}**{svc} ({s.get('id','?')}) — type: {fmt_field(s.get('type'))}, HQ: {fmt_field(s.get('hq'))}, strength: {fmt_field(s.get('strength_pct'),'?')}%. {fmt_field(s.get('notes'),'')}")
            body.append("")
        tag = f"**Tags**: [OOB-{code}] [STRUCTURED] [LEVEL:{top_tag}] {cite}"
        chunks += emit_chunk(cfg["ext_dir"], "top", x["id"], body, tag)

    # --- second_tier chunks ---
    sec_label, sec_tag = cfg["tier_labels"]["second_tier"]
    for s in second_tier:
        parent = top_by_id.get(s.get("parent_id", ""), {})
        sub_thirds = [t for t in third_tier if t.get("parent_id") == s["id"]]
        eq = eq_by_unit.get(s["id"], [])
        body = [
            f"# {label} — {sec_label}: {fmt_field(s.get('name'))}",
            "",
            f"**Unit ID**: {fmt_field(s.get('id'))}",
            f"**Service**: {fmt_field(s.get('service'))}",
            f"**Type**: {fmt_field(s.get('type'))}",
            f"**Headquarters**: {fmt_field(s.get('hq'))}",
            f"**Parent**: {parent.get('name','?')} ({s.get('parent_id','?')})",
            f"**Strength (% authorized)**: {fmt_field(s.get('strength_pct'),'?')}%",
            f"**Notes**: {fmt_field(s.get('notes'),'')}",
            "",
        ]
        if sub_thirds:
            third_label, _ = cfg["tier_labels"]["third_tier"]
            body.append(f"## Subordinate {third_label}s")
            for t in sub_thirds:
                elite = " (elite)" if t.get("is_elite") else ""
                body.append(f"- **{t.get('name','?')}**{elite} ({t.get('id','?')}) — type: {fmt_field(t.get('type'))}, HQ: {fmt_field(t.get('hq'))}, strength: {fmt_field(t.get('strength_pct'),'?')}%. {fmt_field(t.get('notes'),'')}")
            body.append("")
        if eq:
            body.append("## Authorized Equipment (estimated)")
            for e in eq:
                body.append(f"- **{e.get('equipment_type','?')}** — {fmt_field(e.get('equipment_model'),'model unspecified')} — authorized: {fmt_field(e.get('authorized_count'),'?')}, estimated lost: {fmt_field(e.get('estimated_lost'),0)}")
            body.append("")
        tag = f"**Tags**: [OOB-{code}] [STRUCTURED] [LEVEL:{sec_tag}] {cite}"
        chunks += emit_chunk(cfg["ext_dir"], "sec", s["id"], body, tag)

    # --- third_tier chunks ---
    third_label, third_tag = cfg["tier_labels"]["third_tier"]
    for t in third_tier:
        # Determine parent (could be second_tier or top_tier directly)
        ptype = t.get("parent_type", "second_tier")
        pid = t.get("parent_id", "")
        if ptype == "top_tier":
            parent = top_by_id.get(pid, {})
            parent_label = f"{cfg['tier_labels']['top_tier'][0]}: {parent.get('name','?')} ({pid})"
            grandparent_name = "—"
        else:
            parent = second_by_id.get(pid, {})
            parent_label = f"{cfg['tier_labels']['second_tier'][0]}: {parent.get('name','?')} ({pid})"
            grandparent = top_by_id.get(parent.get("parent_id", ""), {})
            grandparent_name = grandparent.get("name", "?")
        eq = eq_by_unit.get(t["id"], [])
        sub_fourths = [f for f in fourth_tier if f.get("parent_id") == t["id"]]
        elite = " (ELITE / first-tier)" if t.get("is_elite") else ""
        body = [
            f"# {label} — {third_label}: {fmt_field(t.get('name'))}{elite}",
            "",
            f"**Unit ID**: {fmt_field(t.get('id'))}",
            f"**Type**: {fmt_field(t.get('type'))}",
            f"**Headquarters**: {fmt_field(t.get('hq'))}",
            f"**Parent**: {parent_label}",
            f"**Higher echelon**: {grandparent_name}",
            f"**Elite designation**: {'Yes' if t.get('is_elite') else 'No'}",
            f"**Strength (% authorized)**: {fmt_field(t.get('strength_pct'),'?')}%",
            f"**Notes**: {fmt_field(t.get('notes'),'')}",
            "",
        ]
        if sub_fourths:
            body.append("## Subordinate Sub-units")
            for f in sub_fourths:
                body.append(f"- **{f.get('name','?')}** ({f.get('id','?')}) — type: {fmt_field(f.get('type'))}, HQ: {fmt_field(f.get('hq'))}. {fmt_field(f.get('notes'),'')}")
            body.append("")
        if eq:
            body.append("## Authorized Equipment (estimated)")
            for e in eq:
                body.append(f"- **{e.get('equipment_type','?')}** — {fmt_field(e.get('equipment_model'),'model unspecified')} — authorized: {fmt_field(e.get('authorized_count'),'?')}, estimated lost: {fmt_field(e.get('estimated_lost'),0)}")
            body.append("")
        tag = f"**Tags**: [OOB-{code}] [STRUCTURED] [LEVEL:{third_tag}] {cite}"
        chunks += emit_chunk(cfg["ext_dir"], "third", t["id"], body, tag)

    # --- fourth_tier chunks (if any) ---
    if fourth_tier:
        f_label, f_tag = cfg["tier_labels"]["fourth_tier"]
        for f in fourth_tier:
            parent = third_by_id.get(f.get("parent_id", ""), {})
            eq = eq_by_unit.get(f["id"], [])
            body = [
                f"# {label} — {f_label}: {fmt_field(f.get('name'))}",
                "",
                f"**Unit ID**: {fmt_field(f.get('id'))}",
                f"**Type**: {fmt_field(f.get('type'))}",
                f"**Headquarters**: {fmt_field(f.get('hq'))}",
                f"**Parent**: {parent.get('name','?')} ({f.get('parent_id','?')})",
                f"**Notes**: {fmt_field(f.get('notes'),'')}",
                "",
            ]
            if eq:
                body.append("## Authorized Equipment (estimated)")
                for e in eq:
                    body.append(f"- **{e.get('equipment_type','?')}** — {fmt_field(e.get('equipment_model'),'model unspecified')} — authorized: {fmt_field(e.get('authorized_count'),'?')}")
                body.append("")
            tag = f"**Tags**: [OOB-{code}] [STRUCTURED] [LEVEL:{f_tag}] {cite}"
            chunks += emit_chunk(cfg["ext_dir"], "fourth", f["id"], body, tag)

    # --- copy raw JSON into corpus raw/ ---
    shutil.copy(src, cfg["raw_dir"] / src.name)

    # Also copy summary md if present
    summary = src.parent / src.name.replace("_oob.json", "_oob_summary.md")
    if summary.exists():
        shutil.copy(summary, cfg["raw_dir"] / summary.name)

    print(f"=== {country_key.upper()} OOB INGESTION ===")
    print(f"  top_tier:    {len(top_tier):>3} → {len(top_tier)} chunks")
    print(f"  second_tier: {len(second_tier):>3} → {len(second_tier)} chunks")
    print(f"  third_tier:  {len(third_tier):>3} → {len(third_tier)} chunks")
    print(f"  fourth_tier: {len(fourth_tier):>3} → {len(fourth_tier)} chunks")
    print(f"  equipment:   {len(equipment):>3} (rolled into parent unit chunks)")
    print(f"  total chunks written: {chunks}")
    print(f"  output: {cfg['ext_dir']}")
    return chunks


def main():
    grand_total = 0
    for country in ["china", "iran", "dprk"]:
        grand_total += ingest_country(country)
        print()
    print(f"=== ALL OOB INGESTION COMPLETE ===")
    print(f"Grand total chunks: {grand_total}")


if __name__ == "__main__":
    main()

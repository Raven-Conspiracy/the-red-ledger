/**
 * THE RED LEDGER — Tactical Map (v6)
 * Leaflet 2D map, IPB-style dark terrain, no Google Maps dependency
 * MIL-STD-2525D hostile markers | FLOT | Weapon range rings | CE% labels
 * Centered on Ukraine — analytical use only
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Army, Division, Brigade, UnitEquipment } from '@shared/schema';
import { RAIL_ROUTES, PIPELINE_ROUTES } from '../data/infrastructure';

// ─── UNIT GEOLOCATIONS ────────────────────────────────────────────────────────
// Last known HQ positions — ISW / open-source OSINT. Approx ±10–30km.
const UNIT_POSITIONS: Record<string, { lat: number; lng: number; label: string }> = {
  '1gta':  { lat: 55.65,  lng: 37.27,  label: '1 GTA' },
  '20gca': { lat: 51.67,  lng: 39.18,  label: '20 GCAA' },
  '6ca':   { lat: 59.93,  lng: 30.32,  label: '6 CAA' },
  '11ac':  { lat: 54.71,  lng: 20.51,  label: '11 AC' },
  '14ac':  { lat: 68.97,  lng: 33.08,  label: '14 AC' },
  '44ac':  { lat: 44.72,  lng: 37.77,  label: '44 AC' },
  '3gca':  { lat: 48.57,  lng: 39.31,  label: '3 GCAA' },
  '8gca':  { lat: 47.42,  lng: 37.55,  label: '8 GCAA' },
  '18ca':  { lat: 44.62,  lng: 33.52,  label: '18 CAA' },
  '49ca':  { lat: 45.04,  lng: 41.97,  label: '49 CAA' },
  '51ca':  { lat: 47.10,  lng: 37.25,  label: '51 CAA' },
  '58gca': { lat: 47.14,  lng: 35.40,  label: '58 GCAA' },
  '2gca':  { lat: 53.20,  lng: 50.15,  label: '2 GCAA' },
  '41gca': { lat: 54.99,  lng: 82.90,  label: '41 GCAA' },
  '3ac':   { lat: 55.58,  lng: 43.60,  label: '3 AC' },
  '5gca':  { lat: 43.79,  lng: 131.96, label: '5 GCAA' },
  '29gca': { lat: 52.04,  lng: 113.50, label: '29 GCAA' },
  '35ca':  { lat: 50.92,  lng: 128.47, label: '35 CAA' },
  '36ca':  { lat: 51.83,  lng: 107.61, label: '36 CAA' },
  '68ac':  { lat: 46.96,  lng: 142.74, label: '68 AC' },
};

// ─── WEAPON RANGES ────────────────────────────────────────────────────────────
const WEAPON_RANGES: Record<string, { name: string; rangeKm: number; color: string }> = {
  combined_arms_army: { name: 'Iskander-M SRBM',   rangeKm: 500, color: '#ff4444' },
  tank_army:          { name: 'Iskander-M SRBM',   rangeKm: 500, color: '#ff4444' },
  army_corps:         { name: 'BM-30 Smerch MLRS', rangeKm: 90,  color: '#ff8800' },
  motor_rifle:        { name: 'BM-21 Grad MLRS',   rangeKm: 40,  color: '#ffaa00' },
  tank:               { name: 'T-80BVM gun',        rangeKm: 5,   color: '#ffcc00' },
  naval_infantry:     { name: 'BM-21 Grad MLRS',   rangeKm: 40,  color: '#ffaa00' },
  air_assault:        { name: 'Mi-24 Hind ATGM',   rangeKm: 8,   color: '#ffcc00' },
  spetsnaz:           { name: 'ATGM / mortar',      rangeKm: 8,   color: '#dddddd' },
  artillery:          { name: '2S7 Pion 203mm',     rangeKm: 55,  color: '#ff6600' },
  artillery_sp:       { name: '2S19 Msta-S 152mm',  rangeKm: 30,  color: '#ff8800' },
};

// ─── UKRAINE OIL STRIKE TARGETS ──────────────────────────────────────────────
// Confirmed Ukrainian drone strikes on Russian oil infrastructure — Apr 2026
const OIL_STRIKES: { lat: number; lng: number; name: string; type: string; status: string; date: string; detail: string }[] = [
  { lat: 44.72, lng: 37.79, name: 'Sheskharis Terminal', type: 'Export Terminal', status: 'SUSPENDED', date: 'Apr 5–7 2026', detail: '6/7 jetties damaged. 700K bbl/day. ~20% of RU wartime crude exports. SBU Centre Alpha strike.' },
  { lat: 59.69, lng: 28.43, name: 'Ust-Luga Terminal', type: 'Export Port', status: 'SUSPENDED', date: 'Mar 25–29 2026', detail: 'Hit 3× in one week. Russia\'s largest Baltic export port. 33M tons/yr. NOVATEK LNG also affected.' },
  { lat: 59.49, lng: 32.08, name: 'Kirishi Refinery (KINEF)', type: 'Refinery', status: 'HALTED', date: 'Mar 26–27 2026', detail: 'Russia\'s 2nd largest. 20M tons/yr (~6.6% of total). Crude processing units, bitumen, gas fractionation damaged.' },
  { lat: 60.35, lng: 29.77, name: 'Primorsk Terminal', type: 'Export Terminal', status: 'DAMAGED', date: 'Mar 2026', detail: 'Baltic pipeline hub. 60M tons crude/yr. 10-15% of total RU oil exports.' },
  { lat: 51.45, lng: 45.93, name: 'Saratov Refinery', type: 'Refinery', status: 'SUSPENDED', date: 'Mar 2026', detail: 'Major Volga region refinery. Repairs may take a month.' },
  { lat: 44.09, lng: 39.07, name: 'Tuapse Refinery', type: 'Refinery', status: 'DAMAGED', date: 'Mar 2026', detail: 'Black Sea coast. Krasnodar region. Key diesel supplier for southern military group.' },
  { lat: 54.23, lng: 37.58, name: 'Ryazan Refinery', type: 'Refinery', status: 'DAMAGED', date: '2025–2026', detail: 'Central Russia. Multiple strikes since 2024.' },
  { lat: 56.35, lng: 43.85, name: 'Kstovo Refinery (NORSI)', type: 'Refinery', status: 'DAMAGED', date: '2025–2026', detail: 'Nizhny Novgorod region. One of Russia\'s largest.' },
  { lat: 55.75, lng: 37.85, name: 'Moscow Refinery (Kapotnya)', type: 'Refinery', status: 'DAMAGED', date: 'Mar 2026', detail: '50% of Moscow fuel at risk. Largest refinery serving the capital.' },
  { lat: 48.72, lng: 44.52, name: 'Volgograd Refinery', type: 'Refinery', status: 'DAMAGED', date: '2025–2026', detail: 'Southern Russia logistics hub. Multiple strikes.' },
  { lat: 54.72, lng: 56.0, name: 'Bashneft-Ufaneftekhim (Ufa)', type: 'Refinery', status: 'DAMAGED', date: 'Mar 2026', detail: '1,300+ km from front. Primary distillation unit hit. Bashkortostan Republic.' },
  { lat: 57.63, lng: 39.87, name: 'Yaroslavl Refinery', type: 'Refinery', status: 'DAMAGED', date: 'Mar 2026', detail: 'Aviation fuel supplier for northern/western airfields.' },
  { lat: 53.19, lng: 50.1, name: 'Novokuibyshevsk Refinery', type: 'Refinery', status: 'DAMAGED', date: '2025–2026', detail: 'Samara region. Key Volga-Urals processing hub.' },
  { lat: 44.82, lng: 38.45, name: 'Afipsky Refinery', type: 'Refinery', status: 'DAMAGED', date: 'Mar 2026', detail: 'Krasnodar region. Diesel supply for southern military operations.' },
  { lat: 44.6, lng: 38.15, name: 'Ilsky Refinery', type: 'Refinery', status: 'DAMAGED', date: '2025–2026', detail: 'Krasnodar cluster. Part of southern refining complex.' },
  { lat: 45.27, lng: 38.1, name: 'Slavyansk Refinery', type: 'Refinery', status: 'DAMAGED', date: '2025–2026', detail: 'Krasnodar krai. Black Sea supply chain.' },
  { lat: 47.73, lng: 40.22, name: 'Novoshakhtinsk Refinery', type: 'Refinery', status: 'DAMAGED', date: '2025–2026', detail: 'Rostov region. Close to front lines. Fuel for Donbas operations.' },
  { lat: 54.73, lng: 55.85, name: 'Salavat Petrochemical', type: 'Petrochemical', status: 'DAMAGED', date: '2025', detail: 'Gazprom Neftekhim Salavat. Bashkortostan. Deep-strike target.' },
  { lat: 45.04, lng: 36.57, name: 'Port Kavkaz', type: 'Port', status: 'DAMAGED', date: 'Mar 2026', detail: 'Critical Kerch Strait crossing. Fuel transshipment for Crimea.' },
  { lat: 53.2, lng: 49.7, name: 'Syzran Refinery', type: 'Refinery', status: 'DAMAGED', date: '2025–2026', detail: 'Samara region. Mid-Volga processing.' },
];

// ─── FLOT / FLET — Apr 2026 estimate ─────────────────────────────────────────
// Source: DeepStateMap / ISW. Not for navigation use.
const FLOT_COORDS: [number, number][] = [
  [51.38, 35.98],
  [51.20, 36.10],
  [50.78, 36.28],
  [50.40, 36.60],
  [49.98, 37.02],
  [49.62, 37.28],
  [49.40, 37.68],
  [49.18, 37.85],
  [48.92, 38.02],
  [48.68, 38.21],
  [48.52, 38.45],
  [48.30, 38.68],
  [48.10, 38.82],
  [47.98, 37.48],
  [47.85, 37.22],
  [47.60, 37.10],
  [47.40, 37.05],
  [47.22, 36.82],
  [47.04, 36.60],
  [46.92, 36.20],
  [46.80, 35.88],
  [46.68, 35.60],
  [46.52, 35.02],
  [46.40, 34.42],
  [46.28, 33.80],
  [46.48, 32.78],
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function ceColor(pct: number): string {
  if (pct >= 75) return '#22c55e';
  if (pct >= 50) return '#f59e0b';
  if (pct >= 25) return '#ef4444';
  return '#991b1b';
}

function ceLabel(pct: number): string {
  if (pct >= 75) return 'EFFECTIVE';
  if (pct >= 50) return 'REDUCED';
  if (pct >= 25) return 'DEGRADED';
  return 'INEFFECTIVE';
}

// ─── MIL-STD-2525D symbol as SVG string ──────────────────────────────────────
// Hostile ground: red diamond frame, black function icon, echelon amplifier
function milSymbolSVG(type: string, level: 'army' | 'division' | 'brigade', size: number): string {
  const cx = size / 2;
  const cy = size / 2;
  const d = size * 0.42;
  const echelon = level === 'army' ? 'XXXXX' : level === 'division' ? 'XXX' : 'XX';
  const ic = size * 0.2;

  // Build function icon path
  let icon = '';
  if (type === 'tank' || type === 'tank_army') {
    icon = `<ellipse cx="${cx}" cy="${cy + 2}" rx="${ic * 0.85}" ry="${ic * 0.45}" fill="#000"/>`;
  } else if (type === 'motor_rifle' || type === 'combined_arms_army') {
    icon = `
      <line x1="${cx}" y1="${cy - ic * 0.7}" x2="${cx}" y2="${cy + ic * 0.7}" stroke="#000" stroke-width="${size * 0.055}" stroke-linecap="round"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${ic * 0.5}" ry="${ic * 0.3}" stroke="#000" stroke-width="${size * 0.05}" fill="none"/>
    `;
  } else if (type === 'artillery' || type === 'artillery_sp') {
    icon = `
      <circle cx="${cx}" cy="${cy - ic * 0.15}" r="${ic * 0.38}" fill="#000"/>
      <line x1="${cx - ic * 0.5}" y1="${cy + ic * 0.5}" x2="${cx + ic * 0.5}" y2="${cy + ic * 0.5}" stroke="#000" stroke-width="${size * 0.055}" stroke-linecap="round"/>
    `;
  } else if (type === 'naval_infantry') {
    icon = `
      <circle cx="${cx}" cy="${cy - ic * 0.28}" r="${ic * 0.28}" stroke="#000" stroke-width="${size * 0.05}" fill="none"/>
      <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + ic * 0.6}" stroke="#000" stroke-width="${size * 0.055}" stroke-linecap="round"/>
      <line x1="${cx - ic * 0.4}" y1="${cy + ic * 0.35}" x2="${cx + ic * 0.4}" y2="${cy + ic * 0.35}" stroke="#000" stroke-width="${size * 0.05}" stroke-linecap="round"/>
    `;
  } else if (type === 'air_assault') {
    icon = `
      <ellipse cx="${cx}" cy="${cy + ic * 0.1}" rx="${ic * 0.42}" ry="${ic * 0.27}" stroke="#000" stroke-width="${size * 0.05}" fill="none"/>
      <path d="M${cx - ic * 0.5} ${cy - ic * 0.15} Q${cx} ${cy - ic * 0.65} ${cx + ic * 0.5} ${cy - ic * 0.15}" stroke="#000" stroke-width="${size * 0.05}" fill="none"/>
    `;
  } else if (type === 'spetsnaz') {
    icon = `
      <line x1="${cx - ic * 0.5}" y1="${cy - ic * 0.5}" x2="${cx + ic * 0.5}" y2="${cy + ic * 0.5}" stroke="#000" stroke-width="${size * 0.065}" stroke-linecap="round"/>
      <line x1="${cx + ic * 0.5}" y1="${cy - ic * 0.5}" x2="${cx - ic * 0.5}" y2="${cy + ic * 0.5}" stroke="#000" stroke-width="${size * 0.065}" stroke-linecap="round"/>
    `;
  } else if (type === 'army_corps') {
    icon = `
      <line x1="${cx - ic * 0.52}" y1="${cy - ic * 0.52}" x2="${cx + ic * 0.52}" y2="${cy + ic * 0.52}" stroke="#000" stroke-width="${size * 0.065}" stroke-linecap="round"/>
      <line x1="${cx + ic * 0.52}" y1="${cy - ic * 0.52}" x2="${cx - ic * 0.52}" y2="${cy + ic * 0.52}" stroke="#000" stroke-width="${size * 0.065}" stroke-linecap="round"/>
    `;
  } else {
    icon = `
      <line x1="${cx - ic * 0.5}" y1="${cy - ic * 0.5}" x2="${cx + ic * 0.5}" y2="${cy + ic * 0.5}" stroke="#000" stroke-width="${size * 0.055}" stroke-linecap="round"/>
      <line x1="${cx + ic * 0.5}" y1="${cy - ic * 0.5}" x2="${cx - ic * 0.5}" y2="${cy + ic * 0.5}" stroke="#000" stroke-width="${size * 0.055}" stroke-linecap="round"/>
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <!-- Diamond frame -->
      <polygon points="${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}"
        fill="#c0392b" stroke="#1a0000" stroke-width="${size * 0.045}"/>
      <!-- Function icon -->
      ${icon}
      <!-- Echelon (top, above diamond) -->
      <text x="${cx}" y="${cy - d + size * 0.13}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="monospace" font-size="${size * 0.13}" font-weight="bold" fill="#fff">
        ${echelon}
      </text>
    </svg>
  `;
  return svg;
}

// ─── PROJECTION ───────────────────────────────────────────────────────────────
function computeProjectedCe(type: string, currentCe: number): number {
  const typeMap: Record<string, number> = {
    tank_army: +2, combined_arms_army: -3, army_corps: -2,
    motor_rifle: -5, tank: +3, naval_infantry: -6,
    air_assault: -4, spetsnaz: +1, artillery: +2,
  };
  const delta = typeMap[type] ?? -2;
  return Math.max(5, Math.min(95, Math.round(currentCe + delta)));
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface TacticalUnit {
  id: string;
  name: string;
  type: string;
  strengthPct: number;
  projectedPct: number;
  lat: number;
  lng: number;
  level: 'army' | 'division' | 'brigade';
  hq?: string | null;
}

interface Props {
  armies: Army[];
  divs: Division[];
  brigsMap: Map<string, Brigade[]>;
  equipment: UnitEquipment[];
}

// ─── PANEL: Unit Info ─────────────────────────────────────────────────────────
function UnitPanel({
  unit,
  weapon,
  onClose,
}: {
  unit: TacticalUnit;
  weapon: { name: string; rangeKm: number; color: string };
  onClose: () => void;
}) {
  const col = ceColor(unit.strengthPct);
  const projCol = ceColor(unit.projectedPct);
  const trend = unit.projectedPct > unit.strengthPct + 2 ? '▲' : unit.projectedPct < unit.strengthPct - 2 ? '▼' : '►';

  return (
    <div style={{
      position: 'absolute', top: 14, right: 14, width: 292, zIndex: 1000,
      background: 'rgba(13,17,23,0.97)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 6, padding: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
      fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(8px)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 9, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 2 }}>
            {unit.level.toUpperCase()} · {unit.type.replace(/_/g, ' ').toUpperCase()}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e4dc', lineHeight: 1.3, maxWidth: 220 }}>{unit.name}</div>
          {unit.hq && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>HQ: {unit.hq}</div>}
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, borderRadius: 4,
          width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
        }}>×</button>
      </div>

      {/* CE bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Combat Effectiveness</span>
          <span style={{ fontSize: 9, color: col, fontWeight: 700 }}>{ceLabel(unit.strengthPct)}</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ height: '100%', width: `${unit.strengthPct}%`, background: col, borderRadius: 3 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: col, fontFamily: 'JetBrains Mono, monospace' }}>
            {unit.strengthPct.toFixed(0)}%
          </span>
          <span style={{ fontSize: 11, color: projCol, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            {trend} {unit.projectedPct.toFixed(0)}% <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }}>12mo proj.</span>
          </span>
        </div>
      </div>

      {/* Weapon */}
      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(217,119,6,0.25)',
        borderRadius: 4, padding: '8px 10px', marginBottom: 10,
      }}>
        <div style={{ fontSize: 9, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 4 }}>
          Longest Shooter — Range Ring Active
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#e8e4dc' }}>{weapon.name}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
          Max range:{' '}
          <span style={{ color: weapon.color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
            {weapon.rangeKm} km
          </span>
        </div>
      </div>

      {/* Position */}
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontFamily: 'JetBrains Mono, monospace' }}>
        {unit.lat.toFixed(4)}°N · {unit.lng.toFixed(4)}°E · APPROX ±30km
      </div>
      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', marginTop: 3 }}>
        SRC: ISW / OSINT — Analytical use only
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function TacticalMap({ armies, divs }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const flotLayer = useRef<L.Polyline | null>(null);
  const rangeLayer = useRef<L.Circle | null>(null);
  const rangeLabel = useRef<L.Marker | null>(null);

  const [selectedUnit, setSelectedUnit] = useState<TacticalUnit | null>(null);
  const [showFlot, setShowFlot] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showOilStrikes, setShowOilStrikes] = useState(true);
  const [showRail, setShowRail] = useState(false);
  const [showPipelines, setShowPipelines] = useState(false);
  const [filter, setFilter] = useState<'all' | 'deployed' | 'strategic'>('all');
  const oilLayer = useRef<L.LayerGroup | null>(null);
  const railLayer = useRef<L.LayerGroup | null>(null);
  const pipelineLayer = useRef<L.LayerGroup | null>(null);

  // ── Build unit list ──
  const allUnits: TacticalUnit[] = [];
  armies.forEach(a => {
    const pos = UNIT_POSITIONS[a.id];
    if (!pos) return;
    allUnits.push({
      id: a.id, name: a.name, type: a.type,
      strengthPct: a.strengthPct,
      projectedPct: computeProjectedCe(a.type, a.strengthPct),
      lat: pos.lat, lng: pos.lng, level: 'army', hq: a.hq,
    });
  });
  divs.forEach(d => {
    const pos = UNIT_POSITIONS[d.id];
    if (!pos) return;
    allUnits.push({
      id: d.id, name: d.name, type: d.type,
      strengthPct: d.strengthPct,
      projectedPct: computeProjectedCe(d.type, d.strengthPct),
      lat: pos.lat, lng: pos.lng, level: 'division', hq: d.hq,
    });
  });

  // Filter by proximity to Ukraine: deployed = within ~600km of Kyiv
  const KYIV = { lat: 50.45, lng: 30.52 };
  function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  const units = allUnits.filter(u => {
    if (filter === 'deployed') return distKm(u, KYIV) < 700;
    if (filter === 'strategic') return distKm(u, KYIV) >= 700;
    return true;
  });

  // ── Init Leaflet ──
  useEffect(() => {
    if (leafletMap.current || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [48.5, 34.0],  // Eastern Ukraine
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark military tile layer (CartoDB Dark Matter — no API key needed)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 14,
      minZoom: 3,
    }).addTo(map);

    // Attribution (small, bottom right)
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('© CartoDB · OSM · ISW/OSINT analytical data only')
      .addTo(map);

    // Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Layers
    markersLayer.current = L.layerGroup().addTo(map);

    oilLayer.current = L.layerGroup().addTo(map);
    railLayer.current = L.layerGroup().addTo(map);
    pipelineLayer.current = L.layerGroup().addTo(map);
    leafletMap.current = map;

    // Inject CSS for animated flow lines
    if (!document.getElementById('infra-flow-css')) {
      const style = document.createElement('style');
      style.id = 'infra-flow-css';
      style.textContent = `
        @keyframes flowForward {
          to { stroke-dashoffset: -40; }
        }
        @keyframes flowForwardSlow {
          to { stroke-dashoffset: -40; }
        }
        .flow-heavy path { animation: flowForward 0.8s linear infinite; }
        .flow-moderate path { animation: flowForward 1.6s linear infinite; }
        .flow-light path { animation: flowForward 3s linear infinite; }
        .flow-inactive path { stroke-dasharray: 4 8 !important; }
        .flow-high path { animation: flowForward 0.8s linear infinite; }
        .flow-medium path { animation: flowForward 1.6s linear infinite; }
        .flow-low path { animation: flowForward 3s linear infinite; }
        @keyframes oilPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // Click map to deselect
    map.on('click', () => setSelectedUnit(null));

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // ── FLOT polyline ──
  useEffect(() => {
    if (!leafletMap.current) return;
    if (flotLayer.current) {
      flotLayer.current.remove();
      flotLayer.current = null;
    }
    if (showFlot) {
      // Double line: thicker glow underneath, solid orange on top
      L.polyline(FLOT_COORDS, {
        color: '#ff6b35', weight: 7, opacity: 0.22,
      }).addTo(leafletMap.current);

      flotLayer.current = L.polyline(FLOT_COORDS, {
        color: '#ff6b35', weight: 2.5, opacity: 0.95,
        dashArray: '8 4',
      }).addTo(leafletMap.current);

      // Label at midpoint
      const mid = FLOT_COORDS[Math.floor(FLOT_COORDS.length / 2)];
      L.marker(mid, {
        icon: L.divIcon({
          className: '',
          html: `<div style="
            background:rgba(255,107,53,0.15);
            border:1px solid rgba(255,107,53,0.5);
            color:#ff6b35;
            font-family:Inter,sans-serif;
            font-size:9px;font-weight:700;
            letter-spacing:0.1em;
            padding:2px 7px;
            border-radius:2px;
            white-space:nowrap;
            text-shadow:0 0 6px rgba(255,107,53,0.8);
          ">FLOT · APR 2026 EST.</div>`,
          iconAnchor: [60, 10],
        }),
        interactive: false,
        zIndexOffset: -100,
      }).addTo(leafletMap.current!);
    }
  }, [showFlot]);

  // ── Oil strike markers ──
  useEffect(() => {
    if (!leafletMap.current || !oilLayer.current) return;
    oilLayer.current.clearLayers();

    if (showOilStrikes) {
      OIL_STRIKES.forEach(strike => {
        const statusColor = strike.status === 'SUSPENDED' ? '#ff2222' : strike.status === 'HALTED' ? '#ff6600' : '#ffaa00';
        const size = strike.status === 'SUSPENDED' ? 28 : 22;

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              display:flex;flex-direction:column;align-items:center;
              cursor:pointer;
              filter:drop-shadow(0 2px 8px rgba(255,50,0,0.6));
            ">
              <div style="
                width:${size}px;height:${size}px;
                background:radial-gradient(circle at 40% 35%, ${statusColor}, #660000);
                border:2px solid ${statusColor};
                border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                font-size:${size * 0.5}px;
                animation: oilPulse 2s ease-in-out infinite;
              ">🔥</div>
              <div style="
                margin-top:1px;
                background:rgba(13,17,23,0.92);
                border:1px solid ${statusColor}44;
                border-radius:2px;
                padding:0px 4px;
                font-family:Inter,sans-serif;
                font-size:7px;font-weight:700;
                color:${statusColor};
                white-space:nowrap;
                letter-spacing:0.02em;
              ">${strike.name.length > 20 ? strike.name.slice(0, 18) + '...' : strike.name}</div>
            </div>
          `,
          iconSize: [size + 60, size + 20],
          iconAnchor: [(size + 60) / 2, size / 2],
        });

        const marker = L.marker([strike.lat, strike.lng], {
          icon,
          zIndexOffset: 30,
        }).addTo(oilLayer.current!);

        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:200px;max-width:260px;">
            <div style="font-size:11px;font-weight:700;color:#1a1a1a;margin-bottom:3px;">${strike.name}</div>
            <div style="display:flex;gap:6px;margin-bottom:4px;">
              <span style="font-size:8px;font-weight:700;padding:1px 5px;border-radius:2px;
                background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;">
                ${strike.status}
              </span>
              <span style="font-size:8px;color:#666;">${strike.type} · ${strike.date}</span>
            </div>
            <div style="font-size:9px;color:#444;line-height:1.4;">${strike.detail}</div>
            <div style="font-size:7px;color:#999;margin-top:4px;">SRC: Reuters / Euromaidan Press / Kyiv Independent</div>
          </div>
        `, { className: 'oil-strike-popup' });
      });
    }
  }, [showOilStrikes]);

  // ── Railroad overlays ──
  useEffect(() => {
    if (!leafletMap.current || !railLayer.current) return;
    railLayer.current.clearLayers();

    if (showRail) {
      RAIL_ROUTES.forEach(route => {
        const color = route.traffic === 'heavy' ? '#ef4444' : route.traffic === 'moderate' ? '#eab308' : '#22c55e';
        const weight = route.traffic === 'heavy' ? 3.5 : route.traffic === 'moderate' ? 2.5 : 2;
        const cls = `flow-${route.traffic}`;

        // Glow underneath
        L.polyline(route.points, {
          color, weight: weight + 4, opacity: 0.12, interactive: false,
        }).addTo(railLayer.current!);

        // Animated dashed line
        const line = L.polyline(route.points, {
          color, weight, opacity: 0.85,
          dashArray: '8 12', className: cls,
          interactive: true,
        }).addTo(railLayer.current!);

        // Tooltip
        line.bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:180px;max-width:240px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="font-size:13px;">🚂</span>
              <span style="font-size:11px;font-weight:700;color:#1a1a1a;">${route.name}</span>
            </div>
            <div style="display:flex;gap:5px;margin-bottom:4px;">
              <span style="font-size:8px;font-weight:700;padding:1px 5px;border-radius:2px;
                background:${color}22;color:${color};border:1px solid ${color}44;">
                ${route.traffic.toUpperCase()} TRAFFIC
              </span>
              <span style="font-size:8px;padding:1px 5px;border-radius:2px;
                background:rgba(0,0,0,0.05);color:#666;">
                ${route.importance.toUpperCase()} PRIORITY
              </span>
            </div>
            <div style="font-size:9px;color:#444;line-height:1.4;">${route.description}</div>
            <div style="font-size:7px;color:#999;margin-top:4px;">SRC: ISW / Tochnyi.info / Euromaidan Press</div>
          </div>
        `, { className: 'rail-popup' });

        // Mid-point label at low zoom
        const mid = route.points[Math.floor(route.points.length / 2)];
        L.marker(mid, {
          icon: L.divIcon({
            className: '',
            html: `<div style="
              background:rgba(13,17,23,0.85);
              border:1px solid ${color}66;
              border-radius:2px;
              padding:0px 4px;
              font-family:Inter,sans-serif;
              font-size:7px;font-weight:600;
              color:${color};
              white-space:nowrap;
              letter-spacing:0.02em;
            ">🚂 ${route.name.length > 22 ? route.name.slice(0, 20) + '…' : route.name}</div>`,
            iconAnchor: [50, 8],
          }),
          interactive: false,
          zIndexOffset: -50,
        }).addTo(railLayer.current!);
      });
    }
  }, [showRail]);

  // ── Pipeline overlays ──
  useEffect(() => {
    if (!leafletMap.current || !pipelineLayer.current) return;
    pipelineLayer.current.clearLayers();

    if (showPipelines) {
      PIPELINE_ROUTES.forEach(route => {
        const colorMap: Record<string, string> = {
          high: '#ef4444', medium: '#eab308', low: '#22c55e', inactive: '#6b7280',
        };
        const color = colorMap[route.throughput] || '#6b7280';
        const weight = route.throughput === 'high' ? 3.5 : route.throughput === 'medium' ? 2.8 : route.throughput === 'inactive' ? 1.5 : 2;
        const cls = `flow-${route.throughput}`;
        const typeIcon = route.type === 'oil' ? '🛢️' : '⛽';

        // Glow
        L.polyline(route.points, {
          color, weight: weight + 4, opacity: 0.10, interactive: false,
        }).addTo(pipelineLayer.current!);

        // Animated dashed line
        const line = L.polyline(route.points, {
          color, weight, opacity: route.throughput === 'inactive' ? 0.4 : 0.85,
          dashArray: route.throughput === 'inactive' ? '4 8' : '6 14',
          className: cls, interactive: true,
        }).addTo(pipelineLayer.current!);

        // Popup
        line.bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:180px;max-width:260px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="font-size:13px;">${typeIcon}</span>
              <span style="font-size:11px;font-weight:700;color:#1a1a1a;">${route.name}</span>
            </div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px;">
              <span style="font-size:8px;font-weight:700;padding:1px 5px;border-radius:2px;
                background:${color}22;color:${color};border:1px solid ${color}44;">
                ${route.throughput.toUpperCase()} FLOW
              </span>
              <span style="font-size:8px;padding:1px 5px;border-radius:2px;
                background:rgba(0,0,0,0.05);color:#666;text-transform:uppercase;">
                ${route.type}
              </span>
            </div>
            <div style="font-size:9px;color:#333;line-height:1.35;margin-bottom:3px;font-weight:600;">${route.status}</div>
            <div style="font-size:9px;color:#555;line-height:1.4;">${route.description}</div>
            <div style="font-size:7px;color:#999;margin-top:4px;">SRC: Reuters / S&P Global / Euromaidan Press</div>
          </div>
        `, { className: 'pipeline-popup' });

        // Label
        const mid = route.points[Math.floor(route.points.length / 2)];
        L.marker(mid, {
          icon: L.divIcon({
            className: '',
            html: `<div style="
              background:rgba(13,17,23,0.85);
              border:1px solid ${color}66;
              border-radius:2px;
              padding:0px 4px;
              font-family:Inter,sans-serif;
              font-size:7px;font-weight:600;
              color:${color};
              white-space:nowrap;
              letter-spacing:0.02em;
            ">${typeIcon} ${route.name.length > 22 ? route.name.slice(0, 20) + '…' : route.name}</div>`,
            iconAnchor: [55, 8],
          }),
          interactive: false,
          zIndexOffset: -50,
        }).addTo(pipelineLayer.current!);
      });
    }
  }, [showPipelines]);

  // ── Unit markers ──
  useEffect(() => {
    if (!leafletMap.current || !markersLayer.current) return;
    markersLayer.current.clearLayers();

    units.forEach(unit => {
      const size = unit.level === 'army' ? 52 : 42;
      const svg = milSymbolSVG(unit.type, unit.level, size);
      const col = ceColor(unit.strengthPct);

      const labelHtml = showLabels ? `
        <div style="
          margin-top:2px;
          background:rgba(13,17,23,0.9);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:3px;
          padding:1px 5px;
          font-family:Inter,sans-serif;
          font-size:9px;font-weight:600;
          color:${col};
          white-space:nowrap;
          text-align:center;
          line-height:1.5;
        ">
          ${unit.level === 'army'
            ? unit.name.replace(/Guards|Combined Arms Army|Guards Tank Army|Army Corps/gi, '').trim().slice(0, 18)
            : unit.name.slice(0, 20)}
          &nbsp;·&nbsp;${unit.strengthPct.toFixed(0)}%
        </div>
      ` : '';

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            display:flex;flex-direction:column;align-items:center;
            cursor:pointer;
            filter:drop-shadow(0 2px 6px rgba(0,0,0,0.9));
          ">
            ${svg}
            ${labelHtml}
          </div>
        `,
        iconSize: [size + 30, size + 30],
        iconAnchor: [(size + 30) / 2, size / 2],
      });

      const marker = L.marker([unit.lat, unit.lng], {
        icon,
        zIndexOffset: unit.level === 'army' ? 100 : 50,
      }).addTo(markersLayer.current!);

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedUnit(unit);
      });
    });
  }, [units.length, showLabels, filter]);

  // ── Range ring for selected unit ──
  useEffect(() => {
    if (!leafletMap.current) return;

    if (rangeLayer.current) { rangeLayer.current.remove(); rangeLayer.current = null; }
    if (rangeLabel.current) { rangeLabel.current.remove(); rangeLabel.current = null; }

    if (!selectedUnit) return;

    const weapon = WEAPON_RANGES[selectedUnit.type] ?? WEAPON_RANGES['motor_rifle'];
    const col = weapon.color;

    // Glow ring
    L.circle([selectedUnit.lat, selectedUnit.lng], {
      radius: weapon.rangeKm * 1000,
      color: col, weight: 8, opacity: 0.08,
      fill: true, fillColor: col, fillOpacity: 0.04,
      interactive: false,
    }).addTo(leafletMap.current);

    // Crisp ring
    rangeLayer.current = L.circle([selectedUnit.lat, selectedUnit.lng], {
      radius: weapon.rangeKm * 1000,
      color: col, weight: 2, opacity: 0.9,
      fill: true, fillColor: col, fillOpacity: 0.06,
      dashArray: '6 4',
      interactive: false,
    }).addTo(leafletMap.current);

    // Range label on ring edge
    const labelLat = selectedUnit.lat + (weapon.rangeKm / 111.2);
    rangeLabel.current = L.marker([labelLat, selectedUnit.lng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="
          background:rgba(13,17,23,0.88);
          border:1px solid ${col};
          color:${col};
          font-family:JetBrains Mono,monospace;
          font-size:9px;font-weight:700;
          padding:2px 6px;border-radius:3px;
          white-space:nowrap;
        ">${weapon.rangeKm} km — ${weapon.name}</div>`,
        iconAnchor: [40, 10],
      }),
      interactive: false,
      zIndexOffset: 200,
    }).addTo(leafletMap.current);

  }, [selectedUnit]);

  const selectedWeapon = selectedUnit
    ? (WEAPON_RANGES[selectedUnit.type] ?? WEAPON_RANGES['motor_rifle'])
    : null;

  // ── Colour counts for legend ──
  const counts = { green: 0, amber: 0, red: 0, dark: 0 };
  units.forEach(u => {
    if (u.strengthPct >= 75) counts.green++;
    else if (u.strengthPct >= 50) counts.amber++;
    else if (u.strengthPct >= 25) counts.red++;
    else counts.dark++;
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0d1117' }}>
      {/* Map */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* ── LEFT PANEL: controls + legend ── */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 8,
        fontFamily: 'Inter, sans-serif',
        maxWidth: 200,
      }}>
        {/* Title card */}
        <div style={{
          background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(192,57,43,0.4)',
          borderRadius: 6, padding: '8px 12px',
        }}>
          <div style={{ fontSize: 10, color: '#c0392b', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            IPB Tactical Map
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            RGF Order of Battle · Apr 2026
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
            {units.length} units plotted
          </div>
        </div>

        {/* Filter */}
        <div style={{
          background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, padding: '10px 12px',
        }}>
          <div style={{ fontSize: 9, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 7 }}>
            Unit Filter
          </div>
          {(['all', 'deployed', 'strategic'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              display: 'block', width: '100%', marginBottom: 4,
              background: filter === f ? 'rgba(192,57,43,0.25)' : 'transparent',
              border: `1px solid ${filter === f ? 'rgba(192,57,43,0.6)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 3, color: filter === f ? '#e8e4dc' : 'rgba(255,255,255,0.45)',
              fontSize: 10, fontWeight: filter === f ? 700 : 400,
              padding: '4px 8px', cursor: 'pointer', textAlign: 'left',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              fontFamily: 'Inter, sans-serif',
            }}>
              {f === 'all' ? 'All Units' : f === 'deployed' ? 'Deployed (<700km)' : 'Strategic Reserve'}
            </button>
          ))}
        </div>

        {/* Toggles */}
        <div style={{
          background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, padding: '10px 12px',
        }}>
          <div style={{ fontSize: 9, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8 }}>
            Overlays
          </div>
          {[
            { label: 'FLOT Line', val: showFlot, set: setShowFlot },
            { label: 'Unit Labels', val: showLabels, set: setShowLabels },
            { label: 'Oil Strikes', val: showOilStrikes, set: setShowOilStrikes },
            { label: 'Rail Lines', val: showRail, set: setShowRail },
            { label: 'Pipelines', val: showPipelines, set: setShowPipelines },
          ].map(({ label, val, set }) => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
              <div onClick={() => set(!val)} style={{
                width: 28, height: 16, borderRadius: 8,
                background: val ? '#c0392b' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: val ? 13 : 2,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                }} />
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{label}</span>
            </label>
          ))}
        </div>

        {/* CE Legend */}
        <div style={{
          background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, padding: '10px 12px',
        }}>
          <div style={{ fontSize: 9, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>
            CE% Status
          </div>
          {[
            ['≥75% Effective',   '#22c55e', counts.green],
            ['50–74% Reduced',   '#f59e0b', counts.amber],
            ['25–49% Degraded',  '#ef4444', counts.red],
            ['<25% Ineffective', '#991b1b', counts.dark],
          ].map(([lbl, col, n]) => (
            <div key={lbl as string} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: col as string, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', flex: 1 }}>{lbl}</span>
              <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: col as string, fontWeight: 700 }}>{n}</span>
            </div>
          ))}
          <div style={{ marginTop: 7, paddingTop: 7, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 16, height: 2, background: '#ff6b35', borderRadius: 1 }} />
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>FLOT (Apr 2026 est.)</span>
            </div>
            {showOilStrikes && (
              <div style={{ marginTop: 5, paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 9, color: '#ff6600', fontWeight: 700, marginBottom: 3, letterSpacing: '0.03em' }}>
                  🔥 UA OIL STRIKES ({OIL_STRIKES.length})
                </div>
                {[
                  ['SUSPENDED', '#ff2222'],
                  ['HALTED', '#ff6600'],
                  ['DAMAGED', '#ffaa00'],
                ].map(([lbl, col]) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: `radial-gradient(circle, ${col}, #660000)`, border: `1px solid ${col}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)' }}>{lbl}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
              Click any unit to show weapon range ring
            </div>
            {showRail && (
              <div style={{ marginTop: 5, paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700, marginBottom: 3, letterSpacing: '0.03em' }}>
                  🚂 RAIL LINES ({RAIL_ROUTES.length})
                </div>
                {[
                  ['HEAVY', '#ef4444'],
                  ['MODERATE', '#eab308'],
                  ['LIGHT', '#22c55e'],
                ].map(([lbl, col]) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <div style={{ width: 16, height: 2, background: col as string, borderRadius: 1 }} />
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)' }}>{lbl}</span>
                  </div>
                ))}
              </div>
            )}
            {showPipelines && (
              <div style={{ marginTop: 5, paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 9, color: '#60a5fa', fontWeight: 700, marginBottom: 3, letterSpacing: '0.03em' }}>
                  🛢️ PIPELINES ({PIPELINE_ROUTES.length})
                </div>
                {[
                  ['HIGH FLOW', '#ef4444'],
                  ['MEDIUM', '#eab308'],
                  ['LOW/REDUCED', '#22c55e'],
                  ['INACTIVE', '#6b7280'],
                ].map(([lbl, col]) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <div style={{ width: 16, height: 2, background: col as string, borderRadius: 1, opacity: lbl === 'INACTIVE' ? 0.5 : 1 }} />
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)' }}>{lbl}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>🛢️ Oil</span>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>⛽ Gas</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* IPB attribution */}
        <div style={{
          background: 'rgba(13,17,23,0.85)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 6, padding: '7px 10px',
        }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
            MIL-STD-2525D (FM 1-02.2)<br />
            ISW · DeepStateMap · OSINT<br />
            Analytical use only
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: selected unit info ── */}
      {selectedUnit && selectedWeapon && (
        <UnitPanel
          unit={selectedUnit}
          weapon={selectedWeapon}
          onClose={() => setSelectedUnit(null)}
        />
      )}

      {/* ── BOTTOM: IPB-style classification banner ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 900,
        background: 'rgba(13,17,23,0.9)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '5px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
          OSINT COMPILATION — FOR ANALYTICAL PURPOSES ONLY — NOT CLASSIFIED
        </div>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace' }}>
          DTG: {new Date().toISOString().slice(0, 10).replace(/-/g, '')} · UKRAINE AO
        </div>
      </div>
    </div>
  );
}

/**
 * THE RED LEDGER — Mobile App Shell (iOS-style)
 * 
 * Full-screen single-view layout:
 * - Compact top status bar (logo + live + refresh)
 * - Content area fills viewport
 * - Fixed iOS-style bottom tab bar with 5 tabs
 * - Each view designed to fit one screen (no endless scrolling)
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { OOBData } from './OOBPage';
import { buildEquipmentDatabase, aggregateEquipment, getArmyEquipmentKeys, CATEGORY_DISPLAY, type CategoryKey, type EquipmentEntry } from '@/data/equipment-reference';
import { INTEL_STORIES, INTEL_CATEGORIES, type IntelCategory, type IntelStory } from '@/data/intel-feed';
import { searchKB, type KBEntry } from '@/data/knowledge-base';
import { TacticalMap } from './TacticalMap';
import ravenLogo from '@assets/taskforce-raven.jpg';

// ─── TYPES ───────────────────────────────────────────────────────────────────
type MobileTab = 'oob' | 'map' | 'intel' | 'sources' | 'proj';

// ─── STRENGTH COLOR ───────────────────────────────────────────────────────────
function SC(pct: number): string {
  if (pct >= 75) return '#22c55e';
  if (pct >= 50) return '#f59e0b';
  if (pct >= 25) return '#ef4444';
  return '#991b1b';
}
function SCLabel(pct: number): string {
  if (pct >= 75) return 'EFF';
  if (pct >= 50) return 'RED';
  if (pct >= 25) return 'DEG';
  return 'INEFF';
}

// ─── CE PROJECTION ───────────────────────────────────────────────────────────
function projCe(type: string, ce: number): number {
  const m: Record<string, number> = {
    tank_army: +2, combined_arms_army: -3, army_corps: -2,
    motor_rifle: -5, tank: +3, naval_infantry: -6,
    air_assault: -4, spetsnaz: +1, artillery: +2,
  };
  return Math.max(5, Math.min(95, Math.round(ce + (m[type] ?? -2))));
}

// ─── SOURCE REPOSITORY DATA ──────────────────────────────────────────────────
const SOURCE_REPO = [
  {
    id: 'isw', name: 'ISW', full: 'Institute for the Study of War',
    url: 'https://understandingwar.org',
    type: 'think_tank' as const,
    reports: { losses: 42, ground: 38, personnel: 12, production: 8, strike: 6 },
    reliability: 'HIGH', desc: 'Daily campaign assessments. Rigorous sourcing. Gold standard for frontline analysis.',
  },
  {
    id: 'deepstate', name: 'DeepStateMap', full: 'DeepStateMap / @DeepStateUA',
    url: 'https://deepstatemap.live',
    type: 'osint' as const,
    reports: { losses: 8, ground: 52, personnel: 2, production: 0, strike: 15 },
    reliability: 'HIGH', desc: 'Real-time geolocated frontline mapping. Primary source for FLOT changes.',
  },
  {
    id: 'oryx', name: 'Oryx', full: 'Oryx Visual Loss Tracker',
    url: 'https://oryxspioenkop.com',
    type: 'osint' as const,
    reports: { losses: 65, ground: 0, personnel: 0, production: 5, strike: 3 },
    reliability: 'HIGH', desc: 'Photo-verified equipment losses. Minimum confirmed — actual losses higher.',
  },
  {
    id: 'ukr_gs', name: 'UA GenStaff', full: 'Ukrainian General Staff',
    url: 'https://www.facebook.com/GeneralStaff.ua',
    type: 'official' as const,
    reports: { losses: 48, ground: 22, personnel: 18, production: 0, strike: 28 },
    reliability: 'MED-HIGH', desc: 'Official Ukrainian military reports. Daily casualty & loss figures. Potential overcounting.',
  },
  {
    id: 'bellingcat', name: 'Bellingcat', full: 'Bellingcat Investigation',
    url: 'https://bellingcat.com',
    type: 'osint' as const,
    reports: { losses: 5, ground: 3, personnel: 2, production: 4, strike: 22 },
    reliability: 'HIGH', desc: 'Open-source geolocation, satellite imagery, verification. Strike damage assessment.',
  },
  {
    id: 'janes', name: 'Janes', full: 'Janes Defence Intelligence',
    url: 'https://janes.com',
    type: 'defense_intel' as const,
    reports: { losses: 6, ground: 4, personnel: 8, production: 28, strike: 2 },
    reliability: 'HIGH', desc: 'Professional defence intelligence. Equipment specs, production estimates, order of battle.',
  },
  {
    id: 'fisa', name: 'Estonia FISA', full: 'Estonian Foreign Intelligence Service',
    url: 'https://www.vfrk.ee',
    type: 'official' as const,
    reports: { losses: 3, ground: 2, personnel: 6, production: 22, strike: 1 },
    reliability: 'HIGH', desc: 'Annual threat assessment. Key source for Russian production capacity data.',
  },
  {
    id: 'frontel', name: 'Frontelligence', full: 'Frontelligence Insight',
    url: 'https://frontelligence.com',
    type: 'osint' as const,
    reports: { losses: 2, ground: 8, personnel: 4, production: 18, strike: 5 },
    reliability: 'MED-HIGH', desc: 'Leaked Russian military documents analysis. Key for production forecasts.',
  },
  {
    id: 'reuters', name: 'Reuters', full: 'Reuters News Agency',
    url: 'https://reuters.com',
    type: 'media' as const,
    reports: { losses: 4, ground: 6, personnel: 14, production: 10, strike: 8 },
    reliability: 'HIGH', desc: 'Wire service. Recruitment, economic impact, diplomatic context reporting.',
  },
  {
    id: 'russianomics', name: 'Russianomics', full: 'Russianomics / Janis Kluge',
    url: 'https://swp-berlin.org',
    type: 'think_tank' as const,
    reports: { losses: 0, ground: 0, personnel: 22, production: 15, strike: 0 },
    reliability: 'HIGH', desc: 'SWP Berlin. Russian economic & recruitment data analysis. Budget deep dives.',
  },
];

const REPORT_TYPES = [
  { key: 'losses', label: 'Losses', color: '#ef4444' },
  { key: 'ground', label: 'Ground', color: '#f59e0b' },
  { key: 'personnel', label: 'Personnel', color: '#3b82f6' },
  { key: 'production', label: 'Production', color: '#8b5cf6' },
  { key: 'strike', label: 'Strikes', color: '#22c55e' },
] as const;

type ReportKey = typeof REPORT_TYPES[number]['key'];

// ─── PROJECTION DATA ─────────────────────────────────────────────────────────
const PROJ_CATS = [
  { key: 'tanks', label: 'Tanks (MBT)', color: '#f59e0b',
    data: [
      { yr: '22', g: 400, l: 1500 }, { yr: '23', g: 900, l: 900 }, { yr: '24', g: 1400, l: 1100 },
      { yr: '25', g: 1840, l: 1050 }, { yr: '26', g: 1900, l: 900 }, { yr: '27', g: 2100, l: 850 }, { yr: '28', g: 2500, l: 800 },
    ] },
  { key: 'sp_arty', label: 'SP Artillery', color: '#ef4444',
    data: [
      { yr: '22', g: 200, l: 300 }, { yr: '23', g: 350, l: 350 }, { yr: '24', g: 420, l: 400 },
      { yr: '25', g: 480, l: 380 }, { yr: '26', g: 500, l: 350 }, { yr: '27', g: 520, l: 330 }, { yr: '28', g: 550, l: 310 },
    ] },
  { key: 'ifv', label: 'IFV / APC', color: '#3b82f6',
    data: [
      { yr: '22', g: 600, l: 1800 }, { yr: '23', g: 900, l: 1400 }, { yr: '24', g: 1200, l: 1600 },
      { yr: '25', g: 1400, l: 1500 }, { yr: '26', g: 1500, l: 1400 }, { yr: '27', g: 1600, l: 1300 }, { yr: '28', g: 1700, l: 1200 },
    ] },
  { key: 'mlrs', label: 'MLRS', color: '#8b5cf6',
    data: [
      { yr: '22', g: 80, l: 120 }, { yr: '23', g: 120, l: 140 }, { yr: '24', g: 150, l: 160 },
      { yr: '25', g: 180, l: 140 }, { yr: '26', g: 200, l: 130 }, { yr: '27', g: 220, l: 120 }, { yr: '28', g: 240, l: 110 },
    ] },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

// ── Status Bar ──
function StatusBar({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 12px', background: 'hsl(220 15% 7%)',
      borderBottom: '1px solid hsl(220 12% 16%)',
      flexShrink: 0,
    }}>
      <img src={ravenLogo} alt="" style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid hsl(0 50% 32%)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(38 92% 65%)', letterSpacing: '0.04em' }}>THE RED LEDGER</div>
        <div style={{ fontSize: 8, color: 'hsl(45 5% 40%)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="live-dot" style={{ width: 4, height: 4 }} />
          <span>LIVE · ISW / ORYX · {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} UTC</span>
        </div>
      </div>
      <button onClick={onRefresh} disabled={isRefreshing}
        style={{
          background: 'hsl(220 15% 14%)', border: '1px solid hsl(220 12% 24%)',
          borderRadius: 4, color: isRefreshing ? 'hsl(45 5% 40%)' : 'hsl(38 92% 58%)',
          padding: '4px 8px', fontSize: 9, fontFamily: 'inherit', cursor: 'pointer',
        }}>
        {isRefreshing ? '…' : '⟳'}
      </button>
    </div>
  );
}

// ── Bottom Tab Bar ──
function BottomTabs({ tab, setTab }: { tab: MobileTab; setTab: (t: MobileTab) => void }) {
  const tabs: { id: MobileTab; icon: string; label: string }[] = [
    { id: 'oob', icon: '⬡', label: 'OOB' },
    { id: 'map', icon: '◎', label: 'Map' },
    { id: 'intel', icon: '◆', label: 'Intel' },
    { id: 'sources', icon: '▣', label: 'Sources' },
    { id: 'proj', icon: '▤', label: 'Forecast' },
  ];
  return (
    <nav style={{
      display: 'flex', flexShrink: 0,
      background: 'hsl(220 15% 7%)',
      borderTop: '1px solid hsl(220 12% 16%)',
      paddingBottom: 'env(safe-area-inset-bottom, 4px)',
    }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)}
            data-testid={`tab-${t.id}`}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 1, padding: '6px 0 4px', border: 'none', background: 'none', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}>
            <span style={{
              fontSize: 18, lineHeight: 1,
              color: active ? 'hsl(38 92% 58%)' : 'hsl(45 5% 40%)',
              transition: 'color 0.15s',
            }}>{t.icon}</span>
            <span style={{
              fontSize: 9, fontWeight: active ? 700 : 500,
              color: active ? 'hsl(38 92% 62%)' : 'hsl(45 5% 42%)',
              letterSpacing: '0.03em', fontFamily: 'Inter, sans-serif',
            }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── OOB View — compact single-screen ──
function MobOOBView({ data }: { data: OOBData }) {
  const { districts, armies, divisions, brigades, oryxLosses } = data;
  const [expandedDist, setExpandedDist] = useState<string | null>(null);
  const [expandedArmy, setExpandedArmy] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  const eqDb = useMemo(() => buildEquipmentDatabase(), []);

  const distArmies = useMemo(() => {
    const m = new Map<string, typeof armies>();
    districts.forEach(d => m.set(d.id, armies.filter(a => a.districtId === d.id)));
    return m;
  }, [districts, armies]);

  const divsByArmy = useMemo(() => {
    const m = new Map<string, typeof divisions>();
    armies.forEach(a => m.set(a.id, divisions.filter(d => d.armyId === a.id)));
    return m;
  }, [armies, divisions]);

  const brigsByParent = useMemo(() => {
    const m = new Map<string, typeof brigades>();
    [...armies, ...divisions].forEach(u => {
      m.set(u.id, brigades.filter(b => b.parentId === u.id));
    });
    return m;
  }, [armies, divisions, brigades]);

  // Equipment bar renderer
  const EqBar = ({ cat, auth, cur }: { cat: CategoryKey; auth: number; cur: number }) => {
    const { label, color } = CATEGORY_DISPLAY[cat];
    const pct = auth > 0 ? Math.round((cur / auth) * 100) : 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
        <span style={{ fontSize: 7, fontWeight: 800, color, width: 32, textAlign: 'right', letterSpacing: '0.04em' }}>{label}</span>
        <div style={{ flex: 1, height: 6, background: 'hsl(220 12% 16%)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 3, opacity: 0.85 }} />
          {/* Authorized ghost line */}
          <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: `${Math.max(0, 100 - pct)}%`, background: `${color}15`, borderRadius: '0 3px 3px 0' }} />
        </div>
        <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: pct > 60 ? color : '#ef4444', width: 44, textAlign: 'right' }}>
          {cur}/{auth}
        </span>
      </div>
    );
  };

  // Equipment detail lines for expanded sub-unit
  const EqDetail = ({ unitId }: { unitId: string }) => {
    const profile = eqDb.get(unitId);
    if (!profile) return <div style={{ fontSize: 8, color: 'hsl(45 5% 35%)', padding: '2px 0 2px 36px', fontStyle: 'italic' }}>Equipment data pending</div>;
    
    return (
      <div style={{ padding: '4px 8px 4px 20px' }}>
        {profile.equipment
          .sort((a, b) => CATEGORY_DISPLAY[a.category].priority - CATEGORY_DISPLAY[b.category].priority)
          .map((eq, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <span style={{ fontSize: 7, fontWeight: 800, color: CATEGORY_DISPLAY[eq.category].color, width: 30, textAlign: 'right' }}>
                {CATEGORY_DISPLAY[eq.category].label}
              </span>
              <span style={{ fontSize: 9, color: 'hsl(45 5% 62%)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {eq.model}
              </span>
              <span style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: eq.estimatedCurrent / eq.authorized > 0.6 ? CATEGORY_DISPLAY[eq.category].color : '#ef4444', flexShrink: 0 }}>
                {eq.estimatedCurrent}/{eq.authorized}
              </span>
            </div>
          ))}
        <div style={{ fontSize: 7, color: 'hsl(45 5% 30%)', marginTop: 3, fontStyle: 'italic' }}>
          SRC: {profile.sources}
        </div>
      </div>
    );
  };

  // Aggregate equipment summary for an army
  const ArmyEqSummary = ({ armyId, divIds, brigIds }: { armyId: string; divIds: string[]; brigIds: string[] }) => {
    const keys = getArmyEquipmentKeys(armyId, brigIds, divIds);
    const agg = aggregateEquipment(eqDb, keys);
    const cats: CategoryKey[] = ['ada', 'radar', 'artillery', 'mlrs', 'tank', 'ifv'];
    const hasSome = cats.some(c => agg.byCategory[c].authorized > 0);
    if (!hasSome) return null;
    
    return (
      <div style={{ padding: '4px 10px 6px 16px', background: 'hsl(220 15% 8%)' }}>
        <div style={{ fontSize: 8, color: 'hsl(38 70% 50%)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>
          Equipment Summary (Army + Subordinates)
        </div>
        {cats.map(c => {
          if (agg.byCategory[c].authorized === 0) return null;
          return <EqBar key={c} cat={c} auth={agg.byCategory[c].authorized} cur={agg.byCategory[c].current} />;
        })}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '8px 8px 0' }}>
      {/* KPIs — compact 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
        {[
          { label: 'TOTAL LOSSES', val: oryxLosses?.total?.toLocaleString() ?? '24,383', color: '#ef4444' },
          { label: 'DESTROYED', val: oryxLosses?.destroyed?.toLocaleString() ?? '19,028', color: '#f59e0b' },
          { label: 'ABANDONED', val: oryxLosses?.abandoned?.toLocaleString() ?? '1,204', color: '#3b82f6' },
          { label: 'CAPTURED', val: oryxLosses?.captured?.toLocaleString() ?? '3,180', color: '#22c55e' },
        ].map(k => (
          <div key={k.label} style={{
            background: 'hsl(220 15% 11%)', border: '1px solid hsl(220 12% 20%)',
            borderRadius: 4, padding: '5px 8px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 7, color: 'hsl(45 5% 45%)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Equipment Legend */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6, padding: '0 2px' }}>
        {(['ada', 'radar', 'artillery', 'mlrs', 'tank', 'ifv'] as CategoryKey[]).map(c => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: 1, background: CATEGORY_DISPLAY[c].color }} />
            <span style={{ fontSize: 7, color: 'hsl(45 5% 50%)', fontWeight: 600 }}>{CATEGORY_DISPLAY[c].label}</span>
          </div>
        ))}
        <span style={{ fontSize: 7, color: 'hsl(45 5% 35%)', marginLeft: 'auto' }}>curr/auth</span>
      </div>

      {/* Districts — compact accordion */}
      {districts.map(dist => {
        const dArmies = distArmies.get(dist.id) ?? [];
        const avg = dArmies.length ? dArmies.reduce((s, a) => s + a.strengthPct, 0) / dArmies.length : 0;
        const isOpen = expandedDist === dist.id;

        return (
          <div key={dist.id} style={{
            border: `1px solid ${dist.color ?? 'hsl(220 12% 22%)'}`,
            borderRadius: 5, marginBottom: 6, overflow: 'hidden',
          }}>
            {/* District header */}
            <div
              onClick={() => setExpandedDist(isOpen ? null : dist.id)}
              style={{
                display: 'flex', alignItems: 'center', padding: '8px 10px',
                background: 'hsl(220 15% 11%)', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(45 10% 88%)', letterSpacing: '0.02em' }}>{dist.name}</div>
                <div style={{ fontSize: 9, color: 'hsl(45 5% 48%)' }}>{dArmies.length} armies · HQ: {dist.hq}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: SC(avg), marginRight: 6 }}>
                {avg.toFixed(0)}%
              </div>
              <span style={{ fontSize: 10, color: 'hsl(45 5% 40%)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
            </div>

            {/* Armies */}
            {isOpen && dArmies.map(army => {
              const isArmyOpen = expandedArmy === army.id;
              const armyDivs = divsByArmy.get(army.id) ?? [];
              const armyBrigs = brigsByParent.get(army.id) ?? [];
              const proj = projCe(army.type, army.strengthPct);
              const trend = proj > army.strengthPct + 2 ? '▲' : proj < army.strengthPct - 2 ? '▼' : '►';
              const allDivBrigIds = armyDivs.flatMap(d => (brigsByParent.get(d.id) ?? []).map(b => b.id));
              const allBrigIds = [...armyBrigs.map(b => b.id), ...allDivBrigIds];

              return (
                <div key={army.id} style={{ borderTop: '1px solid hsl(220 12% 18%)' }}>
                  <div
                    onClick={() => setExpandedArmy(isArmyOpen ? null : army.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px 7px 16px', background: 'hsl(220 15% 9%)',
                      cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'hsl(38 92% 62%)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {army.name}
                      </div>
                      <div style={{ fontSize: 9, color: 'hsl(45 5% 45%)', marginTop: 1 }}>
                        HQ: {army.hq} · {armyDivs.length} div · {armyBrigs.length} sep brig
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: SC(army.strengthPct) }}>
                        {army.strengthPct.toFixed(0)}%
                      </div>
                      <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: SC(proj) }}>
                        {trend} {proj}%
                      </div>
                    </div>
                    <span style={{ fontSize: 9, color: 'hsl(45 5% 38%)', transform: isArmyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                  </div>
                  {/* CE bar */}
                  <div style={{ height: 2, background: 'hsl(220 12% 16%)', margin: '0 10px 0 16px' }}>
                    <div style={{ height: '100%', width: `${army.strengthPct}%`, background: SC(army.strengthPct), borderRadius: 1 }} />
                  </div>

                  {/* Expanded: equipment summary + subordinates */}
                  {isArmyOpen && (
                    <div style={{ background: 'hsl(220 15% 8%)' }}>
                      {/* Army equipment summary */}
                      <ArmyEqSummary
                        armyId={army.id}
                        divIds={armyDivs.map(d => d.id)}
                        brigIds={allBrigIds}
                      />

                      {/* Divisions */}
                      {armyDivs.map(div => {
                        const divBrigs = brigsByParent.get(div.id) ?? [];
                        const isDivOpen = expandedUnit === div.id;
                        return (
                          <div key={div.id} style={{ borderTop: '1px solid hsl(220 12% 14%)' }}>
                            <div
                              onClick={() => setExpandedUnit(isDivOpen ? null : div.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '5px 10px 5px 20px', cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                              }}>
                              <span style={{
                                fontSize: 7, padding: '1px 4px', borderRadius: 2,
                                background: 'hsl(220 15% 16%)', color: 'hsl(45 5% 60%)',
                                fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0,
                              }}>
                                {div.type === 'motor_rifle' ? 'MRD' : div.type === 'tank' ? 'TD' : 'DIV'}
                              </span>
                              <div style={{ flex: 1, minWidth: 0, fontSize: 10, color: 'hsl(45 5% 68%)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {div.name}
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: SC(div.strengthPct), flexShrink: 0 }}>
                                {div.strengthPct.toFixed(0)}%
                              </span>
                              <span style={{ fontSize: 8, color: 'hsl(45 5% 35%)', transform: isDivOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
                            </div>

                            {isDivOpen && (
                              <div style={{ background: 'hsl(220 15% 7%)' }}>
                                {/* Division ADA + Arty regiment equipment */}
                                {eqDb.has(div.id + '_adr') && (
                                  <div style={{ padding: '3px 8px 3px 28px' }}>
                                    <div style={{ fontSize: 7, color: '#ef4444', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 2 }}>DIV ADA REGIMENT</div>
                                    <EqDetail unitId={div.id + '_adr'} />
                                  </div>
                                )}
                                {eqDb.has(div.id + '_far') && (
                                  <div style={{ padding: '3px 8px 3px 28px' }}>
                                    <div style={{ fontSize: 7, color: '#f59e0b', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 2 }}>DIV ARTILLERY REGIMENT</div>
                                    <EqDetail unitId={div.id + '_far'} />
                                  </div>
                                )}

                                {/* Brigades/Regiments under division */}
                                {divBrigs.map(brig => {
                                  const isBrigOpen = expandedUnit === brig.id;
                                  return (
                                    <div key={brig.id} style={{ borderTop: '1px solid hsl(220 12% 12%)' }}>
                                      <div
                                        onClick={(e) => { e.stopPropagation(); setExpandedUnit(isBrigOpen ? div.id : brig.id); }}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: 4,
                                          padding: '4px 8px 4px 28px', cursor: 'pointer',
                                          WebkitTapHighlightColor: 'transparent',
                                        }}>
                                        <span style={{
                                          fontSize: 6, padding: '1px 3px', borderRadius: 2,
                                          background: brig.type === 'tank' ? 'hsl(120 40% 15%)' : 'hsl(220 15% 16%)',
                                          color: brig.type === 'tank' ? '#22c55e' : 'hsl(45 5% 55%)',
                                          fontWeight: 700, flexShrink: 0,
                                        }}>
                                          {brig.type === 'tank' ? 'TNK' : brig.type === 'motor_rifle' ? 'MR' : brig.type === 'naval_infantry' ? 'NI' : brig.type.slice(0, 3).toUpperCase()}
                                        </span>
                                        <span style={{ flex: 1, fontSize: 9, color: 'hsl(45 5% 62%)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {brig.name}
                                        </span>
                                        <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: SC(brig.strengthPct), flexShrink: 0 }}>
                                          {brig.strengthPct.toFixed(0)}%
                                        </span>
                                      </div>
                                      {isBrigOpen && <EqDetail unitId={brig.id} />}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Separate brigades (directly under army) */}
                      {armyBrigs.map(brig => {
                        const isBrigOpen = expandedUnit === brig.id;
                        return (
                          <div key={brig.id} style={{ borderTop: '1px solid hsl(220 12% 14%)' }}>
                            <div
                              onClick={() => setExpandedUnit(isBrigOpen ? null : brig.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '5px 10px 5px 20px', cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                              }}>
                              <span style={{
                                fontSize: 7, padding: '1px 4px', borderRadius: 2,
                                background: brig.type === 'spetsnaz' ? 'hsl(0 40% 18%)' : brig.type === 'naval_infantry' ? 'hsl(200 40% 16%)' : 'hsl(220 15% 16%)',
                                color: brig.type === 'spetsnaz' ? '#ef4444' : brig.type === 'naval_infantry' ? '#3b82f6' : 'hsl(45 5% 60%)',
                                fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0,
                              }}>
                                {brig.type === 'spetsnaz' ? 'SPTZ' : brig.type === 'naval_infantry' ? 'NI' : brig.type === 'air_assault' ? 'AA' : brig.type === 'tank' ? 'TNK' : 'MRB'}
                              </span>
                              <div style={{ flex: 1, minWidth: 0, fontSize: 10, color: 'hsl(45 5% 68%)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {brig.name}
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: SC(brig.strengthPct), flexShrink: 0 }}>
                                {brig.strengthPct.toFixed(0)}%
                              </span>
                              <span style={{ fontSize: 8, color: 'hsl(45 5% 35%)', transform: isBrigOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
                            </div>
                            {isBrigOpen && <EqDetail unitId={brig.id} />}
                          </div>
                        );
                      })}

                      {/* Army-level assets */}
                      {(eqDb.has(army.id + '_adb') || eqDb.has(army.id + '_fab') || eqDb.has(army.id + '_mb')) && (
                        <div style={{ borderTop: '1px solid hsl(220 12% 14%)', padding: '4px 10px 6px 20px', background: 'hsl(220 15% 7%)' }}>
                          <div style={{ fontSize: 8, color: 'hsl(38 70% 50%)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>ARMY-LEVEL ASSETS</div>
                          {eqDb.has(army.id + '_adb') && (
                            <div style={{ marginBottom: 4 }}>
                              <div style={{ fontSize: 7, color: '#ef4444', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 1 }}>ADA BRIGADE</div>
                              <EqDetail unitId={army.id + '_adb'} />
                            </div>
                          )}
                          {eqDb.has(army.id + '_fab') && (
                            <div style={{ marginBottom: 4 }}>
                              <div style={{ fontSize: 7, color: '#f59e0b', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 1 }}>ARTILLERY BRIGADE</div>
                              <EqDetail unitId={army.id + '_fab'} />
                            </div>
                          )}
                          {eqDb.has(army.id + '_mb') && (
                            <div>
                              <div style={{ fontSize: 7, color: '#a855f7', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 1 }}>MISSILE BRIGADE</div>
                              <EqDetail unitId={army.id + '_mb'} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Footer */}
      <div style={{ fontSize: 7, color: 'hsl(45 5% 28%)', padding: '8px 0 12px', lineHeight: 1.6, textAlign: 'center' }}>
        Grau/Bartles (FMSO 2017) · CNA 2019 · IISS MilBal 2024 · Oryx (live) · Janes · FM 1-02.2
      </div>
    </div>
  );
}

// ── Intel View — categorized feed with expandable stories ──
function MobIntelView() {
  const [activeCat, setActiveCat] = useState<IntelCategory>('top5');
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

  const stories = INTEL_STORIES.filter(s => s.category === activeCat);
  const catMeta = INTEL_CATEGORIES.find(c => c.key === activeCat)!;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '8px 8px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span className="live-dot" />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(38 92% 62%)', letterSpacing: '0.03em' }}>INTEL FEED</span>
        <span style={{ fontSize: 8, color: 'hsl(45 5% 40%)', marginLeft: 'auto' }}>LAST 48H · {INTEL_STORIES.length} REPORTS</span>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch' }}>
        {INTEL_CATEGORIES.map(cat => {
          const isActive = activeCat === cat.key;
          const count = INTEL_STORIES.filter(s => s.category === cat.key).length;
          return (
            <button key={cat.key} onClick={() => { setActiveCat(cat.key); setExpandedStory(null); }}
              data-testid={`intel-cat-${cat.key}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '4px 8px', fontSize: 8, fontWeight: isActive ? 700 : 500,
                background: isActive ? `${cat.color}22` : 'hsl(220 15% 11%)',
                border: `1px solid ${isActive ? cat.color : 'hsl(220 12% 22%)'}`,
                borderRadius: 12, color: isActive ? cat.color : 'hsl(45 5% 50%)',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
              <span style={{ fontSize: 10 }}>{cat.icon}</span>
              {cat.label}
              <span style={{
                fontSize: 7, fontWeight: 700, background: isActive ? cat.color : 'hsl(220 12% 22%)',
                color: isActive ? '#fff' : 'hsl(45 5% 55%)',
                borderRadius: 6, padding: '1px 4px', minWidth: 14, textAlign: 'center',
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Story cards */}
      {stories.map((story, i) => {
        const isOpen = expandedStory === story.id;
        return (
          <div key={story.id}
            data-testid={`intel-story-${story.id}`}
            style={{
              background: isOpen ? 'hsl(220 15% 12%)' : 'hsl(220 15% 10%)',
              border: `1px solid ${isOpen ? catMeta.color + '44' : 'hsl(220 12% 18%)'}`,
              borderRadius: 6, marginBottom: 5, overflow: 'hidden',
              transition: 'background 0.15s',
            }}>
            {/* Header row */}
            <div
              onClick={() => setExpandedStory(isOpen ? null : story.id)}
              style={{
                padding: '8px 10px', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{
                  fontSize: 8, fontWeight: 800, color: '#fff',
                  background: i === 0 ? '#ef4444' : i < 2 ? catMeta.color : 'hsl(220 12% 28%)',
                  padding: '1px 5px', borderRadius: 2, lineHeight: 1.5,
                }}>{i + 1}</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: catMeta.color }}>{story.source}</span>
                <span style={{
                  fontSize: 7, fontWeight: 700, marginLeft: 'auto',
                  color: story.reliability === 'HIGH' ? '#22c55e' : story.reliability === 'MED-HIGH' ? '#f59e0b' : '#94a3b8',
                  letterSpacing: '0.04em',
                }}>{story.reliability}</span>
                <span style={{ fontSize: 8, color: 'hsl(45 5% 40%)' }}>{story.date}</span>
                <span style={{ fontSize: 9, color: 'hsl(45 5% 38%)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'hsl(45 10% 88%)', lineHeight: 1.35 }}>
                {story.headline}
              </div>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div style={{
                padding: '0 10px 10px',
                borderTop: `1px solid ${catMeta.color}22`,
              }}>
                {/* Summary */}
                <div style={{ fontSize: 10, color: 'hsl(45 5% 65%)', lineHeight: 1.5, marginTop: 8, marginBottom: 8 }}>
                  {story.summary}
                </div>

                {/* Key details */}
                <div style={{ fontSize: 8, fontWeight: 700, color: catMeta.color, letterSpacing: '0.06em', marginBottom: 4, textTransform: 'uppercase' }}>
                  Key Details
                </div>
                {story.details.map((d, j) => (
                  <div key={j} style={{ display: 'flex', gap: 5, marginBottom: 3, paddingLeft: 4 }}>
                    <span style={{ color: catMeta.color, fontSize: 6, marginTop: 3, flexShrink: 0 }}>●</span>
                    <span style={{ fontSize: 9, color: 'hsl(45 5% 60%)', lineHeight: 1.4 }}>{d}</span>
                  </div>
                ))}

                {/* Significance */}
                <div style={{
                  marginTop: 8, padding: '6px 8px',
                  background: `${catMeta.color}11`,
                  border: `1px solid ${catMeta.color}22`,
                  borderRadius: 4,
                }}>
                  <div style={{ fontSize: 7, fontWeight: 800, color: catMeta.color, letterSpacing: '0.06em', marginBottom: 2 }}>SIGNIFICANCE</div>
                  <div style={{ fontSize: 9, color: 'hsl(45 5% 68%)', lineHeight: 1.45 }}>{story.significance}</div>
                </div>

                {/* Source link */}
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 8, color: 'hsl(45 5% 35%)' }}>SRC:</span>
                  <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 8, color: 'hsl(210 60% 55%)', textDecoration: 'none', wordBreak: 'break-all' }}>
                    {story.source} →
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Category summary footer */}
      <div style={{ padding: '6px 0 12px', display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        {INTEL_CATEGORIES.map(c => (
          <span key={c.key} style={{ fontSize: 7, color: 'hsl(45 5% 32%)' }}>
            {c.icon} {INTEL_STORIES.filter(s => s.category === c.key).length}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Sources Repository View ──
function MobSourcesView() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Totals for bar chart
  const maxTotal = Math.max(...SOURCE_REPO.map(s => Object.values(s.reports).reduce((a, b) => a + b, 0)));

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '8px 8px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(38 92% 62%)', letterSpacing: '0.03em', marginBottom: 2 }}>
        SOURCE REPOSITORY
      </div>
      <div style={{ fontSize: 8, color: 'hsl(45 5% 45%)', marginBottom: 8, lineHeight: 1.5 }}>
        {SOURCE_REPO.length} tracked sources · report counts by category
      </div>

      {/* Stacked bar legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {REPORT_TYPES.map(rt => (
          <div key={rt.key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: rt.color }} />
            <span style={{ fontSize: 8, color: 'hsl(45 5% 55%)', fontWeight: 600 }}>{rt.label}</span>
          </div>
        ))}
      </div>

      {/* Source list + stacked bars */}
      {SOURCE_REPO.map(src => {
        const total = Object.values(src.reports).reduce((a, b) => a + b, 0);
        const isExpanded = selectedSource === src.id;
        const typeColor =
          src.type === 'osint' ? '#22c55e' :
          src.type === 'official' ? '#3b82f6' :
          src.type === 'think_tank' ? '#f59e0b' :
          src.type === 'defense_intel' ? '#8b5cf6' : '#94a3b8';
        const typeLabel =
          src.type === 'osint' ? 'OSINT' :
          src.type === 'official' ? 'OFFICIAL' :
          src.type === 'think_tank' ? 'THINK TANK' :
          src.type === 'defense_intel' ? 'DEF INTEL' : 'MEDIA';

        return (
          <div key={src.id}
            onClick={() => setSelectedSource(isExpanded ? null : src.id)}
            style={{
              background: isExpanded ? 'hsl(220 15% 12%)' : 'hsl(220 15% 10%)',
              border: `1px solid ${isExpanded ? 'hsl(38 50% 30%)' : 'hsl(220 12% 18%)'}`,
              borderRadius: 5, marginBottom: 5, padding: '7px 10px', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              transition: 'background 0.15s',
            }}>
            {/* Row: name + total + reliability */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{
                fontSize: 7, fontWeight: 800, color: typeColor,
                background: `${typeColor}22`,
                padding: '1px 4px', borderRadius: 2, letterSpacing: '0.06em',
                flexShrink: 0,
              }}>{typeLabel}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(45 10% 88%)', flex: 1 }}>{src.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'hsl(38 80% 58%)', flexShrink: 0 }}>{total}</span>
              <span style={{
                fontSize: 7, fontWeight: 700, color: src.reliability === 'HIGH' ? '#22c55e' : '#f59e0b',
                letterSpacing: '0.04em', flexShrink: 0,
              }}>{src.reliability}</span>
            </div>

            {/* Stacked horizontal bar */}
            <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'hsl(220 12% 16%)' }}>
              {REPORT_TYPES.map(rt => {
                const v = src.reports[rt.key as ReportKey];
                if (!v) return null;
                return (
                  <div key={rt.key} style={{
                    width: `${(v / maxTotal) * 100}%`,
                    background: rt.color, minWidth: v > 0 ? 2 : 0,
                  }} />
                );
              })}
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid hsl(220 12% 20%)' }}>
                <div style={{ fontSize: 10, color: 'hsl(45 5% 55%)', marginBottom: 2, fontWeight: 600 }}>{src.full}</div>
                <div style={{ fontSize: 9, color: 'hsl(45 5% 42%)', lineHeight: 1.5, marginBottom: 6 }}>{src.desc}</div>

                {/* Individual counts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 }}>
                  {REPORT_TYPES.map(rt => {
                    const v = src.reports[rt.key as ReportKey];
                    return (
                      <div key={rt.key} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: rt.color }}>{v}</div>
                        <div style={{ fontSize: 7, color: 'hsl(45 5% 42%)', textTransform: 'uppercase', fontWeight: 600 }}>{rt.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* URL */}
                <div style={{ fontSize: 8, color: 'hsl(45 5% 35%)', marginTop: 4, wordBreak: 'break-all' }}>
                  {src.url}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Aggregate summary */}
      <div style={{
        background: 'hsl(220 15% 11%)', border: '1px solid hsl(220 12% 20%)',
        borderRadius: 5, padding: '8px 10px', marginTop: 4, marginBottom: 12,
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'hsl(38 70% 50%)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          Aggregate by Report Type
        </div>
        {REPORT_TYPES.map(rt => {
          const total = SOURCE_REPO.reduce((s, src) => s + src.reports[rt.key as ReportKey], 0);
          return (
            <div key={rt.key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: rt.color, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: 'hsl(45 5% 58%)', flex: 1 }}>{rt.label}</span>
              <div style={{ flex: 2, height: 5, borderRadius: 2, background: 'hsl(220 12% 16%)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(total / 200) * 100}%`, background: rt.color, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: rt.color, width: 28, textAlign: 'right' }}>{total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Projections View — compact bars ──
function MobProjectionsView() {
  const [activeCat, setActiveCat] = useState(0);
  const cat = PROJ_CATS[activeCat];

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '8px 8px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(38 92% 62%)', letterSpacing: '0.03em', marginBottom: 6 }}>
        EQUIPMENT PROJECTIONS 2022–2028
      </div>

      {/* Category selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {PROJ_CATS.map((c, i) => (
          <button key={c.key} onClick={() => setActiveCat(i)}
            style={{
              padding: '4px 8px', fontSize: 9, fontWeight: activeCat === i ? 700 : 500,
              background: activeCat === i ? `${c.color}22` : 'transparent',
              border: `1px solid ${activeCat === i ? c.color : 'hsl(220 12% 22%)'}`,
              borderRadius: 3, color: activeCat === i ? c.color : 'hsl(45 5% 50%)',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{
        background: 'hsl(220 15% 11%)', border: '1px solid hsl(220 12% 20%)',
        borderRadius: 5, padding: '10px',
      }}>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e' }} />
            <span style={{ fontSize: 9, color: 'hsl(45 5% 55%)' }}>Gains</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} />
            <span style={{ fontSize: 9, color: 'hsl(45 5% 55%)' }}>Losses</span>
          </div>
        </div>

        {cat.data.map((d, i) => {
          const maxVal = Math.max(...cat.data.flatMap(r => [r.g, r.l]));
          const isProjected = i >= 4;
          return (
            <div key={d.yr} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: isProjected ? 'hsl(38 80% 55%)' : 'hsl(45 5% 55%)',
                  fontFamily: 'JetBrains Mono, monospace', width: 22,
                  fontStyle: isProjected ? 'italic' : 'normal',
                }}>'{d.yr}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      height: 8, borderRadius: 2,
                      background: `${isProjected ? '#22c55e88' : '#22c55e'}`,
                      width: `${(d.g / maxVal) * 100}%`,
                      border: isProjected ? '1px dashed #22c55e' : 'none',
                    }} />
                    <span style={{ fontSize: 8, color: '#22c55e', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, flexShrink: 0 }}>
                      +{d.g.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      height: 8, borderRadius: 2,
                      background: `${isProjected ? '#ef444488' : '#ef4444'}`,
                      width: `${(d.l / maxVal) * 100}%`,
                      border: isProjected ? '1px dashed #ef4444' : 'none',
                    }} />
                    <span style={{ fontSize: 8, color: '#ef4444', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, flexShrink: 0 }}>
                      -{d.l.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              {/* Net */}
              <div style={{ textAlign: 'right', fontSize: 8, fontFamily: 'JetBrains Mono, monospace', color: d.g > d.l ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                NET: {d.g > d.l ? '+' : ''}{(d.g - d.l).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 8, color: 'hsl(45 5% 30%)', padding: '8px 0 12px', lineHeight: 1.6, textAlign: 'center' }}>
        Gains = production + refurb. Losses = Oryx-confirmed + est. · Dashed = projected · Janes / FISA / Frontelligence
      </div>
    </div>
  );
}

// ── Map View — wrapper for TacticalMap ──
function MobMapView({ data }: { data: OOBData }) {
  return (
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      <TacticalMap
        armies={data.armies}
        divs={data.divisions}
        brigsMap={new Map()}
        equipment={data.equipment}
      />
    </div>
  );
}

// ── Chatbot (Client-side RAG with TF-IDF search) ──
interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

function ChatBot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: 'Red Ledger analyst ready. Ask me about Russian Ground Forces OOB, equipment, losses, production, oil strikes, rail, drones, foreign aid, or anything in the app.\n\nTry: "What are Russian tank losses?" or "Tell me about Ukraine drones"' },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');

    // Search knowledge base
    const results = searchKB(userMsg, 3);
    let answer: string;
    let sources: string[] = [];

    if (results.length > 0 && results[0]) {
      // Combine top results into a comprehensive answer
      const primary = results[0];
      const parts = [primary.answer];
      sources = [primary.category.toUpperCase()];

      // If there are relevant secondary results, add key info
      if (results.length > 1 && results[1]) {
        const secondary = results[1];
        // Only add if it's substantially different
        if (secondary.id !== primary.id && secondary.category !== primary.category) {
          parts.push('\n\nRelated: ' + secondary.answer.split('. ').slice(0, 2).join('. ') + '.');
          sources.push(secondary.category.toUpperCase());
        }
      }
      answer = parts.join('');
    } else {
      answer = 'I don\'t have specific data on that topic. Try asking about:\n• Russian Ground Forces OOB structure\n• Equipment (tanks, artillery, ADA, IFVs)\n• Oryx-verified losses\n• Production rates\n• Oil strike campaign\n• Rail logistics\n• Ukrainian drones\n• Foreign military aid\n• App features & data sources';
    }

    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMsg },
      { role: 'assistant', content: answer, sources },
    ]);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, top: 0,
      background: 'hsl(220 15% 6%)',
      display: 'flex', flexDirection: 'column',
      zIndex: 999,
    }}>
      {/* Chat header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        background: 'hsl(220 15% 9%)',
        borderBottom: '1px solid hsl(220 12% 18%)',
        flexShrink: 0,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'hsl(38 92% 62%)' }}>RED LEDGER ANALYST</div>
          <div style={{ fontSize: 8, color: 'hsl(45 5% 42%)' }}>Knowledge-base intelligence search</div>
        </div>
        <button onClick={onClose} data-testid="chat-close"
          style={{
            background: 'none', border: '1px solid hsl(220 12% 25%)',
            borderRadius: 4, padding: '4px 10px', color: 'hsl(45 5% 55%)',
            fontSize: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>CLOSE</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '8px 10px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 6,
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '8px 10px',
              borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
              background: msg.role === 'user' ? 'hsl(38 50% 20%)' : 'hsl(220 15% 13%)',
              border: `1px solid ${msg.role === 'user' ? 'hsl(38 50% 30%)' : 'hsl(220 12% 20%)'}`,
            }}>
              <div style={{ fontSize: 10, color: 'hsl(45 5% 75%)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                  {msg.sources.map((s, si) => (
                    <span key={si} style={{
                      fontSize: 7, fontWeight: 700, letterSpacing: '0.05em',
                      padding: '1px 5px', borderRadius: 3,
                      background: 'hsl(38 50% 15%)', color: 'hsl(38 80% 60%)',
                      border: '1px solid hsl(38 30% 25%)',
                    }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 6, padding: '8px 10px',
        paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)',
        background: 'hsl(220 15% 8%)',
        borderTop: '1px solid hsl(220 12% 18%)',
        flexShrink: 0,
      }}>
        <input
          data-testid="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about OOB, equipment, losses..."
          style={{
            flex: 1, padding: '8px 10px', fontSize: 11,
            background: 'hsl(220 15% 12%)', border: '1px solid hsl(220 12% 22%)',
            borderRadius: 6, color: 'hsl(45 5% 85%)',
            outline: 'none', fontFamily: 'Inter, sans-serif',
          }}
        />
        <button onClick={send} data-testid="chat-send"
          disabled={!input.trim()}
          style={{
            padding: '8px 14px', fontSize: 10, fontWeight: 700,
            background: input.trim() ? 'hsl(38 80% 45%)' : 'hsl(220 12% 18%)',
            color: input.trim() ? '#fff' : 'hsl(45 5% 40%)',
            border: 'none', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}>SEND</button>
      </div>
    </div>
  );
}

// ─── MAIN MOBILE APP ─────────────────────────────────────────────────────────
export default function MobileApp() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<MobileTab>('oob');
  const [chatOpen, setChatOpen] = useState(false);

  const { data, isLoading } = useQuery<OOBData>({
    queryKey: ['/api/oob'],
    refetchInterval: 5 * 60 * 1000,
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/refresh'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/oob'] }),
  });

  if (isLoading || !data) {
    return (
      <div style={{
        height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: 'hsl(220 15% 8%)',
      }}>
        <img src={ravenLogo} alt="" style={{ width: 28, height: 28, borderRadius: '50%', opacity: 0.7 }} />
        <span style={{ color: 'hsl(38 92% 58%)', fontSize: 11 }}>LOADING…</span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', maxHeight: '100dvh',
      overflow: 'hidden',
      background: 'hsl(220 15% 8%)',
    }}>
      <StatusBar onRefresh={() => refreshMutation.mutate()} isRefreshing={refreshMutation.isPending} />

      {/* Content — fills remaining space */}
      {tab === 'oob' && <MobOOBView data={data} />}
      {tab === 'map' && <MobMapView data={data} />}
      {tab === 'intel' && <MobIntelView />}
      {tab === 'sources' && <MobSourcesView />}
      {tab === 'proj' && <MobProjectionsView />}

      <BottomTabs tab={tab} setTab={setTab} />

      {/* Floating chat button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          data-testid="chat-fab"
          style={{
            position: 'fixed', bottom: 72, right: 12,
            width: 44, height: 44, borderRadius: '50%',
            background: 'hsl(38 80% 45%)',
            border: '2px solid hsl(38 80% 55%)',
            boxShadow: '0 2px 12px hsl(0 0% 0% / 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 100,
          }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>💬</span>
        </button>
      )}

      {/* Chat overlay */}
      {chatOpen && <ChatBot onClose={() => setChatOpen(false)} />}
    </div>
  );
}

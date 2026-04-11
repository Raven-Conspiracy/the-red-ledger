import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ravenLogo from '@assets/taskforce-raven.jpg';
import type { MilitaryDistrict, Army, Division, Brigade, UnitEquipment, OryxLoss } from '@shared/schema';
import { TacticalMap } from './TacticalMap';

export interface OOBData {
  districts: MilitaryDistrict[];
  armies: Army[];
  divisions: Division[];
  brigades: Brigade[];
  equipment: UnitEquipment[];
  oryxLosses: OryxLoss[];
  lastUpdated: string | null;
}

// ─── LIVE INTEL FEED — Top 5 trusted OSINT sources ─────────────────────────
// Sources ranked by analytical rigor and verification standards:
// 1. ISW (Institute for the Study of War) — daily campaign assessments
// 2. DeepStateMap (@DeepStateUA) — real-time frontline map, UA military-linked
// 3. Oryx — visually confirmed equipment losses (absolute minimum baseline)
// 4. Ukrainian General Staff (GeneralStaff.ua) — official daily loss reports
// 5. Bellingcat — geolocation verification and investigation
const LIVE_INTEL = [
  {
    id: 1,
    priority: 1,
    source: 'ISW — Institute for the Study of War',
    account: 'understandingwar.org',
    date: 'Apr 8, 2026',
    type: 'losses',
    headline: 'Russian artillery losses surge: +63 systems in a single day',
    body: 'ISW / Ukrainian General Staff reports 1,030 KIA and heavy equipment losses Apr 8: +63 artillery systems (cumulative 39,625), +5 tanks (11,846 total), +4 ACVs (24,368 total), +1,960 UAVs (225,301 total). Highest single-day artillery attrition since Jan 2026. ISW assesses Russian forces continue to absorb disproportionate losses relative to territorial gains.',
    url: 'https://www.criticalthreats.org/analysis/russian-offensive-campaign-assessment-april-6-2026',
  },
  {
    id: 2,
    priority: 2,
    source: 'DeepStateMap — @DeepStateUA',
    account: 'deepstatemap.live',
    date: 'Apr 7–8, 2026',
    type: 'ground',
    headline: 'Frontline update: Ukrainian advances confirmed in Yampil; Kupyansk urban fighting',
    body: 'DeepStateMap geolocated footage confirms Ukrainian forces advanced in central Yampil (SE of Lyman) — Russian 204th Akhmat Spetsnaz Regiment shelling UA positions. Russian attacks within Kupyansk city itself; UA counterattacks confirmed in northern Kupyansk. Frontline changes in Zaporizhia: clashes near Shcherbaky (W of Orikhiv). Russian forces completed capture of Hishna settlement per geolocated imagery.',
    url: 'https://deepstatemap.live',
  },
  {
    id: 3,
    priority: 3,
    source: 'Oryx — Visual Equipment Loss Tracker',
    account: 'oryxspioenkop.com',
    date: 'Apr 6–8, 2026',
    type: 'losses',
    headline: 'Oryx confirmed: 11,846 tanks, 24,383 total vehicles — loss rate accelerating',
    body: 'Latest Oryx visual confirmation: 11,846 Russian tanks destroyed/damaged/abandoned/captured since Feb 2022. Total equipment: 24,383 (19,028 destroyed, 1,204 abandoned, 3,180 captured). Self-propelled artillery: 1,008 confirmed. MLRS: 580 confirmed. These are visual-confirmation minimums — actual losses significantly higher. Current loss rate: approx 25–30 tanks/week.',
    url: 'https://www.oryxspioenkop.com/2022/02/attack-on-europe-documenting-equipment.html',
  },
  {
    id: 4,
    priority: 4,
    source: 'Ukrainian General Staff — Official',
    account: 'GeneralStaff.ua',
    date: 'Apr 6, 2026',
    type: 'personnel',
    headline: 'Q1 2026: Russian casualties (85,290) exceed new contracts (80,456) — 4th consecutive month',
    body: 'Ukrainian General Staff: Q1 2026 Russian recruitment (80,456 contracts) fell below battlefield losses (est. 85,290 KIA+WIA requiring replacement) for the 4th consecutive month. Cumulative personnel losses since Feb 2022: ~1,306,500. Russian forces fired 141 drones overnight Apr 5–6 (Shahed/Gerbera/Italmas types), causing power outages across Sumy, Kharkiv, Odesa, Kherson, Chernihiv oblasts.',
    url: 'https://www.criticalthreats.org/analysis/russian-offensive-campaign-assessment-april-6-2026',
  },
  {
    id: 5,
    priority: 5,
    source: 'Bellingcat — Geolocation & Verification',
    account: 'bellingcat.com',
    date: 'Apr 5–6, 2026',
    type: 'strike',
    headline: 'Geolocated: Ukraine struck Sheskharis oil terminal and Admiral Makarov at Novorossiysk',
    body: 'Bellingcat-affiliated analysts geolocated and verified: Ukrainian naval drones struck the Sheskharis oil terminal at Novorossiysk (Apr 5–6), causing large fires visible via satellite (NASA FIRMS confirmed). Admiral Makarov frigate (Project 11356R — primary Kalibr launcher) reported struck in port. Separately, geolocated footage confirmed Ukrainian strike on Pantsir-S ADS at Melitopol Air Base.',
    url: 'https://www.bellingcat.com',
  },
]

// ─── STATIC INTEL DATA (from research) ───────────────────────────────────────
const INTEL_NEWS = [
  {
    id: 1, type: 'personnel', date: '27 Mar 2026',
    headline: '80,000+ contracts signed in first Q1 2026',
    body: 'Deputy PM Medvedev confirmed 80,000+ new contract soldiers signed since Jan 2026. Full-year 2026 MoD target: 409,000. Monthly target: 33,500–37,000.',
    source: 'RIA Novosti / Caliber.az',
  },
  {
    id: 2, type: 'personnel', date: 'Jan 2026',
    headline: '422,704 contracts signed in 2025 — 6% drop from 2024',
    body: 'Down from 450,000 in 2024. ~32,000 additional volunteers. Some regions cutting sign-up bonuses due to budget pressure. ~30,000 contracts/month pace sustained.',
    source: 'Reuters / Moscow Times',
  },
  {
    id: 3, type: 'production', date: 'Feb 2026',
    headline: 'Russia produced 7 million shells in 2025 — 17× pre-war levels',
    body: 'Estonia FISA: 7M rounds total in 2025. Breakdown: 3.4M howitzer (122–203mm), 2.3M mortar (120–240mm), 0.8M tank ammo, 0.5M MLRS. Fires ~10,000 shells/day.',
    source: 'Estonian Foreign Intelligence Service',
  },
  {
    id: 4, type: 'production', date: 'Nov 2025',
    headline: '250–300 new T-90M tanks delivered in 2025',
    body: 'Uralvagonzavod delivered 250–300 newly built T-90Ms in 2025. Plus ~1,500 refurbished Soviet-era tanks from storage. T-90M units in service grew from 2 to ~20 since 2022.',
    source: 'Janes / Defence-UA / OSINT',
  },
  {
    id: 5, type: 'production', date: 'May 2025',
    headline: '1,500 tanks, 3,000 AFVs and 250,000 shells/month projected for 2025',
    body: 'Western intelligence estimates: Russia on track for 1,500 tanks/year (combined new+refurb), 3,000 AFVs/year, 250,000 artillery shells/month (~3M/year new build).',
    source: 'Censor.net / Western Intel',
  },
  {
    id: 6, type: 'projection', date: 'Oct 2025',
    headline: 'T-90M2 "Ryvok-1" production planned from 2026; 1,783 tanks 2026–2036',
    body: 'Leaked documents show 10 T-90M2 units in 2026, ramping to 428/year by 2028 peak. 1,118 tanks planned 2027–2029. Full decade target: 1,783 T-90M/M2.',
    source: 'Frontelligence Insight (leaked docs)',
  },
  {
    id: 7, type: 'personnel', date: 'Nov 2025',
    headline: 'Recruitment pace stable at ~30,000 contracts/month',
    body: 'Regional budget data confirms ~30,000/month. October 2025 estimate: 37,938. Budget cycle inflates year-end figures. New reservist mobilization law passed but Kremlin says no forced draft planned.',
    source: 'Russianomics / Janis Kluge',
  },
  {
    id: 8, type: 'projection', date: 'Feb 2026',
    headline: 'Defense spending $175.5B in 2025 — 6.31% of GDP',
    body: 'Record military budget. ~2.5–3M defense workers employed. Reported shortage of 400,000 skilled workers limiting production scale-up. Shell production costs: ~€10.6B (1 trillion rubles) in 2025.',
    source: 'Militarnyi / WifiTalents',
  },
];

// ─── EQUIPMENT PROJECTION DATA ────────────────────────────────────────────────
const PROJ_YEARS = [2022, 2023, 2024, 2025, 2026, 2027, 2028];
const PROJ_DATA = {
  tanks: {
    label: 'Tanks (MBT)',
    color: '#f59e0b',
    gained:  [400,  900,  1400, 1840, 1900, 2100, 2500],
    lost:    [1500, 900,  1100, 1050, 900,  850,  800],
    notes: 'Gains = new production + refurb from storage. Losses = Oryx-confirmed + est. unreported.',
  },
  artillery_sp: {
    label: 'Self-Propelled Artillery',
    color: '#ef4444',
    gained:  [200, 350, 420, 480, 500, 520, 550],
    lost:    [300, 350, 400, 380, 350, 330, 310],
    notes: 'Gains include 2S19, 2S35 new production + 2S3 refurb from storage.',
  },
  ifv: {
    label: 'IFVs / APCs',
    color: '#3b82f6',
    gained:  [600,  900,  1200, 1400, 1500, 1600, 1700],
    lost:    [1800, 1400, 1600, 1500, 1400, 1300, 1200],
    notes: 'BMP-1/2/3 new + refurb. BMP-3 production ramping at Kurganmashzavod.',
  },
  mlrs: {
    label: 'MLRS',
    color: '#8b5cf6',
    gained:  [80,  120, 150, 180, 200, 220, 240],
    lost:    [120, 140, 160, 140, 130, 120, 110],
    notes: 'BM-21 Grad, Tornado-G, BM-30 Smerch, Uragan combined.',
  },
};

// ─── NATO APP-6D SYMBOLOGY — Unit patches mapped by unitId ────────────────────
// Wikimedia Commons SVG files via Special:FilePath proxy
const UNIT_PATCHES: Record<string, { url: string; label: string }> = {
  // Army-level patches
  '1gta':  { url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Great_emblem_of_the_1st_Guards_Tank_Army.svg', label: '1st GTA' },
  '8gca':  { url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sleeve_patch_of_the_8th_Combined_Arms_Army.svg', label: '8th GCAA' },
  '58gca': { url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sleeve_patch_of_the_58th_Combined_Arms_Army.svg', label: '58th GCAA' },
  // Division patches
  '2gmd':  { url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Emblem_of_the_2nd_Guards_Tamanskaya_Motor_Rifle_Division.svg', label: '2nd Gds MRD' },
  '4gtd':  { url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Emblem_of_the_4th_Guards_Kantemirovskaya_Tank_Division.svg', label: '4th Gds TD' },
  '150md': { url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sleeve_patch_of_the_150th_Motor_Rifle_Division.svg', label: '150th MRD' },
  '42gmd': { url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Emblem_of_the_42nd_Guards_Motor_Rifle_Division.svg', label: '42nd Gds MRD' },
};

// ─── PRE-2022 TO&E BASELINE EQUIPMENT (Russian Way of War, Grau & Bartles 2016) ─
// Provides baseline for all units — used when DB has no equipment record
// Format: { equipmentType, model, authorizedCount, estimatedLost }
const UNIT_BASELINE: Record<string, Array<{ equipmentType: string; equipmentModel: string; authorizedCount: number; estimatedLost: number }>> = {
  // ── Motor Rifle Division (MRD) baseline ──────────────────────────────────────
  '2gmd':   [ // 2nd Guards 'Tamanskaya' MRD — full MRD TO&E
    { equipmentType: 'sam',          equipmentModel: 'Buk-M2/Tor-M2 ADA Bn',         authorizedCount: 18, estimatedLost: 9 },
    { equipmentType: 'radar',        equipmentModel: 'Zoopark-1M Counter-Battery Radar', authorizedCount: 4,  estimatedLost: 2 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S 152mm SPH',         authorizedCount: 54, estimatedLost: 30 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad / BM-30 Smerch',    authorizedCount: 18, estimatedLost: 9 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3/T-80U MBT',             authorizedCount: 180, estimatedLost: 100 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2/BMP-3 IFV',              authorizedCount: 300, estimatedLost: 175 },
  ],
  '144gmd': [ // 144th Guards MRD
    { equipmentType: 'sam',          equipmentModel: 'Buk-M2 ADA Bn',                authorizedCount: 12, estimatedLost: 5 },
    { equipmentType: 'radar',        equipmentModel: 'Zoopark-1M Radar',             authorizedCount: 3,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S / 2S3 Akatsiya',   authorizedCount: 54, estimatedLost: 22 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 18, estimatedLost: 8 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 180, estimatedLost: 72 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 300, estimatedLost: 130 },
  ],
  '150md':  [ // 150th MRD — already partial in DB, supplement
    { equipmentType: 'sam',          equipmentModel: 'Tor-M1 / Strela-10 ADA',       authorizedCount: 12, estimatedLost: 6 },
    { equipmentType: 'radar',        equipmentModel: 'Zoo-1M Counter-Battery Radar',  authorizedCount: 3,  estimatedLost: 2 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 54, estimatedLost: 28 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 18, estimatedLost: 10 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 150, estimatedLost: 85 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 250, estimatedLost: 150 },
  ],
  '42gmd':  [ // 42nd Guards MRD
    { equipmentType: 'sam',          equipmentModel: 'Pantsir-S1 / Tor-M2 ADA',      authorizedCount: 12, estimatedLost: 5 },
    { equipmentType: 'radar',        equipmentModel: 'Zoopark-1M Radar',             authorizedCount: 3,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 54, estimatedLost: 25 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad / Tornado-G',        authorizedCount: 18, estimatedLost: 8 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3/T-80BVM MBT',           authorizedCount: 180, estimatedLost: 90 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2/3 IFV',                  authorizedCount: 300, estimatedLost: 155 },
  ],
  '68gmd':  [
    { equipmentType: 'sam',          equipmentModel: 'Buk-M2 ADA Bn',                authorizedCount: 12, estimatedLost: 4 },
    { equipmentType: 'radar',        equipmentModel: 'Zoopark-1 Radar',              authorizedCount: 3,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 54, estimatedLost: 18 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 18, estimatedLost: 6 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 180, estimatedLost: 65 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 300, estimatedLost: 110 },
  ],
  '69gmd':  [
    { equipmentType: 'sam',          equipmentModel: 'Buk-M2 ADA Bn',                authorizedCount: 12, estimatedLost: 4 },
    { equipmentType: 'radar',        equipmentModel: 'Zoopark-1 Radar',              authorizedCount: 3,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 54, estimatedLost: 18 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 18, estimatedLost: 6 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 180, estimatedLost: 65 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 300, estimatedLost: 110 },
  ],
  '72md':   [
    { equipmentType: 'sam',          equipmentModel: 'Buk-M2 ADA Bn',                authorizedCount: 12, estimatedLost: 4 },
    { equipmentType: 'radar',        equipmentModel: 'Zoopark-1 Radar',              authorizedCount: 3,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 54, estimatedLost: 18 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 18, estimatedLost: 6 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 150, estimatedLost: 55 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 250, estimatedLost: 95 },
  ],
  '3gmd':   [
    { equipmentType: 'sam',          equipmentModel: 'Buk-M2 / Tor-M2',              authorizedCount: 12, estimatedLost: 5 },
    { equipmentType: 'radar',        equipmentModel: 'Zoopark-1M Radar',             authorizedCount: 3,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 54, estimatedLost: 22 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 18, estimatedLost: 8 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 180, estimatedLost: 75 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 300, estimatedLost: 130 },
  ],
  '73md':   [
    { equipmentType: 'sam',          equipmentModel: 'Tor-M2 ADA',                   authorizedCount: 8,  estimatedLost: 2 },
    { equipmentType: 'radar',        equipmentModel: 'Zoo-1M Radar',                 authorizedCount: 2,  estimatedLost: 0 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 36, estimatedLost: 12 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 12, estimatedLost: 4 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 120, estimatedLost: 40 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2/3 IFV',                  authorizedCount: 200, estimatedLost: 70 },
  ],
  '74md':   [
    { equipmentType: 'sam',          equipmentModel: 'Tor-M2 ADA',                   authorizedCount: 8,  estimatedLost: 2 },
    { equipmentType: 'radar',        equipmentModel: 'Zoo-1M Radar',                 authorizedCount: 2,  estimatedLost: 0 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 36, estimatedLost: 12 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 12, estimatedLost: 4 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 120, estimatedLost: 40 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2/3 IFV',                  authorizedCount: 200, estimatedLost: 70 },
  ],
  '127md':  [
    { equipmentType: 'sam',          equipmentModel: 'Buk-M2 ADA Bn',                authorizedCount: 12, estimatedLost: 4 },
    { equipmentType: 'radar',        equipmentModel: 'Zoopark-1 Radar',              authorizedCount: 3,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 54, estimatedLost: 20 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 18, estimatedLost: 7 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 180, estimatedLost: 70 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 300, estimatedLost: 120 },
  ],
  '36bmd':  [
    { equipmentType: 'sam',          equipmentModel: 'Tor-M1 ADA',                   authorizedCount: 8,  estimatedLost: 3 },
    { equipmentType: 'radar',        equipmentModel: 'Zoo-1M Radar',                 authorizedCount: 2,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 36, estimatedLost: 15 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 12, estimatedLost: 5 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 120, estimatedLost: 50 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 200, estimatedLost: 88 },
  ],
  // ── Tank Division (TD) baseline ──────────────────────────────────────────────
  '4gtd':   [ // already has DB data but supplement
    { equipmentType: 'sam',          equipmentModel: 'S-300V4 / Buk-M2 ADA Regt',    authorizedCount: 24, estimatedLost: 12 },
    { equipmentType: 'radar',        equipmentModel: 'Zoopark-1M / Niobiy Radar',    authorizedCount: 6,  estimatedLost: 3 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S 152mm SPH',        authorizedCount: 72, estimatedLost: 42 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-30 Smerch / Uragan MLRS',   authorizedCount: 12, estimatedLost: 7 },
    { equipmentType: 'tank',         equipmentModel: 'T-80U / T-90M MBT',            authorizedCount: 280, estimatedLost: 175 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV (MR Bn)',            authorizedCount: 150, estimatedLost: 95 },
  ],
  '47gtd':  [
    { equipmentType: 'sam',          equipmentModel: 'Buk-M2 ADA Bn',                authorizedCount: 18, estimatedLost: 7 },
    { equipmentType: 'radar',        equipmentModel: 'Zoopark-1M Radar',             authorizedCount: 4,  estimatedLost: 2 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 54, estimatedLost: 22 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-30 Smerch',                 authorizedCount: 12, estimatedLost: 5 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 / T-90M MBT',           authorizedCount: 220, estimatedLost: 88 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 120, estimatedLost: 50 },
  ],
  '90gtd':  [
    { equipmentType: 'sam',          equipmentModel: 'Buk-M2 / Pantsir-S1 ADA',      authorizedCount: 18, estimatedLost: 10 },
    { equipmentType: 'radar',        equipmentModel: 'Zoopark-1M Radar',             authorizedCount: 4,  estimatedLost: 2 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S / 2S35 Koalitsiya', authorizedCount: 54, estimatedLost: 32 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-30 Smerch MLRS',            authorizedCount: 12, estimatedLost: 7 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 / T-90M MBT',           authorizedCount: 250, estimatedLost: 145 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 120, estimatedLost: 72 },
  ],
  // ── Motor Rifle Brigade (MRB) baseline ───────────────────────────────────────
  '27mrb':  [
    { equipmentType: 'sam',          equipmentModel: 'Tor-M2 / Strela-10 ADA',       authorizedCount: 8,  estimatedLost: 4 },
    { equipmentType: 'radar',        equipmentModel: 'Zoo-1M Counter-Battery Radar',  authorizedCount: 2,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 18, estimatedLost: 10 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 6,  estimatedLost: 3 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 40, estimatedLost: 24 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 150, estimatedLost: 90 },
  ],
  '128mrb': [
    { equipmentType: 'sam',          equipmentModel: 'Tor-M2 ADA',                   authorizedCount: 8,  estimatedLost: 3 },
    { equipmentType: 'radar',        equipmentModel: 'Zoo-1M Radar',                 authorizedCount: 2,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 18, estimatedLost: 7 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 6,  estimatedLost: 2 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 40, estimatedLost: 16 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2/BTR-82A',                authorizedCount: 150, estimatedLost: 62 },
  ],
  '155nb':  [
    { equipmentType: 'sam',          equipmentModel: 'Tor-M1 / 9K38 Igla ADA',       authorizedCount: 8,  estimatedLost: 5 },
    { equipmentType: 'radar',        equipmentModel: 'Antipode-1 / Zoo-1M Radar',    authorizedCount: 2,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S1 Gvozdika / 2S9 Nona',      authorizedCount: 18, estimatedLost: 11 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 6,  estimatedLost: 3 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT (NI variant)',       authorizedCount: 30, estimatedLost: 20 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-3 IFV (amphibious)',        authorizedCount: 100, estimatedLost: 68 },
  ],
  '136gmrb': [
    { equipmentType: 'sam',          equipmentModel: 'Buk-M2 ADA',                   authorizedCount: 8,  estimatedLost: 3 },
    { equipmentType: 'radar',        equipmentModel: 'Zoo-1M Radar',                 authorizedCount: 2,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 18, estimatedLost: 8 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 6,  estimatedLost: 2 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 40, estimatedLost: 18 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 150, estimatedLost: 72 },
  ],
  '810nb':  [
    { equipmentType: 'sam',          equipmentModel: 'Tor-M1 / Pantsir-S1 ADA',      authorizedCount: 8,  estimatedLost: 4 },
    { equipmentType: 'radar',        equipmentModel: 'Zoo-1M / Antipode Radar',      authorizedCount: 2,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S1 Gvozdika / 2S9 Nona',      authorizedCount: 18, estimatedLost: 10 },
    { equipmentType: 'mlrs',         equipmentModel: 'BM-21 Grad',                   authorizedCount: 6,  estimatedLost: 3 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 / T-80BVM MBT',         authorizedCount: 35, estimatedLost: 20 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-3 IFV (amphibious)',        authorizedCount: 110, estimatedLost: 70 },
  ],
  // Regimental baselines (subset of a brigade)
  '6tb':   [
    { equipmentType: 'sam',          equipmentModel: 'Strela-10 / Tor-M1 ADA',       authorizedCount: 4,  estimatedLost: 3 },
    { equipmentType: 'radar',        equipmentModel: 'Zoo-1M Radar',                 authorizedCount: 1,  estimatedLost: 1 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 18, estimatedLost: 12 },
    { equipmentType: 'tank',         equipmentModel: 'T-80U / T-90M MBT',            authorizedCount: 93, estimatedLost: 62 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 40, estimatedLost: 28 },
  ],
  '13tb':  [
    { equipmentType: 'sam',          equipmentModel: 'Strela-10 ADA',                authorizedCount: 4,  estimatedLost: 2 },
    { equipmentType: 'radar',        equipmentModel: 'Zoo-1M Radar',                 authorizedCount: 1,  estimatedLost: 0 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 18, estimatedLost: 9 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 40, estimatedLost: 22 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 120, estimatedLost: 65 },
  ],
  '15mrr': [
    { equipmentType: 'sam',          equipmentModel: 'Strela-10 ADA',                authorizedCount: 4,  estimatedLost: 2 },
    { equipmentType: 'radar',        equipmentModel: 'Zoo-1M Radar',                 authorizedCount: 1,  estimatedLost: 0 },
    { equipmentType: 'artillery_sp', equipmentModel: '2S19 Msta-S',                   authorizedCount: 18, estimatedLost: 9 },
    { equipmentType: 'tank',         equipmentModel: 'T-72B3 MBT',                   authorizedCount: 40, estimatedLost: 22 },
    { equipmentType: 'ifv',          equipmentModel: 'BMP-2 IFV',                    authorizedCount: 120, estimatedLost: 65 },
  ],
};

// ─── TOP-5 MISSION-CRITICAL EQUIPMENT per unit type ───────────────────────────
// Priority: ADA > Radars > Artillery > MLRS > Type-specific
const MISSION_EQUIPMENT: Record<string, Array<{ priority: number; name: string; role: string }>> = {
  motor_rifle: [
    { priority: 1, name: 'Buk-M2 / Tor-M2 ADA System',          role: 'Air defense — protects formation from air/missile' },
    { priority: 2, name: 'Zoopark-1M Counter-Battery Radar',     role: 'Locates enemy artillery for counter-fire' },
    { priority: 3, name: '2S19 Msta-S 152mm SPH',                role: 'Primary indirect fire support' },
    { priority: 4, name: 'BM-21 Grad / Tornado-G MLRS',          role: 'Area suppression and deep fires' },
    { priority: 5, name: 'BMP-2/3 IFV',                          role: 'Mechanized infantry transport and fire support' },
  ],
  tank: [
    { priority: 1, name: 'S-300V4 / Buk-M2 ADA System',         role: 'Air defense — critical for tank formations' },
    { priority: 2, name: 'Zoopark-1M Counter-Battery Radar',     role: 'Counter-battery — enables artillery survivability' },
    { priority: 3, name: '2S19 Msta-S / 2S35 Koalitsiya SPH',   role: 'Indirect fire support for tank maneuver' },
    { priority: 4, name: 'BM-30 Smerch MLRS',                   role: 'Long-range suppression before tank assault' },
    { priority: 5, name: 'T-80U / T-72B3 / T-90M MBT',          role: 'Core striking power — offensive maneuver' },
  ],
  naval_infantry: [
    { priority: 1, name: 'Tor-M1 / Pantsir-S1 ADA',             role: 'Air defense in contested coastal environment' },
    { priority: 2, name: 'Zoo-1M / Antipode Radar',             role: 'Counter-battery and air surveillance' },
    { priority: 3, name: '2S9 Nona / 2S1 Gvozdika SPH',         role: 'Amphibious-capable fire support' },
    { priority: 4, name: 'BM-21 Grad MLRS',                     role: 'Suppression during amphibious operations' },
    { priority: 5, name: 'BMP-3 IFV (amphibious)',              role: 'Amphibious assault capability' },
  ],
  air_assault: [
    { priority: 1, name: 'Strela-10 / Igla-S SHORAD',           role: 'SHORAD — organic air defense for airmobile ops' },
    { priority: 2, name: 'Antipode / Zoo-1M Radar',             role: 'Counter-battery support' },
    { priority: 3, name: '2S9 Nona / D-30 Howitzer',            role: 'Air-deployable indirect fire' },
    { priority: 4, name: 'BM-21 Grad (vehicle-mounted)',        role: 'Suppression fire on landing zones' },
    { priority: 5, name: 'BMD-2/4 AIFV',                       role: 'Airborne mechanized fire support' },
  ],
  spetsnaz: [
    { priority: 1, name: '9K38 Igla / Verba MANPADS',           role: 'Man-portable air defense' },
    { priority: 2, name: 'Small UAV / EW (Leer-3)',              role: 'ISR and electronic warfare' },
    { priority: 3, name: '82mm / 120mm Mortar',                 role: 'Organic indirect fire' },
    { priority: 4, name: 'ATGM (9M133 Kornet)',                 role: 'Anti-armor capability' },
    { priority: 5, name: 'Tigr / Typhoon-K Vehicle',            role: 'High-mobility transport' },
  ],
  combined_arms_army: [
    { priority: 1, name: 'S-300V4 ADA Brigade',                 role: 'Army-level area air defense' },
    { priority: 2, name: 'Kasta 2E2 / Niobiy Air-Search Radar', role: 'Long-range air surveillance' },
    { priority: 3, name: 'Iskander-M SRBM Brigade (12 TELs)',   role: 'Precision deep strike / A2AD' },
    { priority: 4, name: '2S19 / BM-27 Uragan Artillery Bde',  role: 'Army-level fire support' },
    { priority: 5, name: 'Krasukha-4 EW System',               role: 'Electronic warfare suppression' },
  ],
  tank_army: [
    { priority: 1, name: 'S-300V4 ADA Brigade',                 role: 'Army-level area air defense — essential for tank army' },
    { priority: 2, name: 'Niobiy / 64L6 Air-Search Radar',     role: 'Long-range air surveillance' },
    { priority: 3, name: 'Iskander-M SRBM Brigade (12 TELs)',   role: 'Deep precision strike to clear path' },
    { priority: 4, name: 'BM-30 Smerch / Tornado-S Artillery', role: 'Long-range fires for exploitation' },
    { priority: 5, name: 'T-90M / T-80U MBT (mass)',           role: 'Armored breakthrough and exploitation' },
  ],
  army_corps: [
    { priority: 1, name: 'Buk-M2 / S-400 ADA System',          role: 'Corps-level air defense umbrella' },
    { priority: 2, name: 'Zoopark-1M Radar',                   role: 'Counter-battery at corps level' },
    { priority: 3, name: 'Iskander-M / Tochka-U SRBM',         role: 'Operational-level precision strike' },
    { priority: 4, name: '2S19 / BM-27 Uragan MLRS',           role: 'Corps fire support' },
    { priority: 5, name: 'Krasukha-2/4 EW System',             role: 'Electronic warfare and jamming' },
  ],
};

// ─── CE PROJECTION ENGINE ─────────────────────────────────────────────────────
interface CEProjection {
  projectedCe: number;
  deltaSign: 'up' | 'stable' | 'down';
  deltaPct: number;
  rationale: string;
}

const NATIONAL_PROD = {
  tanks: { gained: 1840, lost: 900, formations: 40 },
  ifv:   { gained: 1400, lost: 1500, formations: 200 },
  arty:  { gained: 480,  lost: 380,  formations: 80 },
};

function getEffectiveEquipment(unitId: string, dbEquip: UnitEquipment[]): Array<{ equipmentType: string; authorizedCount: number; estimatedLost: number }> {
  const fromDB = dbEquip.filter(e => e.unitId === unitId);
  if (fromDB.length > 0) return fromDB;
  return UNIT_BASELINE[unitId] ?? [];
}

function computeCEProjection(
  unit: { id: string; type: string; strengthPct: number; notes?: string | null },
  equipment: UnitEquipment[]
): CEProjection {
  const eq = getEffectiveEquipment(unit.id, equipment);
  const currentCe = unit.strengthPct;

  if (eq.length === 0) return typeBasedProjection(unit.type, currentCe);

  let totalAuth = 0, totalLost = 0;
  for (const e of eq) {
    totalAuth += e.authorizedCount;
    totalLost += e.estimatedLost;
  }
  const monthlyAttritionRate = totalAuth > 0 ? (totalLost / 24) / totalAuth : 0.015;

  const hasTanks = eq.some(e => e.equipmentType === 'tank');
  const hasIFV   = eq.some(e => e.equipmentType === 'ifv' || e.equipmentType === 'apc');
  const hasArty  = eq.some(e => e.equipmentType === 'artillery_sp' || e.equipmentType === 'artillery_towed');

  let monthlyReplenishmentRate = 0;
  if (hasTanks) {
    const tankAuth = eq.filter(e => e.equipmentType === 'tank').reduce((a, e) => a + e.authorizedCount, 0);
    if (tankAuth > 0) {
      const netAnnual = (NATIONAL_PROD.tanks.gained - NATIONAL_PROD.tanks.lost) / NATIONAL_PROD.tanks.formations;
      monthlyReplenishmentRate += (netAnnual / 12) / tankAuth;
    }
  }
  if (hasIFV) {
    const ifvAuth = eq.filter(e => e.equipmentType === 'ifv' || e.equipmentType === 'apc').reduce((a, e) => a + e.authorizedCount, 0);
    if (ifvAuth > 0) {
      const netAnnual = (NATIONAL_PROD.ifv.gained - NATIONAL_PROD.ifv.lost) / NATIONAL_PROD.ifv.formations;
      monthlyReplenishmentRate += (netAnnual / 12) / ifvAuth;
    }
  }
  if (hasArty && !hasTanks && !hasIFV) {
    const artyAuth = eq.reduce((a, e) => a + e.authorizedCount, 0);
    if (artyAuth > 0) {
      const netAnnual = (NATIONAL_PROD.arty.gained - NATIONAL_PROD.arty.lost) / NATIONAL_PROD.arty.formations;
      monthlyReplenishmentRate += (netAnnual / 12) / artyAuth;
    }
  }

  const personnelMonthlyDrag = 70000 / (400 * 12 * 800);
  const netMonthlyDelta = monthlyReplenishmentRate - monthlyAttritionRate - personnelMonthlyDrag;
  const annual12mDeltaPct = netMonthlyDelta * 12 * 100;
  const clampedDelta = Math.max(-18, Math.min(12, annual12mDeltaPct));
  const projected = Math.max(5, Math.min(95, currentCe + clampedDelta));

  const deltaSign: 'up' | 'stable' | 'down' = clampedDelta >= 4 ? 'up' : clampedDelta <= -4 ? 'down' : 'stable';
  const attrAnnual = (monthlyAttritionRate * 12 * 100).toFixed(1);
  const replenAnnual = (monthlyReplenishmentRate * 12 * 100).toFixed(1);
  const equip = hasTanks && hasIFV ? 'tanks + IFVs' : hasTanks ? 'tanks' : hasIFV ? 'IFVs' : 'artillery';
  const rationale = `Equipment attrition ~${attrAnnual}%/yr on ${equip}; national production replenishes ~${replenAnnual}%/yr. Net: ${clampedDelta >= 0 ? '+' : ''}${clampedDelta.toFixed(1)}% CE over 12 months.`;

  return { projectedCe: Math.round(projected), deltaSign, deltaPct: parseFloat(clampedDelta.toFixed(1)), rationale };
}

function typeBasedProjection(type: string, currentCe: number): CEProjection {
  const typeMap: Record<string, { delta: number; reason: string }> = {
    tank_army:          { delta: +2,  reason: 'High priority T-90M resupply; 1,840 tanks replenished 2025. Net +2% vs attrition.' },
    combined_arms_army: { delta: -3,  reason: 'Mixed IFV/tank losses exceed production at army level. Net -3% per year.' },
    army_corps:         { delta: -2,  reason: 'Corps-level IFV attrition marginally exceeds national production share.' },
    motor_rifle:        { delta: -5,  reason: 'IFV losses ~1,500/yr vs gains ~1,400. Motor rifle units net negative.' },
    tank:               { delta: +3,  reason: 'Tank formations benefit from 1,840 replacements/yr split among ~40 units.' },
    naval_infantry:     { delta: -6,  reason: 'Specialist amphibious vehicles not in primary replenishment pipeline.' },
    air_assault:        { delta: -4,  reason: 'Aviation + light vehicle losses not fully offset by production.' },
    spetsnaz:           { delta: +1,  reason: 'Low equipment density; attrition primarily personnel-driven. Stable CE.' },
    artillery:          { delta: +2,  reason: 'SP arty net positive (+100 units/yr nationally); arty units moderately improving.' },
  };
  const mapping = typeMap[type] ?? { delta: -2, reason: 'Estimated based on average RGF attrition rate.' };
  const clamped = Math.max(-18, Math.min(12, mapping.delta));
  const projected = Math.max(5, Math.min(95, currentCe + clamped));
  return {
    projectedCe: Math.round(projected),
    deltaSign: clamped >= 4 ? 'up' : clamped <= -4 ? 'down' : 'stable',
    deltaPct: clamped,
    rationale: mapping.reason,
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const SC = (p: number) => p >= 75 ? 'high' : p >= 50 ? 'med' : p >= 25 ? 'low' : 'crit';
const SL = (p: number) => p >= 75 ? 'COMBAT EFF.' : p >= 50 ? 'REDUCED' : p >= 25 ? 'DEGRADED' : 'CRITICAL';
const SC_COLOR = (p: number) => p >= 75 ? 'var(--str-high)' : p >= 50 ? 'var(--str-med)' : p >= 25 ? 'var(--str-low)' : 'var(--str-crit)';
const TL = (t: string) => ({ tank:'TD/B', motor_rifle:'MRD/B', artillery:'ARTY', naval_infantry:'NI', air_assault:'AA', spetsnaz:'SPTZ', combined_arms_army:'CAA', tank_army:'GTA', army_corps:'AC' }[t] ?? t.slice(0,4).toUpperCase());

// ─── MIL-STD-2525D HOSTILE GROUND UNIT SYMBOLS (US Army doctrine) ──────────────
// Source: FM 1-02.2 / MIL-STD-2525D (harmonized with APP-6D frame shapes)
// Hostile ground: RED-FILLED rotated diamond frame, BLACK icons inside.
// Key MIL-STD-2525D distinctions vs APP-6D:
//   - Hostile fill = solid red (#c0392b), NOT dark background
//   - Icons are BLACK (not red) inside the filled frame
//   - Infantry = vertical line with two bumps (per FM 1-02 Fig 2-6)
//   - Armor/Tank = filled ellipse/blob (track silhouette per FM 1-02 Fig 2-7)
//   - Mechanized = infantry icon + track line (Fig 2-8)
//   - Field Artillery = filled circle (Fig 2-10)
//   - Air Defense = half-circle arc pointing up
//   - Special Forces = two crossed arrows (US SOF symbol per FM 3-05)
//   - Marine/Naval Infantry = anchor (per FM 1-02)
//   - Aviation/Air Assault = wing symbol (per FM 1-02)

// Echelon amplifiers — identical in MIL-STD-2525D and APP-6D (Roman numerals / X)
function getEchelonForLevel(level: 'army' | 'division' | 'brigade', type: string): string {
  if (level === 'army') {
    if (type === 'tank_army' || type === 'combined_arms_army') return 'XXXXX';
    if (type === 'army_corps') return 'XXXX';
    return 'XXXXX';
  }
  if (level === 'division') return 'XXX';
  if (level === 'brigade') return type === 'spetsnaz' ? 'II' : 'XX';
  return 'XX';
}

// MIL-STD-2525D function icons — black on red fill, per FM 1-02.2 conventions
// Icons in 20×20 coordinate space, drawn in black (#000) for contrast on red fill
function getFunctionIcon(type: string): React.ReactNode {
  switch (type) {
    case 'tank':
    case 'tank_army':
      // MIL-STD armor: filled ellipse (tank hull/track blob) per FM 1-02 Fig 2-7
      return (
        <g>
          <ellipse cx="10" cy="12" rx="6.5" ry="4" fill="#000" stroke="none"/>
          <ellipse cx="10" cy="9.5" rx="3.5" ry="3" fill="#000" stroke="none"/>
        </g>
      );
    case 'motor_rifle':
      // MIL-STD mech infantry: vertical line (infantry) + horizontal track line below
      return (
        <g>
          <line x1="10" y1="6" x2="10" y2="13" stroke="#000" strokeWidth="2"/>
          <ellipse cx="10" cy="9" rx="3" ry="2" fill="none" stroke="#000" strokeWidth="1.2"/>
          <line x1="4" y1="15" x2="16" y2="15" stroke="#000" strokeWidth="2"/>
        </g>
      );
    case 'naval_infantry':
      // MIL-STD Marine: infantry line + anchor
      return (
        <g>
          <circle cx="10" cy="7.5" r="2.2" fill="none" stroke="#000" strokeWidth="1.2"/>
          <line x1="10" y1="9.7" x2="10" y2="15" stroke="#000" strokeWidth="1.2"/>
          <line x1="6.5" y1="15" x2="13.5" y2="15" stroke="#000" strokeWidth="1.2"/>
          <path d="M6.5 12.5 Q10 14 13.5 12.5" fill="none" stroke="#000" strokeWidth="1.2"/>
        </g>
      );
    case 'air_assault':
      // MIL-STD air assault: infantry + rotor wing arc
      return (
        <g>
          <line x1="10" y1="7" x2="10" y2="12" stroke="#000" strokeWidth="1.8"/>
          <path d="M4 9 Q7 5 10 8 Q13 5 16 9" fill="none" stroke="#000" strokeWidth="1.5"/>
          <line x1="4" y1="14" x2="16" y2="14" stroke="#000" strokeWidth="1.5"/>
        </g>
      );
    case 'spetsnaz':
      // US SF / SOF: two crossed arrows (per FM 3-05 Special Forces symbol)
      return (
        <g>
          {/* Arrow 1: NW→SE */}
          <line x1="5" y1="7" x2="15" y2="15" stroke="#000" strokeWidth="1.5"/>
          <polygon points="15,15 12,14.5 14.5,12" fill="#000"/>
          <polygon points="5,7 7.5,7.5 5.5,10" fill="#000"/>
          {/* Arrow 2: NE→SW */}
          <line x1="15" y1="7" x2="5" y2="15" stroke="#000" strokeWidth="1.5"/>
          <polygon points="5,15 7.5,14.5 5.5,12" fill="#000"/>
          <polygon points="15,7 12.5,7.5 14.5,10" fill="#000"/>
        </g>
      );
    case 'artillery':
    case 'artillery_sp':
      // MIL-STD field artillery: solid/filled circle (per FM 1-02 Fig 2-10)
      return (
        <g>
          <circle cx="10" cy="10" r="4" fill="#000" stroke="none"/>
          <line x1="4" y1="14" x2="16" y2="14" stroke="#000" strokeWidth="1.8"/>
        </g>
      );
    case 'combined_arms_army':
      // MIL-STD combined arms: infantry + armor stacked (X pattern)
      return (
        <g>
          <line x1="5" y1="7" x2="15" y2="15" stroke="#000" strokeWidth="2"/>
          <line x1="15" y1="7" x2="5" y2="15" stroke="#000" strokeWidth="2"/>
          <line x1="10" y1="7" x2="10" y2="15" stroke="#000" strokeWidth="1.5"/>
        </g>
      );
    case 'army_corps':
    default:
      // MIL-STD HQ / generic: single vertical line with crossbar
      return (
        <g>
          <line x1="10" y1="6" x2="10" y2="16" stroke="#000" strokeWidth="2"/>
          <line x1="6" y1="11" x2="14" y2="11" stroke="#000" strokeWidth="2"/>
        </g>
      );
  }
}

// MIL-STD-2525D hostile ground unit symbol renderer
// Key: RED FILL inside diamond (not dark background) — this is the core doctrinal
// difference. Hostile = red fill. Friendly = blue fill. Neutral = green fill.
function MilSymbol({ type, level, size = 40 }: { type: string; level: 'army' | 'division' | 'brigade'; size?: number }) {
  const echelon = getEchelonForLevel(level, type);
  const w = size;
  const h = size;
  const echelonH = echelon ? 9 : 0;
  const totalH = h + echelonH;

  const cx = w / 2;
  const cy = echelonH + h / 2;
  const rx = w / 2 - 1.5;
  const ry = h / 2 - 1.5;

  // Diamond path
  const diamond = `M ${cx} ${cy - ry} L ${cx + rx} ${cy} L ${cx} ${cy + ry} L ${cx - rx} ${cy} Z`;

  return (
    <svg
      width={w}
      height={totalH}
      viewBox={`0 0 ${w} ${totalH}`}
      style={{ flexShrink: 0, overflow: 'visible' }}
      aria-label={`MIL-STD-2525D symbol: hostile ${type}`}
    >
      {/* Echelon amplifier above frame */}
      {echelon && (
        <text
          x={cx}
          y={7}
          textAnchor="middle"
          fill="#ef4444"
          fontSize={echelon.length > 3 ? 5 : 6}
          fontFamily="monospace"
          fontWeight="700"
          letterSpacing="0.8"
        >
          {echelon}
        </text>
      )}

      {/* Red-filled diamond frame (MIL-STD-2525D hostile = solid red fill) */}
      <path d={diamond} fill="#c0392b" stroke="#7f1d1d" strokeWidth="1.2"/>

      {/* Black function icon inside — scaled to fit inner diamond area */}
      <g transform={`translate(${cx - rx * 0.72}, ${cy - ry * 0.72}) scale(${(rx * 1.44) / 20})`}>
        {getFunctionIcon(type)}
      </g>
    </svg>
  );
}

// ─── UNIT PATCH IMAGE ──────────────────────────────────────────────────────────
function UnitPatch({ unitId, size = 28 }: { unitId: string; size?: number }) {
  const patch = UNIT_PATCHES[unitId];
  const [imgError, setImgError] = useState(false);

  if (!patch || imgError) {
    // Fallback: generated circular emblem with unit number
    const num = unitId.replace(/[^0-9]/g, '').slice(0, 3) || '?';
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
        <circle cx="16" cy="16" r="14" fill="hsl(0 30% 18%)" stroke="hsl(0 50% 40%)" strokeWidth="1.5"/>
        <text x="16" y="20" textAnchor="middle" fill="hsl(38 80% 60%)" fontSize="10" fontFamily="monospace" fontWeight="700">
          {num}
        </text>
      </svg>
    );
  }

  return (
    <img
      src={patch.url}
      alt={patch.label}
      width={size}
      height={size}
      style={{ flexShrink: 0, borderRadius: 2, objectFit: 'contain', background: 'hsl(220 15% 12%)' }}
      onError={() => setImgError(true)}
      title={patch.label}
    />
  );
}

function StrBar({ pct, h = 3 }: { pct: number; h?: number }) {
  return (
    <div className="str-bar" style={{height:h}}>
      <div className={`str-fill ${SC(pct)}`} style={{width:`${pct}%`}}/>
    </div>
  );
}

// ─── CE PROJECTION BADGE ──────────────────────────────────────────────────────
function CEBadge({ proj, size = 'sm' }: { proj: CEProjection; size?: 'sm' | 'md' }) {
  const arrow = proj.deltaSign === 'up' ? '▲' : proj.deltaSign === 'down' ? '▼' : '►';
  const color = proj.deltaSign === 'up'
    ? 'hsl(120 50% 55%)'
    : proj.deltaSign === 'down'
    ? 'hsl(0 65% 60%)'
    : 'hsl(45 5% 55%)';
  const isSm = size === 'sm';
  return (
    <div
      style={{
        display:'inline-flex', alignItems:'center', gap: isSm?2:4,
        background:'hsl(220 15% 16%)', border:`1px solid ${color}44`,
        borderRadius:3, padding:isSm?'1px 5px':'3px 8px',
        flexShrink:0,
      }}
      title={proj.rationale}
    >
      <span style={{fontSize:isSm?8:10,color,fontWeight:700}}>{arrow}</span>
      <span style={{fontSize:isSm?8:10,color,fontWeight:700}}>{proj.projectedCe}%</span>
      {!isSm && <span style={{fontSize:9,color:'hsl(45 5% 50%)',marginLeft:2}}>12m</span>}
    </div>
  );
}

// ─── DESKTOP OOB ──────────────────────────────────────────────────────────────
function DesktopBrigNode({ b, onClick, equipment }: { b: Brigade; onClick:(b:Brigade)=>void; equipment: UnitEquipment[] }) {
  const proj = computeCEProjection(b, equipment);
  return (
    <div className="oob-brig-node" onClick={()=>onClick(b)} data-testid={`brig-${b.id}`}>
      <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
        {/* NATO symbol */}
        <MilSymbol type={b.type} level="brigade" size={28}/>
        {/* Unit patch */}
        <UnitPatch unitId={b.id} size={22}/>
        <span className={`ubadge ${b.type}`}>{TL(b.type)}</span>
        {b.isGuards && <span className="gstar">★</span>}
        <span style={{fontSize:10,flex:1,lineHeight:1.2}}>{b.name.length>30?b.name.slice(0,30)+'…':b.name}</span>
        <CEBadge proj={proj} size="sm"/>
      </div>
      <StrBar pct={b.strengthPct}/>
    </div>
  );
}

function DesktopDivNode({ d, brigsMap, onClick, onBrig, equipment }: {
  d: Division; brigsMap: Map<string,Brigade[]>;
  onClick:(d:Division)=>void; onBrig:(b:Brigade)=>void;
  equipment: UnitEquipment[];
}) {
  const [open, setOpen] = useState(false);
  const brigs = brigsMap.get(d.id) ?? [];
  const proj = computeCEProjection(d, equipment);
  return (
    <div className="oob-div-node" data-testid={`div-${d.id}`}>
      <div style={{display:'flex',alignItems:'flex-start',gap:5,marginBottom:3}}
           onClick={()=>{setOpen(!open); onClick(d);}}>
        {/* NATO symbol */}
        <MilSymbol type={d.type} level="division" size={32}/>
        {/* Unit patch */}
        <UnitPatch unitId={d.id} size={28}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap',marginBottom:2}}>
            <span className={`ubadge ${d.type}`}>{TL(d.type)}</span>
            <span style={{fontSize:11,fontWeight:600,color:'hsl(45 10% 82%)',lineHeight:1.2}}>
              {d.name.length>28?d.name.slice(0,28)+'…':d.name}
            </span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
            <span style={{fontSize:9,color:'hsl(45 5% 50%)'}}>{SL(d.strengthPct)} — {d.strengthPct.toFixed(0)}%</span>
            <CEBadge proj={proj} size="sm"/>
          </div>
          <StrBar pct={d.strengthPct}/>
        </div>
        {brigs.length>0 && <span style={{fontSize:10,color:'hsl(38 92% 52%)',marginTop:2}}>{open?'▲':'▼'}{brigs.length}</span>}
      </div>
      {open && brigs.length>0 && (
        <div style={{marginTop:4,borderTop:'1px solid hsl(220 12% 18%)',paddingTop:4}}>
          {brigs.map(b=><DesktopBrigNode key={b.id} b={b} onClick={onBrig} equipment={equipment}/>)}
        </div>
      )}
    </div>
  );
}

function DesktopArmyCard({ army, divs, brigsMap, onClick, onDiv, onBrig, equipment }: {
  army: Army; divs: Division[]; brigsMap: Map<string,Brigade[]>;
  onClick:(a:Army)=>void; onDiv:(d:Division)=>void; onBrig:(b:Brigade)=>void;
  equipment: UnitEquipment[];
}) {
  const armyDivs = divs.filter(d=>d.armyId===army.id);
  const directBrigs = brigsMap.get(army.id) ?? [];
  const proj = computeCEProjection(army, equipment);
  return (
    <div className="oob-army-card" data-testid={`army-${army.id}`}>
      <div className="oob-army-hdr" onClick={()=>onClick(army)}>
        <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:4}}>
          {/* NATO symbol for army */}
          <MilSymbol type={army.type} level="army" size={34}/>
          {/* Unit patch if available */}
          <UnitPatch unitId={army.id} size={28}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:700,color:'hsl(38 92% 65%)',lineHeight:1.2}}>{army.name}</div>
            {army.hq && <div style={{fontSize:9,color:'hsl(45 5% 50%)',marginTop:1}}>HQ: {army.hq}</div>}
          </div>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:3}}>
          <span className={`ubadge ${army.type}`}>{TL(army.type)}</span>
          <span style={{fontSize:9,color:SC_COLOR(army.strengthPct)}}>{army.strengthPct.toFixed(0)}% {SL(army.strengthPct)}</span>
          <CEBadge proj={proj} size="sm"/>
        </div>
        <StrBar pct={army.strengthPct}/>
      </div>
      <div className="oob-army-body">
        {directBrigs.map(b=><DesktopBrigNode key={b.id} b={b} onClick={onBrig} equipment={equipment}/>)}
        {armyDivs.map(d=><DesktopDivNode key={d.id} d={d} brigsMap={brigsMap} onClick={onDiv} onBrig={onBrig} equipment={equipment}/>)}
        {armyDivs.length===0 && directBrigs.length===0 && (
          <div style={{fontSize:10,color:'hsl(45 5% 40%)',padding:'4px 0'}}>No sub-units on record</div>
        )}
      </div>
    </div>
  );
}

function DesktopDistrict({ district, armies, divs, brigsMap, onClick, onArmy, onDiv, onBrig, equipment }: {
  district: MilitaryDistrict; armies: Army[]; divs: Division[];
  brigsMap: Map<string,Brigade[]>;
  onClick:(d:MilitaryDistrict)=>void; onArmy:(a:Army)=>void;
  onDiv:(d:Division)=>void; onBrig:(b:Brigade)=>void;
  equipment: UnitEquipment[];
}) {
  const distArmies = armies.filter(a=>a.districtId===district.id);
  const allPcts = [
    ...distArmies.map(a=>a.strengthPct),
    ...divs.filter(d=>distArmies.some(a=>a.id===d.armyId)).map(d=>d.strengthPct),
  ];
  const avg = allPcts.length ? allPcts.reduce((a,b)=>a+b,0)/allPcts.length : 75;
  return (
    <div className="oob-district" style={{borderColor:district.color}} data-testid={`district-${district.id}`}>
      <div className="oob-district-hdr" style={{background:district.color+'2a',borderBottom:`1px solid ${district.color}44`}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <svg width="20" height="20" viewBox="0 0 20 20"><rect x="1" y="1" width="18" height="18" rx="2" fill="none" stroke={district.color} strokeWidth="1.5"/><circle cx="10" cy="10" r="3" fill={district.color}/></svg>
          <div>
            <div style={{color:'hsl(45 10% 88%)',fontSize:12}}>{district.name}</div>
            {district.commander && <div style={{fontSize:9,color:'hsl(45 5% 50%)',fontWeight:400,textTransform:'none'}}>{district.commander} · HQ: {district.hq}</div>}
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:20,fontWeight:700,color:SC_COLOR(avg)}}>{avg.toFixed(0)}%</div>
          <div style={{fontSize:9,color:'hsl(45 5% 50%)'}}>AVG STRENGTH</div>
        </div>
      </div>
      <div className="oob-army-row">
        {distArmies.map(a=>(
          <DesktopArmyCard key={a.id} army={a} divs={divs} brigsMap={brigsMap}
            onClick={onArmy} onDiv={onDiv} onBrig={onBrig} equipment={equipment}/>
        ))}
      </div>
    </div>
  );
}

// ─── MOBILE OOB ───────────────────────────────────────────────────────────────
// ─── MOBILE INLINE EQUIPMENT DETAIL ──────────────────────────────────────────
function MobInlineDetail({ unitId, unitType, strengthPct, equipment, proj }: {
  unitId: string; unitType: string; strengthPct: number;
  equipment: UnitEquipment[]; proj: CEProjection;
}) {
  const eq = getEffectiveEquipment(unitId, equipment);
  const missionEq = MISSION_EQUIPMENT[unitType] ?? MISSION_EQUIPMENT['motor_rifle'];
  const SC = SC_COLOR(strengthPct);
  const projColor = proj.direction === 'up' ? '#22c55e' : proj.direction === 'down' ? '#ef4444' : '#f59e0b';
  const projArrow = proj.direction === 'up' ? '▲' : proj.direction === 'down' ? '▼' : '►';
  return (
    <div className="mob2-inline-detail">
      {/* CE summary row */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8,paddingBottom:6,borderBottom:'1px solid hsl(220 12% 18%)'}}>
        <div>
          <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.06em',color:'hsl(45 5% 45%)',fontWeight:600}}>Combat Effectiveness</div>
          <div style={{fontSize:18,fontWeight:700,color:SC,fontFamily:'JetBrains Mono, monospace',lineHeight:1.1}}>
            {strengthPct.toFixed(0)}%
          </div>
          <div style={{fontSize:10,color:'hsl(45 5% 52%)'}}>{proj.statusLabel}</div>
        </div>
        <div style={{flex:1}}>
          <StrBar pct={strengthPct} h={4}/>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.06em',color:'hsl(45 5% 45%)',fontWeight:600}}>12-mo Proj</div>
          <div style={{fontSize:15,fontWeight:700,color:projColor,fontFamily:'JetBrains Mono, monospace'}}>
            {projArrow} {Math.abs(proj.projectedChange).toFixed(0)}%
          </div>
          <div style={{fontSize:9,color:'hsl(45 5% 42%)'}}>{proj.projectedCE.toFixed(0)}% projected</div>
        </div>
      </div>

      {/* Top mission equipment */}
      <div className="mob2-detail-section">Top 5 Mission Equipment</div>
      {missionEq.map(item=>(
        <div key={item.priority} style={{display:'flex',alignItems:'center',gap:6,padding:'3px 0',borderBottom:'1px solid hsl(220 12% 13%)'}}>
          <span style={{fontSize:9,color:'hsl(38 60% 45%)',fontWeight:700,width:14,flexShrink:0,fontFamily:'JetBrains Mono, monospace'}}>#{item.priority}</span>
          <span style={{fontSize:11,color:'hsl(45 8% 75%)',fontWeight:600,flex:1,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{item.name}</span>
          <span style={{fontSize:9,color:'hsl(45 5% 42%)',flexShrink:0}}>{item.role}</span>
        </div>
      ))}

      {/* Key equipment counts */}
      {eq.length > 0 && (
        <>
          <div className="mob2-detail-section" style={{marginTop:10}}>Equipment Inventory</div>
          {eq.slice(0,5).map(e=>{
            const lostPct = e.authorizedCount > 0 ? Math.round((e.estimatedLost/e.authorizedCount)*100) : 0;
            const remaining = Math.max(0, e.authorizedCount - e.estimatedLost);
            const barW = Math.max(0, Math.min(100, (remaining/e.authorizedCount)*100));
            return (
              <div key={e.equipmentType} style={{marginBottom:5}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:11,color:'hsl(45 8% 72%)',fontWeight:500,flex:1,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{e.equipmentType}</span>
                  <span style={{fontSize:12,fontWeight:700,color:'hsl(38 80% 65%)',fontFamily:'JetBrains Mono, monospace'}}>{remaining}</span>
                  <span style={{fontSize:10,color:'hsl(45 5% 38%)',fontFamily:'JetBrains Mono, monospace'}}>/ {e.authorizedCount}</span>
                  <span style={{fontSize:9,color:'hsl(0 60% 55%)',fontFamily:'JetBrains Mono, monospace'}}>-{lostPct}%</span>
                </div>
                <div style={{height:3,background:'hsl(220 12% 18%)',borderRadius:2,overflow:'hidden',marginTop:2}}>
                  <div style={{height:'100%',width:`${barW}%`,background: barW>60?'hsl(120 40% 42%)':barW>35?'hsl(38 80% 48%)':'hsl(0 60% 42%)',borderRadius:2,transition:'width 0.4s ease'}}/>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── MOBILE BRIGADE ROW ───────────────────────────────────────────────────────
function MobBrigRow({ b, equipment, onSelect }: { b: Brigade; equipment: UnitEquipment[]; onSelect:(t:string,d:any)=>void }) {
  const [open, setOpen] = useState(false);
  const proj = computeCEProjection(b, equipment);
  return (
    <div>
      <div className={`mob2-brig${b.isGuards?' guards':''}`}
           onClick={e=>{e.stopPropagation(); setOpen(o=>!o); onSelect('brigade',b);}}>
        <MilSymbol type={b.type} level="brigade" size={22}/>
        <UnitPatch unitId={b.id} size={18}/>
        <div style={{flex:1,minWidth:0}}>
          <div className="mob2-brig-name">{b.name}</div>
          <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}>
            <span className={`ubadge ${b.type}`}>{TL(b.type)}</span>
            {b.isGuards && <span className="gstar">★</span>}
            <CEBadge proj={proj} size="sm"/>
          </div>
        </div>
        <div className="mob2-brig-pct" style={{color:SC_COLOR(b.strengthPct)}}>{b.strengthPct.toFixed(0)}%</div>
        <div className={`mob2-chevron${open?' open':''}`}>▼</div>
      </div>
      {open && <MobInlineDetail unitId={b.id} unitType={b.type} strengthPct={b.strengthPct} equipment={equipment} proj={proj}/>}
    </div>
  );
}

// ─── MOBILE DIVISION ROW ──────────────────────────────────────────────────────
function MobDivRow({ d, brigsMap, equipment, onSelect }: { d: Division; brigsMap: Map<string,Brigade[]>; equipment: UnitEquipment[]; onSelect:(t:string,v:any)=>void }) {
  const [open, setOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const proj = computeCEProjection(d, equipment);
  const divBrigs = brigsMap.get(d.id) ?? [];
  return (
    <div className="mob2-div">
      {/* Division header row */}
      <div className="mob2-div-hdr"
           onClick={e=>{ e.stopPropagation(); setOpen(o=>!o); onSelect('division',d); }}>
        <MilSymbol type={d.type} level="division" size={24}/>
        <UnitPatch unitId={d.id} size={20}/>
        <div style={{flex:1,minWidth:0}}>
          <div className="mob2-div-name">{d.name}</div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3}}>
            <span className={`ubadge ${d.type}`}>{TL(d.type)}</span>
            <CEBadge proj={proj} size="sm"/>
            {divBrigs.length > 0 && <span style={{fontSize:9,color:'hsl(45 5% 40%)'}}>{divBrigs.length} units</span>}
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
          <div className="mob2-div-pct" style={{color:SC_COLOR(d.strengthPct)}}>{d.strengthPct.toFixed(0)}%</div>
          {/* Two mini-buttons: detail strip or brigades */}
          <div style={{display:'flex',gap:4}} onClick={e=>e.stopPropagation()}>
            <button onClick={e=>{e.stopPropagation();setShowDetail(s=>!s);}}
              style={{fontSize:9,padding:'2px 6px',background:showDetail?'hsl(38 70% 22%)':'hsl(220 15% 16%)',
                border:`1px solid ${showDetail?'hsl(38 60% 38%)':'hsl(220 12% 26%)'}`,borderRadius:2,
                color:showDetail?'hsl(38 92% 62%)':'hsl(45 5% 50%)',cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>
              INFO
            </button>
            {divBrigs.length > 0 && (
              <button onClick={e=>{e.stopPropagation();setOpen(s=>!s);}}
                style={{fontSize:9,padding:'2px 6px',background:open?'hsl(220 25% 18%)':'hsl(220 15% 16%)',
                  border:`1px solid ${open?'hsl(220 40% 35%)':'hsl(220 12% 26%)'}`,borderRadius:2,
                  color:open?'hsl(210 60% 72%)':'hsl(45 5% 50%)',cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>
                {open ? `▲ ${divBrigs.length}` : `▼ ${divBrigs.length}`}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Inline strength bar always visible */}
      <div style={{margin:'0 14px 0 20px'}}><StrBar pct={d.strengthPct} h={2}/></div>
      {/* Inline detail strip */}
      {showDetail && <MobInlineDetail unitId={d.id} unitType={d.type} strengthPct={d.strengthPct} equipment={equipment} proj={proj}/>}
      {/* Brigade sub-rows */}
      {open && divBrigs.map(b=>(
        <MobBrigRow key={b.id} b={b} equipment={equipment} onSelect={onSelect}/>
      ))}
    </div>
  );
}

// ─── MOBILE ARMY ROW ──────────────────────────────────────────────────────────
function MobArmyRow({ army, divs, brigsMap, equipment, onSelect }: {
  army: Army; divs: Division[]; brigsMap: Map<string,Brigade[]>;
  equipment: UnitEquipment[]; onSelect:(t:string,v:any)=>void;
}) {
  const [open, setOpen] = useState(false);
  const proj = computeCEProjection(army, equipment);
  const armyDivs = divs.filter(d=>d.armyId===army.id);
  const directBrigs = brigsMap.get(army.id) ?? [];
  const totalSub = armyDivs.length + directBrigs.length;
  return (
    <div className="mob2-army">
      <div className={`mob2-army-hdr${open?' open':''}`}
           onClick={()=>{ setOpen(o=>!o); onSelect('army',army); }}>
        <MilSymbol type={army.type} level="army" size={28}/>
        <UnitPatch unitId={army.id} size={24}/>
        <div className="mob2-army-info">
          <div className="mob2-army-name">{army.name}</div>
          <div className="mob2-army-sub">
            <span className={`ubadge ${army.type}`}>{TL(army.type)}</span>
            <span className="mob2-hq">HQ: {army.hq}</span>
            <CEBadge proj={proj} size="sm"/>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2,flexShrink:0}}>
          <div className="mob2-army-pct" style={{color:SC_COLOR(army.strengthPct)}}>{army.strengthPct.toFixed(0)}%</div>
          {totalSub > 0 && <span style={{fontSize:9,color:'hsl(45 5% 42%)'}}>{totalSub} unit{totalSub!==1?'s':''}</span>}
          <div className={`mob2-chevron${open?' open':''}`}>▼</div>
        </div>
      </div>
      {/* Thin strength bar under army header */}
      <div className="mob2-str-mini">
        <div className="mob2-str-mini-fill" style={{width:`${army.strengthPct}%`,background:SC_COLOR(army.strengthPct)}}/>
      </div>
      {/* Sub-units */}
      {open && (
        <div style={{background:'hsl(220 15% 9%)'}}>
          {directBrigs.map(b=>(
            <MobBrigRow key={b.id} b={b} equipment={equipment} onSelect={onSelect}/>
          ))}
          {armyDivs.map(d=>(
            <MobDivRow key={d.id} d={d} brigsMap={brigsMap} equipment={equipment} onSelect={onSelect}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MOBILE DISTRICT (top-level, v4c) ─────────────────────────────────────────
function MobileDistrict({ district, armies, divs, brigsMap, onSelect, equipment }: {
  district: MilitaryDistrict; armies: Army[]; divs: Division[];
  brigsMap: Map<string,Brigade[]>; onSelect:(type:string,d:any)=>void;
  equipment: UnitEquipment[];
}) {
  const [open, setOpen] = useState(false);
  const distArmies = armies.filter(a=>a.districtId===district.id);
  const allPcts = [
    ...distArmies.map(a=>a.strengthPct),
    ...divs.filter(d=>distArmies.some(a=>a.id===d.armyId)).map(d=>d.strengthPct),
  ];
  const avg = allPcts.length ? allPcts.reduce((a,b)=>a+b,0)/allPcts.length : 75;

  return (
    <div className="mob2-district" style={{borderColor:district.color}} data-testid={`mob-district-${district.id}`}>
      {/* District header — tap to expand */}
      <div className="mob2-district-hdr"
           style={{background:district.color+'1a',borderBottom:open?`1px solid ${district.color}33`:'none'}}
           onClick={()=>setOpen(!open)}>
        <div style={{flex:1,minWidth:0}}>
          <div className="mob2-district-name">{district.name}</div>
          <div className="mob2-district-meta">{distArmies.length} armies · HQ: {district.hq}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          <div style={{textAlign:'right'}}>
            <div className="mob2-district-strength" style={{color:SC_COLOR(avg)}}>{avg.toFixed(0)}%</div>
            <div style={{fontSize:9,color:'hsl(45 5% 42%)',marginTop:1}}>avg CE</div>
          </div>
          <div className={`mob2-chevron${open?' open':''}`} style={{fontSize:14}}>▼</div>
        </div>
      </div>
      {/* Strength bar across full width */}
      <div style={{height:3,background:'hsl(220 12% 18%)',overflow:'hidden'}}>
        <div style={{height:'100%',width:`${avg}%`,background:SC_COLOR(avg),transition:'width 0.5s ease'}}/>
      </div>
      {/* Army rows — each self-managing */}
      {open && distArmies.map(army=>(
        <MobArmyRow key={army.id} army={army} divs={divs} brigsMap={brigsMap}
          equipment={equipment} onSelect={onSelect}/>
      ))}
    </div>
  );
}

// ─── ORYX SUMMARY ────────────────────────────────────────────────────────────
function OryxSummary({ losses, lastUpdated, compact = false }: { losses: OryxLoss[]; lastUpdated: string|null; compact?: boolean }) {
  const total = losses.find(l=>l.category==='TOTAL');
  const cats = losses.filter(l=>l.category!=='TOTAL').sort((a,b)=>b.total-a.total);
  if (!total) return null;
  return (
    <div style={{background:'hsl(220 15% 11%)',border:'1px solid hsl(0 40% 25%)',borderRadius:4,padding:compact?10:14,marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center'}}>
          <span className="live-dot red"/>
          <span style={{fontSize:11,fontWeight:700,color:'hsl(0 70% 65%)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Oryx Verified Losses</span>
        </div>
        {lastUpdated && <span style={{fontSize:9,color:'hsl(45 5% 40%)'}}>{new Date(lastUpdated).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'})}</span>}
      </div>
      <div className="kpi-grid cols4" style={{marginBottom:compact?8:12}}>
        {[
          {label:'Total',val:total.total,color:'hsl(0 60% 60%)'},
          {label:'Destroyed',val:total.destroyed,color:'hsl(0 70% 50%)'},
          {label:'Abandoned',val:total.abandoned,color:'hsl(38 80% 55%)'},
          {label:'Captured',val:total.captured,color:'hsl(120 40% 55%)'},
        ].map(item=>(
          <div key={item.label} className="kpi-box">
            <div className="kpi-val" style={{color:item.color}}>{item.val.toLocaleString()}</div>
            <div className="kpi-lbl">{item.label}</div>
          </div>
        ))}
      </div>
      {!compact && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:5}}>
          {cats.slice(0,8).map(cat=>(
            <div key={cat.id} style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:9,color:'hsl(45 5% 50%)',minWidth:172,textTransform:'uppercase',overflow:'hidden',whiteSpace:'nowrap'}}>
                {cat.category.length>28?cat.category.slice(0,28)+'…':cat.category}
              </span>
              <span style={{fontSize:11,fontWeight:700,color:'hsl(0 60% 60%)',minWidth:36,textAlign:'right'}}>{cat.total}</span>
              <div style={{flex:1,height:3,background:'hsl(220 12% 20%)',borderRadius:2}}>
                <div style={{height:'100%',background:'hsl(0 60% 45%)',borderRadius:2,width:`${Math.min(100,(cat.total/(total?.total||1))*500)}%`}}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MISSION EQUIPMENT LIST ────────────────────────────────────────────────────
function MissionEquipmentList({ unitType }: { unitType: string }) {
  const items = MISSION_EQUIPMENT[unitType] ?? MISSION_EQUIPMENT['motor_rifle'];
  return (
    <div style={{background:'hsl(220 15% 12%)',border:'1px solid hsl(38 60% 25%)',borderRadius:3,padding:8,marginBottom:10}}>
      <div style={{fontSize:9,color:'hsl(38 80% 55%)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700}}>
        Top-5 Mission-Critical Equipment
      </div>
      {items.map(item=>(
        <div key={item.priority} style={{display:'flex',gap:6,marginBottom:5,alignItems:'flex-start'}}>
          <span style={{fontSize:9,color:'hsl(38 60% 50%)',fontWeight:700,minWidth:14,marginTop:1}}>#{item.priority}</span>
          <div>
            <div style={{fontSize:10,color:'hsl(45 10% 82%)',fontWeight:600,lineHeight:1.3}}>{item.name}</div>
            <div style={{fontSize:9,color:'hsl(45 5% 52%)',lineHeight:1.4,marginTop:1}}>{item.role}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BASELINE EQUIPMENT PANEL ─────────────────────────────────────────────────
function BaselineEquipmentPanel({ unitId, dbEquip }: { unitId: string; dbEquip: UnitEquipment[] }) {
  const effectiveEq = getEffectiveEquipment(unitId, dbEquip);
  const isFromDB = dbEquip.some(e => e.unitId === unitId);

  if (effectiveEq.length === 0) return null;

  return (
    <div style={{background:'hsl(220 15% 12%)',border:'1px solid hsl(220 12% 20%)',borderRadius:3,padding:8,marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{fontSize:9,color:'hsl(45 5% 50%)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
          Equipment Inventory
        </div>
        <span style={{fontSize:8,color:isFromDB?'hsl(120 40% 50%)':'hsl(38 80% 50%)',background:'hsl(220 15% 14%)',padding:'1px 5px',borderRadius:2}}>
          {isFromDB ? 'LIVE DB' : 'PRE-2022 BASELINE'}
        </span>
      </div>
      {effectiveEq.map((e, idx)=>{
        const lostPct = e.authorizedCount>0?(e.estimatedLost/e.authorizedCount)*100:0;
        const rem = e.authorizedCount - e.estimatedLost;
        const currentCount = Math.max(0, rem);
        return (
          <div key={idx} style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <div>
                <span className={`ubadge ${e.equipmentType==='tank'?'tank':e.equipmentType==='ifv'?'motor_rifle':e.equipmentType==='sam'?'air_assault':e.equipmentType==='radar'?'spetsnaz':'artillery'}`}>
                  {e.equipmentType.replace('_',' ').toUpperCase()}
                </span>
                {'equipmentModel' in e && e.equipmentModel && (
                  <span style={{fontSize:10,color:'hsl(45 5% 60%)',marginLeft:5}}>{e.equipmentModel}</span>
                )}
              </div>
              <div style={{textAlign:'right'}}>
                <span style={{fontSize:11,color:'hsl(120 40% 60%)',fontWeight:700}}>{currentCount}</span>
                <span style={{fontSize:9,color:'hsl(45 5% 45%)'}}> / {e.authorizedCount}</span>
              </div>
            </div>
            <div className="str-bar" style={{height:4}}>
              <div className={`str-fill ${SC(100-lostPct)}`} style={{width:`${Math.max(0,100-lostPct)}%`}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:2}}>
              <span style={{fontSize:9,color:'hsl(0 60% 60%)'}}>~{e.estimatedLost} est. lost ({lostPct.toFixed(0)}%)</span>
              <span style={{fontSize:9,color:'hsl(45 5% 40%)'}}>baseline: {e.authorizedCount}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({ selected, equipment, onClose, mobile = false }: {
  selected:{type:string;data:any}|null; equipment:UnitEquipment[]; onClose:()=>void; mobile?:boolean;
}) {
  if (!selected) return null;
  const {type,data} = selected;
  const proj = computeCEProjection(data, equipment);

  const trendColor = proj.deltaSign === 'up'
    ? 'hsl(120 50% 55%)'
    : proj.deltaSign === 'down'
    ? 'hsl(0 65% 55%)'
    : 'hsl(45 5% 55%)';
  const trendLabel = proj.deltaSign === 'up' ? 'IMPROVING' : proj.deltaSign === 'down' ? 'DEGRADING' : 'STABLE';
  const unitLevel = type === 'army' ? 'army' : type === 'division' ? 'division' : 'brigade';

  return (
    <div className={`detail-panel ${mobile?'mobile':''}`}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <MilSymbol type={data.type} level={unitLevel} size={36}/>
          <div>
            <div style={{fontSize:9,color:'hsl(45 5% 50%)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{type} record</div>
            <div style={{fontSize:12,fontWeight:700,color:'hsl(38 92% 65%)',marginTop:2,lineHeight:1.3}}>{data.name}</div>
          </div>
        </div>
        <button onClick={onClose} style={{background:'hsl(220 12% 20%)',border:'1px solid hsl(220 12% 30%)',borderRadius:3,color:'hsl(45 5% 60%)',padding:'4px 8px',cursor:'pointer',fontSize:11,flexShrink:0}}>✕</button>
      </div>

      {/* Unit patch if available */}
      {UNIT_PATCHES[data.id] && (
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,background:'hsl(220 15% 12%)',borderRadius:3,padding:6}}>
          <UnitPatch unitId={data.id} size={36}/>
          <div>
            <div style={{fontSize:9,color:'hsl(45 5% 50%)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Official Unit Patch</div>
            <div style={{fontSize:10,color:'hsl(45 10% 70%)'}}>{UNIT_PATCHES[data.id].label}</div>
          </div>
        </div>
      )}

      {/* Current CE */}
      <div style={{background:'hsl(220 15% 13%)',border:'1px solid hsl(220 12% 22%)',borderRadius:3,padding:10,marginBottom:10}}>
        <div style={{fontSize:9,color:'hsl(45 5% 50%)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.08em'}}>Combat Effectiveness — Current</div>
        <div style={{fontSize:28,fontWeight:700,color:SC_COLOR(data.strengthPct??70)}}>{(data.strengthPct??70).toFixed(0)}%</div>
        <div style={{fontSize:10,color:'hsl(45 5% 60%)',marginBottom:6}}>{SL(data.strengthPct??70)}</div>
        <StrBar pct={data.strengthPct??70} h={4}/>
      </div>

      {/* CE Projection */}
      <div style={{background:'hsl(220 15% 12%)',border:`1px solid ${trendColor}44`,borderRadius:3,padding:10,marginBottom:10}}>
        <div style={{fontSize:9,color:'hsl(45 5% 50%)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>
          12-Month CE Projection
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
          <div>
            <div style={{fontSize:22,fontWeight:700,color:trendColor}}>{proj.projectedCe}%</div>
            <div style={{fontSize:9,color:trendColor,fontWeight:700,letterSpacing:'0.08em'}}>{trendLabel}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:'hsl(45 5% 65%)',marginBottom:3}}>
              {proj.deltaPct >= 0 ? '+' : ''}{proj.deltaPct}% over 12 months
            </div>
            <div style={{height:6,background:'hsl(220 12% 20%)',borderRadius:3,overflow:'hidden',position:'relative'}}>
              {proj.deltaPct >= 0 ? (
                <div style={{position:'absolute',left:'50%',width:`${Math.abs(proj.deltaPct)/18*50}%`,height:'100%',background:trendColor,borderRadius:3}}/>
              ) : (
                <div style={{position:'absolute',right:'50%',width:`${Math.abs(proj.deltaPct)/18*50}%`,height:'100%',background:trendColor,borderRadius:3,transform:'translateX(100%)'}}/>
              )}
              <div style={{position:'absolute',left:'50%',top:0,bottom:0,width:1,background:'hsl(220 12% 35%)'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:8,color:'hsl(45 5% 35%)',marginTop:2}}>
              <span>−18%</span><span>0</span><span>+12%</span>
            </div>
          </div>
        </div>
        <div style={{fontSize:9,color:'hsl(45 5% 52%)',lineHeight:1.55,borderTop:'1px solid hsl(220 12% 18%)',paddingTop:6}}>
          {proj.rationale}
        </div>
        <div style={{fontSize:8,color:'hsl(45 5% 38%)',marginTop:4}}>
          Model: national production allocation vs. 24-month attrition rate · For analytical use only
        </div>
      </div>

      {/* Mission Equipment Top-5 */}
      <MissionEquipmentList unitType={data.type}/>

      {/* Baseline/DB Equipment */}
      <BaselineEquipmentPanel unitId={data.id} dbEquip={equipment}/>

      {data.notes && (
        <div style={{background:'hsl(220 15% 12%)',border:'1px solid hsl(220 12% 20%)',borderRadius:3,padding:8,marginBottom:10}}>
          <div style={{fontSize:9,color:'hsl(45 5% 50%)',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.08em'}}>Intel Notes</div>
          <div style={{fontSize:11,color:'hsl(45 5% 70%)',lineHeight:1.5}}>{data.notes}</div>
        </div>
      )}

      {data.hq && (
        <div style={{display:'flex',gap:8,marginBottom:5}}>
          <span style={{fontSize:9,color:'hsl(45 5% 50%)',textTransform:'uppercase',letterSpacing:'0.08em',minWidth:36}}>HQ</span>
          <span style={{fontSize:11,color:'hsl(45 5% 75%)'}}>{data.hq}</span>
        </div>
      )}
      {data.isGuards && <div style={{fontSize:11,color:'hsl(38 92% 65%)',marginBottom:6}}>★ Guards Formation</div>}

      <div style={{marginTop:12,paddingTop:10,borderTop:'1px solid hsl(220 12% 18%)'}}>
        <div style={{fontSize:9,color:'hsl(45 5% 35%)',lineHeight:1.7}}>
          Sources: ISW, Wikipedia, US Army ATP 7-100.1, Russian Way of War (Grau & Bartles 2016), open OSINT.<br/>
          Baseline equipment from pre-2022 TO&amp;E. Subject to fog-of-war.
        </div>
      </div>
    </div>
  );
}

// ─── LIVE INTEL CARD ──────────────────────────────────────────────────────────
const INTEL_TYPE_COLOR: Record<string,string> = {
  losses:    'hsl(0 70% 60%)',
  strike:    'hsl(38 80% 58%)',
  ground:    'hsl(210 60% 60%)',
  naval:     'hsl(195 60% 55%)',
  personnel: 'hsl(280 50% 65%)',
};

function LiveIntelCard({ item }: { item: typeof LIVE_INTEL[0] }) {
  const col = INTEL_TYPE_COLOR[item.type] ?? 'hsl(45 5% 55%)';
  return (
    <div style={{
      background:'hsl(220 15% 11%)',
      border:`1px solid ${col}33`,
      borderLeft:`3px solid ${col}`,
      borderRadius:3,
      padding:12,
      marginBottom:10,
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:9,fontWeight:700,color:col,textTransform:'uppercase',letterSpacing:'0.1em'}}>{item.type}</span>
          <span style={{fontSize:9,color:'hsl(45 5% 40%)',background:'hsl(220 15% 16%)',padding:'1px 6px',borderRadius:2}}>PRIORITY {item.priority}</span>
        </div>
        <span style={{fontSize:9,color:'hsl(45 5% 45%)'}}>{item.date}</span>
      </div>
      <div style={{fontSize:12,fontWeight:700,color:'hsl(45 10% 86%)',lineHeight:1.35,marginBottom:5}}>{item.headline}</div>
      <div style={{fontSize:11,color:'hsl(45 5% 68%)',lineHeight:1.55,marginBottom:6}}>{item.body}</div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:9,color:'hsl(45 5% 45%)'}}>SRC: {item.source}</span>
        <span style={{fontSize:9,color:'hsl(45 5% 38%)',background:'hsl(220 15% 14%)',padding:'1px 6px',borderRadius:2}}>via {item.account}</span>
      </div>
    </div>
  );
}

function IntelCard({ item }: { item: typeof INTEL_NEWS[0] }) {
  const typeMap: Record<string,string> = { personnel:'PERSONNEL', production:'PRODUCTION', projection:'PROJECTION' };
  const colMap: Record<string,string> = { personnel:'hsl(210 60% 60%)', production:'hsl(38 80% 58%)', projection:'hsl(280 50% 65%)' };
  return (
    <div className={`intel-card ${item.type==='projection'?'production':item.type}`}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
        <span style={{fontSize:9,fontWeight:700,color:colMap[item.type],textTransform:'uppercase',letterSpacing:'0.1em'}}>{typeMap[item.type]}</span>
        <span style={{fontSize:9,color:'hsl(45 5% 45%)'}}>{item.date}</span>
      </div>
      <div style={{fontSize:12,fontWeight:700,color:'hsl(45 10% 86%)',lineHeight:1.35,marginBottom:5}}>{item.headline}</div>
      <div style={{fontSize:11,color:'hsl(45 5% 68%)',lineHeight:1.55,marginBottom:6}}>{item.body}</div>
      <div style={{fontSize:9,color:'hsl(45 5% 45%)'}}>SRC: {item.source}</div>
    </div>
  );
}

function ProjectionChart() {
  const MAX_VAL = 2000;
  return (
    <div>
      <div style={{fontSize:10,color:'hsl(45 5% 55%)',marginBottom:12,lineHeight:1.6}}>
        Annual equipment gains (production + refurbishment) vs. confirmed/estimated battlefield losses.
        2026–2028 are projections based on reported production plans and trend extrapolation.
        <span style={{color:'hsl(38 80% 55%)',marginLeft:6}}>■ Projected years</span>
      </div>

      {Object.entries(PROJ_DATA).map(([key,cat])=>(
        <div key={key} className="chart-wrap">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <span style={{fontSize:11,fontWeight:700,color:cat.color}}>{cat.label}</span>
            <div style={{display:'flex',gap:12,fontSize:9,color:'hsl(45 5% 55%)'}}>
              <span><span style={{color:'hsl(120 50% 50%)'}}> ▮</span> Gained</span>
              <span><span style={{color:'hsl(0 60% 50%)'}}> ▮</span> Lost</span>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'44px 1fr',rowGap:5,alignItems:'center'}}>
            {PROJ_YEARS.map((yr,i)=>{
              const isProj = yr >= 2026;
              const g = cat.gained[i], l = cat.lost[i];
              return [
                <span key={`y${yr}`} style={{fontSize:9,color:isProj?'hsl(38 80% 55%)':'hsl(45 5% 55%)',textAlign:'right',paddingRight:8}}>{yr}</span>,
                <div key={`b${yr}`}>
                  <div className="proj-bar-wrap">
                    <div className="proj-bar" style={{opacity:isProj?0.7:1}}>
                      <div className="proj-bar-gain" style={{width:`${(g/MAX_VAL)*100}%`}}/>
                    </div>
                    <span style={{fontSize:9,color:'hsl(120 40% 60%)',minWidth:34,textAlign:'right'}}>{g.toLocaleString()}</span>
                  </div>
                  <div className="proj-bar-wrap" style={{marginBottom:0}}>
                    <div className="proj-bar" style={{opacity:isProj?0.7:1}}>
                      <div className="proj-bar-loss" style={{width:`${(l/MAX_VAL)*100}%`}}/>
                    </div>
                    <span style={{fontSize:9,color:'hsl(0 60% 60%)',minWidth:34,textAlign:'right'}}>{l.toLocaleString()}</span>
                  </div>
                </div>,
              ];
            })}
          </div>
          <div style={{fontSize:9,color:'hsl(45 5% 40%)',marginTop:6,lineHeight:1.5}}>{cat.notes}</div>
        </div>
      ))}

      {/* Personnel projection */}
      <div className="chart-wrap">
        <div style={{fontSize:11,fontWeight:700,color:'hsl(210 60% 65%)',marginBottom:8}}>Personnel — Contract Recruitment</div>
        {[
          {yr:2022,val:200000,proj:false,note:'Mobilization wave'},
          {yr:2023,val:350000,proj:false,note:null},
          {yr:2024,val:450000,proj:false,note:'Peak year'},
          {yr:2025,val:422000,proj:false,note:'6% drop'},
          {yr:2026,val:409000,proj:true,note:'MoD target'},
          {yr:2027,val:380000,proj:true,note:'Est. trend'},
          {yr:2028,val:360000,proj:true,note:'Est. trend'},
        ].map(row=>(
          <div key={row.yr} className="proj-bar-wrap">
            <span style={{fontSize:9,color:row.proj?'hsl(38 80% 55%)':'hsl(45 5% 55%)',minWidth:44,textAlign:'right',paddingRight:8}}>{row.yr}</span>
            <div className="proj-bar" style={{height:10,opacity:row.proj?0.65:1}}>
              <div style={{height:'100%',borderRadius:3,background:'hsl(210 50% 40%)',width:`${(row.val/500000)*100}%`}}/>
            </div>
            <span style={{fontSize:9,color:'hsl(210 40% 65%)',minWidth:42,textAlign:'right'}}>{(row.val/1000).toFixed(0)}K</span>
            {row.note && <span style={{fontSize:9,color:'hsl(45 5% 45%)',marginLeft:4}}>{row.note}</span>}
          </div>
        ))}
        <div style={{fontSize:9,color:'hsl(45 5% 40%)',marginTop:6,lineHeight:1.5}}>
          Sources: Medvedev/MoD statements, Reuters, Moscow Times. 2026+ are projections.<br/>
          Note: Q1 2026 casualties (85,290) exceeded recruitment (80,456) for 4th consecutive month.
        </div>
      </div>
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({ tab, setTab, onRefresh, isRefreshing }: {
  tab: string; setTab:(t:string)=>void; onRefresh:()=>void; isRefreshing:boolean;
}) {
  return (
    <header style={{background:'hsl(220 15% 9%)',borderBottom:'1px solid hsl(220 12% 18%)',position:'sticky',top:0,zIndex:100}}>
      <div style={{padding:'7px 14px',display:'flex',alignItems:'center',gap:10,borderBottom:'1px solid hsl(220 12% 16%)'}}>
        <img
          src={ravenLogo}
          alt="Task Force Raven"
          style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:'1px solid hsl(0 60% 35%)',boxShadow:'0 0 8px hsl(0 70% 25% / 0.6)'}}
        />
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700,color:'hsl(38 92% 65%)',letterSpacing:'0.04em',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            THE RED LEDGER
          </div>
          <div style={{fontSize:9,color:'hsl(45 5% 40%)',letterSpacing:'0.05em',display:'flex',alignItems:'center',gap:5}}>
            <span style={{color:'hsl(0 55% 45%)',fontSize:9,fontWeight:700}}>TASK FORCE RAVEN</span>
            <span style={{color:'hsl(45 5% 30%)'}}>·</span>
            <span className="live-dot" style={{width:5,height:5}}/>
            <span>LIVE · ISW / ORYX · {new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} UTC</span>
          </div>
        </div>
        <button onClick={onRefresh} disabled={isRefreshing}
          style={{background:'hsl(220 15% 16%)',border:'1px solid hsl(220 12% 28%)',borderRadius:3,
            color:isRefreshing?'hsl(45 5% 45%)':'hsl(38 92% 58%)',padding:'5px 10px',cursor:isRefreshing?'default':'pointer',
            fontSize:10,fontFamily:'inherit',letterSpacing:'0.04em',whiteSpace:'nowrap',flexShrink:0}}>
          {isRefreshing ? '…' : '⟳ REFRESH'}
        </button>
      </div>
      <nav className="nav-tabs">
        {[
          {id:'oob-desktop',label:'📊 OOB Chart'},
          {id:'oob-mobile',label:'📱 OOB Mobile'},
          {id:'intel',label:'📡 Intel Feed'},
          {id:'projections',label:'📈 Projections'},
          {id:'tacmap',label:'🗺 Tactical Map'},
        ].map(t=>(
          <button key={t.id} className={`nav-tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function OOBPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('oob-desktop');
  const [selected, setSelected] = useState<{type:string;data:any}|null>(null);
  const [filter, setFilter] = useState('');
  const [intelFilter, setIntelFilter] = useState<'all'|'personnel'|'production'|'projection'>('all');

  const {data, isLoading} = useQuery<OOBData>({queryKey:['/api/oob'], refetchInterval: 5*60*1000});

  const refreshMutation = useMutation({
    mutationFn:()=>apiRequest('POST','/api/refresh'),
    onSuccess:()=>qc.invalidateQueries({queryKey:['/api/oob']}),
  });

  const handleSelect = useCallback((type:string, d:any) => {
    setSelected(prev=>prev?.data.id===d.id?null:{type,data:d});
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    if (mq.matches && tab === 'oob-desktop') setTab('oob-mobile');
  }, []);

  if (isLoading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
      <img src={ravenLogo} alt="" style={{width:32,height:32,borderRadius:'50%',opacity:0.7}}/>
      <span style={{color:'hsl(38 92% 58%)',fontSize:12}}>LOADING THE RED LEDGER…</span>
    </div>
  );

  if (!data) return null;

  const {districts, armies, divisions, brigades, equipment, oryxLosses, lastUpdated} = data;

  const brigsMap = new Map<string,Brigade[]>();
  for (const b of brigades) {
    const arr = brigsMap.get(b.parentId) ?? [];
    arr.push(b);
    brigsMap.set(b.parentId, arr);
  }

  const fl = filter.toLowerCase();
  const fArmies = fl ? armies.filter(a=>a.name.toLowerCase().includes(fl)) : armies;
  const fDivs = fl ? divisions.filter(d=>d.name.toLowerCase().includes(fl)) : divisions;
  const fBrigsMap = fl
    ? new Map(Array.from(brigsMap.entries()).map(([k,v])=>[k,v.filter(b=>b.name.toLowerCase().includes(fl))]))
    : brigsMap;

  const hasDetail = selected !== null;
  const detailW = hasDetail ? 325 : 0;
  const filteredIntel = intelFilter === 'all' ? INTEL_NEWS : INTEL_NEWS.filter(i=>i.type===intelFilter);

  return (
    <div style={{minHeight:'100vh',paddingRight:tab!=='intel'&&tab!=='projections'&&tab!=='tacmap'&&!isMobileTab(tab)?`${detailW}px`:'0',transition:'padding-right 0.25s'}}>
      <Header tab={tab} setTab={setTab} onRefresh={()=>refreshMutation.mutate()} isRefreshing={refreshMutation.isPending}/>

      {/* Tactical map — full bleed, no padding */}
      {tab === 'tacmap' && (
        <div style={{height:"calc(100vh - 97px)"}}><TacticalMap armies={armies} divs={divisions} brigsMap={brigsMap} equipment={equipment}/></div>
      )}

      <div style={{padding: tab === 'tacmap' ? '0' : '12px 14px', display: tab === 'tacmap' ? 'none' : undefined}}>

        {/* ── OOB DESKTOP TAB ── */}
        {tab === 'oob-desktop' && (
          <>
            <OryxSummary losses={oryxLosses} lastUpdated={lastUpdated}/>
            <div style={{marginBottom:12,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <input type="text" placeholder="FILTER UNITS…" value={filter} onChange={e=>setFilter(e.target.value)}
                data-testid="input-filter"
                style={{background:'hsl(220 15% 13%)',border:'1px solid hsl(220 12% 28%)',borderRadius:3,
                  color:'hsl(45 10% 80%)',padding:'6px 12px',fontFamily:'inherit',fontSize:11,
                  letterSpacing:'0.05em',width:240,outline:'none'}}/>
              {filter && <button onClick={()=>setFilter('')} style={{fontSize:10,color:'hsl(45 5% 50%)',background:'none',border:'none',cursor:'pointer'}}>CLEAR</button>}
              <div style={{marginLeft:'auto',fontSize:9,color:'hsl(45 5% 40%)',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                <span>▼ CLICK UNIT FOR DETAIL PANEL</span>
                <span style={{display:'flex',alignItems:'center',gap:5}}>
                  <span style={{fontSize:8,color:'hsl(45 5% 55%)'}}>MIL-STD-2525D symbol + patch shown left of name</span>
                </span>
              </div>
            </div>
            {districts.map(d=>(
              <DesktopDistrict key={d.id} district={d} armies={fArmies} divs={fDivs}
                brigsMap={fBrigsMap}
                onClick={()=>{}} onArmy={a=>handleSelect('army',a)}
                onDiv={d=>handleSelect('division',d)} onBrig={b=>handleSelect('brigade',b)}
                equipment={equipment}/>
            ))}
          </>
        )}

        {/* ── OOB MOBILE TAB ── */}
        {tab === 'oob-mobile' && (
          <>
            <OryxSummary losses={oryxLosses} lastUpdated={lastUpdated} compact/>
            <div style={{marginBottom:10,display:'flex',gap:8,alignItems:'center'}}>
              <input type="text" placeholder="FILTER UNITS…" value={filter} onChange={e=>setFilter(e.target.value)}
                style={{background:'hsl(220 15% 13%)',border:'1px solid hsl(220 12% 28%)',borderRadius:3,
                  color:'hsl(45 10% 80%)',padding:'6px 10px',fontFamily:'inherit',fontSize:11,flex:1,outline:'none'}}/>
              {filter && <button onClick={()=>setFilter('')} style={{fontSize:10,color:'hsl(45 5% 50%)',background:'none',border:'none',cursor:'pointer'}}>✕</button>}
            </div>
            <div style={{fontSize:10,color:'hsl(45 5% 42%)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
              <span>Tap district → army → tap INFO for full detail inline</span>
            </div>
            {districts.map(d=>(
              <MobileDistrict key={d.id} district={d} armies={fArmies} divs={fDivs}
                brigsMap={fBrigsMap} onSelect={handleSelect} equipment={equipment}/>
            ))}
          </>
        )}

        {/* ── INTEL FEED TAB ── */}
        {tab === 'intel' && (
          <>
            {/* Live OSINT section */}
            <div style={{marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span className="live-dot"/>
                <div style={{fontSize:13,fontWeight:700,color:'hsl(38 92% 60%)'}}>Live OSINT Feed</div>
              </div>
              <div style={{fontSize:10,color:'hsl(45 5% 50%)',marginBottom:10,lineHeight:1.6}}>
                Top 5 most trusted OSINT sources for the Russia-Ukraine conflict — ranked by analytical rigor, verification standards, and track record.
              </div>
              {LIVE_INTEL.map(item=><LiveIntelCard key={item.id} item={item}/>)}
            </div>

            <div style={{borderTop:'2px solid hsl(220 12% 20%)',paddingTop:14,marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:700,color:'hsl(38 92% 60%)',marginBottom:4}}>Intelligence Background</div>
              <div style={{fontSize:10,color:'hsl(45 5% 50%)',marginBottom:10}}>
                Background intelligence on Russian military recruitment, defence production, and force regeneration. Sorted most recent first.
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {(['all','personnel','production','projection'] as const).map(f=>(
                  <button key={f} onClick={()=>setIntelFilter(f)}
                    style={{padding:'4px 10px',fontSize:10,fontFamily:'inherit',fontWeight:700,
                      background:intelFilter===f?'hsl(38 70% 22%)':'hsl(220 15% 14%)',
                      border:`1px solid ${intelFilter===f?'hsl(38 60% 38%)':'hsl(220 12% 24%)'}`,
                      borderRadius:2,color:intelFilter===f?'hsl(38 92% 62%)':'hsl(45 5% 55%)',
                      cursor:'pointer',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="kpi-grid cols4" style={{marginBottom:14}}>
              {[
                {label:'Contracts signed 2025',val:'422,704',color:'hsl(210 60% 65%)'},
                {label:'Contract target 2026',val:'409,000',color:'hsl(210 50% 55%)'},
                {label:'Shells produced 2025',val:'7,000,000',color:'hsl(38 80% 58%)'},
                {label:'T-90M delivered 2025',val:'250–300',color:'hsl(38 80% 58%)'},
              ].map(k=>(
                <div key={k.label} className="kpi-box">
                  <div className="kpi-val" style={{color:k.color,fontSize:13}}>{k.val}</div>
                  <div className="kpi-lbl">{k.label}</div>
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:10}}>
              {filteredIntel.map(item=><IntelCard key={item.id} item={item}/>)}
            </div>

            <div style={{marginTop:16,padding:'10px 0',borderTop:'1px solid hsl(220 12% 18%)',fontSize:9,color:'hsl(45 5% 32%)',lineHeight:1.8}}>
              SOURCES: ISW criticalthreats.org · Ukrainian General Staff (GeneralStaff.ua) · Caliber.az · Reuters · Moscow Times · Estonia FISA · Defence-UA · Janes · Frontelligence Insight · Censor.net · Russianomics/Janis Kluge · Data as of April 2026.
            </div>
          </>
        )}

        {/* ── PROJECTIONS TAB ── */}
        {tab === 'projections' && (
          <>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:700,color:'hsl(38 92% 60%)',marginBottom:4}}>Equipment Projections 2022–2028</div>
              <div style={{fontSize:10,color:'hsl(45 5% 50%)',lineHeight:1.6}}>
                Annual equipment gains (production + refurbishment from storage) vs. battlefield losses. Confirmed losses from Oryx; estimates supplement where visual confirmation lags.
                <span style={{color:'hsl(38 80% 55%)',marginLeft:6}}>■ = projected years (2026–2028)</span>
              </div>
            </div>

            <OryxSummary losses={oryxLosses} lastUpdated={lastUpdated} compact/>
            <ProjectionChart/>

            <div style={{marginTop:8,fontSize:9,color:'hsl(45 5% 32%)',lineHeight:1.8,borderTop:'1px solid hsl(220 12% 18%)',paddingTop:10}}>
              METHODOLOGY: Gains = confirmed deliveries (Oryx captures, state media) + analyst estimates for refurbishment.
              Losses = Oryx-confirmed + ISW/IISS unconfirmed estimates. 2026–2028 projections based on Uralvagonzavod production plans,
              Frontelligence leaked documents, Janes assessments, and Estonian FISA estimates.
              All figures subject to significant uncertainty. For analytical purposes only. Not for operational use.
            </div>
          </>
        )}

        {/* Shared footer */}
        {tab !== 'intel' && tab !== 'projections' && tab !== 'tacmap' && (
          <div style={{marginTop:20,paddingTop:10,borderTop:'1px solid hsl(220 12% 16%)',fontSize:9,color:'hsl(45 5% 30%)',lineHeight:1.8}}>
            DATA: Oryx (live) · ISW · DeepStateMap · Ukrainian General Staff · Bellingcat · US Army ATP 7-100.1 · Russian Way of War (Grau & Bartles 2016) · MIL-STD-2525D symbology (FM 1-02.2) · Strength estimates carry fog-of-war uncertainty · For analytical purposes only
          </div>
        )}
      </div>

      {/* Desktop detail panel */}
      {tab === 'oob-desktop' && selected && (
        <DetailPanel selected={selected} equipment={equipment} onClose={()=>setSelected(null)}/>
      )}
    </div>
  );
}

function isMobileTab(tab: string) { return tab === 'oob-mobile'; }

/**
 * THE RED LEDGER — Knowledge Base for RAG Chatbot
 * Client-side TF-IDF search over curated intelligence entries
 * No external API required — runs entirely in browser
 */

export interface KBEntry {
  id: string;
  category: 'oob' | 'equipment' | 'losses' | 'production' | 'oil' | 'rail' | 'drones' | 'aid' | 'personnel' | 'general';
  keywords: string[];
  question: string;
  answer: string;
}

export const KNOWLEDGE_BASE: KBEntry[] = [
  // ─── OOB Structure ───────────────────────────────────────────────
  {
    id: 'oob-overview',
    category: 'oob',
    keywords: ['oob', 'order', 'battle', 'structure', 'organization', 'russian', 'ground', 'forces', 'rgf', 'how many', 'units'],
    question: 'What is the Russian Ground Forces order of battle?',
    answer: 'The Russian Ground Forces (RGF) are organized under 5 Military Districts: Moscow, Leningrad, Southern, Central, and Eastern. These contain 20 Armies/Corps, 15 Divisions, and 36+ Brigades. The force structure includes Tank Armies, Combined Arms Armies, Army Corps, Motor Rifle Divisions/Brigades, Tank Divisions/Brigades, Naval Infantry, Air Assault, Spetsnaz, and Artillery units.',
  },
  {
    id: 'oob-moscow',
    category: 'oob',
    keywords: ['moscow', 'military', 'district', '1st', 'guards', 'tank', 'army', '1gta', '20th'],
    question: 'What units are in the Moscow Military District?',
    answer: 'The Moscow Military District includes the 1st Guards Tank Army (HQ: Odintsovo) and 20th Guards Combined Arms Army (HQ: Voronezh). Key subordinate units include the 2nd Guards "Tamanskaya" Motor Rifle Division, 4th Guards "Kantemirovskaya" Tank Division, 27th Guards Motor Rifle Brigade, 2nd Guards Spetsnaz Brigade, and 144th Guards Motor Rifle Division.',
  },
  {
    id: 'oob-leningrad',
    category: 'oob',
    keywords: ['leningrad', 'military', 'district', '6th', 'army', '11th', 'corps', '14th', 'saint', 'petersburg'],
    question: 'What units are in the Leningrad Military District?',
    answer: 'The Leningrad Military District includes 4 armies/corps: 6th Combined Arms Army (HQ: St. Petersburg), 11th Army Corps (HQ: Kaliningrad), 14th Army Corps (HQ: Murmansk), and 44th Army Corps (HQ: Novorossiysk). This district covers the northern and Baltic flank, including the Kaliningrad exclave.',
  },
  {
    id: 'oob-southern',
    category: 'oob',
    keywords: ['southern', 'military', 'district', '8th', '3rd', '58th', '51st', '18th', '49th'],
    question: 'What units are in the Southern Military District?',
    answer: 'The Southern Military District is the largest, with 6 armies/corps: 3rd Guards Combined Arms Army, 8th Guards Combined Arms Army, 18th Combined Arms Army, 49th Combined Arms Army, 51st Combined Arms Army, and 58th Guards Combined Arms Army. This district bears the heaviest combat burden in Ukraine, with most units deployed along the front lines.',
  },
  {
    id: 'oob-central',
    category: 'oob',
    keywords: ['central', 'military', 'district', '2nd', '41st', '3rd', 'corps', 'yekaterinburg'],
    question: 'What units are in the Central Military District?',
    answer: 'The Central Military District includes the 2nd Guards Combined Arms Army, 41st Guards Combined Arms Army, and 3rd Army Corps (HQ: Nizhny Novgorod). Based in the Urals region with HQ in Yekaterinburg, this district provides strategic reserve forces and has deployed units to Ukraine.',
  },
  {
    id: 'oob-eastern',
    category: 'oob',
    keywords: ['eastern', 'military', 'district', '5th', '29th', '35th', '36th', '68th', 'khabarovsk', 'pacific'],
    question: 'What units are in the Eastern Military District?',
    answer: 'The Eastern Military District includes 5 armies/corps: 5th Guards Combined Arms Army (HQ: Vladivostok), 29th Guards Combined Arms Army, 35th Combined Arms Army, 36th Combined Arms Army, and 68th Army Corps (Sakhalin). While primarily tasked with Pacific defense, units from this district have deployed to Ukraine with significant losses.',
  },
  {
    id: 'ce-explain',
    category: 'oob',
    keywords: ['combat', 'effectiveness', 'ce', 'strength', 'percentage', 'effective', 'reduced', 'degraded', 'ineffective', 'what', 'mean', 'color'],
    question: 'What do the combat effectiveness percentages mean?',
    answer: 'Combat Effectiveness (CE%) measures a unit\'s ability to execute its mission. Green (≥75%) = EFFECTIVE — fully mission capable. Amber (50–74%) = REDUCED — can conduct limited operations. Red (25–49%) = DEGRADED — severely limited combat capability. Dark Red (<25%) = INEFFECTIVE — combat power essentially destroyed. CE is calculated from equipment strength, personnel levels, training status, and attrition rates.',
  },
  // ─── Equipment ───────────────────────────────────────────────────
  {
    id: 'equip-tanks',
    category: 'equipment',
    keywords: ['tank', 'tanks', 't-90', 't-72', 't-80', 'mbt', 'main', 'battle', 'armor', 'armour'],
    question: 'What tanks does Russia use?',
    answer: 'Russia fields three main battle tank families: T-90M "Proryv" (most modern, ~240/yr production at Uralvagonzavod), T-72B3M (backbone of tank fleet, upgraded with Relikt ERA and Sosna-U sights), and T-80BVM (gas turbine, limited production — Omsktranshmash appears non-functional). Only ~134 T-80s remain in storage. The new T-90M2 "Ryvok" variant is starting production in 2026. Pre-war Russia had ~2,900 active tanks plus ~10,000 in storage.',
  },
  {
    id: 'equip-ada',
    category: 'equipment',
    keywords: ['ada', 'air', 'defense', 'anti-aircraft', 's-300', 's-400', 'buk', 'tor', 'pantsir', 'sam', 'missile'],
    question: 'What air defense systems does Russia have?',
    answer: 'Russian Ground Forces air defense includes: S-300V4 (long-range, ~200km), Buk-M2/M3 (medium-range, ~70km), Tor-M2 (short-range, ~15km), Pantsir-S1 (point defense, ~20km gun/missile combo), and Tunguska-M1. Oryx-confirmed SAM system losses exceed 400+. These are critical — their loss creates gaps exploited by Ukrainian drones and cruise missiles. Replacement production is extremely slow, estimated at only 2–3 S-400 battalions per year.',
  },
  {
    id: 'equip-artillery',
    category: 'equipment',
    keywords: ['artillery', 'howitzer', '2s19', 'msta', '2s3', 'akatsiya', 'sp', 'self-propelled', 'gun', 'towed', 'd-30', '2a65'],
    question: 'What artillery does Russia use?',
    answer: 'Key Russian self-propelled artillery: 2S19 Msta-S (152mm, workhorse), 2S3 Akatsiya (152mm, older), 2S7 Pion (203mm, heavy), 2S35 Koalitsiya-SV (newest, very few deployed). Towed: D-30 (122mm), 2A65 Msta-B (152mm). Oryx-confirmed SP artillery losses exceed 1,000. Towed artillery losses exceed 550. Russia is burning through artillery barrels faster than replacement — barrel life is ~1,500 rounds, frontline guns fire 40-80 rounds/day.',
  },
  {
    id: 'equip-mlrs',
    category: 'equipment',
    keywords: ['mlrs', 'rocket', 'bm-21', 'grad', 'bm-27', 'uragan', 'bm-30', 'smerch', 'tornado', 'multiple', 'launch'],
    question: 'What MLRS systems does Russia have?',
    answer: 'Russian MLRS inventory: BM-21 Grad (122mm, 40 tubes, 40km range — most numerous), BM-27 Uragan (220mm, 16 tubes, 35km), BM-30 Smerch (300mm, 12 tubes, 90km), and 9A52-4 Tornado-G/S (modernized Grad/Smerch). Oryx-confirmed MLRS losses exceed 580. BM-21 Grads are expendable and plentiful but the larger BM-27/30 systems are irreplaceable — production lines are barely functional.',
  },
  {
    id: 'equip-ifv',
    category: 'equipment',
    keywords: ['ifv', 'infantry', 'fighting', 'vehicle', 'bmp', 'btr', 'apc', 'armoured', 'armored', 'personnel', 'carrier'],
    question: 'What IFVs and APCs does Russia use?',
    answer: 'IFVs: BMP-2 (most common, 30mm cannon + ATGM), BMP-3 (100mm gun + 30mm), BMP-1 (legacy, still in use). APCs: BTR-82A (30mm turret, wheeled), BTR-80 (older), MT-LB (tracked multipurpose, used as everything). Oryx-confirmed IFV losses exceed 6,400, APC losses exceed 3,200. Russia is pulling MT-LBs and even civilian vehicles from storage due to massive attrition.',
  },
  // ─── Losses ──────────────────────────────────────────────────────
  {
    id: 'losses-overview',
    category: 'losses',
    keywords: ['loss', 'losses', 'destroyed', 'total', 'equipment', 'oryx', 'confirmed', 'verified', 'how', 'many'],
    question: 'What are total Russian equipment losses?',
    answer: 'As of April 2026, Oryx visual-confirmation tracking shows 24,383 total Russian equipment pieces: 19,028 destroyed, 1,204 abandoned, 3,180 captured, and ~971 damaged. Major categories: 4,300+ tanks, 6,400+ IFVs, 3,200+ APCs, 1,008 self-propelled artillery, 551 towed artillery, 580+ MLRS, 405+ SAM systems. These are MINIMUM confirmed — actual losses are significantly higher as Oryx only counts photo-verified losses.',
  },
  {
    id: 'losses-personnel',
    category: 'personnel',
    keywords: ['casualty', 'casualties', 'killed', 'wounded', 'kia', 'personnel', 'soldier', 'troops', 'manpower', 'recruitment'],
    question: 'What are Russian personnel losses?',
    answer: 'Ukrainian General Staff reports cumulative Russian personnel losses of ~1,306,500 since Feb 2022 (includes KIA, WIA requiring replacement, captured, deserted). Q1 2026 data: ~85,290 casualties vs 80,456 new recruits — the 4th consecutive month where losses exceeded replacement. Russia is paying $22,000+ signing bonuses to attract contract soldiers. Regions like Dagestan and Buryatia continue to bear disproportionate losses.',
  },
  {
    id: 'losses-rate',
    category: 'losses',
    keywords: ['rate', 'attrition', 'per', 'day', 'week', 'month', 'accelerating', 'trend', 'burn'],
    question: 'What is the current Russian loss rate?',
    answer: 'Current Russian loss rates (Apr 2026): ~25-30 tanks/week, ~40-50 IFVs/week, ~8-12 SP artillery/week, ~63 artillery systems in one record single-day (Apr 8). The tank loss rate is accelerating due to increased Ukrainian drone warfare. At current attrition, Russia\'s active tank fleet would be exhausted within 18-24 months without storage drawdowns, but refurbishment of stored vehicles is increasingly constrained by parts shortages.',
  },
  // ─── Production ──────────────────────────────────────────────────
  {
    id: 'prod-tanks',
    category: 'production',
    keywords: ['production', 'manufacture', 'factory', 'uralvagonzavod', 'uvz', 'tank', 'build', 'new', 'rate', 'year', 'annual'],
    question: 'What is Russian tank production rate?',
    answer: 'Russia produces ~240 T-90M tanks/year at Uralvagonzavod (Nizhny Tagil), targeting 428/yr by 2028. Omsktranshmash (T-80 production) appears non-functional for new builds. Most "production" is actually refurbishment of stored Soviet-era vehicles — taking T-72Bs from storage, upgrading to T-72B3M standard. Russia is also producing the new T-90M2 "Ryvok" variant starting 2026. Storage reserves are estimated at ~5,000-7,000 tanks remaining, but quality and completeness vary greatly.',
  },
  {
    id: 'prod-dib-russia',
    category: 'production',
    keywords: ['defense', 'industry', 'industrial', 'base', 'russia', 'russian', 'dib', 'manufacturing', 'capacity', 'mobilization'],
    question: 'What is the state of Russian defence industry?',
    answer: 'Russia\'s defence industrial base is under extreme strain. Key issues: 3-shift, 24/7 operations at major plants; critical machine tool shortages (90% imported pre-war); skilled labor deficit — poaching workers with 3x-4x salary premiums; Western sanctions blocking precision components; artillery barrel production can\'t match consumption; tank "production" is mostly refurbishment; drone production ramping but reliant on Chinese/Iranian components. Estimated defence spending: 40%+ of federal budget in 2026.',
  },
  // ─── Oil Strikes ─────────────────────────────────────────────────
  {
    id: 'oil-overview',
    category: 'oil',
    keywords: ['oil', 'energy', 'refinery', 'strike', 'target', 'capacity', 'disrupted', 'export', 'infrastructure'],
    question: 'How much Russian oil capacity has Ukraine disrupted?',
    answer: 'As of April 2026, ~40% of Russian oil export capacity is disrupted — approximately 2 million barrels/day offline. This is the worst disruption to Russian oil supply in modern history. Ukraine has struck 21 of Russia\'s 38 major refineries, multiple export terminals (Sheskharis, Ust-Luga, Primorsk), and even tanker ships at sea. 14 fuel/lubricant depots also hit. The campaign targets Russia\'s war funding — oil/gas revenue funds ~35-40% of the federal budget.',
  },
  {
    id: 'oil-sheskharis',
    category: 'oil',
    keywords: ['sheskharis', 'novorossiysk', 'black', 'sea', 'terminal', 'crude', 'export', 'port'],
    question: 'What happened to the Sheskharis terminal?',
    answer: 'The Sheskharis oil terminal at Novorossiysk is Russia\'s main Black Sea oil export hub, normally handling 700,000 barrels/day of crude. SBU Centre Alpha drones struck it multiple times: early March (loading halted 5 days), April 5-6 (6 of 7 loading jetties damaged, pipeline and metering infrastructure hit). The terminal handles ~20% of Russia\'s wartime crude exports. Combined with Baltic port strikes, ~40% of export capacity is now paralyzed.',
  },
  {
    id: 'oil-ustluga',
    category: 'oil',
    keywords: ['ust-luga', 'ust', 'luga', 'baltic', 'port', 'novatek', 'lng', 'leningrad'],
    question: 'What happened at Ust-Luga?',
    answer: 'Ust-Luga, Russia\'s largest Baltic Sea export port (~33M metric tons of petroleum/yr, 700,000+ bbl/day), was struck by Ukrainian drones 3 times in one week (March 25, 27, 29 2026). Each strike caused massive fires. The port is operated by Transneft and also handles Novatek LNG. Located >900km from Ukraine\'s border. Exports have been suspended since late March. The port also handles coal, iron ore, fertilizers, making the disruption multi-sector.',
  },
  {
    id: 'oil-kirishi',
    category: 'oil',
    keywords: ['kirishi', 'kinef', 'refinery', 'largest', 'leningrad', 'halted', 'processing'],
    question: 'What happened at the Kirishi refinery?',
    answer: 'The Kirishi (KINEF) refinery in Leningrad Oblast is Russia\'s 2nd largest, processing 20-21M tons of crude/year (~6.6% of Russia\'s total refined oil). Hit on March 26-27, 2026 — fires engulfed crude oil processing units (ELOU-AVT-2 and ELOU-AVT-6), petroleum bitumen production, and gas fractionation units. This refinery supplies engine oils and lubricants critical for military equipment. Located 800+ km from Ukraine. Previously struck in Sept 2025, Oct 2025, and March 2025.',
  },
  {
    id: 'oil-other',
    category: 'oil',
    keywords: ['saratov', 'tuapse', 'primorsk', 'ryazan', 'volgograd', 'afipsky', 'bashneft', 'ufa', 'yaroslavl', 'kstovo'],
    question: 'What other oil targets has Ukraine struck?',
    answer: 'Other major targets include: Saratov refinery (suspended operations), Primorsk Baltic terminal (1M+ bbl/day, struck), Tuapse refinery (Krasnodar, Black Sea), Ryazan refinery, Kstovo refinery (Nizhny Novgorod), Moscow refinery (50% of Moscow fuel at risk), Volgograd refinery, Bashneft-Ufaneftekhim (Ufa, 1,300km from front), Yaroslavl refinery, Novokuibyshevsk (Samara), Afipsky/Ilsky/Slavyansk (Krasnodar cluster). In March 2026 alone, 10 refineries were hit plus 14 fuel depots.',
  },
  // ─── Russian Rail ────────────────────────────────────────────────
  {
    id: 'rail-overview',
    category: 'rail',
    keywords: ['rail', 'railway', 'railroad', 'train', 'freight', 'logistics', 'transport', 'rzhd'],
    question: 'What is the state of Russian railways?',
    answer: 'Russian Railways (RZhD) is in deep crisis: $46.7B debt, freight volumes at 16-year low, profit collapsed 22x, laying off 6,000 staff, selling Moscow real estate to cover costs. 200 trains cancelled daily. ATESH partisans have conducted sabotage operations on rail in Crimea, Luhansk, Rostov, and Belgorod. Analysts describe the freight collapse as "structural, not cyclical" — meaning the rail network is fundamentally broken, not just experiencing a temporary downturn.',
  },
  {
    id: 'rail-sabotage',
    category: 'rail',
    keywords: ['sabotage', 'atesh', 'partisan', 'derailment', 'explosion', 'crimea', 'pokrovsk'],
    question: 'Has Russian rail been sabotaged?',
    answer: 'Yes. ATESH partisans (pro-Ukrainian resistance) have conducted multiple rail sabotage operations: disabled Luhansk rail hub severing Pokrovsk front supply, sabotaged Crimean rail junction on "reunification day" blocking Zaporizhzhia resupply, Tambov region 30-car derailment (suspected sabotage). These attacks target military logistics chokepoints, disrupting ammunition and equipment delivery to front-line units.',
  },
  // ─── Drones ──────────────────────────────────────────────────────
  {
    id: 'drones-ukraine',
    category: 'drones',
    keywords: ['drone', 'fpv', 'uav', 'ukraine', 'ukrainian', 'production', 'million', 'interceptor'],
    question: 'What are Ukraine\'s drone capabilities?',
    answer: 'Ukraine plans to deliver 10 million FPV drones in 2026 (up from 4M+ in 2025). 200+ drone companies are operating. Key developments: interceptor drones achieving 70% kill rate over Kyiv; first defense unicorn UForce (Magura naval drones) valued at $1B+; long-range strike drones reaching 1,300+ km into Russia; AI-guided autonomous targeting being integrated. Total defence industry capacity: $50B/year. FPV drones cost $300-500 each vs $1M+ for the vehicles they destroy.',
  },
  {
    id: 'drones-naval',
    category: 'drones',
    keywords: ['naval', 'sea', 'drone', 'magura', 'maritime', 'ship', 'tanker', 'black sea'],
    question: 'What about Ukrainian naval drones?',
    answer: 'Ukraine pioneered naval drone warfare, sinking or damaging 27+ Russian warships including the flagship Moskva. Magura V5 drones (by UForce, now a $1B+ company) can travel 800+ km. Ukraine has expanded to targeting oil tankers — at least 10 tanker operations confirmed in the Black Sea, Mediterranean, and Atlantic. The Black Sea Fleet has effectively been pushed from western Black Sea, reopening Ukrainian grain exports. Naval drones now carry warheads capable of damaging capital ships.',
  },
  // ─── Foreign Aid ─────────────────────────────────────────────────
  {
    id: 'aid-overview',
    category: 'aid',
    keywords: ['aid', 'military', 'assistance', 'weapon', 'supply', 'western', 'foreign', 'pledge', 'billion', '2026'],
    question: 'What military aid is Ukraine receiving?',
    answer: '$38 billion in military aid pledged for 2026 — the largest annual commitment. Germany leads (€12B — largest single-country package), Norway ($7B), France (100 Rafale fighter jets — largest combat aircraft deal). Czech Republic: shell production tripled to 720,000/year. European aid up 67% year-over-year. US aid down 99% due to policy changes. Denmark, Netherlands, Canada also contributing. Total Western aid since 2022: ~$200B+.',
  },
  {
    id: 'aid-aircraft',
    category: 'aid',
    keywords: ['f-16', 'rafale', 'fighter', 'jet', 'aircraft', 'plane', 'aviation', 'air force', 'gripen'],
    question: 'What aircraft is Ukraine receiving?',
    answer: 'Major aircraft commitments: France signed agreement for 100 Dassault Rafale multirole fighters — the single largest combat aircraft deal. F-16 deliveries ongoing from Denmark, Netherlands, Norway. Czech Air Force also providing Gripen training. Ukrainian pilots already trained on F-16s and conducting operations. Rafales will provide superior multi-role capability and advanced avionics/weapons systems compared to legacy Soviet fleet.',
  },
  {
    id: 'aid-shells',
    category: 'aid',
    keywords: ['ammunition', 'shell', 'shells', 'ammo', '155mm', '152mm', 'czech', 'artillery', 'rounds'],
    question: 'How is Ukraine\'s ammunition supply?',
    answer: 'Czech Republic tripled artillery shell production to 720,000/year. European ammunition initiative delivering 1M+ 155mm shells/year. Rheinmetall opened new ammo plant in Germany. South Korea providing 155mm shells via third-party transfers. Ukraine also produces 152mm shells domestically for Soviet-caliber guns. The "shell hunger" crisis of 2023 has largely been resolved, though demand still exceeds supply at peak consumption rates.',
  },
  // ─── App Features ────────────────────────────────────────────────
  {
    id: 'app-about',
    category: 'general',
    keywords: ['app', 'application', 'red', 'ledger', 'what', 'this', 'about', 'features', 'task', 'force', 'raven'],
    question: 'What is The Red Ledger?',
    answer: 'The Red Ledger by Task Force Raven is an OSINT intelligence application tracking the Russian Ground Forces order of battle. Features: interactive OOB chart with 5 Military Districts, 20 Armies, 15 Divisions, 36+ Brigades; Oryx-verified live loss tracking; unit combat effectiveness ratings with 12-month projections; detailed equipment breakdowns (ADA, radars, artillery, tanks, IFVs); categorized intel feed across 5 domains; tactical IPB-style map; OSINT source repository; and this intelligence analyst chatbot.',
  },
  {
    id: 'app-sources',
    category: 'general',
    keywords: ['source', 'sources', 'data', 'where', 'come', 'from', 'osint', 'isw', 'oryx', 'deepstate', 'reliable', 'trusted'],
    question: 'Where does the data come from?',
    answer: 'The Red Ledger uses top OSINT sources: ISW (Institute for the Study of War) — daily campaign assessments; Oryx — photo-verified equipment losses (minimum confirmed); DeepStateMap — real-time frontline mapping; Ukrainian General Staff — official daily reports; Bellingcat — geolocation verification; Janes — professional defence intelligence; Estonia FISA — annual threat assessment; Frontelligence Insight — tactical analysis. Equipment baselines from "The Russian Way of War" and pre-2022 known TO&Es.',
  },
  {
    id: 'app-projections',
    category: 'general',
    keywords: ['projection', 'forecast', 'predict', 'future', 'trend', 'will', 'next', 'year', 'months'],
    question: 'How do projections work?',
    answer: 'Projections are based on: 1) Current attrition rates from Oryx-confirmed losses (2-year trend); 2) Known production rates (Uralvagonzavod ~240 T-90M/yr, etc.); 3) Storage drawdown rates; 4) Unit-type specific modifiers (tank units trending up due to production, motor rifle trending down due to heavy losses). Combat Effectiveness projections show 12-month outlook. Equipment projections extend to 2028. These are estimates for analytical purposes.',
  },
  {
    id: 'app-map',
    category: 'general',
    keywords: ['map', 'tactical', 'ipb', 'location', 'where', 'flot', 'front', 'line'],
    question: 'What does the tactical map show?',
    answer: 'The Tactical Map is an IPB-style (Intelligence Preparation of the Battlefield) overlay showing: last known positions of all RGF armies/divisions with MIL-STD-2525D hostile symbology (red diamonds); FLOT/FLET line (Apr 2026 estimate from DeepStateMap/ISW); weapon range rings when you click a unit; CE% labels; unit filters (deployed <700km from Kyiv vs strategic reserve). The map also shows Ukrainian drone strikes on Russian oil infrastructure with damage assessments.',
  },
  {
    id: 'app-intel',
    category: 'general',
    keywords: ['intel', 'intelligence', 'feed', 'news', 'stories', 'reports', 'categories', 'trends'],
    question: 'What does the intel feed show?',
    answer: 'The Intel Feed covers 5 categories with 25 stories total: "Top 5 Trends" (cross-cutting stories), "Oil & Energy Strikes" (Ukraine\'s campaign against Russian oil infrastructure), "Defence Industry" (production rates and drone development for both UA and RU), "Russian Rail" (logistics crisis and sabotage), and "Foreign Military Aid" (Western equipment deliveries). Each story is expandable with summary, key details, significance assessment, and source links.',
  },
  // ─── Additional context ──────────────────────────────────────────
  {
    id: 'mil-std',
    category: 'general',
    keywords: ['mil-std', 'symbol', 'symbology', '2525', 'red', 'diamond', 'hostile', 'icon', 'military', 'marker'],
    question: 'What military symbology is used?',
    answer: 'The app uses MIL-STD-2525D (FM 1-02.2) — the US Army standard for military symbols. Hostile ground units are shown as red diamonds with black function icons inside. Echelon markers above indicate unit size (XXXXX = Army, XXX = Division, XX = Brigade). This is US Army doctrine, NOT NATO APP-6D. Unit type icons distinguish infantry, armor, artillery, air assault, spetsnaz, and other branch functions.',
  },
  {
    id: 'ukraine-dib',
    category: 'drones',
    keywords: ['ukraine', 'defence', 'defense', 'industry', 'production', 'manufacturing', 'capacity', 'billion'],
    question: 'What is Ukraine\'s defence industry capacity?',
    answer: 'Ukraine\'s defence industry has reached $50B/year capacity. 200+ drone companies operate in the ecosystem. First defence unicorn: UForce (Magura drone maker, $1B+). Key capabilities: 10M FPV drones planned for 2026; long-range strike drones reaching 1,300+ km; interceptor drones (70% kill rate over Kyiv); naval drones that have reshaped Black Sea warfare; domestic 152mm ammunition production; EW systems; AI-guided autonomous munitions.',
  },
];

// ─── TF-IDF Search Engine ─────────────────────────────────────────
function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s\-']/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1)
    .filter(t => !STOP_WORDS.has(t));
}

const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall',
  'can','of','in','to','for','with','on','at','by','from','as','into',
  'through','during','before','after','above','below','between','up','down',
  'out','off','over','under','again','further','then','once','here','there',
  'when','where','why','how','all','each','every','both','few','more','most',
  'other','some','such','no','nor','not','only','own','same','so','than',
  'too','very','just','because','but','or','if','while','about','that','this',
  'these','those','what','which','who','whom','it','its','i','me','my','we',
  'you','your','he','she','they','them','their','and',
]);

// Compute term frequency for a document
function tf(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  tokens.forEach(t => freq.set(t, (freq.get(t) ?? 0) + 1));
  const max = Math.max(...freq.values(), 1);
  const normalized = new Map<string, number>();
  freq.forEach((v, k) => normalized.set(k, v / max));
  return normalized;
}

// Build IDF from all documents
function buildIdf(docs: string[][]): Map<string, number> {
  const N = docs.length;
  const dfMap = new Map<string, number>();
  docs.forEach(doc => {
    const unique = new Set(doc);
    unique.forEach(t => dfMap.set(t, (dfMap.get(t) ?? 0) + 1));
  });
  const idf = new Map<string, number>();
  dfMap.forEach((df, term) => idf.set(term, Math.log(N / (df + 1)) + 1));
  return idf;
}

// Pre-build search index
const DOC_TOKENS = KNOWLEDGE_BASE.map(e =>
  tokenize([e.question, e.answer, ...e.keywords].join(' '))
);
const IDF = buildIdf(DOC_TOKENS);
const DOC_TF = DOC_TOKENS.map(tf);

export function searchKB(query: string, topK = 3): KBEntry[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const queryTf = tf(queryTokens);
  const scores: { idx: number; score: number }[] = [];

  DOC_TF.forEach((docTf, idx) => {
    let score = 0;
    let keywordBoost = 0;

    queryTokens.forEach(qt => {
      const tfDoc = docTf.get(qt) ?? 0;
      const tfQ = queryTf.get(qt) ?? 0;
      const idfVal = IDF.get(qt) ?? 1;
      score += tfDoc * tfQ * idfVal;

      // Boost if query term matches a keyword directly
      if (KNOWLEDGE_BASE[idx].keywords.some(kw => kw.includes(qt) || qt.includes(kw))) {
        keywordBoost += 2;
      }
    });

    scores.push({ idx, score: score + keywordBoost });
  });

  return scores
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => KNOWLEDGE_BASE[s.idx]);
}

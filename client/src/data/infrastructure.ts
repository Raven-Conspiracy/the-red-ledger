/**
 * THE RED LEDGER — Russian Infrastructure Data
 * Major railroad lines and oil/gas pipelines with traffic density
 * Sources: ISW, Tochnyi.info, Euromaidan Press, Reuters, S&P Global
 */

export interface RailRoute {
  name: string;
  points: [number, number][];
  importance: 'high' | 'medium' | 'low';
  traffic: 'heavy' | 'moderate' | 'light';
  description: string;
}

export interface PipelineRoute {
  name: string;
  type: 'oil' | 'gas';
  points: [number, number][];
  throughput: 'high' | 'medium' | 'low' | 'inactive';
  status: string;
  description: string;
}

// ─── MAJOR RUSSIAN RAILROAD ROUTES ───────────────────────────────────────────
export const RAIL_ROUTES: RailRoute[] = [
  {
    name: "Trans-Siberian (Moscow–Novosibirsk)",
    points: [[55.76,37.62],[56.13,40.41],[56.33,44.01],[58.60,49.67],[57.99,56.25],[56.85,60.61],[57.15,65.53],[54.93,73.40],[55.04,82.93]],
    importance: "high", traffic: "heavy",
    description: "Primary east-west military logistics artery carrying munitions and equipment from Siberian depots."
  },
  {
    name: "Moscow – St. Petersburg",
    points: [[55.76,37.62],[56.72,35.92],[58.00,34.37],[58.53,31.27],[58.93,30.08],[59.94,30.31]],
    importance: "medium", traffic: "moderate",
    description: "October Railway mainline. Strategic for Baltic Fleet and northwestern logistics."
  },
  {
    name: "Moscow – Rostov – Krasnodar",
    points: [[55.76,37.62],[54.63,39.73],[53.73,41.42],[51.67,39.18],[50.98,39.50],[49.65,40.66],[47.73,40.18],[47.22,39.69],[46.97,39.90],[45.85,40.12],[45.02,38.99]],
    importance: "high", traffic: "heavy",
    description: "Primary southern supply backbone. Liski and Tikhoretsk are critical junction nodes."
  },
  {
    name: "Moscow – Voronezh – Rostov",
    points: [[55.76,37.62],[54.20,37.62],[53.20,37.85],[52.61,38.51],[51.67,39.18],[50.98,39.50],[49.45,40.08],[48.09,40.09],[47.22,39.69]],
    importance: "high", traffic: "heavy",
    description: "M-4 rail corridor feeding the Southern Military District. Principal ammunition and troop route."
  },
  {
    name: "Rostov – Volgograd",
    points: [[47.22,39.69],[47.42,40.09],[47.62,40.57],[48.37,41.83],[48.63,43.12],[48.71,44.51]],
    importance: "high", traffic: "heavy",
    description: "East-west link connecting Volga logistics hub to Rostov distribution center."
  },
  {
    name: "Moscow – N. Novgorod – Kazan",
    points: [[55.76,37.62],[55.51,38.93],[55.80,40.98],[56.33,44.01],[56.64,47.90],[55.79,49.12]],
    importance: "medium", traffic: "moderate",
    description: "Gorky Railway mainline to Volga industrial heartland and Kazan defense manufacturing."
  },
  {
    name: "Moscow – Smolensk – Belarus",
    points: [[55.76,37.62],[55.60,36.07],[55.52,35.28],[55.20,34.32],[54.81,32.12],[54.69,31.00]],
    importance: "high", traffic: "moderate",
    description: "Moscow-Brest mainline to allied Belarus. Enables flanking logistics from the north."
  },
  {
    name: "Rostov – Mariupol – Donetsk",
    points: [[47.22,39.69],[47.14,39.76],[47.26,38.91],[47.13,38.57],[47.10,37.82],[47.10,37.54],[47.89,37.80],[47.99,37.80]],
    importance: "high", traffic: "heavy",
    description: "Primary overland supply corridor to occupied southern Ukraine. Opened 2024-2025."
  },
  {
    name: "Crimea Bridge / Kerch",
    points: [[47.22,39.69],[47.14,39.76],[46.97,39.90],[45.92,37.98],[45.33,36.64],[45.36,36.47],[45.20,36.10],[44.96,34.08],[44.62,33.53]],
    importance: "high", traffic: "heavy",
    description: "Sole rail link to Crimea via Kerch Bridge. Critical chokepoint, damaged multiple times."
  },
  {
    name: "Belgorod – Kursk – Moscow",
    points: [[50.59,36.61],[50.75,37.02],[51.08,37.27],[51.73,36.19],[52.06,36.08],[52.97,36.07],[53.77,36.50],[54.99,36.26],[55.76,37.62]],
    importance: "high", traffic: "heavy",
    description: "Northern front supply spine. Belgorod is primary logistics node for NE Ukraine front."
  },
  {
    name: "St. Petersburg – Murmansk",
    points: [[59.94,30.31],[60.77,28.75],[60.84,28.38],[61.02,28.89],[61.78,30.75],[61.79,34.35],[62.58,34.76],[64.00,33.27],[64.89,34.76],[66.66,33.05],[67.13,32.80],[68.97,33.08]],
    importance: "high", traffic: "moderate",
    description: "Kirov Railway to Murmansk, Russia's only ice-free Arctic port and Northern Fleet HQ."
  },
  {
    name: "Voronezh – Luhansk",
    points: [[51.67,39.18],[50.98,39.50],[50.45,39.78],[50.05,39.92],[49.77,40.07],[49.47,40.12],[48.57,39.34]],
    importance: "high", traffic: "heavy",
    description: "Supply corridor from Voronezh hub toward Luhansk occupied zone. Kantemirovka is key staging point."
  },
  {
    name: "Belgorod – Valuyki Hub",
    points: [[50.59,36.61],[50.20,38.12],[51.29,37.85],[51.80,38.05]],
    importance: "high", traffic: "heavy",
    description: "Front-line junction. Valuyki is 15km from UA border — primary final delivery node."
  },
  {
    name: "Liski – Likhovskaya Jct",
    points: [[50.98,39.50],[49.65,40.66],[48.93,40.14],[48.15,40.02],[47.84,40.27]],
    importance: "high", traffic: "heavy",
    description: "Connects Voronezh axis to North Caucasus Railway. Likhovskaya is pivotal distribution junction."
  }
];

// ─── MAJOR RUSSIAN OIL & GAS PIPELINES ──────────────────────────────────────
export const PIPELINE_ROUTES: PipelineRoute[] = [
  {
    name: "Druzhba — North",
    type: "oil",
    points: [[54.88,52.33],[53.20,50.15],[52.97,49.42],[53.50,44.00],[53.75,40.20],[53.25,34.34],[52.85,32.68],[52.05,29.25],[52.08,26.05],[52.52,23.78]],
    throughput: "low",
    status: "Northern branch reduced — carries Kazakh oil at minimal volumes",
    description: "World's longest oil pipeline. Northern arm to Poland/Germany."
  },
  {
    name: "Druzhba — South (UA)",
    type: "oil",
    points: [[52.85,32.68],[52.05,29.25],[51.52,28.67],[51.31,25.32],[50.09,25.15],[49.81,23.98],[49.55,22.70],[48.62,22.29]],
    throughput: "inactive",
    status: "SUSPENDED Jan 2026 — Brody pumping station struck by Russian drone",
    description: "Southern branch through Ukraine to Hungary/Slovakia."
  },
  {
    name: "CPC (Tengiz–Novorossiysk)",
    type: "oil",
    points: [[46.15,53.38],[47.85,51.10],[49.20,49.00],[49.80,47.20],[48.00,44.50],[46.50,41.80],[45.87,40.13],[45.20,38.90],[44.73,37.78]],
    throughput: "medium",
    status: "Operating but disrupted by drone strikes on Novorossiysk terminal",
    description: "Kazakh crude to Novorossiysk Black Sea terminal. 1,511 km."
  },
  {
    name: "BPS-1 (Primorsk)",
    type: "oil",
    points: [[57.63,39.88],[58.20,37.90],[58.80,36.80],[59.45,35.00],[59.88,32.40],[60.10,30.80],[60.10,29.50],[60.36,28.57]],
    throughput: "low",
    status: "Primorsk terminal struck by UA drones Mar 2026 — operations halted",
    description: "Baltic export pipeline to Primorsk terminal on Gulf of Finland."
  },
  {
    name: "BPS-2 (Ust-Luga)",
    type: "oil",
    points: [[52.85,32.68],[53.00,31.50],[54.50,32.05],[55.20,32.20],[56.80,33.50],[57.90,33.20],[58.50,31.80],[59.20,30.00],[59.57,28.41]],
    throughput: "low",
    status: "Ust-Luga terminal struck multiple times 2025-2026 — halted",
    description: "Baltic export pipeline to Ust-Luga. ~40% of RU oil exports offline."
  },
  {
    name: "Transneft South (Samara–Novorossiysk)",
    type: "oil",
    points: [[53.20,50.15],[52.30,50.20],[51.50,49.40],[50.50,48.50],[48.70,46.40],[48.50,44.70],[48.00,43.30],[47.20,42.60],[45.87,40.13],[44.73,37.78]],
    throughput: "medium",
    status: "Operational — expanded capacity to compensate for disrupted western routes",
    description: "Main trunk line from Samara to Novorossiysk Black Sea port."
  },
  {
    name: "Black Sea Network",
    type: "oil",
    points: [[45.87,40.13],[45.40,39.50],[45.20,39.00],[44.50,38.60],[44.10,39.07],[44.73,37.78]],
    throughput: "medium",
    status: "Partially disrupted — Tuapse refinery and Kavazsk depot struck",
    description: "Tikhoretsk to Tuapse and Novorossiysk Black Sea terminals."
  },
  {
    name: "TurkStream",
    type: "gas",
    points: [[45.04,37.32],[44.50,36.00],[43.80,34.50],[43.00,32.50],[42.50,30.50],[42.00,29.00],[41.65,27.97],[41.77,27.36],[41.68,26.56]],
    throughput: "high",
    status: "Fully operational — 31.5 bcm/yr to Turkey and SE Europe",
    description: "Undersea gas pipeline from Anapa to Turkey. Unaffected by conflict."
  },
  {
    name: "Nord Stream 1 & 2",
    type: "gas",
    points: [[60.73,28.75],[60.60,27.00],[60.20,25.00],[59.30,22.50],[57.50,20.50],[56.20,18.80],[55.50,17.50],[55.20,16.00],[54.80,14.80],[54.16,13.76]],
    throughput: "inactive",
    status: "PERMANENTLY INACTIVE — sabotaged Sep 2022",
    description: "Twin Baltic Sea pipelines to Germany. Destroyed by undersea explosions."
  },
  {
    name: "Yamal–Europe",
    type: "gas",
    points: [[62.00,68.00],[60.00,62.00],[57.04,34.96],[55.60,32.10],[54.30,30.10],[53.90,27.56],[53.32,25.30],[53.10,23.20],[52.40,20.80],[52.36,14.55]],
    throughput: "low",
    status: "Essentially idle westward since May 2022 — Poland reversed flow",
    description: "Gas pipeline from Yamal through Belarus and Poland to Germany."
  },
  {
    name: "Urengoy–Uzhhorod",
    type: "gas",
    points: [[62.50,66.00],[58.00,56.00],[56.65,53.22],[56.00,49.70],[54.00,45.00],[52.50,41.00],[51.67,38.51],[50.85,34.77],[50.43,30.52],[49.80,26.50],[49.16,23.60],[48.62,22.29]],
    throughput: "inactive",
    status: "TRANSIT ENDED Jan 2025 — Ukraine terminated gas transit agreement",
    description: "Historic Brotherhood pipeline. No longer carries Russian gas."
  },
  {
    name: "Blue Stream",
    type: "gas",
    points: [[45.37,41.72],[44.30,39.80],[44.11,38.52],[43.60,37.80],[42.80,37.00],[42.10,36.50],[41.50,36.10],[41.29,36.33],[40.80,35.00],[39.93,32.86]],
    throughput: "high",
    status: "Fully operational — 16 bcm/yr to Turkey",
    description: "Undersea gas pipeline from Stavropol to Samsun/Ankara, Turkey."
  },
  {
    name: "Power of Siberia",
    type: "gas",
    points: [[60.37,112.97],[59.80,115.50],[58.50,118.00],[57.00,120.50],[55.40,124.00],[54.50,127.50],[53.55,127.48],[50.27,127.53]],
    throughput: "high",
    status: "Fully operational — pivoting Russian gas exports to China",
    description: "Eastern gas pipeline from Yakutia to China border at Blagoveshchensk."
  }
];

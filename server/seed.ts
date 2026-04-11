/**
 * Seed the database with the Russian Ground Forces Order of Battle.
 * Sources: Wikipedia, ISW, US Army ATP 7-100.1, open OSINT.
 */
import { db } from "./storage";
import * as schema from "@shared/schema";

// Clear existing data
db.delete(schema.brigades).run();
db.delete(schema.divisions).run();
db.delete(schema.armies).run();
db.delete(schema.militaryDistricts).run();
db.delete(schema.unitEquipment).run();

// ─── MILITARY DISTRICTS ───────────────────────────────────────────────────────
const districts: schema.InsertMilitaryDistrict[] = [
  { id: "mmd", name: "Moscow Military District", commander: "Col Gen Sergey Kuzovlev", hq: "Moscow", color: "#1a3a6b" },
  { id: "lmd", name: "Leningrad Military District", commander: "Col Gen Yevgeny Nikiforov", hq: "Saint Petersburg", color: "#2d5a8e" },
  { id: "smd", name: "Southern Military District", commander: "Lt Gen Sergey Medvedev", hq: "Rostov-on-Don", color: "#7b1a1a" },
  { id: "cmd", name: "Central Military District", commander: "Col Gen Valery Solodchuk", hq: "Yekaterinburg", color: "#1a5c3a" },
  { id: "emd", name: "Eastern Military District", commander: "Col Gen Andrey Ivanayev", hq: "Khabarovsk", color: "#5c3a1a" },
];
for (const d of districts) db.insert(schema.militaryDistricts).values(d).run();

// ─── FIELD ARMIES / CORPS ────────────────────────────────────────────────────
const armies: schema.InsertArmy[] = [
  // Moscow MD
  { id: "1gta", name: "1st Guards Tank Army", districtId: "mmd", hq: "Odintsovo", type: "tank_army", strengthPct: 55, notes: "Severely attrited; multiple divisions rebuilt from remnants" },
  { id: "20gca", name: "20th Guards Combined Arms Army", districtId: "mmd", hq: "Voronezh", type: "combined_arms_army", strengthPct: 60, notes: "Deployed to Lyman sector" },
  // Leningrad MD
  { id: "6ca", name: "6th Combined Arms Army", districtId: "lmd", hq: "Agalatovo", type: "combined_arms_army", strengthPct: 70, notes: "Deployed North Kharkiv" },
  { id: "11ac", name: "11th Army Corps", districtId: "lmd", hq: "Kaliningrad", type: "army_corps", strengthPct: 85, notes: "Baltic defense posture" },
  { id: "14ac", name: "14th Army Corps", districtId: "lmd", hq: "Murmansk", type: "army_corps", strengthPct: 80, notes: "Arctic / Northern Fleet" },
  { id: "44ac", name: "44th Army Corps", districtId: "lmd", hq: "Petrozavodsk", type: "army_corps", strengthPct: 65, notes: "Deployed Sumy Oblast" },
  // Southern MD
  { id: "3gca", name: "3rd Guards Combined Arms Army", districtId: "smd", hq: "Luhansk", type: "combined_arms_army", strengthPct: 62, notes: "Siversk sector" },
  { id: "8gca", name: "8th Guards Combined Arms Army", districtId: "smd", hq: "Novocherkassk", type: "combined_arms_army", strengthPct: 58, notes: "Heavy losses; Donetsk main effort" },
  { id: "18ca", name: "18th Combined Arms Army", districtId: "smd", hq: "Sevastopol", type: "combined_arms_army", strengthPct: 70, notes: "Kherson / Dnieper axis" },
  { id: "49ca", name: "49th Combined Arms Army", districtId: "smd", hq: "Stavropol", type: "combined_arms_army", strengthPct: 72, notes: "Zaporozhye axis" },
  { id: "51ca", name: "51st Combined Arms Army", districtId: "smd", hq: "Donetsk", type: "combined_arms_army", strengthPct: 55, notes: "Former DNR I Corps; Donetsk central" },
  { id: "58gca", name: "58th Guards Combined Arms Army", districtId: "smd", hq: "Vladikavkaz", type: "combined_arms_army", strengthPct: 65, notes: "South Donetsk / Zaporozhye" },
  // Central MD
  { id: "2gca", name: "2nd Guards Combined Arms Army", districtId: "cmd", hq: "Samara", type: "combined_arms_army", strengthPct: 60, notes: "Deployed Kupyansk sector" },
  { id: "41gca", name: "41st Guards Combined Arms Army", districtId: "cmd", hq: "Novosibirsk", type: "combined_arms_army", strengthPct: 58, notes: "Deployed Central Donetsk" },
  { id: "3ac", name: "3rd Army Corps", districtId: "cmd", hq: "Mulino", type: "army_corps", strengthPct: 50, notes: "Reserve / mobilization corps; heavy attrition" },
  // Eastern MD
  { id: "5gca", name: "5th Guards Combined Arms Army", districtId: "emd", hq: "Ussuriysk", type: "combined_arms_army", strengthPct: 62, notes: "South Donetsk" },
  { id: "29gca", name: "29th Guards Combined Arms Army", districtId: "emd", hq: "Chita", type: "combined_arms_army", strengthPct: 55, notes: "South Donetsk / Velyka Novosilka" },
  { id: "35ca", name: "35th Combined Arms Army", districtId: "emd", hq: "Belogorsk", type: "combined_arms_army", strengthPct: 58, notes: "South Donetsk" },
  { id: "36ca", name: "36th Combined Arms Army", districtId: "emd", hq: "Ulan-Ude", type: "combined_arms_army", strengthPct: 60, notes: "Deployed Vuhledar / Zaporozhye" },
  { id: "68ac", name: "68th Army Corps", districtId: "emd", hq: "Yuzhno-Sakhalinsk", type: "army_corps", strengthPct: 78, notes: "Sakhalin / Pacific defense" },
];
for (const a of armies) db.insert(schema.armies).values(a).run();

// ─── DIVISIONS ───────────────────────────────────────────────────────────────
const divisions: schema.InsertDivision[] = [
  // 1st GTA (MMD)
  { id: "2gmd", name: "2nd Guards 'Tamanskaya' Motor Rifle Division", armyId: "1gta", type: "motor_rifle", strengthPct: 50, hq: "Alabino", notes: "Heavily engaged near Lyman" },
  { id: "4gtd", name: "4th Guards 'Kantemirovskaya' Tank Division", armyId: "1gta", type: "tank", strengthPct: 45, hq: "Naro-Fominsk", notes: "Severe losses; partially rebuilt" },
  // 20th GCA (MMD)
  { id: "144gmd", name: "144th Guards Motor Rifle Division", armyId: "20gca", type: "motor_rifle", strengthPct: 58, hq: "Yelnya", notes: "Lyman / Kreminna sector" },
  // 6th CA (LMD)
  { id: "68gmd", name: "68th Guards Motor Rifle Division", armyId: "6ca", type: "motor_rifle", strengthPct: 65, hq: "Agalatovo", notes: "N Kharkiv" },
  { id: "69gmd", name: "69th Guards Motor Rifle Division", armyId: "6ca", type: "motor_rifle", strengthPct: 62, hq: "Vyborg", notes: "N Kharkiv" },
  // 44th AC (LMD)
  { id: "72md", name: "72nd Motor Rifle Division", armyId: "44ac", type: "motor_rifle", strengthPct: 60, hq: "Petrozavodsk", notes: "Sumy Oblast" },
  { id: "47gtd", name: "47th Guards Tank Division", armyId: "44ac", type: "tank", strengthPct: 55, hq: "Mulino", notes: "Newly formed 2022; N Kharkiv" },
  // 8th GCA (SMD)
  { id: "150md", name: "150th Motor Rifle Division", armyId: "8gca", type: "motor_rifle", strengthPct: 52, hq: "Novocherkassk", notes: "Donetsk central" },
  { id: "42gmd", name: "42nd Guards Motor Rifle Division", armyId: "8gca", type: "motor_rifle", strengthPct: 55, hq: "Khankala", notes: "Donetsk; incl. Chechen elements" },
  // 3rd GCA (SMD)
  { id: "3gmd", name: "3rd Guards Motor Rifle Division", armyId: "3gca", type: "motor_rifle", strengthPct: 60, hq: "Luhansk", notes: "Siversk sector" },
  // 2nd GCA (CMD)
  { id: "90gtd", name: "90th Guards Tank Division", armyId: "2gca", type: "tank", strengthPct: 52, hq: "Chelyabinsk", notes: "Heavy losses; Kupyansk" },
  // 41st GCA (CMD)
  { id: "73md", name: "73rd Mechanized Division", armyId: "41gca", type: "motor_rifle", strengthPct: 55, hq: "Novosibirsk", notes: "Newly raised 2024" },
  { id: "74md", name: "74th Mechanized Division", armyId: "41gca", type: "motor_rifle", strengthPct: 55, hq: "Yurga", notes: "Newly raised 2024" },
  // 5th GCA (EMD)
  { id: "127md", name: "127th Motor Rifle Division", armyId: "5gca", type: "motor_rifle", strengthPct: 58, hq: "Sergeyevka", notes: "South Donetsk" },
  // 36th CA (EMD)
  { id: "36bmd", name: "36th Combined Arms Brigade / Division", armyId: "36ca", type: "motor_rifle", strengthPct: 60, hq: "Ulan-Ude", notes: "Vuhledar axis" },
];
for (const d of divisions) db.insert(schema.divisions).values(d).run();

// ─── BRIGADES / REGIMENTS (key units) ─────────────────────────────────────────
const brigades: schema.InsertBrigade[] = [
  // 1st GTA brigades
  { id: "27mrb", name: "27th Guards Motor Rifle Brigade", parentId: "1gta", parentType: "army", type: "motor_rifle", strengthPct: 48, isGuards: true, notes: "Kupyansk sector" },
  { id: "6tb", name: "6th Tank Regiment (former brigade)", parentId: "4gtd", parentType: "division", type: "tank", strengthPct: 42, isGuards: true },
  { id: "13tb", name: "13th Guards Motor Rifle Regiment", parentId: "2gmd", parentType: "division", type: "motor_rifle", strengthPct: 50, isGuards: true },
  { id: "15mrr", name: "15th Guards Motor Rifle Regiment", parentId: "2gmd", parentType: "division", type: "motor_rifle", strengthPct: 48, isGuards: true },
  // 20th GCA units
  { id: "252mrr", name: "252nd Motor Rifle Regiment", parentId: "144gmd", parentType: "division", type: "motor_rifle", strengthPct: 55 },
  { id: "254mrr", name: "254th Motor Rifle Regiment", parentId: "144gmd", parentType: "division", type: "motor_rifle", strengthPct: 55 },
  { id: "448mrr", name: "448th Motor Rifle Regiment", parentId: "144gmd", parentType: "division", type: "motor_rifle", strengthPct: 50 },
  // 6th CA / Leningrad MD
  { id: "1009mrr", name: "1009th Motor Rifle Regiment", parentId: "69gmd", parentType: "division", type: "motor_rifle", strengthPct: 62 },
  { id: "1008mrr", name: "1008th Motor Rifle Regiment", parentId: "68gmd", parentType: "division", type: "motor_rifle", strengthPct: 60 },
  { id: "155nb", name: "155th Guards Naval Infantry Brigade → 55th Marine Div", parentId: "44ac", parentType: "army", type: "naval_infantry", strengthPct: 50, isGuards: true, notes: "Reorganized to 55th Marine Division; understrength" },
  { id: "128mrb", name: "128th Guards Motor Rifle Brigade", parentId: "44ac", parentType: "army", type: "motor_rifle", strengthPct: 62, isGuards: true, notes: "Sumy Oblast" },
  { id: "30mrr", name: "30th Motor Rifle Regiment", parentId: "72md", parentType: "division", type: "motor_rifle", strengthPct: 58 },
  { id: "41mrr", name: "41st Motor Rifle Regiment", parentId: "72md", parentType: "division", type: "motor_rifle", strengthPct: 55 },
  // 11th AC
  { id: "18gmd_11", name: "18th Guards Motor Rifle Division (elements)", parentId: "11ac", parentType: "army", type: "motor_rifle", strengthPct: 75, isGuards: true, notes: "Baltic / Kaliningrad" },
  // 14th AC
  { id: "200mrb", name: "71st Guards Motor Rifle Division (former 200th Bde)", parentId: "14ac", parentType: "army", type: "motor_rifle", strengthPct: 68, isGuards: true, notes: "Reorganized to 71st MRD; Arctic" },
  { id: "80amrb", name: "80th Arctic Motor Rifle Brigade", parentId: "14ac", parentType: "army", type: "motor_rifle", strengthPct: 80, notes: "Arctic trained" },
  // SMD units
  { id: "19mrb", name: "19th Motor Rifle Brigade", parentId: "58gca", parentType: "army", type: "motor_rifle", strengthPct: 60 },
  { id: "136gmrb", name: "136th Guards Motor Rifle Brigade", parentId: "58gca", parentType: "army", type: "motor_rifle", strengthPct: 58, isGuards: true },
  { id: "810nb", name: "810th Guards Naval Infantry Brigade", parentId: "18ca", parentType: "army", type: "naval_infantry", strengthPct: 55, isGuards: true, notes: "Black Sea Fleet; Sumy / Kherson" },
  // 51st CA (former DNR)
  { id: "1mrb_51", name: "1st Motor Rifle Brigade", parentId: "51ca", parentType: "army", type: "motor_rifle", strengthPct: 52 },
  { id: "5mrb_51", name: "5th Motor Rifle Brigade", parentId: "51ca", parentType: "army", type: "motor_rifle", strengthPct: 50 },
  { id: "9mrb_51", name: "9th Motor Rifle Brigade", parentId: "51ca", parentType: "army", type: "motor_rifle", strengthPct: 50 },
  { id: "110mrb_51", name: "110th Motor Rifle Brigade", parentId: "51ca", parentType: "army", type: "motor_rifle", strengthPct: 48 },
  { id: "114mrb_51", name: "114th Motor Rifle Brigade", parentId: "51ca", parentType: "army", type: "motor_rifle", strengthPct: 48 },
  { id: "132mrb_51", name: "132nd Motor Rifle Brigade", parentId: "51ca", parentType: "army", type: "motor_rifle", strengthPct: 50 },
  // 8th GCA
  { id: "103rr", name: "103rd Motor Rifle Regiment", parentId: "150md", parentType: "division", type: "motor_rifle", strengthPct: 50 },
  { id: "68mrr_42", name: "70th Guards Motor Rifle Regiment", parentId: "42gmd", parentType: "division", type: "motor_rifle", strengthPct: 52, isGuards: true },
  // CMD units
  { id: "90b_3reg", name: "275th Motor Rifle Regiment", parentId: "90gtd", parentType: "division", type: "motor_rifle", strengthPct: 50 },
  { id: "90b_6reg", name: "6th Tank Regiment", parentId: "90gtd", parentType: "division", type: "tank", strengthPct: 48 },
  { id: "37mrb", name: "37th Guards Motor Rifle Brigade", parentId: "36ca", parentType: "army", type: "motor_rifle", strengthPct: 58, isGuards: true },
  { id: "5tb", name: "5th Guards Tank Brigade", parentId: "36ca", parentType: "army", type: "tank", strengthPct: 55, isGuards: true },
  // EMD
  { id: "143mrr", name: "143rd Motor Rifle Regiment", parentId: "127md", parentType: "division", type: "motor_rifle", strengthPct: 55 },
  { id: "218tr", name: "218th Tank Regiment", parentId: "127md", parentType: "division", type: "tank", strengthPct: 52 },
  { id: "83aab", name: "83rd Guards Air Assault Brigade", parentId: "5gca", parentType: "army", type: "air_assault", strengthPct: 60, isGuards: true },
  { id: "36mrb_35", name: "36th Combined Arms Rgt", parentId: "35ca", parentType: "army", type: "motor_rifle", strengthPct: 60 },
  // Special / GRU
  { id: "2spetz", name: "2nd Guards Spetsnaz Brigade (GRU)", parentId: "1gta", parentType: "army", type: "spetsnaz", strengthPct: 78, isGuards: true },
];
for (const b of brigades) db.insert(schema.brigades).values(b).run();

// ─── UNIT EQUIPMENT (authorized org equipment per unit type) ─────────────────
// Based on Russian doctrine:
// Tank Division: ~240-300 tanks, ~250 IFVs, ~72 SP arty
// Motor Rifle Division: ~100 tanks, ~350 IFVs, ~72 SP arty
// Combined Arms Army: varies (division equipment rolled up + army assets)
// Brigade (MR): ~40 tanks, ~150 IFVs, ~18 SP arty

const equipment: schema.InsertUnitEquipment[] = [
  // 4th Guards Tank Division
  { unitId: "4gtd", unitType: "division", equipmentType: "tank", equipmentModel: "T-80U/BVM, T-72B3", authorizedCount: 250, estimatedLost: 138 },
  { unitId: "4gtd", unitType: "division", equipmentType: "ifv", equipmentModel: "BMP-2, BMP-3", authorizedCount: 180, estimatedLost: 72 },
  { unitId: "4gtd", unitType: "division", equipmentType: "artillery_sp", equipmentModel: "2S19 Msta-S, 2S3 Akatsiya", authorizedCount: 72, estimatedLost: 28 },
  // 2nd Guards MRD
  { unitId: "2gmd", unitType: "division", equipmentType: "tank", equipmentModel: "T-72B3, T-80BV", authorizedCount: 100, estimatedLost: 52 },
  { unitId: "2gmd", unitType: "division", equipmentType: "ifv", equipmentModel: "BMP-2, BMP-3", authorizedCount: 240, estimatedLost: 88 },
  { unitId: "2gmd", unitType: "division", equipmentType: "artillery_sp", equipmentModel: "2S19 Msta-S", authorizedCount: 54, estimatedLost: 18 },
  // 90th Guards Tank Div
  { unitId: "90gtd", unitType: "division", equipmentType: "tank", equipmentModel: "T-72B3M, T-90M", authorizedCount: 220, estimatedLost: 115 },
  { unitId: "90gtd", unitType: "division", equipmentType: "ifv", equipmentModel: "BMP-2", authorizedCount: 160, estimatedLost: 68 },
  { unitId: "90gtd", unitType: "division", equipmentType: "artillery_sp", equipmentModel: "2S19 Msta-S", authorizedCount: 72, estimatedLost: 24 },
  // 144th Guards MRD
  { unitId: "144gmd", unitType: "division", equipmentType: "tank", equipmentModel: "T-72B3", authorizedCount: 94, estimatedLost: 42 },
  { unitId: "144gmd", unitType: "division", equipmentType: "ifv", equipmentModel: "BMP-2, MT-LB", authorizedCount: 220, estimatedLost: 78 },
  { unitId: "144gmd", unitType: "division", equipmentType: "artillery_sp", equipmentModel: "2S19, 2S3", authorizedCount: 54, estimatedLost: 20 },
  // 150th MRD
  { unitId: "150md", unitType: "division", equipmentType: "tank", equipmentModel: "T-72B3, T-62M", authorizedCount: 90, estimatedLost: 50 },
  { unitId: "150md", unitType: "division", equipmentType: "ifv", equipmentModel: "BMP-1, BMP-2", authorizedCount: 200, estimatedLost: 88 },
  // 47th Tank Division (Leningrad MD)
  { unitId: "47gtd", unitType: "division", equipmentType: "tank", equipmentModel: "T-80BVM", authorizedCount: 180, estimatedLost: 85 },
  { unitId: "47gtd", unitType: "division", equipmentType: "ifv", equipmentModel: "BMP-2", authorizedCount: 130, estimatedLost: 48 },
  // Key brigades
  { unitId: "136gmrb", unitType: "brigade", equipmentType: "tank", equipmentModel: "T-72B3", authorizedCount: 40, estimatedLost: 18 },
  { unitId: "136gmrb", unitType: "brigade", equipmentType: "ifv", equipmentModel: "BMP-2", authorizedCount: 100, estimatedLost: 38 },
  { unitId: "810nb", unitType: "brigade", equipmentType: "tank", equipmentModel: "T-72B3", authorizedCount: 31, estimatedLost: 16 },
  { unitId: "810nb", unitType: "brigade", equipmentType: "ifv", equipmentModel: "BMP-3", authorizedCount: 90, estimatedLost: 40 },
  { unitId: "155nb", unitType: "brigade", equipmentType: "tank", equipmentModel: "T-72B3", authorizedCount: 40, estimatedLost: 24 },
  { unitId: "155nb", unitType: "brigade", equipmentType: "ifv", equipmentModel: "BMP-3", authorizedCount: 120, estimatedLost: 62 },
  { unitId: "27mrb", unitType: "brigade", equipmentType: "tank", equipmentModel: "T-80U", authorizedCount: 40, estimatedLost: 22 },
  { unitId: "27mrb", unitType: "brigade", equipmentType: "ifv", equipmentModel: "BMP-3, BMP-2", authorizedCount: 150, estimatedLost: 68 },
];
for (const e of equipment) db.insert(schema.unitEquipment).values(e).run();

console.log("✅ Seed complete:", districts.length, "districts,", armies.length, "armies,", divisions.length, "divisions,", brigades.length, "brigades");

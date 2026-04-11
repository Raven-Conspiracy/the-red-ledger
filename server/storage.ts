import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite, { schema });

// Run migrations manually
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS military_districts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    commander TEXT,
    hq TEXT,
    color TEXT NOT NULL DEFAULT '#4a5568'
  );
  CREATE TABLE IF NOT EXISTS armies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    district_id TEXT NOT NULL,
    hq TEXT,
    type TEXT NOT NULL,
    strength_pct REAL NOT NULL DEFAULT 100,
    notes TEXT
  );
  CREATE TABLE IF NOT EXISTS divisions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    army_id TEXT NOT NULL,
    type TEXT NOT NULL,
    strength_pct REAL NOT NULL DEFAULT 100,
    hq TEXT,
    notes TEXT
  );
  CREATE TABLE IF NOT EXISTS brigades (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT NOT NULL,
    parent_type TEXT NOT NULL,
    type TEXT NOT NULL,
    strength_pct REAL NOT NULL DEFAULT 100,
    notes TEXT,
    is_guards INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS unit_equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id TEXT NOT NULL,
    unit_type TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    equipment_model TEXT,
    authorized_count INTEGER NOT NULL DEFAULT 0,
    estimated_lost INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS oryx_losses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    category TEXT NOT NULL,
    total INTEGER NOT NULL DEFAULT 0,
    destroyed INTEGER NOT NULL DEFAULT 0,
    damaged INTEGER NOT NULL DEFAULT 0,
    abandoned INTEGER NOT NULL DEFAULT 0,
    captured INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS data_meta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

export interface IStorage {
  // Districts
  getAllDistricts(): schema.MilitaryDistrict[];
  // Armies
  getAllArmies(): schema.Army[];
  getArmiesByDistrict(districtId: string): schema.Army[];
  // Divisions
  getAllDivisions(): schema.Division[];
  getDivisionsByArmy(armyId: string): schema.Division[];
  // Brigades
  getAllBrigades(): schema.Brigade[];
  getBrigadesByParent(parentId: string): schema.Brigade[];
  // Equipment
  getEquipmentByUnit(unitId: string): schema.UnitEquipment[];
  getAllEquipment(): schema.UnitEquipment[];
  // Oryx losses
  getLatestOryxLosses(): schema.OryxLoss[];
  upsertOryxLosses(losses: schema.InsertOryxLosses[]): void;
  // Meta
  getMeta(key: string): schema.DataMeta | undefined;
  setMeta(key: string, value: string): void;
  // Full OOB tree
  getFullOOB(): FullOOBResponse;
}

export interface FullOOBResponse {
  districts: schema.MilitaryDistrict[];
  armies: schema.Army[];
  divisions: schema.Division[];
  brigades: schema.Brigade[];
  equipment: schema.UnitEquipment[];
  oryxLosses: schema.OryxLoss[];
  lastUpdated: string | null;
}

class Storage implements IStorage {
  getAllDistricts(): schema.MilitaryDistrict[] {
    return db.select().from(schema.militaryDistricts).all();
  }

  getAllArmies(): schema.Army[] {
    return db.select().from(schema.armies).all();
  }

  getArmiesByDistrict(districtId: string): schema.Army[] {
    return db.select().from(schema.armies).where(eq(schema.armies.districtId, districtId)).all();
  }

  getAllDivisions(): schema.Division[] {
    return db.select().from(schema.divisions).all();
  }

  getDivisionsByArmy(armyId: string): schema.Division[] {
    return db.select().from(schema.divisions).where(eq(schema.divisions.armyId, armyId)).all();
  }

  getAllBrigades(): schema.Brigade[] {
    return db.select().from(schema.brigades).all();
  }

  getBrigadesByParent(parentId: string): schema.Brigade[] {
    return db.select().from(schema.brigades).where(eq(schema.brigades.parentId, parentId)).all();
  }

  getEquipmentByUnit(unitId: string): schema.UnitEquipment[] {
    return db.select().from(schema.unitEquipment).where(eq(schema.unitEquipment.unitId, unitId)).all();
  }

  getAllEquipment(): schema.UnitEquipment[] {
    return db.select().from(schema.unitEquipment).all();
  }

  getLatestOryxLosses(): schema.OryxLoss[] {
    // Get the latest fetch's data
    const latestMeta = db.select().from(schema.dataMeta).where(eq(schema.dataMeta.key, 'oryx_last_fetch')).get();
    if (!latestMeta) return [];
    return db.select().from(schema.oryxLosses)
      .where(eq(schema.oryxLosses.fetchedAt, latestMeta.value))
      .all();
  }

  upsertOryxLosses(losses: schema.InsertOryxLosses[]): void {
    if (losses.length === 0) return;
    const fetchedAt = losses[0].fetchedAt;
    // Delete old entries for this timestamp and insert new
    sqlite.exec(`DELETE FROM oryx_losses WHERE fetched_at = '${fetchedAt}'`);
    for (const loss of losses) {
      db.insert(schema.oryxLosses).values(loss).run();
    }
  }

  getMeta(key: string): schema.DataMeta | undefined {
    return db.select().from(schema.dataMeta).where(eq(schema.dataMeta.key, key)).get();
  }

  setMeta(key: string, value: string): void {
    const now = new Date().toISOString();
    sqlite.exec(`INSERT OR REPLACE INTO data_meta (key, value, updated_at) VALUES ('${key}', '${value.replace(/'/g, "''")}', '${now}')`);
  }

  getFullOOB(): FullOOBResponse {
    const districts = this.getAllDistricts();
    const armies = this.getAllArmies();
    const divisions = this.getAllDivisions();
    const brigades = this.getAllBrigades();
    const equipment = this.getAllEquipment();
    const oryxLosses = this.getLatestOryxLosses();
    const lastUpdatedMeta = this.getMeta('oryx_last_fetch');
    return {
      districts,
      armies,
      divisions,
      brigades,
      equipment,
      oryxLosses,
      lastUpdated: lastUpdatedMeta?.value ?? null,
    };
  }
}

export const storage = new Storage();

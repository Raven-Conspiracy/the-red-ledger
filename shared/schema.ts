import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Military Districts (top-level grouping)
export const militaryDistricts = sqliteTable("military_districts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  commander: text("commander"),
  hq: text("hq"),
  color: text("color").notNull().default("#4a5568"),
});

// Field Armies / Corps (second level)
export const armies = sqliteTable("armies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  districtId: text("district_id").notNull(),
  hq: text("hq"),
  type: text("type").notNull(), // 'combined_arms_army', 'tank_army', 'army_corps'
  strengthPct: real("strength_pct").notNull().default(100),
  notes: text("notes"),
});

// Divisions (third level)
export const divisions = sqliteTable("divisions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  armyId: text("army_id").notNull(),
  type: text("type").notNull(), // 'motor_rifle', 'tank', 'artillery', 'airborne', 'naval_infantry'
  strengthPct: real("strength_pct").notNull().default(100),
  hq: text("hq"),
  notes: text("notes"),
});

// Brigades / Regiments (fourth level)
export const brigades = sqliteTable("brigades", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  parentId: text("parent_id").notNull(), // army or division id
  parentType: text("parent_type").notNull(), // 'army' | 'division'
  type: text("type").notNull(), // 'motor_rifle', 'tank', 'artillery', 'air_assault', 'naval_infantry', 'spetsnaz', 'engineer', 'air_defense'
  strengthPct: real("strength_pct").notNull().default(100),
  notes: text("notes"),
  isGuards: integer("is_guards", { mode: "boolean" }).notNull().default(false),
});

// Equipment types per unit
export const unitEquipment = sqliteTable("unit_equipment", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  unitId: text("unit_id").notNull(),
  unitType: text("unit_type").notNull(), // 'brigade', 'division', 'army'
  equipmentType: text("equipment_type").notNull(), // 'tank', 'ifv', 'apc', 'artillery_sp', 'artillery_towed', 'mlrs', 'sam', 'helicopter'
  equipmentModel: text("equipment_model"),
  authorizedCount: integer("authorized_count").notNull().default(0),
  estimatedLost: integer("estimated_lost").notNull().default(0),
});

// Global equipment losses from Oryx (pulled from live source)
export const oryxLosses = sqliteTable("oryx_losses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fetchedAt: text("fetched_at").notNull(),
  category: text("category").notNull(),
  total: integer("total").notNull().default(0),
  destroyed: integer("destroyed").notNull().default(0),
  damaged: integer("damaged").notNull().default(0),
  abandoned: integer("abandoned").notNull().default(0),
  captured: integer("captured").notNull().default(0),
});

// Last data fetch metadata
export const dataMeta = sqliteTable("data_meta", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Insert schemas
export const insertMilitaryDistrictSchema = createInsertSchema(militaryDistricts);
export const insertArmySchema = createInsertSchema(armies);
export const insertDivisionSchema = createInsertSchema(divisions);
export const insertBrigadeSchema = createInsertSchema(brigades);
export const insertUnitEquipmentSchema = createInsertSchema(unitEquipment).omit({ id: true });
export const insertOryxLossesSchema = createInsertSchema(oryxLosses).omit({ id: true });
export const insertDataMetaSchema = createInsertSchema(dataMeta).omit({ id: true });

// Types
export type MilitaryDistrict = typeof militaryDistricts.$inferSelect;
export type Army = typeof armies.$inferSelect;
export type Division = typeof divisions.$inferSelect;
export type Brigade = typeof brigades.$inferSelect;
export type UnitEquipment = typeof unitEquipment.$inferSelect;
export type OryxLoss = typeof oryxLosses.$inferSelect;
export type DataMeta = typeof dataMeta.$inferSelect;

export type InsertMilitaryDistrict = z.infer<typeof insertMilitaryDistrictSchema>;
export type InsertArmy = z.infer<typeof insertArmySchema>;
export type InsertDivision = z.infer<typeof insertDivisionSchema>;
export type InsertBrigade = z.infer<typeof insertBrigadeSchema>;
export type InsertUnitEquipment = z.infer<typeof insertUnitEquipmentSchema>;
export type InsertOryxLosses = z.infer<typeof insertOryxLossesSchema>;

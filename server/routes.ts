import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";

// Oryx data fetcher - scrapes the current totals
async function fetchOryxData(): Promise<void> {
  try {
    const response = await fetch("https://www.oryxspioenkop.com/2022/02/attack-on-europe-documenting-equipment.html", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    // Parse totals from the HTML text using regex patterns
    const lossData: Array<{ category: string; total: number; destroyed: number; damaged: number; abandoned: number; captured: number }> = [];

    const patterns = [
      { cat: "Tanks", re: /Tanks \((\d+), of which destroyed: (\d+), damaged: (\d+), abandoned: (\d+), captured: (\d+)\)/ },
      { cat: "Armoured Fighting Vehicles", re: /Armoured Fighting Vehicles \((\d+), of which destroyed: (\d+), damaged: (\d+), abandoned: (\d+), captured: (\d+)\)/ },
      { cat: "Infantry Fighting Vehicles", re: /Infantry Fighting Vehicles \((\d+), of which destroyed: (\d+), damaged: (\d+), abandoned: (\d+), captured: (\d+)\)/ },
      { cat: "Armoured Personnel Carriers", re: /Armoured Personnel Carriers \((\d+), of which destroyed: (\d+), damaged: (\d+), abandoned: (\d+), captured: (\d+)\)/ },
      { cat: "Self-Propelled Artillery", re: /Self-Propelled Artillery \((\d+), of which destroyed: (\d+), damaged: (\d+), abandoned: (\d+), captured: (\d+)\)/ },
      { cat: "Towed Artillery", re: /Towed Artillery \((\d+), of which destroyed: (\d+), damaged: (\d+), abandoned: (\d+), captured: (\d+)\)/ },
      { cat: "Rocket Artillery", re: /Rocket(?:\s+and Missile)? Artillery \((\d+), of which destroyed: (\d+), damaged: (\d+), abandoned: (\d+), captured: (\d+)\)/ },
      { cat: "Surface-To-Air Missile Systems", re: /Surface-To-Air Missile Systems \((\d+), of which destroyed: (\d+), damaged: (\d+), abandoned: (\d+), captured: (\d+)\)/ },
      { cat: "Aircraft", re: /Aircraft \((\d+), of which destroyed: (\d+), damaged: (\d+), abandoned: (\d+)(?:, captured: (\d+))?\)/ },
      { cat: "Helicopters", re: /Helicopters \((\d+), of which destroyed: (\d+), damaged: (\d+), abandoned: (\d+)(?:, captured: (\d+))?\)/ },
    ];

    for (const { cat, re } of patterns) {
      const m = html.match(re);
      if (m) {
        lossData.push({
          category: cat,
          total: parseInt(m[1]),
          destroyed: parseInt(m[2]),
          damaged: parseInt(m[3]),
          abandoned: parseInt(m[4]),
          captured: parseInt(m[5] ?? "0"),
        });
      }
    }

    // Also try to extract aggregate totals
    const totalMatch = html.match(/Russia - (\d+), of which: destroyed: (\d+), damaged: (\d+), abandoned: (\d+), captured: (\d+)/);
    if (totalMatch) {
      lossData.push({
        category: "TOTAL",
        total: parseInt(totalMatch[1]),
        destroyed: parseInt(totalMatch[2]),
        damaged: parseInt(totalMatch[3]),
        abandoned: parseInt(totalMatch[4]),
        captured: parseInt(totalMatch[5]),
      });
    }

    if (lossData.length > 0) {
      const fetchedAt = new Date().toISOString();
      const toInsert = lossData.map(d => ({ ...d, fetchedAt }));
      storage.upsertOryxLosses(toInsert);
      storage.setMeta('oryx_last_fetch', fetchedAt);
      console.log(`[Oryx] Fetched ${lossData.length} categories at ${fetchedAt}`);
    }
  } catch (err) {
    console.error("[Oryx] Fetch failed:", err instanceof Error ? err.message : err);
    // Store hardcoded fallback data if fetch fails
    const fallbackData = [
      { category: "TOTAL", total: 24383, destroyed: 19028, damaged: 971, abandoned: 1204, captured: 3180 },
      { category: "Tanks", total: 4371, destroyed: 3276, damaged: 161, abandoned: 396, captured: 538 },
      { category: "Armoured Fighting Vehicles", total: 2399, destroyed: 1960, damaged: 38, abandoned: 124, captured: 277 },
      { category: "Infantry Fighting Vehicles", total: 6416, destroyed: 5145, damaged: 158, abandoned: 482, captured: 631 },
      { category: "Armoured Personnel Carriers", total: 728, destroyed: 572, damaged: 18, abandoned: 42, captured: 96 },
      { category: "Self-Propelled Artillery", total: 1008, destroyed: 840, damaged: 53, abandoned: 7, captured: 108 },
      { category: "Towed Artillery", total: 551, destroyed: 342, damaged: 105, abandoned: 5, captured: 99 },
      { category: "Rocket Artillery", total: 580, destroyed: 478, damaged: 46, abandoned: 2, captured: 54 },
      { category: "Surface-To-Air Missile Systems", total: 405, destroyed: 305, damaged: 72, abandoned: 4, captured: 24 },
      { category: "Aircraft", total: 181, destroyed: 152, damaged: 29, abandoned: 0, captured: 0 },
      { category: "Helicopters", total: 172, destroyed: 136, damaged: 34, abandoned: 0, captured: 2 },
    ];
    const fetchedAt = new Date().toISOString();
    const existing = storage.getMeta('oryx_last_fetch');
    if (!existing) {
      storage.upsertOryxLosses(fallbackData.map(d => ({ ...d, fetchedAt })));
      storage.setMeta('oryx_last_fetch', fetchedAt);
    }
  }
}

export async function registerRoutes(httpServer: Server, app: Express) {
  // Full OOB data
  app.get("/api/oob", (_req, res) => {
    const data = storage.getFullOOB();
    res.json(data);
  });

  // Oryx losses only
  app.get("/api/oryx", (_req, res) => {
    const losses = storage.getLatestOryxLosses();
    const meta = storage.getMeta('oryx_last_fetch');
    res.json({ losses, lastUpdated: meta?.value ?? null });
  });

  // Trigger manual refresh
  app.post("/api/refresh", async (_req, res) => {
    await fetchOryxData();
    const losses = storage.getLatestOryxLosses();
    const meta = storage.getMeta('oryx_last_fetch');
    res.json({ success: true, losses, lastUpdated: meta?.value ?? null });
  });

  // Initial fetch on startup
  await fetchOryxData();

  // Auto-refresh every 30 minutes
  setInterval(fetchOryxData, 30 * 60 * 1000);
}

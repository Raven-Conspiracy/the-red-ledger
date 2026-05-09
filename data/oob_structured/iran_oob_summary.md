# Iran Armed Forces — Structured OOB Summary
**Snapshot date**: 2026-05-09  
**Schema version**: v1  
**Built for**: Inquisitor corpus bucket `oob_iran_structured`  
**Tags**: `[OOB-IR] [STRUCTURED] [LEVEL:SERVICE|REGION|BDE]`

---

## Critical Note on Parallel Hierarchies

Iran operates **two separate, parallel military chains of command** that both report independently to the Supreme Leader (Ayatollah Khamenei, assassinated per some 2026 reporting — status of command authority [POST-2024-STRIKES STATUS UNCERTAIN]):

| Dimension | **Artesh** (Regular) | **IRGC / Sepah** |
|-----------|---------------------|-----------------|
| Official name | Islamic Republic of Iran Armed Forces | Islamic Revolutionary Guard Corps |
| Formed | Pre-Revolution (reformed 1979) | 1979 (post-Revolution) |
| Ground force | IRIGF (~350,000) | IRGCGF (~150,000) |
| Air component | IRIAF (~37,000) | IRGC Aerospace Force (~15,000) |
| Naval component | IRIN (~18,000) — blue-water/IO/Caspian | IRGCN (~20,000) — Persian Gulf asymmetric |
| Missiles | NO ballistic missiles | YES — ALL ballistic missiles held by IRGC-AF |
| Loyalty | Iranian state / constitution | Supreme Leader / velayat-e faqih |
| Chain of command | AFGS → Artesh | IRGC Commander → Supreme Leader |

**Wartime integration** occurs at **Khatam al-Anbiya Central HQ (KACHQ)** — the joint operational command that unifies both when ordered by the Supreme Leader.

---

## Hierarchy Tree

```
SUPREME LEADER
├── AFGS (Armed Forces General Staff) — Chief: Gen. Bagheri
│   └── KHATAM AL-ANBIYA CENTRAL HQ (joint wartime cmd, Gen. Rashid)
│
├── ARTESH (Regular Military)
│   ├── ARTESH GROUND FORCE (IRIGF, ~350,000)
│   │   ├── NW Regional HQ (Urumiyeh)
│   │   │   ├── 21st Infantry Div (Tabriz)
│   │   │   ├── 16th Armored Div (Ghazvin)
│   │   │   └── 64th Infantry Div (Urumiyeh)
│   │   ├── W Regional HQ (Kermanshah)
│   │   │   ├── 81st Armored Div (Kermanshah)
│   │   │   └── 28th Infantry Div (Sanandaj)
│   │   ├── SW Regional HQ (Ahvaz)
│   │   │   ├── 92nd Armored Div (Ahvaz)
│   │   │   └── 84th Infantry Div (Khorramabad)
│   │   ├── NE Regional HQ (Mashhad)
│   │   │   ├── 77th Infantry Div (Mashhad)
│   │   │   ├── 30th Infantry Div (Birjand)
│   │   │   └── 58th Mobile Assault Div (Shahroud)
│   │   ├── SE Regional HQ (Kerman)
│   │   │   └── 88th Armored Div (Zahedan)
│   │   └── Central/Tehran (no RHQ)
│   │       ├── 23rd Mobile Assault Div (Robat Karim)
│   │       └── 65th NOHED Airborne SF Bde [ELITE]
│   ├── IRIAF (~37,000)
│   │   ├── TAB1 Mehrabad (MiG-29, transports, tankers)
│   │   ├── TAB2 Tabriz (F-5E, MiG-29, Saeghe)
│   │   ├── TAB3 Hamadan/Nojeh (F-4E, RF-4E)
│   │   ├── TAB4 Dezful/Vahdati (F-5E/F)
│   │   ├── TAB5 Omidiyeh (F-7N — 3 sqns)
│   │   ├── TAB6 Bushehr (F-4E)
│   │   ├── TAB7 Shiraz (Su-24MK — 3 sqns, C-130, P-3)
│   │   ├── TAB8 Isfahan (F-14A — 3 sqns) [ASSESSED DESTROYED Mar 2026]
│   │   ├── TAB9 Bandar Abbas (F-4E; Oghab 44 underground base)
│   │   ├── TAB10 Chahbahar (F-4D, Mirage F-1)
│   │   └── TAB14 Mashhad (F-5E)
│   └── IRIN (~18,000)
│       ├── 1st ND Bandar Abbas/SNFHQ (Kilo subs, corvettes)
│       ├── 2nd ND Bushehr/Jask (Persian Gulf/Gulf of Oman)
│       ├── 3rd ND Chah Bahar (Gulf of Oman)
│       ├── 4th ND Bandar Anzali (Caspian)
│       └── 5th ND Jask (Indian Ocean forward)
│
└── IRGC (Islamic Revolutionary Guard Corps, Gen. Salami)
    ├── IRGC GROUND FORCES (~150,000)
    │   ├── Sarallah HQ (Tehran/Alborz — STRUCK Mar 2026)
    │   │   ├── Muhammad Rasoul Allah Corps (Tehran City)
    │   │   └── Imam Hassan Mojtaba Corps (Alborz)
    │   ├── Hamze HQ (W/NW)
    │   │   ├── Ashura Corps (E. Azerbaijan)
    │   │   ├── Shohada Corps (W. Azerbaijan)
    │   │   └── Kurdistan Beit-ol-Moqaddas Corps
    │   ├── Ashura HQ (also covers NW)
    │   │   ├── Hazrat-e Abbas Corps (Ardabil)
    │   │   └── Ansar al-Mahdi Corps (Zanjan)
    │   ├── Najaf-e Ashraf HQ (West)
    │   │   ├── Amir al-Mouminin Corps (Ilam)
    │   │   ├── Kermanshah Nebi Akram Corps
    │   │   └── Ansar al-Hossein Corps (Hamedan)
    │   ├── Karbala HQ (South)
    │   │   ├── Vali-ye Asr Corps (Khuzestan)
    │   │   ├── Fath Corps (Kohgiluyeh)
    │   │   └── Abolfazl Corps (Lorestan)
    │   ├── Madineh-ye al-Munavareh HQ (SW)
    │   │   ├── Fajr Corps (Fars)
    │   │   ├── Imam Sadeq Corps (Bushehr)
    │   │   └── Imam Sadjad Corps (Hormozgan)
    │   ├── Ghadir HQ (North/Caspian)
    │   │   ├── Qods Corps (Gilan)
    │   │   ├── Neynava Corps (Golestan)
    │   │   └── Karbala Corps (Mazandaran)
    │   ├── Saheb al-Zaman HQ (Central)
    │   │   ├── Ruhollah Corps (Markazi)
    │   │   ├── Saheb al-Amr Corps (Qazvin)
    │   │   ├── Ali bin Abu Taleb Corps (Qom)
    │   │   └── Ghaem al-Muhammad Corps (Semnan)
    │   ├── Sayyed al-Shohada HQ (Central)
    │   │   ├── Ghamar Bani Hashem Corps (Chaharmahal)
    │   │   ├── Saheb al-Zaman Corps (Isfahan)
    │   │   └── al-Ghadir Corps (Yazd)
    │   ├── Samen al-Aeme HQ (NE)
    │   │   ├── Imam Reza Corps (Razavi Khorasan)
    │   │   ├── Javad al-Aeme Corps (N. Khorasan)
    │   │   └── Ansar al-Reza Corps (S. Khorasan)
    │   └── Qods HQ (SE)
    │       ├── Sarallah Corps (Kerman)
    │       └── Salman Corps (Sistan-Baluchestan)
    ├── IRGC AEROSPACE FORCE (~15,000) [HOLDS ALL BALLISTIC MISSILES]
    │   ├── Al-Ghadir Missile Command (AGMC)
    │   │   ├── 5th Ra'ad Missile Brigade (SRBM)
    │   │   ├── 7th al-Hadid Missile Brigade (MRBM)
    │   │   ├── 15th Ghaem Missile Brigade (solid SRBM)
    │   │   ├── 19th Zulfiqar Missile Brigade (SRBM)
    │   │   ├── 23rd Towhid Missile Brigade
    │   │   └── Cruise Missile Command (Hoveyzeh/Soumar/Ya-Ali)
    │   ├── Space Command (Shahroud; Nour satellites)
    │   ├── UAV Command (Shahed-136, Mohajer-6, Ababil)
    │   └── Air Defense Component [SEVERELY DEGRADED]
    ├── IRGC NAVY (~20,000)
    │   ├── 1st Region Bandar Abbas [STRUCK 2026]
    │   ├── 2nd Region Bushehr
    │   ├── 3rd Region Bandar Mahshahr [STRUCK 2026]
    │   ├── 4th Region Asaluyeh
    │   └── 5th Region Bandar Lengeh (SNSF Forur Island)
    ├── QUDS FORCE (~5,000-21,000)
    │   ├── Iraq Desk / Ramadan HQ (1st Corps)
    │   ├── Lebanon/Syria Corps (7th Corps)
    │   ├── Yemen/Arabian Peninsula Corps (6th Corps)
    │   ├── Afghanistan/Pakistan Corps (4th / Al-Ansar)
    │   └── Palestine Division
    └── BASIJ (450,000 active; up to 1M inactive)
        └── 32 provincial commands (mirrors IRGC corps)
```

---

## Unit Provenance (per unit, 1-line)

| Unit | Source |
|------|--------|
| Khatam al-Anbiya Central HQ | DIA IMP 2019 p.17; Commander Rashid confirmed |
| Artesh (IRIGF) | DIA IMP 2019 p.17-18; ~350,000 confirmed |
| IRIAF | DIA IMP 2019 p.24; Scramble.nl IRIAF OOB Feb 2026 |
| IRIN | DIA IMP 2019 p.27; ONI Iran Naval Doctrine 2017 |
| IRGC Ground Forces | DIA IMP 2019 p.18; Wikipedia IRGC GF; CTP Mar 2026 |
| IRGC Aerospace Force | DIA IMP 2019 p.21; Iran Watch 2020; Wikipedia IRGCASF |
| IRGCN | DIA IMP 2019 p.28; IFMAT 2017; Alma Research Mar 2026 |
| Quds Force | Wikipedia Quds Force; DIA IMP 2019 p.22 |
| Basij | DIA IMP 2019 p.19; CTP Mar 2026 |
| NW Regional HQ (Artesh) | CTP Artesh OOB Aug 2025; BG2 Shafiei confirmed |
| W Regional HQ (Artesh) | CTP Artesh OOB Aug 2025; BG2 Taheri confirmed |
| SW Regional HQ (Artesh) | CTP Artesh OOB Aug 2025; BG2 H.M. Shafiei confirmed |
| NE Regional HQ (Artesh) | CTP Artesh OOB Aug 2025; BG2 Amanollahi confirmed |
| SE Regional HQ (Artesh) | CTP Artesh OOB Aug 2025; BG Alian confirmed |
| TAB1-14 (IRIAF) | Scramble.nl IRIAF OOB Feb 2026; DIA IMP 2019 |
| IRIN Naval Districts | DIA IMP 2019; ONI Iran Naval Doctrine 2017 |
| IRGCN Naval Regions | DIA IMP 2019; Wikipedia IRGCN; IFMAT 2017 |
| IRGC-AF AGMC + missile brigades | Iran Watch IRGC-AF 2020; DIA IMP 2019; Jane's 2006 (6 Shahab-3 brigades) |
| 21st / 16th / 64th Infantry & Armor Divs | CTP Artesh OOB Aug 2025; all commanders named |
| 81st / 28th Divs (West) | CTP Artesh OOB Aug 2025; all commanders named |
| 92nd / 84th Divs (Southwest) | CTP Artesh OOB Aug 2025; all commanders named |
| 77th / 30th / 58th Divs (Northeast) | CTP Artesh OOB Aug 2025; all commanders named |
| 88th Armored Div (Southeast) | CTP Artesh OOB Aug 2025; BG2 Heydari confirmed |
| 23rd Mobile Assault Div | CTP Artesh OOB Aug 2025 |
| 65th NOHED Airborne SF Bde | DIA IMP 2019; CTP Artesh OOB Aug 2025; Col. Rafiei |
| 31 IRGC Provincial Corps | Wikipedia IRGC GF (all commanders named); cross-checked vs. CTP |
| Quds Force geographic desks | Wikipedia Quds Force; DIA IMP 2019 p.22 |
| IRIAF squadrons (11th, 21st-141st TFS) | Scramble.nl IRIAF OOB Feb 2026 (full squadron-level detail) |
| IRIN submarine/surface forces | DIA IMP 2019; TWZ Mar 2026 |
| IRGCN swarm FAC / SNSF | DIA IMP 2019; IFMAT 2017; Alma Research |

---

## Gaps and Uncertainties

### Tier 1 (Confirmed, well-sourced)
- All 9 top-tier service branches: confirmed
- 5 Artesh regional HQs with current commanders: confirmed (CTP Aug 2025)
- 5 IRIAF tactical air bases with squadron detail: confirmed (Scramble.nl Feb 2026)
- 5 IRIN + 5 IRGCN naval districts: confirmed (DIA IMP 2019; ONI 2017)
- IRGC-AF key commands: confirmed (Iran Watch 2020; DIA IMP 2019)
- All 31 + Tehran City IRGC provincial corps: confirmed (Wikipedia IRGC GF)

### Gaps — IRGC Ground Force Brigade-Level
The task specification correctly notes that **IRGC GF subordinate-brigade data is sparse in open source**. The DIA IMP 2019 and Wikipedia GF do not publish brigade-level IRGC OOB. The Treadstone71 report (2024) identifies some unit naming (e.g., "64th Al-Hadid Artillery Group" in Khuzestan, "15th Brigade" in Behbahan, "Hazrat Mahdi Brigade" in Andimeshk) but these are fragmentary. This OOB **does not fabricate brigade-level IRGC structure below provincial corps level** — only the named SOF units (Saberin, 110th, 33rd) with confirmed DIA/open-source citations are included in third_tier.

### Gaps — Artesh Artillery / AAA
The CTP Artesh OOB (Aug 2025) explicitly notes: "This order of battle does not cover artillery, missile, drone units, or aviation wing." No confirmed artillery brigade-level assignments have been populated.

### Gaps — IRGC-AF Missile Brigade Complete List
Iran Watch (2020) identifies five missile brigades (5th Ra'ad, 7th al-Hadid, 15th Ghaem, 19th Zulfiqar, 23rd Towhid). Jane's (2006) identified 6 Shahab-3 brigades but current post-reorganization brigade numbering beyond these 5 is unconfirmed in unclassified sources. The IRGC-AF likely has 8-12 active missile brigades total based on known inventory size; confirmed numbering exists only for those listed.

### Gaps — IRIAF Current Readiness
Pre-strike order of battle from Scramble.nl (Feb 2026) is the most detailed unclassified IRIAF OOB. Post-June 2025 / March 2026 strike status is uncertain for most TABs. Su-35E deliveries begun (numbers unknown); Su-35E assigned to TAB3 Hamadan, TAB6 Bushehr, TAB9 Bandar Abbas per Scramble but no confirmed quantities.

### Gaps — IRIN / IRGCN Post-Strike Inventory
Bandar Abbas base struck March 2026; specific vessels destroyed or damaged is not fully enumerated. Five vessels at Bandar Abbas "hit or sunk" per MAIAR; 6 damaged at Konarak. True current fleet count requires post-strike overhead imagery analysis.

### Gaps — Quds Force Operational Structure 2025-2026
Post-Soleimani (Jan 2020) Quds Force underwent restructuring under Qaani. Open sources confirm geographic desks/corps structure; subordinate unit numbering (Unit 190, 700, 18000 for Lebanon; Unit 3800 for Iraq; Unit 2250 for Syria logistics) is partial. Iran-Hezbollah logistics chain through Syria (Unit 2250, headed by Razi Mousavi, assassinated Israeli strike Dec 2023) disrupted.

### Gaps — Basij Provincial Detail
32 Basij provincial commands confirmed in structure; individual unit naming (Ashura, Al Zahra, Beyt ol Moghaddas, Kowsar, Imam Ali, Imam Hossein, Fatehin by type) provided at top level. Individual Basij provincial unit commanders not confirmed in open source for this snapshot. Tehran Basij has 22+ regional bases per CTP; at least 6 of 23 targeted as of Mar 4, 2026.

---

## Post-2024 Strike Damage Notes

### April 2024 — Israeli Air Force Strike (Operation Approximate)
- Targeted Isfahan air defense components
- **S-300 PMU2**: At least 1 Tombstone target engagement radar destroyed; battery assessed inoperable
- Ghadir passive array radar: Partially damaged
- Source: [ISW Oct 2024 PDF](https://understandingwar.org/wp-content/uploads/2024/11/The-Consequences-of-the-IDF-Strikes-into-Iran-PDF.pdf)

### October 1, 2024 — Iran "True Promise II" (IRGC-AF strike on Israel)
- IRGC Aerospace Force launched ~200 ballistic missiles at Israel in 2 waves; Iran's largest missile strike
- Mix of Shahab/Ghadr, Emad, Khorramshahr-4, and Fattah variants used
- Significant missile expenditure; solid-fuel production subsequently degraded
- Source: [Wikipedia October 2024 Iranian strikes on Israel](https://en.wikipedia.org/wiki/October_2024_Iranian_strikes_on_Israel)

### October 2024 — Israeli Retaliatory Strikes
- **~20 targets struck across Iran**
- **All 4 S-300 PMU2 batteries assessed inoperable** (Tombstone radars destroyed; Apr + Oct combined)
- **Khojir missile complex struck** (missile/component production)
- **Solid-fuel mixing equipment destroyed** — limits production of Kheibar Shekan and advanced solid-fuel MRBMs; Iran cannot domestically produce replacements; acquiring new mixers estimated 1+ year
- **2x Ghadir passive array detection radar sites** in SW Iran damaged
- Key implication: IRGC-AF retains mobile launchers and existing stockpile but production rate degraded
- Source: [ISW Oct 2024 PDF](https://understandingwar.org/wp-content/uploads/2024/11/The-Consequences-of-the-IDF-Strikes-into-Iran-PDF.pdf)

### June 2025 — Israeli Air Force Strikes on IRIAF Bases
- **TAB1 Mehrabad** (Tehran): Struck June 13; airworthiness doubtful
- **TAB2 Tabriz**: Struck June 13; airworthiness doubtful
- **TAB3 Hamadan/Nojeh**: Struck June 13; airworthiness doubtful
- **TAB4 Dezful**: Struck June 13; airworthiness doubtful
- **TAB6 Bushehr**: Struck June 13 AND June 19; airworthiness doubtful
- **TAB7 Shiraz**: Struck June 13; airworthiness doubtful
- **TAB14 Mashhad**: Struck June 15; some transports and tankers destroyed
- **84th Infantry Division** (Khorramabad): 3 deaths confirmed from Israeli drone June 19
- **71st Mechanized Infantry Brigade** (Sarpol-e Zahab): Former brigade commander Col. Mohammadi killed June 22
- **292nd Armored Brigade** ammunition depot (Dezful): Struck
- **216th Armored Brigade** ammunition depot (Zanjan): Struck
- Source: [Scramble.nl IRIAF OOB Feb 2026](https://www.scramble.nl/planning/orbats/iran/isl.-rep.-of-iran-air-force); [CTP Artesh OOB Aug 2025](https://www.criticalthreats.org/analysis/order-of-battle-of-the-iranian-artesh-ground-forces)

### March 2026 — US-Israeli "Operation Epic Fury" Strikes
- **IRGC Sarallah Headquarters** (Tehran): Struck March 1, 2026 per CTP; oversees capital region security
- **IRGC-GF Commander Mohammad Pakpur**: Killed in airstrike per JPost March 2026
- **IRIAF TAB8 Isfahan**: Under "heavy attack"; F-14A fleet "entirely destroyed" per Scramble.nl; Su-22s, P-3s, C-130s also destroyed
- **IRGCN 1st Region HQ Bandar Abbas**: Multiple drydocks hit; "at least 5 vessels hit or sunk" per MAIAR; Makran (forward base ship) set ablaze
- **IRGCN 2nd Region? Konarak**: 6 vessels damaged, structures destroyed per MAIAR
- **IRGCN 3rd Region Bandar Mahshahr**: At least 6 munitions on structures Mar 2, 2026 per Alma Research
- **CENTCOM**: Reported 16 Iranian minelayers destroyed near Strait of Hormuz by March 10
- **IRIAF TABs 1-4, 6-7, 14**: Operational status severely degraded; Su-35E deliveries ongoing but insufficient to replace losses
- Source: [TWZ Mar 2026](https://www.twz.com/news-features/irans-key-naval-base-on-strait-of-hormuz-set-ablaze-from-strikes); [Alma Research Mar 2026](https://israel-alma.org/irgc-naval-installations-targeted/); [Scramble.nl Feb 2026]; [JPost Mar 2026](https://www.jpost.com/middle-east/iran-news/article-888831); [CTP Mar 2026](https://www.criticalthreats.org/analysis/iran-update-evening-special-report-march-4-2026)

### March 2026 — IRGC True Promise IV (54th Wave)
- IRGC fired **Sejjil solid-fuel MRBM for the first time operationally** in 54th wave of strikes on Israel
- Also used Haj Qasem MRBM in same operation
- Demonstrates IRGC-AF retains offensive capability despite production degradation
- Source: [Kurdistan24 Mar 2026](https://www.kurdistan24.net/en/story/900736/irans-irgc-announces-54th-strike-wave-on-israel-debuts-sejjil-missile)

---

## Key Analytical Points

### 1. IRGC-AF Holds All Ballistic Missiles — Not Artesh
This is the most common analytical error. The IRIAF has NO ballistic missiles. All SRBMs, MRBMs, and cruise missiles belong to the **IRGC Aerospace Force (IRGC-AF)** under Al-Ghadir Missile Command. [DIA IMP 2019 p.21]

### 2. IRGCN ≠ IRIN — Doctrine and Equipment are Entirely Different
- **IRIN**: Blue-water, guided-missile corvettes, Kilo-class submarines, Indian Ocean deployments. Artesh.
- **IRGCN**: Persian Gulf asymmetric swarm, hundreds of small fast-attack craft, coastal ASCMs. IRGC.
- They share the Bandar Abbas port but are separate forces with separate chains of command.

### 3. Soleimani Death Impact
Qasem Soleimani killed Jan 3, 2020 in US drone strike (Baghdad). Replaced by **Esmail Qaani**. Organizational continuity of Quds Force maintained but some argue operational effectiveness diminished for regional proxies initially. Quds Force has since rebuilt Lebanon/Syria network (partially degraded by Israeli strikes 2024-2026, including killing of Lebanon/Syria Corps BG Zahedi in April 2024).

### 4. Post-2024 IRGC Command Resilience
Per Jerusalem Post (Mar 2026), IRGC had pre-planned decentralized succession three levels deep per commander. Each provincial corps can operate autonomously in event of central command decapitation — a deliberate post-2003 (Iraq invasion) lesson. General Pakpur's death likely resulted in pre-named successor taking immediate command.

### 5. IRIAF Readiness Was Already Low Pre-2024
Even before the 2025-2026 strikes, IRIAF was operating Cold War-vintage US and Soviet aircraft with extreme parts shortages and 30-40% operational readiness for most platforms. The F-14 fleet had been declining for decades; the assessment of its destruction in March 2026 is not surprising given it was already severely degraded.

---

## Sources Consulted

| Source | URL | Used For |
|--------|-----|----------|
| DIA Iran Military Power 2019 | https://www.dia.mil/Portals/110/Images/News/Military_Powers_Publications/Iran_Military_Power_LR.pdf | Baseline OOB, all branches, equipment counts, personnel |
| CTP/ISW — Artesh Ground Forces OOB (Aug 2025) | https://www.criticalthreats.org/analysis/order-of-battle-of-the-iranian-artesh-ground-forces | Definitive Artesh division/brigade OOB with current commanders |
| ISW — Consequences of IDF Strikes on Iran (Nov 2024) | https://understandingwar.org/wp-content/uploads/2024/11/The-Consequences-of-the-IDF-Strikes-into-Iran-PDF.pdf | Oct 2024 strike damage assessment |
| Scramble.nl — IRIAF OOB (Feb 2026) | https://www.scramble.nl/planning/orbats/iran/isl.-rep.-of-iran-air-force | Definitive IRIAF TAB and squadron OOB; post-strike status |
| Wikipedia — IRGC Ground Forces | https://en.wikipedia.org/wiki/Islamic_Revolutionary_Guard_Corps_Ground_Forces | 31+1 provincial corps list with commanders |
| Wikipedia — IRGC Aerospace Force | https://en.wikipedia.org/wiki/Islamic_Revolutionary_Guard_Corps_Aerospace_Force | Missile system list, organizational details |
| Wikipedia — IRGC Navy | https://en.wikipedia.org/wiki/Islamic_Revolutionary_Guard_Corps_Navy | 5 naval regions, commanders |
| Wikipedia — Quds Force | https://en.wikipedia.org/wiki/Quds_Force | Geographic directorates, command centers, Qaani biography |
| Wikipedia — IRGC | https://en.wikipedia.org/wiki/Islamic_Revolutionary_Guard_Corps | Overall IRGC structure and decentralization 2008 |
| Iran Watch — IRGC-AF profile | https://www.iranwatch.org/iranian-entities/islamic-revolutionary-guard-corps-irgc-aerospace-force | 5 named missile brigades; AGMC commander |
| Iran Watch — Missile Arsenal Table (Jan 2026) | https://www.iranwatch.org/our-publications/weapon-program-background-report/table-irans-missile-arsenal | 3,000+ missile estimate |
| ONI — Iran Naval Forces (2017) | https://www.oni.navy.mil/Portals/12/Intel%20agencies/iran/Iran%20022217SP.pdf | IRIN naval district structure |
| CTP — Evening Special Report March 4, 2026 | https://www.criticalthreats.org/analysis/iran-update-evening-special-report-march-4-2026 | Sarallah HQ strike; Basij regional bases |
| Alma Research — IRGCN Naval Installations Targeted (Mar 2026) | https://israel-alma.org/irgc-naval-installations-targeted/ | 3 IRGCN regional HQs struck; satellite imagery |
| The War Zone — Bandar Abbas struck (Mar 2026) | https://www.twz.com/news-features/irans-key-naval-base-on-strait-of-hormuz-set-ablaze-from-strikes | IRIN Makran ablaze; Bandar Abbas damage |
| IFMAT — IRGCN Naval Regions (2017) | https://www.ifmat.org/04/13/irgcn-naval-regions/ | IRGCN 5th region and Jask base |
| JPost — IRGC decentralization (Mar 2026) | https://www.jpost.com/middle-east/iran-news/article-888831 | Pakpur death; decentralized succession |
| Kurdistan24 — Sejjil fired (Mar 2026) | https://www.kurdistan24.net/en/story/900736/irans-irgc-announces-54th-strike-wave-on-israel-debuts-sejjil-missile | First operational Sejjil use |
| NTI — Iran WMD Profile | https://www.nti.org/countries/iran/ | Nuclear/missile cross-check |
| Wikipedia — Structure of Iranian Army (cross-check) | https://en.wikipedia.org/wiki/Structure_of_the_Iranian_Army | Historical division numbering cross-check |

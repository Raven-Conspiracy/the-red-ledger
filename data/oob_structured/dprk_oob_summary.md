# DPRK Korean People's Army (KPA) — Structured Order of Battle Summary

**Snapshot date**: 2026-05-09  
**Schema version**: v1  
**Baseline source**: DIA North Korea Military Power Report 2021  
**Inquisitor corpus tag**: `[OOB-DPRK] [STRUCTURED] [LEVEL:GSD|CORPS|BDE]`

---

## Methodology Note

North Korea is the hardest OSINT target in the world. This OOB follows a **brutal-honesty protocol**: where unit designations are not confirmed in publicly accessible sources (DIA NKMP 2021, IISS Military Balance, ROK Defense White Papers, HRNK, FAS, Wikipedia cross-check), placeholder entries are generated with **explicit "NAME UNKNOWN"** labels rather than invented unit names. Specific corps-level formations (820th, 806th, 815th, 620th, 91st) are included because they appear in authoritative sources. Most infantry division assignments to specific corps are not confirmed and are flagged accordingly.

---

## Hierarchy Tree

```
KPA General Staff Department (kpa_gs) — VM Ri Yong-gil
│
├── KPA Ground Forces (kpa_gf)
│   ├── I Corps [FORWARD] — HQ Kumgang County
│   │   ├── 3× Infantry Divisions (unidentified, placeholders)
│   │   ├── Mechanized Brigade (unidentified)
│   │   └── Artillery Brigade (unidentified)
│   ├── II Corps [FORWARD] — HQ Wonsan area
│   ├── IV Corps [FORWARD] — Western/Seoul axis
│   ├── V Corps [FORWARD] — Central/eastern DMZ
│   ├── III Corps — Second echelon
│   ├── Former VI Corps (DISBANDED ~1996)
│   ├── VII Corps — Coastal/east
│   ├── VIII Corps — North-central
│   ├── IX Corps — N. Hamgyong
│   │   ├── 24th Infantry Division
│   │   └── 42nd Infantry Division
│   ├── X Corps — Northern
│   ├── 806th Mechanized Corps
│   ├── 815th Mechanized Corps
│   ├── 820th Armored Corps — HQ Sariwon
│   │   └── 105th Seoul Tank Division [ELITE]
│   ├── 620th Artillery Corps [FORWARD ARTY / HIGHEST READINESS]
│   │   ├── 170mm Koksan SP Artillery Brigade [ELITE]
│   │   └── 240mm MLRS Brigade [ELITE]
│   ├── Pyongyang Defense Command [REGIME PROTECTION]
│   │   └── Bodyguard Command Brigade (multiple)
│   └── Capital Defense Command / 91st Corps [ELITE]
│
├── Korean People's Navy (kpn) — Park Kwang Seop (CDR from May 2025)
│   ├── East Sea Fleet — HQ Toejo-dong
│   │   ├── Romeo-class Submarine Flotilla (~20 boats)
│   │   ├── Sang-O Submarine Flotilla (~40 coastal SSC)
│   │   ├── Midget Submarine Flotilla (~45-70 Yugo/Yono)
│   │   ├── SSB 8.24 Yongung (Sinpo-class, 1 SLBM tube) [ELITE]
│   │   └── SSB Hero Kim Kun Ok (multi-tube, Sep 2023) [ELITE]
│   ├── West Sea Fleet — HQ Nampo
│   │   ├── DDG Choe Hyon + Sister Ship (launched 2025) [ELITE]
│   │   └── West Sea Surface Combatant Flotilla
│   ├── 24th Seaborne Sniper Brigade [ELITE]
│   └── 29th Seaborne Sniper Brigade [ELITE]
│
├── Korean People's Army Air Force (kpaf)
│   ├── 1st ACC — HQ Kaechon (NW sector)
│   │   ├── 57th Fighter Wing (MiG-29) [ELITE]
│   │   ├── 55th Attack Wing (Su-25K)
│   │   ├── 24th Bomber Rgt (Il-28/H-5)
│   │   ├── 35th Fighter Rgt (J-6/MiG-19)
│   │   ├── 58th Fighter Rgt (MiG-23ML)
│   │   └── [+ 4 more regiments]
│   ├── 2nd ACC — HQ Toksan (East coast)
│   │   └── [56th, 25th, 46th, 66th, 71st, 72nd Rgts]
│   ├── 3rd ACC — HQ Hwangju (DMZ sector)
│   │   └── [4th, 32nd, 33rd, 11th, 50th, 86th, 63rd Rgts]
│   ├── 5th Transport Division — HQ Taechon
│   │   ├── An-2 transport wings (SOF insertion)
│   │   └── 64th Helo Rgt (84× MD-500D) [ELITE SOF support]
│   ├── 6th Transport Division — HQ Sondok
│   └── 8th Training Division — HQ Orang
│
├── KPA Special Operations Forces (sof) — ~200,000 personnel
│   └── 11th Storm Corps — HQ Tokchon [ELITE]
│       ├── LI Brigades 1-22 (placeholder names; 8 attached to fwd corps, 14 to 11th Corps)
│       ├── 3rd SOF Airborne Brigade [ELITE]
│       ├── 17th SOF Airborne Brigade [ELITE]
│       ├── Sniper Brigade No. 1 (General Sniper, incl. female "Peony Brigade") [ELITE]
│       ├── Reconnaissance Brigade No. 1 [ELITE]
│       └── Amphibious LI Brigade No. 1 [ELITE]
│
├── KPA Strategic Force / Missile General Bureau (strategic)
│   ├── SRBM Brigade Group (Hwasong-5/6/9, KN-23, KN-24, KN-25)
│   │   ├── KN-23 Iskander SRBM Brigade [ELITE]
│   │   ├── KN-24 ATACMS-class Brigade [ELITE]
│   │   └── KN-25 600mm SRMRL Brigade [ELITE]
│   ├── MRBM/IRBM Brigade Group (Hwasong-7/12/Pukguksong-2)
│   │   ├── Hwasong-7 (Nodong) MRBM Brigade [ELITE]
│   │   └── Pukguksong-2 Solid MRBM Brigade [ELITE]
│   ├── ICBM Brigade Group (Hwasong-14/15/17/18/19)
│   │   ├── Hwasong-17 Brigade [ELITE, POST-2021]
│   │   ├── Hwasong-18 Solid ICBM Brigade [ELITE, POST-2021]
│   │   └── Hwasong-19 Brigade [ELITE, POST-2021]
│   └── SLBM Unit (8.24 Yongung + Hero Kim Kun Ok)
│
└── Reconnaissance General Bureau / RGB (rgb) — Col Gen Ri Chang-ho
    └── 5th Bureau / Technical Reconnaissance (Cyber) [ELITE]
        └── 121st Bureau / Lazarus Group (APT38, ~6,000 hackers) [ELITE]
```

---

## Unit Provenance Table

| Unit | Source(s) | Confidence |
|------|-----------|------------|
| KPA GSD / VM Ri Yong-gil | Wikipedia GSD KPA; Yonhap Jan 2026 | HIGH |
| KPA Ground Forces force totals | DIA NKMP 2021; IISS MB 2017 p.304 | HIGH |
| I–V Corps (Forward Corps designation) | Wikipedia KPAGF 2003 report; DIA NKMP 2021; FAS irp.fas.org | HIGH (existence); LOW (sub-unit names) |
| Former VI Corps (disbanded) | Wikipedia KPAGF citing Bermudez *Shield of the Great Leader* | HIGH |
| IX Corps 24th/42nd Divs | Wikipedia KPAGF | MEDIUM |
| 806th/815th Mech Corps | Wikipedia KPAGF 2003 report; IISS MB 2017 | HIGH |
| 820th Armored Corps, HQ Sariwon | Wikipedia KPAGF citing Mizokami/ROK-US assessment 2020 | HIGH |
| 105th Seoul Tank Division | IISS MB 2017; Wikipedia KPAGF | HIGH |
| 620th Artillery Corps | Wikipedia KPAGF (also cites possible reorg as 518th Division) | HIGH (existence); MEDIUM (structure) |
| Pyongyang Defense Command | DIA NKMP 2021 | HIGH |
| 91st Capital Defense Corps | ROK DWP 2022 | MEDIUM |
| KPN East/West Fleet HQs, bases | DIA NKMP 2021; Wikipedia KPN | HIGH |
| Romeo/Sang-O/Midget sub flotillas | DIA NKMP 2021; Wikipedia KPN; KPASOF Wikipedia | HIGH (existence); MEDIUM (numbers) |
| 8.24 Yongung SLBM submarine | Wikipedia KPN | HIGH |
| Hero Kim Kun Ok submarine | Wikipedia KPN (Sep 2023 commissioning) | HIGH |
| Choe Hyon-class destroyers (2025) | Wikipedia Choe Hyon; CSIS; Sputnik News 2026 | HIGH |
| KPAF 6 divisions (1st/2nd/3rd ACC, 5th/6th TD, 8th Training) | Wikipedia KPAF; DIA NKMP 2021 | HIGH (division structure) |
| Named air regiments (57th MiG-29, 55th Su-25, 24th Il-28, etc.) | Wikipedia KPAF detailed base table | MEDIUM (based on open-source orbat, not officially confirmed) |
| MD-500D (84 aircraft, 64th Rgt) | Wikipedia KPAF; FAS KPA Guide Part 3 | HIGH |
| 11th Storm Corps, HQ Tokchon | Wikipedia XI Corps NK; Grey Dynamics 2024 | HIGH |
| SOF 22 LI brigades, 3 airborne, 3 sniper, 2 amphibious | FAS KPA Guide Part 3; Grey Dynamics 2024; DIA NKMP 2021 | HIGH (types/numbers); NONE (actual designations) |
| 24th/29th Seaborne Sniper Brigades | HRNK RGB Final 2026 | MEDIUM |
| Strategic Force missile systems (all) | Wikipedia Strategic Force; DIA NKMP 2021 Appendix A | HIGH (systems); MEDIUM (brigade designations) |
| KN-23/24/25 brigades | Wikipedia Strategic Force; CSIS Beyond Parallel 2020; DIA NKMP 2021 | HIGH (systems); LOW (brigade numbers) |
| Hwasong-17/18/19 ICBMs | Wikipedia Strategic Force (post-2021 tests confirmed) | HIGH |
| RGB structure, 6 bureaus | HRNK RGB Final 2026 | HIGH |
| RGB 5th Bureau / 121st Bureau / Lazarus | HRNK RGB Final 2026; Wikipedia Bureau 121 | HIGH |
| Equipment totals (tanks, aircraft, etc.) | DIA NKMP 2021; IISS MB 2017-2018; ROK DWP 2022 | MEDIUM (all estimates) |

---

## Gaps & Uncertainties

This section is intentionally the largest of the three country OOBs. DPRK is the hardest target in open-source intelligence.

### Critical Gaps

1. **Infantry division designations**: DIA NKMP 2021 and IISS MB 2017 confirm ~27 infantry divisions exist in the KPA GF. **Zero of these 27 division numbers are confirmed in current unclassified sources**. Wikipedia KPAGF only confirms the 24th and 42nd Divisions (as IX Corps elements, absorbed from VI Corps). The 105th Armored Division is named. All other ~24 divisions use generic placeholder labels in this OOB.

2. **Corps sub-unit assignment**: Which specific divisions/brigades belong to which corps (I–V, VII–X) is not established in open sources. The 2003 echelonment model (4 forward corps + 2 mech + 1 armor + 1 arty + strategic reserve) is structurally confirmed but unit-level assignments are not.

3. **SOF brigade designations**: The 22 light infantry brigades, 3 airborne brigades, 3 sniper brigades, 3 recon brigades, and 2 amphibious brigades are confirmed as *types and numbers* by FAS (pre-2000 estimates) and Grey Dynamics (2024). **No brigade designations/numbers appear in unclassified open sources** except the 11th Storm Corps as the controlling headquarters. The "3rd, 17th SOF Air Bdes" in the task specification have not been verified independently in sources consulted.

4. **Missile brigade designations**: KPA Strategic Force has 13 brigades (expanded from 8 in 2020). **None have confirmed unit designations in unclassified open sources.** Operating base locations are partially known from CSIS Beyond Parallel satellite analysis (Kal-gol, Sakkanmol, etc.) but brigade/unit numbers are classified. CSIS notes the organizational nomenclature is inconsistent even internally.

5. **Corps headquarters locations**: Only the 820th Corps (Sariwon, Hwanghae Province) and 11th Storm Corps (Tokchon, South Pyongan Province) have confirmed HQ locations. The HQs of I, II, IV, V, III, VII, VIII, IX, X Corps are approximate or entirely unconfirmed in open sources consulted.

6. **620th Artillery Corps reorganization**: Wikipedia KPAGF notes reports that the 620th has been "reorganised as the 518th Artillery Division." This transition is unconfirmed, and both designations may be in use or the 620th may have reverted. This OOB retains "620th" as the primary identifier.

7. **806th/815th Mechanized Corps sub-units**: Brigades within these corps are not named in open sources. The corps are confirmed to exist but internal composition is opaque.

8. **KPN squadron/flotilla designations**: DIA NKMP 2021 references "8 operational commands" (East Fleet) and "5 operational commands" (West Fleet). None have confirmed unit designations in this OOB except the named submarines (8.24 Yongung, Hero Kim Kun Ok) and the Choe Hyon destroyers.

9. **KPAF air regiment currency**: The air regiment assignments in this OOB draw from Wikipedia KPAF's detailed base/unit table, which itself is an open-source community compilation. Several regiment numbers have "??" as confirmed designations. Aircraft-to-regiment assignments should be treated as indicative, not authoritative.

10. **Strength percentages**: KPA readiness is highly variable and essentially unverifiable from open sources. The values used (82-90% for forward corps, 50-60% for navy, ~70% for rear corps) are analyst judgments based on DIA NKMP 2021 language about unit readiness and general DPRK economic strain. They are not derived from specific intelligence reporting.

11. **RGB commander currency**: Col Gen Ri Chang-ho confirmed as RGB director from 2022 per HRNK 2026 report. However, DPRK leadership reshuffles rapidly. Post-January 2026 ROK MND report confirmed changes to Pyongyang defense leadership, but RGB director was not specifically mentioned.

12. **SOF deployment to Russia**: KPASOF Wikipedia notes "Elements of the KPASOF have been deployed to Russia as a part of the North Korean involvement in the Russian invasion of Ukraine." Scale and which units are not confirmed.

---

## Post-2021 Updates

These are additions/changes to the DIA NKMP 2021 baseline confirmed by post-2021 sources:

| Item | Update | Source | Date |
|------|---------|--------|------|
| Hwasong-17 ICBM | First test success (>13,000km); 11+ systems | Wikipedia Strategic Force | Mar 2022 |
| Hwasong-18 solid-fuel ICBM | First solid ICBM in NK arsenal (15,000km); tested | Wikipedia Strategic Force | Apr 2023 |
| Hwasong-19 ICBM | Newest ICBM (≥15,000km); tested | Wikipedia Strategic Force | Oct 2024 |
| Hwasong-16B solid IRBM | New solid IRBM (3000-5500km); tested | Wikipedia Strategic Force | Apr 2024, Jan 2025 |
| Hero Kim Kun Ok SSB | Multi-tube SLBM submarine commissioned | Wikipedia KPN | Sep 2023 |
| Choe Hyon-class destroyer (×2) | First DPRK destroyers; launched Apr + Jun 2025; armed with VLS, PAArs | Wikipedia Choe Hyon; CSIS; Sputnik | Apr-Jun 2025 |
| Nuclear-powered SSBN announced | DPRK announced SSBN construction (est. 5000-8000t, ~10 missiles) | Wikipedia KPN | Mar 2025 |
| New guided-missile frigates (×2) | 4000-5000t frigates under construction at Nampo + Chongjin | Wikipedia KPN; CSIS Apr 2025 | Dec 2024 - 2025 |
| KPAF renamed | "Air and Anti-Air Force" → "Air Force" | Wikipedia KPAF | Apr 2022 |
| Russia MiG-29/Su-27 transfer (reported) | INDOPACOM CDR Paparo reported NK to receive MiG-29/Su-27 from Russia; **not confirmed delivered as of May 2026** | Wikipedia KPAF | 2024 |
| Pyongyang defense leadership reshuffled | Guard Office, Guard Dept, KPA Bodyguard Command chiefs replaced | Yonhap/Korea Times | Jan 2026 |
| NK-Russia Treaty | Comprehensive Strategic Partnership Treaty signed; mutual defense clause | Arms Control Association | Jun 2024 |
| GSD Chief Ri Yong-gil | Appointed 10 Aug 2023 | Wikipedia GSD KPA | Aug 2023 |
| SOF to Russia | KPASOF elements deployed to Russia for Ukraine conflict | KPASOF Wikipedia | 2024 |
| KN-25 shells to Russia | NK supplied artillery shells/rockets used in Ukraine from late 2023 | Wikipedia Strategic Force | 2023+ |
| First vice-chief expanded | KPA GSD first vice-chief posts expanded from 1 to 2 | ROK MND/Yonhap | Jan 2026 |

---

## Russia-DPRK Cooperation Impact

### Confirmed (as of May 2026)

1. **Artillery shell/rocket transfers from DPRK to Russia**: North Korea supplied large quantities of 122mm/152mm artillery shells and KN-25 SRMRL rockets to Russia for use in Ukraine. Debris analysis confirmed NK-origin munitions in Ukraine from late 2023 onwards. This gives NK rare real-world combat data on its artillery systems.

2. **KPA troops to Russia**: KPASOF elements (estimated 10,000-12,000 troops in 2024 estimates per open media) deployed to Russia, suffering casualties in Kursk/Donetsk sectors. Operational lessons unknown but significant.

3. **June 2024 NK-Russia Treaty**: Article 4 mutual defense obligation; Article 8 establishes military cooperation mechanisms; Article 10 opens space and nuclear energy cooperation. Russia's April 2026 announcement of "long-term" plan for 2027-2031 military cooperation indicates deepening ties.

4. **Technology transfers to DPRK (partially confirmed)**: Russia reportedly providing satellite technology, artillery manufacturing expertise, and possibly aerospace technology. Kim Jong Un's Malligyong-1 reconnaissance satellite launch (Nov 2023) benefited from Russian technical assistance per multiple analyses.

### Reported But Unconfirmed

5. **MiG-29/Su-27 aircraft transfer**: INDOPACOM CDR Paparo stated in 2024 that NK is "set to receive" MiG-29/Su-27 from Russia. **Not confirmed delivered as of May 2026.** Russia's own aerospace industry is under strain from Ukraine war demand. If delivered, this would be a meaningful KPAF modernization given current MiG-29 force is only 35 aircraft.

6. **Russian air defense system transfers**: Unconfirmed reports of potential S-400 or advanced SAM technology transfer. NK has already domestically developed Pongae-5 (S-300 derivative) and Pyoljji-1-2 (S-400 derivative).

7. **Nuclear warhead miniaturization assistance**: Speculative. No credible public reporting confirms Russian nuclear technology transfer.

### OOB Impact Assessment

The Russia-DPRK cooperation does not yet materially change the KPA OOB structure documented here. The Strategic Force order of battle remains NK-indigenous missile systems. Ground force equipment remains legacy Soviet and domestic production. The most significant near-term OOB impact would be the potential MiG-29/Su-27 transfer to KPAF if confirmed. The longer-term impact is enhanced NK capability for precision-guided munition production and space-based ISR (Malligyong satellite), which supports Strategic Force targeting.

---

## Equipment Notes

All equipment counts are **estimates**. KPA has nominal inventory of ~3,500 tanks but readiness varies massively. The following caveats apply:

- **Tanks**: ~3,500 nominal; perhaps 1,500-2,000 operationally ready per analyst judgments. Pokpung-ho (modern domestic T-72 derivative, perhaps 200-500 in service). Chonma-ho (~800-1,000). Remainder T-55/62 legacy. New "M-2018" hexagonal turret heavy tank appeared at 2018 parade; production numbers unknown.
- **Artillery**: >8,600 gun systems; >4,800 MRL tubes per US DoD 2014. Many in static positions or poor condition. Forward-deployed systems near DMZ are higher readiness.
- **Aircraft**: ~570 combat aircraft but most are obsolete. 35 MiG-29 and 34 Su-25 are the only Western-threat-relevant combat aircraft. ~80 Il-28/H-5 bombers are useful for anti-ship missions. The 270+ An-2 fleet is strategically significant for SOF insertion precisely because it is radar-invisible.
- **Submarines**: ~70 total; operational readiness low for Romeo-class (aging). Sang-O and midgets are more operationally active. SLBM submarines are strategic programs with high maintenance priority.
- **Missiles**: Counts from DIA NKMP 2021 Appendix A + Wikipedia Strategic Force. NK claimed ~900 SRBMs in 2017; current count with newer systems likely higher. ICBM numbers intentionally low in this estimate (30) reflecting uncertainty about warhead production constraints.

---

## Sources Consulted

1. **DIA North Korea Military Power 2021** — https://www.dia.mil/Portals/110/Documents/News/North_Korea_Military_Power.pdf
2. **Wikipedia Korean People's Army Ground Force** — https://en.wikipedia.org/wiki/Korean_People%27s_Army_Ground_Force
3. **Wikipedia Korean People's Navy** — https://en.wikipedia.org/wiki/Korean_People%27s_Navy
4. **Wikipedia Korean People's Army Air Force** — https://en.wikipedia.org/wiki/Korean_People%27s_Army_Air_Force
5. **Wikipedia Korean People's Army Strategic Force** — https://en.wikipedia.org/wiki/Korean_People%27s_Army_Strategic_Force
6. **Wikipedia Korean People's Army Special Operations Forces** — https://en.wikipedia.org/wiki/Korean_People%27s_Army_Special_Operations_Forces
7. **Wikipedia General Staff Department KPA** — https://en.wikipedia.org/wiki/General_Staff_Department_of_the_Korean_People%27s_Army
8. **Wikipedia XI Corps (Storm Corps) North Korea** — https://en.wikipedia.org/wiki/XI_Corps_(North_Korea)
9. **Wikipedia I Corps North Korea** — https://en.wikipedia.org/wiki/I_Corps_(North_Korea)
10. **Wikipedia North Korean destroyer Choe Hyon** — https://en.wikipedia.org/wiki/North_Korean_destroyer_Choe_Hyon
11. **Wikipedia Bureau 121** — https://en.wikipedia.org/wiki/Bureau_121
12. **HRNK Reconnaissance General Bureau Final Report 2026** — https://www.hrnk.org/wp-content/uploads/2026/02/RGB_Final.pdf
13. **FAS KPA Guide Part 3 Special Operations Forces** — https://nuke.fas.org/guide/dprk/agency/kpa-guide/part03.htm
14. **FAS IRP Chapter 5 North Korea Military Forces** — https://irp.fas.org/dia/product/knfms/knfms_chp5.html
15. **CSIS Beyond Parallel: Kal-gol Missile Operating Base 2020** — https://beyondparallel.csis.org/undeclared-north-korea-the-kal-gol-missile-operating-base/
16. **Grey Dynamics: North Korean Special Forces Oct 2024** — https://greydynamics.com/north-korean-special-forces/
17. **IISS Military Balance 2017** — DPRK chapter, p.304 (paywalled; references from Wikipedia KPAGF)
18. **ROK Ministry of National Defense 2022 Defense White Paper** — https://www.mnd.go.kr
19. **Arms Control Association: North Korea-Russia Military Ties Jul 2024** — https://www.armscontrol.org/act/2024-07/news/north-korea-russia-strengthen-military-ties
20. **Sputnik News: North Korea Choe Hyon Destroyer May 2026** — https://sputniknews.in/20260508/north-korea-tests-new-choe-hyon-destroyer-10872168.html
21. **Yonhap/Korea Times: NK Military Reshuffle Jan 2026** — https://www.koreatimes.co.kr/foreignaffairs/northkorea/20260113/n-korea-replaces-top-military-officials-guarding-kim-jong-un-unification-ministry
22. **NamuWiki KPN** — https://en.namu.wiki/w/korean-peoples-army-navy
23. **GlobalMilitary.net KPAF 2026** — https://www.globalmilitary.net/air_forces/prk/

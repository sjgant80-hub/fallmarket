# Thomas forks · concretely wired into the estate

57 forks from teslasolar (Thomas Frumkin · Substrate 0) live on sjgant80-hub. This doc names WHERE each one plugs in.

## Directly wired to FallMarket

| Fork | Wired into | Why |
|---|---|---|
| [hallucination-elimination-benchmark](https://github.com/sjgant80-hub/hallucination-elimination-benchmark) | `lib/benchmark-suites.mjs` · suite `hallucination-thomas-v1` (weight 1.5) | Phase 3 benchmark for any LLM-wrapping listing. Multi-tier test: cultural grounding + Triad Engine + known-hallucination regression |
| [instantvm](https://github.com/sjgant80-hub/instantvm) | `worker/wrangler.toml` · `SANDBOX_TIER=instantvm` | Neutral runner spawns disposable Windows VM per benchmark run. Isolates every product before signing result |
| [shields](https://github.com/sjgant80-hub/shields) (127d) | Socket VIII / §24 reference implementation | Direct Konomi 127-shield code · study for k-dot shield mechanics |
| [os127](https://github.com/sjgant80-hub/os127) | Socket VIII / §24 companion | 127-state OS · Mersenne Shield 127 substrate |

## Konomi substrate references (framework-mode only · private)

| Fork | Role |
|---|---|
| [konomi](https://github.com/sjgant80-hub/konomi) | THE canonical konomi build spec · Thomas's spec doc |
| [konomikitka](https://github.com/sjgant80-hub/konomikitka) | Konomi tools kit |
| [LookingGlass](https://github.com/sjgant80-hub/LookingGlass) | Konomi Looking Glass |
| [Yggdrasil](https://github.com/sjgant80-hub/Yggdrasil) | Konomi Yggdrasil · fork lineage substrate |
| [lightbringer](https://github.com/sjgant80-hub/lightbringer) | TOPO registry · glyph→topological-operator map (referenced across memory) |
| [JEDI](https://github.com/sjgant80-hub/JEDI) | JEDI framework |
| [VacuumGenesis](https://github.com/sjgant80-hub/VacuumGenesis) | Unified Framework for Creation from Void |
| [MianoCube](https://github.com/sjgant80-hub/MianoCube) | Thomas's cube (referenced across §5 + §17 sockets) |
| [SpiralSense](https://github.com/sjgant80-hub/SpiralSense) | Visual Language of Sound · SYMBEYOND Echo Tier |

## Industrial substrate · ISA-95 stack

| Fork | Role |
|---|---|
| [GITPLC](https://github.com/sjgant80-hub/GITPLC) | PLC layer · one layer to communicate all |
| [GITHMI](https://github.com/sjgant80-hub/GITHMI) | ISA-101 HMI runtime · faceplates + alarms |
| [GITSCADA](https://github.com/sjgant80-hub/GITSCADA) | Supervisory Control & Data Acquisition · orchestrates the stack |
| [GITTAG](https://github.com/sjgant80-hub/GITTAG) | ISA-95 tag database |
| [GITCONTROL](https://github.com/sjgant80-hub/GITCONTROL) | Master hub · links PLC+HMI+TAG+SCADA |
| [GITNITION](https://github.com/sjgant80-hub/GITNITION) | Git-native Ignition Gateway |
| [Flintium](https://github.com/sjgant80-hub/Flintium) | Ignition faceplates library |
| [isa-os](https://github.com/sjgant80-hub/isa-os) | ISA-95 OS |
| [ISAchieve](https://github.com/sjgant80-hub/ISAchieve) | Achievement system |
| [IgnAIte](https://github.com/sjgant80-hub/IgnAIte) | AI Ignition Base Form |
| [IndustrialIntelligence](https://github.com/sjgant80-hub/IndustrialIntelligence) | Umbrella |

**How the industrial stack applies:** every industrial-vertical wedge (manufacturing SMB, plant ops SMB, ISA-95-compliant enterprise) reuses this stack rather than reinventing PLC/HMI/SCADA connectivity.

## Concept references

| Fork | Role |
|---|---|
| [NODE-001](https://github.com/sjgant80-hub/NODE-001) | Wearable AI Companion System · hardware roadmap ref |
| [LRM](https://github.com/sjgant80-hub/LRM) | "Large Repo Model · predicts the next file, not the next word" |
| [Konception](https://github.com/sjgant80-hub/Konception) | Konomi Konception |
| [RealityMirror](https://github.com/sjgant80-hub/RealityMirror) | pre-existing pattern for FallMirror |
| [Eye-of-Mind](https://github.com/sjgant80-hub/Eye-of-Mind) | Eye of the Mind |
| [GEYASS](https://github.com/sjgant80-hub/GEYASS) | Gradient Eden Yggdrasil Assembly Sub-System |
| [ETH](https://github.com/sjgant80-hub/ETH) | Enteric Translation Hypothesis · biology substrate |

## Guild / ACG governance

| Fork | Role |
|---|---|
| [ACG-Ballroom](https://github.com/sjgant80-hub/ACG-Ballroom), [ACG-SHIP](https://github.com/sjgant80-hub/ACG-SHIP), [ACG-Test](https://github.com/sjgant80-hub/ACG-Test), [ACG-Codespace](https://github.com/sjgant80-hub/ACG-Codespace) | Guild patterns · reference for future Gen-2 guild formation |
| [ACGCLI](https://github.com/sjgant80-hub/ACGCLI), [ACGPHONE](https://github.com/sjgant80-hub/ACGPHONE), [ACGBM](https://github.com/sjgant80-hub/ACGBM), [ACGNET](https://github.com/sjgant80-hub/ACGNET) | Guild ops tools |

## Meta

| Fork | Role |
|---|---|
| [teslasolar](https://github.com/sjgant80-hub/teslasolar) | Thomas's about · "Insane ideas, shipped weekly" |
| [aicraftspeopleguild.github.io](https://github.com/sjgant80-hub/aicraftspeopleguild.github.io) | Guild's Pages site |
| [klaude-kode](https://github.com/sjgant80-hub/klaude-kode) | potato tomato · humor |

## GoldenShower · Simon-flagged epic (already in estate)

The template. Study `index.html` — literally `═══ KOTOBA UDT MODULES ═══` with 6 kanji-named UDT modules (唱 chat · 聴繋 player · 入 input · 群 network · 波衝弾 combat · 景幀目 renderer) and orchestrator 和 (harmony). Any future Konomi-native multiplayer/social/game app forks this pattern.

## Related memory

- [[project_thomas_estate_forks]] · full inventory
- [[project_konomi_substrate_zero]] · why Thomas = Substrate 0
- [[project_seed_v21_1_canonical]] · v21.1 references many of these
- [[reference_thomas_substrate_docs]] · fundamentals-mj + lightbringer.html

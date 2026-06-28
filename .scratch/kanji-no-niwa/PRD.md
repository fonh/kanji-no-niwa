# PRD — 漢字の庭 (Kanji no Niwa)

Status: ready-for-agent

---

## Problem Statement

Learning the 2136 Jōyō kanji is one of the most demanding milestones in Japanese acquisition. Existing tools (Anki, WaniKani) present kanji as isolated facts — flashcard in, flashcard out — with no sense of narrative, no visual world to inhabit, and no feeling of progression that carries you from session to session. The learner is left staring at a white screen with a number that barely moves.

The user is an intermediate Japanese learner who wants to complete the Jōyō kanji while understanding them deeply (etymology, visual logic, connected vocabulary), not just recognizing them in isolation. They want to feel like they are on an adventure — not filling in a spreadsheet.

---

## Solution

漢字の庭 (Kanji no Niwa, "The Kanji Garden") is a gamified kanji learning PWA built around the visual and emotional language of Pokémon HeartGold/SoulSilver. The **map of Johto is the primary interface**: you navigate it, encounter trainers, enter buildings, and move through the world. Every review card due today is a trainer standing on a route with an exclamation mark above their head. Every arène is a real building in a city, with guards you must beat before facing the Leader. Every NPC speaks Japanese to you — and gets harder to understand the deeper into Johto you go.

The game rests on five pillars. **The Map** is the home screen and navigation surface: you move through Johto in real time, and the world reacts to your learning. **SRS reviews** are the daily engine — every due card is a trainer encounter triggered automatically as you walk past. **The 道場/Arène system** structures long-term progression: gyms in each city gate access to the next zone; 師範 trials (試練) are the boss battles that earn you seals. **Sensei Fukuda** is a persistent companion whose letters and reactions accumulate over time, forming a deepening relationship. **Narration** threads through everything: Team Rocket (9 events), the Rival (6 appearances), the Kimono Girls (5 encounters), and scripted puzzle obstacles make the world feel inhabited, not procedural.

Grammar is a first-class citizen alongside kanji. 828 JLPT grammar points (N5→N1) — sourced from Hanabira.org under Creative Commons — are woven throughout: as a question mode in HP battles, as calibration for NPC dialogue and missions, and as grammar notes appended to kanji lessons. A learner progressing through the map is progressing through Japanese grammar in parallel, without a separate grammar curriculum.

Progression has two speeds: **trainer rank** advances as kanji are *studied* (entered into SRS through a lesson); **mastery** (FSRS stability ≥ 30 days) is a deeper, slower milestone used for text unlock, CS-Kanji powers, and achievements. As kanji are mastered, 7836 JLPT vocabulary words unlock automatically.

---

## User Stories

### Authentication & Setup

1. As a new user, I want to sign in with my Google account in one click, so that I never have to manage a password.
2. As a returning user, I want my session to persist on both my Mac and iPhone automatically, so that I can switch devices without logging in again.
3. As a new user, I want to choose a trainer name during onboarding, so that the app addresses me personally.
4. As a new user, I want an onboarding sequence narrated by Sensei Fukuda — who presents my first lesson batch of 10 kanji beginning with 一 ("the beginning of everything"), walks me through each one with etymology and mnemonic, then runs me through the end-of-lesson quiz covering all 10, and gifts me my first Streak Shield — so that my very first session has a story, real content, and a safety net. After the quiz, 10 trainers are standing on Route 29 ready to fight: the map is never empty on day one.
5. As a new user, I want the onboarding to end by placing my avatar on the map at New Bark Town, so that the moment I enter the world of kanji is also the moment I enter Johto.

---

### La Carte de Johto — Interface Principale (/map)

6. As a learner, I want the map to be my home screen when I open the app, so that I never feel like I'm using a study tool — I feel like I'm playing a game.
7. As a learner, I want to see my trainer avatar placed at my current position on the map, so that I always know where I am in the journey.
8. As a learner, I want the map to show trainers standing on routes ahead of me — the ones with "!" above their heads are the SRS cards due today — so that I can see at a glance what work awaits me on the road.
9. As a learner, I want a persistent HUD overlay at the bottom of the map showing: my trainer sprite and rank name, the EXP bar toward next rank, and the count of trainers with "!" currently on my routes, so that I have the key information without leaving the map.
10. As a learner, I want each city on the map to show a Pokémon Center building I can tap to enter, so that I can access my SRS queue directly from any city.
11. As a learner, I want each city with a 師範 to show a Gym building I can tap to enter, so that the combat challenges are geographically anchored.
12. As a learner, I want to tap any zone I have unlocked to pan the map to that zone, so that navigation across a large map is fast.
13. As a learner, I want zones I've completed at least one lesson in to appear fully coloured, and zones with no lessons to appear greyed out, so that the map is a visual record of where my learning has taken me.
14. As a learner, I want special buildings to appear on the map as I progress — the Pokéathlon Dome near the National Park, Kurt's house in Azalea, the SS Aqua at the Olivine docks — so that the map rewards exploration.
15. As a learner, I want a navigation bar at the bottom with five tabs: **地図** (Map — home), **図書館** (Library — lessons), **図鑑** (Explorer — kanji grid), **先生** (Sensei Fukuda), **自分** (Profile — stats, achievements, photos) — so that every section of the app is one tap away without leaving the map context.

---

### Open World — Règles de Base

La carte est accessible en intégralité dès le début. Il n'y a pas de mur invisible entre les zones. Un joueur peut marcher jusqu'à Mt. Silver dès le jour 1 — il n'y aura simplement rien à faire là-bas (pas de leçons, pas de trainers avec "!", aucun gym ouvert). Ce qui retient naturellement le joueur dans sa zone, c'est l'activité elle-même : les "!" trainers sont où sont tes kanji.

Les seules portes physiques fermées sont : les portes des Gyms (jusqu'à ce que les conditions soient remplies) et la porte du Plateau Indigo (jusqu'aux 8 印). Tout le reste est traversable librement.

---

### Navigation & Mouvement — Le Système "!"

16. As a learner, I want to navigate the map by tapping a zone or a building, and my avatar moves there instantly, so that movement is fast and intentional — not a chore.
17. As a learner, I want due review trainers ("!" trainers) to appear on my current zone and adjacent routes — never in zones behind me — so that I never have to backtrack to clear my queue. The FSRS schedule tells me WHEN to review; my current position on the map tells me WHERE the trainer appears.
18. As a learner, I want a trainer whose SRS cards are due to display a "!" above their head with a pulsing orange glow and a sharp sound, and to tap them directly to launch combat — so that I choose when to engage, and the encounter is immediate.
19. As a learner, I want trainers whose SRS cards are not due to sit or stand passively on the route without any special marker, so that the map is visually calm on rest days and clearly marked on review days.
22. As a learner, I want to see at most ⚙8 "!" trainers on the map at once — additional due cards are queued and appear as trainers defeat each other trainer clears — so that a large review backlog never makes the map visually overwhelming.
23. As a learner, I want to access a "Start Session" button from any Pokémon Center on the map that launches all due reviews in sequence (the old-style direct queue), so that I always have a fast mode available without navigating the map manually.

**Signal "Route Dégagée" — Fin de journée :**
24. As a learner, I want a clear "done for today" signal when all "!" trainers are beaten: the HUD "!" counter shows ✓ in green, the map music softens, and a small notification from Fukuda appears — "Route dégagée pour aujourd'hui." — so that I always know when I'm done without wondering if a trainer is hiding somewhere.
24b. As a learner, I want a **"Passer au lendemain"** button to appear once all today's "!" trainers are cleared — it loads tomorrow's due cards as new "!" trainers on my current routes, letting me review ahead if I have time and motivation, so that a productive day never hits a hard wall.

**Indicateur de Prochaine Étape :**
25. As a learner, I want a pulsing ◆ marker on the map pointing to my recommended next action when the situation is non-obvious — so that returning after 2 days I always know where to go:
- No "!" trainers AND lessons available → marker on the Library tab
- 門弟 beaten but 師範 door not yet open → marker on the gym door with condition summary
- A Rocket event blocking a route → marker on the Rocket event
- The marker disappears when "!" trainers are present — the trainers are the obvious next step

**Tutoriel de Marche avec Fukuda :**
26. As a new learner, I want Fukuda to walk alongside my avatar for my first 3 moves on Route 29 — dialogue bubbles appearing mid-walk — so that the "!" mechanic is demonstrated in-world before I encounter it: "Ce dresseur — tu vois le ! au-dessus de lui ? Ce sont les kanji de ta leçon qui veulent se battre. Approche-le."

**Trainers et position courante :**
27. As a learner, I want due review trainers to always appear on or near my current zone — not in zones I left weeks ago — so that clearing my review queue never requires backtracking. The FSRS schedule is time-based; the map placement is always relative to where I am now. A trainer for 火 (studied on Route 29) appears in front of me at Ecruteak if that's where I am today.

---

### PNJ Porteurs — Quêtes en Japonais Progressif

28. As a learner, I want NPCs scattered across the map to address me in Japanese when I tap them, so that the world itself becomes a reading exercise.
29. As a learner, I want the Japanese spoken by NPCs to use only kanji I have already studied, plus at most 1–2 unfamiliar words presented in context, so that the difficulty is always within reach rather than a wall.
30. As a learner, I want NPC speech difficulty to scale with the zone I'm in — Route 29 NPCs use basic N5 hiragana and simple kanji; Dragon's Den NPCs speak N1 compound sentences — so that advancing on the map also means reading harder Japanese.
31. As a learner, I want tapping an unknown kanji in an NPC's dialogue to open an inline popover showing its meaning and reading, so that I can understand without leaving the conversation.
32. As a learner, I want NPC quests to involve movement on the map — "go to X, come back with Y", "find the inscription on that building and tell me what it says" — so that reading Japanese is connected to exploration, not just sitting still.
33. As a learner, I want completing an NPC quest to reward me with a concrete item — a hint token, a map object (Apricorn, rare item), a Fukuda letter, a shortcut on the map — so that reading Japanese has a tangible payoff.
34. As a learner, I want an active quest to show a ◎ marker on the map at the target location — so that if I close the app and return the next day, I immediately see where I was going without re-reading the NPC dialogue.

NPC dialogue is calibrated along two axes: **kanji** (only studied kanji + 2 unknowns) and **grammar** (grammar points from the zone's JLPT tier, drawn from Hanabira formation patterns). Route 29 NPCs use N5 structures (～があります、～をください); Dragon's Den NPCs use N1 structures (～だけに、～ものだ). The `min_grammar_level` field in the NPC definition maps to JLPT level in the grammar table. The AI batch generation step for NPC dialogue receives the Hanabira `formation` pattern for the zone's tier as a hard constraint — the generated Japanese must match the pattern syntactically, not merely approximate the difficulty.

Sample NPC quest register by zone:

| Zone | Level | Grammar structure used | NPC says (Japanese) | Quest | Reward |
|---|---|---|---|---|---|
| Route 29 | N5 | ～があります | 「あの木に ひらがな が書いてあります。読んでください。」 | Read the sign on the next tile | Hint token |
| Violet City | N5/N4 | ～をとってきてください | 「山の上に赤い石があります。とってきてください！」 | Tap the marked tile in the adjacent mountain zone | Apricorn (赤) |
| Goldenrod | N4 | ～てもらえますか | 「この手紙を郵便局に持って行ってもらえますか？」 | Walk to the Post Office building | Bonus lesson unlock |
| Ecruteak | N3 | ～てほしいのですが | 「古いお寺で、この漢字の意味を調べてきてほしいのですが。」 | Go to Tour Jo, tap the inscription | Fukuda letter |
| Mahogany | N2 | ～た先に | 「氷の道を越えた先に、昔の文書が隠されています。内容を教えてください。」 | Enter Ice Path, read the hidden scroll | CS-Kanji item |
| Dragon's Den | N1 | ～だけに | 「竜の巣穴の奥に碑文がある。その一節を正確に翻訳できる者だけに、秘密を教えよう。」 | Translate a 4-line inscription | Dragon's Den lore entry |

---

### Trainer Progression

35. As a learner, I want my trainer avatar to change as I study more kanji (as kanji enter SRS through lessons), so that I earn a new rank every few days rather than waiting weeks.
36. As a learner, I want to see my current trainer rank name and the next milestone (in kanji studied) in the HUD EXP bar, so that I know exactly what I'm working toward.
37. As a learner, I want a full-screen animation to play when I reach a new trainer rank, so that levelling up feels like a genuine event.
38. As a learner, I want the trainer rank progression to span 25 levels from anonymous NPC to Red, so that I change avatar frequently enough to stay motivated.

The 25 trainer ranks:

| Level | Kanji studied | Character | Rank |
|-------|--------------|-----------|------|
| 1 | 0–50 | Gamin | NPC |
| 2 | 50–100 | Fillette | NPC |
| 3 | 100–150 | Attrapeur | Beginner Trainer |
| 4 | 150–200 | Randonneur | Beginner Trainer |
| 5 | 200–250 | Pêcheur | Beginner Trainer |
| 6 | 250–300 | Campeur | Intermediate Trainer |
| 7 | 300–370 | Marin | Intermediate Trainer |
| 8 | 370–450 | Jongleur | Intermediate Trainer |
| 9 | 450–550 | Sage | Advanced Trainer |
| 10 | 550–650 | Silver (Rival) | Rival — rank advances by kanji count. Silver combat fires as a story event during this level. |
| 11 | 650–750 | Falkner | 師範 — Flying |
| 12 | 750–850 | Bugsy | 師範 — Bug |
| 13 | 850–950 | Whitney | 師範 — Normal |
| 14 | 950–1050 | Morty | 師範 — Ghost |
| 15 | 1050–1150 | Chuck | 師範 — Fighting |
| 16 | 1150–1250 | Jasmine | 師範 — Steel |
| 17 | 1250–1350 | Pryce | 師範 — Ice |
| 18 | 1350–1500 | Clair | 師範 — Dragon |
| 19 | 1500–1650 | Will | Elite Four — Psychic |
| 20 | 1650–1800 | Koga | Elite Four — Poison |
| 21 | 1800–1900 | Bruno | Elite Four — Fighting |
| 22 | 1900–2000 | Karen | Elite Four — Dark |
| 23 | 2000–2100 | Lance | Champion of Johto |
| 24 | 2100–2135 | Professor Elm | Pokémon Master |
| 25 | 2136 | Red | Legend |

---

### Leçons (/library)

39. As a learner, I want new kanji to be introduced through dedicated lessons before they enter my review queue, so that I understand a kanji's meaning, components, etymology, and mnemonic before being tested on it.
40. As a learner, I want each lesson to cover a small group of kanji (5–10) in a narrative, teacher-style format narrated by Fukuda, placing me in a specific zone of Johto, so that learning feels like being taught rather than reading a datasheet.
41. As a learner, I want to access my next available lesson from the Library tab at any time, so that studying new kanji is never more than one tap away.
42. As a learner, I want to configure how many new kanji I receive in lessons per day (default 10), so that I control my learning pace.
43. As a learner, I want kanji I have completed a lesson on to enter my SRS review queue immediately, appearing as new trainers on the map routes associated with that lesson's zone, so that the connection between studying and the map is immediate and visible.
44. As a learner, I want each lesson to end with a short quiz — 1 to 2 questions per kanji covered, using the battle UI — so that I commit the kanji to memory before they enter the SRS.
45. As a learner, I want Sensei Fukuda's narrative voice to thread through every lesson as a continuous story — each batch of kanji corresponds to a zone of Johto that my trainer passes through — so that lessons feel like chapters in a journey.
46. As a learner, I want all completed lessons to be saved and browsable in the Library (/library) — displayed as a shelf of scrolls, completed scrolls open, upcoming ones sealed with a ribbon — so that I can re-read any lesson at any time.
47. As a learner, I want the lesson reading UI to combine a washi paper texture background, Fukuda's sprite on the right side, brush-stroke typography for kanji, and ink-line section dividers.
48. As a learner, I want a red hanko stamp animation when I complete a lesson — the seal pressing down with an ink sound — so that each completed lesson feels officially certified.
49. As a learner, I want to be able to export a lesson as a PDF or Markdown file, so that I can read it on paper or in a separate reading app.
50. As a learner, I want a button to queue a specific kanji for my next lesson directly from its kanji card, with a clear message if component prerequisites are not yet met, so that I have a concrete path forward rather than a blank refusal.

---

### Combats — Système HP et Modes de Questions

All boss battles (Rival, Team Rocket Executives, Kimono Girls, Gym Leaders / 試練, Elite Four, Lance, Red) use the **HP battle system** — distinct from the SRS review screen. Results do not affect FSRS card state.

**The HP battle screen:**
- Two health bars: mine (top-right, coloured by trainer rank) and the opponent's (top-left, coloured by their theme).
- My HP = number of mastered kanji in the battle's thematic pool (higher mastery = more HP — veteran knowledge is resilience).
- Opponent HP = fixed per battle type, depleted by correct answers.
- Wrong answer → I lose HP. Correct answer → opponent loses HP.
- My HP reaches 0 → defeat. Retry immediately — no cooldown.

**The 7 question modes** — mixed randomly within each battle:

| Mode | Prompt | Answer | Tests |
|---|---|---|---|
| **Frappe Signification** | Kanji displayed large | 4 meaning choices | Reading recognition |
| **Frappe Lecture** | Kanji displayed large | 4 hiragana reading choices | Phonetic recognition |
| **Traduction de Phrase** | A Japanese sentence — formal/neutral register drawn from Tatoeba JP↔EN pairs (primary source); spoken/informal register drawn from JESC filtered corpus (secondary, for Silver battles and Rocket Executive battles exclusively). Calibrated to the battle's JLPT tier by kanji coverage and sentence length. | 4 meaning choices | Reading in context |
| **Invocation de Kanji** | English meaning shown | A grid of hiragana tiles (correct reading's kana + distractors, all shuffled) — tap tiles in order to compose the correct reading. Wrong tile = flash red, no HP loss until submit. | Active reading production |
| **Assemblage de Mot** | 4 kanji tiles shown | Drag to combine into a valid word before timer | Compound formation |
| **Kanji Fantôme** | Kanji shown with 30–50% of strokes hidden | 4 kanji choices | Visual memorisation |
| **Frappe Grammaire** | Japanese sentence with one grammar slot blanked out (e.g. 「毎日日本語を＿＿います」) — sentence taken directly from Hanabira grammar corpus example sentences | 4 grammar form choices | Grammar in context |

**Frappe Grammaire** draws directly from the Hanabira grammar corpus (828 points N5→N1, 4 examples each = 3,310 pre-made JP+EN sentences). `getGrammarForBattle` selects a random grammar point from the battle's JLPT tier, takes one of its example sentences (`grammar[n].examples[k].jp`), replaces the grammar structure with a blank, and provides: the correct form + 3 distractors drawn from other same-tier grammar points. A 試練 Falkner draws from N5/N4 (260 points × 4 = 1,040 available questions); Red draws from N1 (245 points × 4 = 980). Each battle replay draws a fresh question set — the pool is large enough that no two replays feel identical.

**Critical Hit:** answering within 3 seconds of a question appearing → "Critical Hit!" flash, double HP damage to opponent.

**Combo:** 3+ consecutive correct answers → Combo counter appears. Combo multiplier applies to HP damage.

**Scoring** ⚙: `score = (accuracy²) × time_multiplier × combo_multiplier`. Squaring accuracy makes the difference between 85% and 95% far more significant than saving 30 seconds. `getBattleRank(score, battleConfig)` returns 初伝/中伝/奥伝/皆伝.

**Reward on defeat:** a narrative response is always triggered even on loss — the opponent says something specific about the battle, and Fukuda responds. Defeat never locks narrative content.

---

### Dresseurs de Route — Reviews comme Rencontres

51. As a learner, I want each SRS card due today to materialise as a trainer on the map route corresponding to that card's kanji zone (derived from the lesson's `johto_zone`), so that my review workload is geographically distributed across Johto.
52. As a learner, I want defeating a route trainer (completing a review with Good or Easy) to make them sit down and the path to open further, so that progress on the map and progress in reviews are the same thing.
53. As a learner, I want hitting "Again" on a review to send the trainer back to a standing position, facing away for the duration set by FSRS, and returning with "!" when the card is due again, so that I always know which trainers I haven't truly beaten yet.
54. As a learner, I want the "Kanji escaped!" animation — the kanji breaking free like a Pokémon from a Poké Ball — to play on "Again" so that failure stays in the metaphor without feeling like a punishment.
55. As a learner, I want a **Critical Hit** visual effect when I reveal an answer within 3 seconds, so that quick recall is celebrated.
56. As a learner, I want a **Combo** counter when I beat 3 trainers in a row correctly, escalating at 5, 10, and 15, so that accuracy streaks feel like momentum building.
**Trainers Spéciaux — Rencontres Alternatives :**
56b. As a learner, I want every 5th trainer slot on a route to be a **trainer spécial** — a different sprite with a "?" marker instead of "!" — that triggers an alternative interaction instead of a standard SRS review, so that a long review session never becomes a pure click-repeat loop.

The four types of special encounter, selected randomly per slot:
- **Texte à trous** (30%): A Hanabira grammar example sentence with the grammar structure blanked out. 4 choices. No FSRS rating — just a grammar moment.
- **Mini-quête express** (25%): An NPC on the current route speaks one line of Japanese and gives a one-step task (tap a marked tile, read a sign, confirm a meaning). Reward: Pokéathlon point or Apricorn.
- **Lecture express** (25%): 3 sentences from the corpus (Tatoeba or JESC register-matched to the zone). Tap the correct overall meaning from 4 choices. No FSRS rating.
- **Flash Pokéathlon** (20%): A 20-second Reading Blitz (kanji → meaning, as fast as possible). Score goes toward the Pokéathlon shop.

Special trainers do not affect FSRS card state. They exist purely to break monotony and practice adjacent skills. They disappear once interacted with, like normal trainers.

57. As a learner, I want a **0.2% chance per card** of a **Shiny Encounter** — a trainer with golden shimmer and a special sound, at most one per session — that if beaten correctly earns a permanent Shiny badge on that kanji's Explorer tile.
57b. As a learner, I want a **"Kanji dans la vraie vie"** moment the first time any kanji card crosses mastery threshold (FSRS stability ≥ 30 days for both meaning and reading cards): a randomly selected Tatoeba sentence containing that kanji appears on the review reveal screen — below the kanji's etymology and mnemonic — with its English translation, framed as *"Ce kanji vit dans cette phrase."* It stays visible until I tap one of the FSRS rating buttons (Again / Hard / Good / Easy), so I can read at my own pace. No timer, no dismissal — I move on when I'm ready.
58. As a learner, I want a session summary screen after clearing all "!" trainers from my current zone, showing: accuracy, trainers beaten, EXP gained, closest upcoming word unlock, text progress for my closest locked story, and any achievements earned this session.
59. As a learner, I want the summary to include a Sensei Fukuda tip about one of the kanji I just reviewed, so that each session adds a small piece of knowledge beyond the test.

**Pokégear — Trainer Phone Calls:**
60. As a learner, I want beaten route trainers to occasionally give me their "Pokégear number" after the fight, so that we stay in contact.
61. As a learner, I want trainers who have my number to call me — via push notification — on the day FSRS schedules their card's next review, saying something like "Mes 火 kanji sont prêts. Tu viens ?" so that the notification is diegetically grounded in the world.
62. As a learner, I want tapping a trainer's notification to place my avatar next to that trainer on the map, so that the path from notification to battle is one tap.

---

### Team Rocket — Arc Narratif Complet

Team Rocket in 漢字の庭 are a faction that believes kanji knowledge is power — and power must be controlled. They appear 9 times across the map, each event blocking a path or corrupting a zone until you resolve it. They are defeated not by grinding SRS but by completing HP battle challenges with specifically themed kanji.

Team Rocket's philosophy (voiced by Archer in the Radio Tower): "Les kanji sont une arme. Qui les comprend, commande les autres. Nous ne voulons pas que tu les apprennes."

Fukuda's counter, only spoken once, at the Radio Tower: "Il y a des gens qui pensent que la connaissance doit appartenir à ceux qui ont le pouvoir. C'est exactement pour ça que j'enseigne."

**The 9 Rocket Events:**

| # | Zone | Event name | What they're doing | Kanji theme | Gate |
|---|---|---|---|---|---|
| 1 | Route 32 | **Éclaireurs** | Intercepting travellers, confiscating lesson notes | N5 basics | Blocks passage to Ruins of Alph until beaten |
| 2 | Ruines Arcaniques | **Pillage des Inscriptions** | Trying to decipher (and steal) Unown inscriptions | 文、字、古、記、史 | Optional; reward: lore entry on ancient script |
| 3 | Puits Ramoloss | **Proton — Opération Ramoloss** (Executive) | Exploiting Slowpoke for "linguistic energy" | 捕、縛、操、支、制 | Blocks access to Bugsy's Gym until cleared |
| 4 | Tour Embrasée | **Traque des Bêtes Sacrées** | Hunting Entei, Raikou, Suicune to weaponise them | 炎、雷、洪、猛、霊 | Optional; reward: Fukuda letter on sacred kanji |
| 5 | Acajou / Lac Colère | **Ariana — Repaire de Mékanos** (Executive) | Broadcasting frequencies to mutate Gyarados; metaphor for distorting language to control people | 欺、偽、惑、騙、詐 | Blocks access to Pryce's Gym until cleared |
| 6 | Dorado — Tour Radio | **Petrel + Archer — Prise de contrôle** (2 Executives + Archer final) | Broadcasting the "Return of Giovanni" signal; trying to summon their leader using radio waves | 権、力、命、令、報 | Blocks national radio; clears after 5-floor gauntlet |
| 7 | Chemin Glacé | **Retardataires** | Grunts who never got the disbanding memo; still operating alone in the cold | 孤、寒、凍、迷、忘 | Optional; reward: lore entry |
| 8 | Antre du Dragon | **L'Émissaire** | One Rocket delivers a letter from Giovanni before vanishing | No combat — translation quiz: decode the letter in Japanese | Optional; reward: Dragon's Den lore, narrative beat |
| 9 | Mont Gris — Sommet | **Le Grunt Solitaire** | A single grunt still waiting for Giovanni at the summit. He has never learned Team Rocket disbanded. | No combat — dialogue in N2 Japanese: you must tell him "チームロケットは解散しました" and he understands | Triggered just before Red; most melancholy Rocket beat |

---

### Rival Silver

Silver appears 6 times on the map as a scripted encounter. All Silver battles use the HP battle system with the 6 question modes — not SRS. Silver's "team" is always a fixed pool of 6 kanji chosen to represent his philosophy or emotional state at that moment in the story.

**Silver's 6 appearances:**

| # | Location | Trigger | His 6 kanji | Emotional beat |
|---|---|---|---|---|
| 1 | Azalea Town — devant le Puits Ramoloss | After Proton event | 怒、争、力、敵、速、逃 | Dismissive; he's here for power, not kanji |
| 2 | Ecruteak City — devant la Tour Jo | studied ≥ 550 | 影、闇、忘、去、断、孤 | He reveals he knows Fukuda; does not know about Red |
| 3 | Mahogany Town — après le Repaire | After Ariana event | 強、越、越、勝、誇、鋼 | He's been watching you; still convinced he was right to leave |
| 4 | Plateau Indigo — Antichambre | Antichambre cleared | 変、知、疑、惜、寂、遅 | First crack in his certainty; something has shifted |
| 5 | Route 28 — avant Mt. Silver | studied ≥ 2000 | 悔、認、謝、恥、赦、和 | He admits, without words, that he was wrong; does not sign his name |
| 6 | Mont Gris — Versants | Optional — after beating Red | 静、空、終、別、礼、別 | He has climbed to see for himself. Says nothing. Nods. Leaves. |

Silver battle defeat/win outcomes: each has distinct dialogue. Losing to Silver early = he mocks you. Losing to Silver late = he says something quieter. He is always the same person, but the kanji change.

---

### Kimono Girls — Arc en 5 Actes

Five Kimono Girls are dispersed across five cities. Each represents a dimension of the Japanese language. Beating all five triggers a collective event. Each battle uses the HP system.

| # | City | Girl | Language dimension | Her 6 kanji | Reward |
|---|---|---|---|---|---|
| 1 | Bourg-en-Vol | Zuki | Meaning (意味) | 意、味、感、知、思、解 | Lesson bonus: polysemy |
| 2 | Dorado | Naomi | Reading (読み) | 音、訓、読、声、言、語 | Lesson bonus: on/kun distinction |
| 3 | Ecorosa | Kuni | Etymology (語源) | 古、源、形、象、原、文 | Lesson bonus: pictographic origins |
| 4 | Amaris | Sayo | Composition (構成) | 組、合、成、部、品、構 | Lesson bonus: compound logic |
| 5 | Orsay | Meri | Context (文脈) | 場、状、況、用、脈、流 | Lesson bonus: register and tone |

After beating all 5 Kimono Girls, they appear together at Tour Jo (Ecorosa) in a collective scene — the only time in the game all five NPCs share a screen. Fukuda sends a message: "Il y a des choses que j'aurais dû t'apprendre plus tôt. Elles me l'ont rappelé."

This event unlocks access to the Lugia / Ho-Oh equivalent: a legendary lesson on the 5 kanji 空、海、光、夢、命 — the "five elements of meaning" — not added to SRS, existing only as a reading experience.

---

### Session de Review (/study — Mode Direct)

63. As a learner, I want access to a "Start Session" button from any Pokémon Center on the map that launches all due reviews in a single uninterrupted queue, so that I can clear my backlog quickly without navigating zone by zone.
64. As a learner, I want each card in the review screen to show the prompt (kanji or word) in "opposing Pokémon" position, my trainer avatar in the corner, and the question in a dialogue-box — so that the review screen stays in the world's visual language even in direct mode.
65. As a learner, I want a single "Reveal" button, then 4 FSRS rating buttons (Again / Hard / Good / Easy), so that I actively recall before self-evaluating.
66. As a learner, I want the reveal screen for kanji cards to show the correct answer, etymology summary, and mnemonic, so that each review reinforces the story behind the character.
67. As a learner, I want word cards to reveal the full reading, meaning, compound story, and one example sentence, so that each word review connects the word to the kanji I already know.
68. As a learner, I want new word cards capped at twice my daily kanji lesson limit (default 20/day), so that mastering several kanji at once does not flood my queue.
69. As a learner, I want hitting "Again" on a previously mastered card to immediately remove it from the mastered count, so that my stats always reflect what I can actually recall right now.
70. As a learner, I want review sessions to play ambient HGSS battle music appropriate to my current trainer rank.
71. As a learner, I want a progress bar showing how far through my session I am.
72. As a learner, I want a session summary at the end showing accuracy, cards reviewed, new cards entered, EXP gained, and any achievements earned.

---

### Carte Kanji (/kanji/[id])

73. As a learner, I want to see the kanji displayed large with its most common meaning and all on/kun readings.
74. As a learner, I want to read a rich etymology section explaining the kanji's pictographic origins and component meanings.
75. As a learner, I want to read a narrative mnemonic written in the style of an enthusiastic teacher.
76. As a learner, I want to see 6–8 common words containing this kanji, each with reading and meaning.
77. As a learner, I want each kanji within a word to be a clickable link to its own card.
78. As a learner, I want kanji I haven't yet had a lesson on to appear greyed out but still clickable.
79. As a learner, I want each word to show whether it is in my SRS queue, due for review, or not yet unlocked.
80. As a learner, I want to expand each word to see 3 example sentences at different registers.
81. As a learner, I want each example sentence in Japanese by default, with a button to reveal the hiragana reading.
82. As a learner, I want to see the visual components of the kanji listed and linked.
83. As a learner, I want to see the kanji's JLPT level and school grade.
84. As a learner, I want a button to queue this kanji for my next lesson batch directly from the card, with a clear message if component prerequisites are missing.

---

### Carte Mot (/word/[id])

85. As a learner, I want to see the word in kanji and kana, its part of speech, its English meaning, and its pitch accent pattern where available — displayed as a contour indicator (高低 pattern, e.g. LH・HLL) — so that I learn correct prosody alongside meaning.
86. As a learner, I want a compound story — a 1–2 sentence narrative explaining how the component kanji meanings combine.
87. As a learner, I want each kanji in the word to be a clickable link.
88. As a learner, I want to see the word's JLPT level and SRS status.
89. As a learner, I want to see 3 example sentences with register variety.
90. As a learner, I want to see which kanji I still need to master before this word unlocks for SRS study.

---

### Explorateur (/explorer)

91. As a learner, I want to see all 2136 Jōyō kanji in a grid.
92. As a learner, I want to filter the grid by JLPT level.
93. As a learner, I want each kanji visually coded by: **Unseen** (no lesson yet), **Studied** (in SRS), **Mastered** (stability ≥ 30 days).
94. As a learner, I want to click any kanji to open its card.
95. As a learner, I want Shiny kanji to display with a permanent gold shimmer on their tile.

---

### Textes Débloquables (/texts)

96. As a learner, I want a library of Japanese texts showing title, difficulty, synopsis, first line (blurred if locked), and my unlock percentage.
97. As a learner, I want AI-generated texts to unlock at 80% mastery of their kanji set, and Aozora Bunko texts at 95% mastery.
98. As a learner, I want to read an unlocked text in Japanese with a full translation available.
99. As a learner, I want 4-choice comprehension questions after each text.
100. As a learner, I want tapping any kanji in a text to open an inline popover — meaning, reading, SRS status — with a "Voir la carte" button.
101. As a learner, I want the popover to work for every kanji in the text, whether I've studied it or not.
102. As a learner, I want a post-reading word panel after comprehension questions, grouping every word by SRS status.
103. As a learner, I want each text to show a re-read count.
104. As a learner, I want a mode sans-filet toggle that hides the English translation.

---

### Activités Géographiques

These activities are accessed by tapping specific buildings or landmarks on the map. They are optional but connected to 道場 unlock conditions, achievements, or narrative events.

#### Pokéathlon Dome (Parc National zone)

105. As a learner, I want to tap the Pokéathlon Dome building on the map to access the mini-game hub, accessible once I've passed Whitney's Gym.
106. As a learner, I want four mini-game disciplines available: **Reading Blitz** (60s, tap the correct meaning for kanji that flash one at a time), **Word Forge** (3 min, drag kanji to form valid compounds), **Kanji Sprint** (60s, link 10 kanji to their correct radical before time runs out), and **Chasse au Trésor** (20 attempts in a random pool from my studied set — I try to "capture" the rarest kanji I know; score = JLPT rarity × response speed) — so that different skills are tested in different games.
107. As a learner, I want points earned in any Pokéathlon game to accumulate toward prizes in the Athlete Shop, with the prize catalogue rotating daily.

Sample Athlete Shop rotation:

| Day | Prize | Effect |
|---|---|---|
| Monday | Élixir de Mémoire | +5 days stability on one chosen card |
| Tuesday | Indice Étymologique | Reveals the full etymology of one unseen kanji |
| Wednesday | Pierre Lune | Unlocks a bonus lesson (reading-only, no SRS) |
| Thursday | Boost de Lecture | Next text unlock threshold reduced by 5% |
| Friday | Jeton Shiny | Doubles Shiny chance for next 10 reviews |
| Weekend | Apricorn Dorée | Kurt's most powerful ball type |

#### Kurt & Apricorns (Azalea Town)

108. As a learner, I want Apricorns to appear as collectible items on map tiles throughout Johto — one colour per tree, respawning every 24 hours.
109. As a learner, I want to bring Apricorns to Kurt's house in Azalea Town, where he crafts them into special items that affect SRS behaviour.

Apricorn combinations:

| Apricorns | Result | Effect |
|---|---|---|
| 3× 赤 (Rouge) | Boule de Rappel | Due date brought forward 1 day on a chosen card |
| 3× bleue | Boule de Gel | Stability frozen (no decay) for 7 days on one card |
| 赤 + 黄 + 黒 | Boule de Maître | Doubles combo multiplier in next battle |
| 2× vert + blanc | Boule d'Ami | Mnemonic hint auto-displayed on next review of a chosen card |
| 赤 + 黒 + 黄 + 白 + bleu | Boule Ultra | Next 試練: +10% accuracy bonus |

#### CS-Kanji — Zones Cachées

110. As a learner, I want certain mastered kanji to grant me permanent movement abilities on the map — CS-Kanji — that unlock new geography as a direct consequence of what I've learned.

| CS-Kanji | Mastered | Unlocks |
|---|---|---|
| 飛 (voler) | mastered | Fast travel: tap any previously visited city to warp there instantly |
| 水 (eau) | mastered | Opens sea routes (Route 40/41) and river crossings |
| 力 (force) | mastered | Moves heavy boulders blocking passage on mountain routes |

The kanji theme matches the ability: mastering 水 teaches you about water, and opens water. This is not arbitrary — it is the game's most elegant mechanic.

#### Radio & Buena's Password

111. As a learner, I want a Radio Tower building visible on the map in Goldenrod City, accessible at any time, so that the Team Rocket takeover has a physical location to "take over."
112. As a learner, I want Professor Oak's daily broadcast to announce a "kanji swarm" — one zone has rare kanji encounters appearing more frequently today — so that the radio has a practical gameplay benefit.
113. As a learner, I want Buena's Password to fire as a push notification at 11:00 showing a kanji prompt. I answer directly in the notification or in an in-app overlay — no building visit required. A correct answer before 19:00 wins a Pokéathlon point bonus, so the daily quiz rewards attentiveness without adding navigation friction.

---

### Obstacles-Puzzles

114. As a learner, I want certain obstacles on the map to block my path until I use a specific CS-Kanji or complete a specific task, so that the world has puzzle-like moments beyond combat.

**Obstacle 1 — Sudowoodo (Route 36):**
A kanji tree-monster made of the character 木 stands in the road. It blocks passage to Ecruteak. Using the CS-Kanji 水 (mastered: water defeats the fake tree) clears the obstacle and triggers a short Fukuda message: "Ce qui ressemble à une force peut être une illusion. L'eau le sait."

**Obstacle 2 — Ronflex (Route 11 / Junction to Kanto):**
A sleeping kanji-giant made of the character 眠 (sleep) blocks the border path. The Pokéflûte channel on the radio (play it from the Radio Tower) emits the on-reading ミン — which is the "wake word". Recognising and inputting the reading from the radio broadcast triggers the kanji to step aside.

**Obstacle 3 — Porte de la Ligue fermée:**
The Indigo Plateau gate is physically locked by a stone slab bearing the character 閉 (closed). It only opens when all 8 印 are earned — at which point the stone slab animates: the character 閉 transitions to 開 (open) in a brush-stroke animation, and the gate swings open.

---

### Événements Jour/Nuit et Semaine

115. As a learner, I want the map's lighting to shift between morning, day, and night in real time, so that the visual atmosphere of Johto changes with the hour.
116. As a learner, I want specific events to occur only at specific times, so that the world feels like it has a rhythm independent of my schedule.

| Day/Time | Event |
|---|---|
| Every day 11:00 | Buena's Password notification — morning kanji prompt (answer in-app, no map visit required) |
| Every day 19:00 | "Route cleared" check — if all "!" trainers beaten, HUD shows ✓ and soft music change |
| Friday | Union Cave Lapras appears — a rare N2 kanji encounter (水、魚、深、眠、来) available for 24 hours |
| Daily (random) | Professor Oak swarm broadcast — one zone has rare kanji encounters today |

---

### Lac Colère — Rencontre Shiny Garantie

117. As a learner, I want to unlock the Lake of Rage zone (accessible after Mahogany Town) and find a single guaranteed Shiny encounter waiting there — a kanji with a red shimmer instead of gold, representing 怒 (rage/anger).
118. As a learner, I want the Lake of Rage Shiny battle to be a 6-question HP battle on the theme of intense emotion: 怒、激、憤、烈、猛、狂.
119. As a learner, I want winning the Lake of Rage battle to earn a permanent red-Shiny badge for 怒 and trigger a Fukuda message: "La colère est une énergie. En japonais, elle a une forme. Maintenant tu la connais."

---

### Achievements (/profile) et Photos Commémoratives

120. As a learner, I want a full-screen achievement animation to play when I unlock a new badge.
121. As a learner, I want all earned badges collected in my profile.
122. As a learner, I want achievements to cover:
    - Kanji studied milestones: 10, 50, 100, 500, 1000, 2136
    - Kanji mastered milestones: 1, 10, 50, 100, 500, 1000, 2136
    - Word mastered milestones: 10, 100, 500, 1000, 7836
    - Streak milestones: 3, 7, 30, 100, 150, 200, 250, 300, 365 days
    - Reading milestones: 1st text unlocked, 10 texts read, 50 texts read
    - Session precision: 100% accuracy on a session
    - Speed: session cleared in under 10 minutes
    - JLPT tier: all N5 mastered, all N4 mastered, all N3, N2, N1
    - Combat milestones: first 印 earned, all 8 印 earned, Antichambre cleared, Red defeated, Red at 皆伝
    - Shiny milestones: first Shiny earned, 10 Shinies, 50 Shinies
    - Team Rocket: all 9 events cleared
    - Kimono Girls: all 5 beaten; collective event triggered
    - Silver milestones: beaten Silver 3 times; beaten Silver all 6 times
    - CS-Kanji: all 3 mastered (飛、水、力)
    - Explorer: all 25 commemorative photos collected
    - Kurt: 10 Apricorn balls crafted
    - Pokéathlon: scored ⚙500+ in Reading Blitz; top score in Chasse au Trésor
    - PNJ: completed 10 NPC quests; completed the Dragon's Den N1 translation
    - 皆伝 milestones: first 皆伝; all 8 試練 at 皆伝; all Elite Four at 皆伝; Red at 皆伝

123. As a learner, I want 25 commemorative photo spots tied to genuinely memorable moments: each gym badge earned (8), each Silver encounter (6), Team Rocket Tour Radio cleared, Antichambre cleared, Kimono Girls collective event, first text unlocked, Red defeated, Red 皆伝, first Shiny, first 皆伝, first NPC quest completed — so that the gallery tells the story of the journey, not a checklist.
124. As a learner, I want each collected photo to appear in a gallery in my profile — a visual timeline of my journey, showing my trainer sprite and the significant NPC or landmark of that moment.
125. As a learner, I want my profile to show: trainer name, current rank, total study time, key stats summary, and the photo gallery.

---

### Sensei Fukuda — Compagnon Permanent (/sensei)

126. As a learner, I want a persistent Fukuda icon in the navigation bar, visible from every screen.
127. As a learner, I want a /sensei page — Fukuda's room — where all his messages, letters, teaching notes, and reactions accumulate chronologically.
128. As a learner, I want Fukuda to produce a new message after every major event: each rank transition, each 試練 cleared, Antichambre cleared, each text unlocked, each mastery milestone, each Daily Challenge completed, each mission submitted, each Team Rocket event cleared, each Kimono Girl beaten, and each NPC quest completed.
129. As a learner, I want Fukuda's tone to evolve over the journey: measured and instructional early; warmer and more personal in the mid-game; quietly proud and vulnerable near the end.
130. As a learner, I want Fukuda to send a message when I fail a 試練 multiple times — not to scold, but to name something specific about the kanji I'm struggling with.
131. As a learner, I want a count of Fukuda's messages displayed on the /sensei page, as a quiet secondary collection mechanic.

---

### Événements Dynamiques & Monde Vivant

#### Surprises en-route (pendant la navigation)

132. As a learner, I want a **0.2% chance per trainer encounter** of a Shiny trainer, at most once per session.
133. As a learner, I want the **Combo counter** to appear after 3 consecutive trainers beaten correctly, intensifying at 5, 10, 15.
134. As a learner, I want a **"Kanji escaped!"** animation on "Again" — the kanji breaks free and runs off screen.

#### Événements narratifs seuils (Dashboard → now on Map)

These one-time story events appear as modal overlays the first time I open the map after their trigger condition is met. Each fires exactly once, stored in `triggered_events`.

| Trigger | Event |
|---|---|
| studied ≥ 150 (rank 4) | Fukuda leaves a 3-question exercise — a handwritten note appears on the map at New Bark Town |
| studied ≥ 300 (rank 7) | Silver letter 2 — a letter appears at the nearest Pokémon Center |
| rank = 23 | Silver's final message — a letter at Mt. Silver base |
| All 9 Rocket events cleared | A telegram from Archer — text only, no combat; he disappears from the story |
| All 5 Kimono Girls beaten | Collective event at Tour Jo |

#### Rencontres aléatoires (sur la carte)

135. As a learner, I want a ⚙10% chance of a **Fukuda surprise quiz** appearing at New Bark Town when I open the map after completing all today's trainers — a 3-kanji quiz from my studied set, delivered as if he left me an exercise.
136. As a learner, I want a ⚙5% chance of a **Special Delivery** — a bonus themed reading lesson (food kanji, weather kanji, etc.) appearing at the Pokémon Center — available once per ⚙14 days.
137. As a learner, I want a **Welcome Back** moment when I return after 2+ days away — Fukuda appears on the map at my position and says: "Le jardin a un peu poussé sans toi. On le taille ensemble."

---

### Système 道場 — Les Arènes de Johto

The 道場 system is now physically embedded in the map. Each city with a 師範 has a Gym building. The gym interior has 門弟 guards followed by the 師範. All battles in gyms use the HP battle system with 6 question modes.

#### Structure d'une Arène

138. As a learner, I want to enter a Gym building by tapping it on the map, so that the gym is a physical location in the world.
139. As a learner, I want each Gym to contain 2 門弟 (dojo guards) I must beat before the 師範 door opens, so that earning the 試練 requires passing through intermediate challenges.
140. As a learner, I want each 門弟 battle to be a 10-question HP battle from the Gym's thematic pool, with a 5-minute timer, so that the guards are a real challenge but not a wall.
141. As a learner, I want the 師範's door to open only after both 門弟 are defeated AND the secondary conditions are met, so that grinding the gym alone is never enough.
142. As a learner, I want the **試練** — the 師範's trial — to be a 20-question HP battle from the intersection of the Gym's thematic pool and kanji I've already studied, with a 10-minute timer, so that I'm only tested on what I know.
143. As a learner, I want to be able to retry a failed 試練 immediately — the challenge comes from not having mastered enough kanji yet, not from waiting. If I lose, Fukuda names a specific kanji I struggled with and I go back to the map to study more.
144. As a learner, I want an **印 ceremony** when I beat a 師範 — their sprite appears full-screen, they deliver their signature line, and the 印 (seal) animates into my inventory — so that each milestone is a named story beat.
145. As a learner, I want the door to the next route to open on the map immediately after winning the 試練, so that my progression through Johto and my progression through the 道場 are the same thing.
146. As a learner, I want to replay any cleared battle from the Carnet de Combat (/battles), with each replay drawing a fresh kanji selection from the same pool, so that pursuing a higher 初伝/中伝/奥伝/皆伝 rank is always possible.

#### Multi-Condition Unlocks

147. As a learner, I want each Gym to require a **primary condition** (kanji studied threshold) plus secondary conditions from different activity types, so that I cannot unlock the next battle by grinding SRS alone.

| Combat | Primary | Secondary conditions |
|--------|---------|---------------------|
| Rival Silver (1st) | studied(550) | mastered(40) |
| 門弟 1 — Falkner | studied(670) | streak(14) |
| 門弟 2 — Falkner | studied(710) | pokeathlon_score(300) |
| 試練 Falkner | studied(750) + both 門弟 | mastered(80) + texts_read(1) |
| 門弟 1 — Bugsy | studied(780) | daily_challenges(5) |
| 門弟 2 — Bugsy | studied(820) | word_forge_score(200) |
| 試練 Bugsy | studied(850) + both 門弟 | mastered(120) + daily_challenges(10) |
| 試練 Whitney | studied(950) + both 門弟 | mastered(160) + npc_quests(3) |
| 試練 Morty | studied(1050) + both 門弟 | mastered(200) + texts_read(3) + rocket_events(5) |
| 試練 Chuck | studied(1150) + both 門弟 | mastered(250) + capture_contest_wins(1) |
| 試練 Jasmine | studied(1250) + both 門弟 | mastered(300) + kurt_balls(3) |
| 試練 Pryce | studied(1350) + both 門弟 | mastered(350) + streak(20) |
| 試練 Clair | studied(1500) + both 門弟 | mastered(400) + kimono_girls(5) + rocket_events(7) |
| Antichambre de la Ligue | studied(1500) + all 8 印 | mastered(350) + streak(20) |
| Elite Four Will | Antichambre cleared | mastered(400) + battle_wins(100) + streak(30) |
| Red | studied(2136) + E4 + Lance | mastered(1000) + texts_read(10) + rocket_events(9) |

#### 道場 Themes

| 師範 | Voie | Kanji thématiques |
|------|------|-------------------|
| Falkner | 空の道 | 空、風、鳥、飛、雲 et apparentés |
| Bugsy | 虫の道 | 虫、小、走、細、草 et apparentés |
| Whitney | 常の道 | Les kanji N5–N4 les plus fréquents |
| Morty | 影の道 | 夜、暗、霊、死、消 et apparentés |
| Chuck | 力の道 | 力、体、強、戦、押 et apparentés |
| Jasmine | 鋼の道 | 金、鉄、石、固、重 et apparentés |
| Pryce | 氷の道 | 冷、水、冬、凍、白 et apparentés |
| Clair | 竜の道 | 竜、王、空、力、古 et apparentés |

#### Antichambre de la Ligue

148. As a learner, I want an **Antichambre de la Ligue** — a 30-question HP battle drawn from all eight 道場 thematic pools combined — to unlock after all 8 印 are earned, with a 12-minute timer and 72% accuracy required for 初伝, so that the jump to the Elite Four is a ramp rather than a wall.

#### Elite Four & Combats Finaux

149. As a learner, I want each Elite Four member to require a **30-question HP battle** from their thematic pool, with escalating accuracy thresholds, so that the final stretch is significantly harder than the 道場 system.

| Elite Four | Thème kanji | 初伝 threshold |
|------------|-------------|---------------|
| Will | Psychique / esprit / perception / rêve | 75% |
| Koga | Nature / poison / subtilité / disparition | 75% |
| Bruno | Corps / force / discipline / combat | 80% |
| Karen | Nuit / obscurité / ambiguïté / dualité | 80% |

150. As a learner, I want the **Lance battle** to be a 35-question HP challenge themed around dragons, power, and ancient kanji, with a 15-minute timer and 85% accuracy for 初伝.
151. As a learner, I want the **Red final battle** to be a 50-question HP challenge drawn from the highest JLPT difficulty kanji I've studied — N1 studied kanji first, then N2, then N3, etc. — with no timer but 90% accuracy for 初伝, so that the final test draws on what cost me the most to learn.
152. As a learner, I want the Red battle to begin in silence: no music, snow falling on the map behind the battle screen, no dialogue — just Red's sprite and the first question appearing.

#### Carnet de Combat (/battles)

153. As a learner, I want a Carnet de Combat page showing every battle — past, current, upcoming — with individual progress bars per unlock condition.
154. As a learner, I want upcoming battles to show their conditions in advance so that I can plan.
155. As a learner, I want cleared battles to show my current rank (初伝/中伝/奥伝/皆伝) and a "Rejouer" button.
156. As a learner, I want the Carnet to show estimated wait time for any battle whose primary condition is met but secondary conditions are not: "試練 Falkner : 80 kanji maîtrisés requis — 58/80. Estimé dans ~12 jours au rythme actuel."

#### Battle Ranking System — 初伝・中伝・奥伝・皆伝

157. As a learner, I want every battle to generate a score based on accuracy, speed, and longest combo, so that clearing a battle is a beginning, not an end.
158. As a learner, I want my score converted into 初伝 / 中伝 / 奥伝 / 皆伝, displayed on the battle entry in the Carnet.

Score thresholds per battle type ⚙ — all values are calibration targets:

| Rang | 門弟 (10q) | 試練 (20q) | Antichambre (30q) | Elite Four (30q) | Lance (35q) | Red (50q) |
|------|------------|------------|-------------------|-----------------|-------------|-----------|
| 初伝 | ⚙60% | ⚙70% | ⚙72% | ⚙75–80% | ⚙85% | ⚙90% |
| 中伝 | ⚙75% + sub ⚙4 min | ⚙80% + sub ⚙8 min | ⚙82% + sub ⚙10 min | ⚙87% + sub ⚙10 min | ⚙90% + sub ⚙12 min | ⚙94% |
| 奥伝 | ⚙85% + sub ⚙3 min | ⚙88% + sub ⚙6 min + ⚙8 combo | ⚙90% + sub ⚙8 min + ⚙10 combo | ⚙93% + sub ⚙9 min + ⚙12 combo | ⚙94% + sub ⚙10 min + ⚙15 combo | ⚙97% + ⚙20 combo |
| 皆伝 | ⚙95% + sub ⚙2 min | ⚙95% + sub ⚙5 min + ⚙15 combo | ⚙95% + sub ⚙7 min + ⚙15 combo | ⚙97% + sub ⚙8 min + ⚙20 combo | ⚙97% + sub ⚙8 min + ⚙25 combo | 100% (non-négociable) |

#### 皆伝 Rewards

159. As a learner, I want achieving 皆伝 on a 試練 to unlock a **師範の伝言** — the 師範's deepest personal teaching on their kanji theme, available only to those who have truly mastered the trial.
160. As a learner, I want achieving 皆伝 on a 試練 to also unlock a **bonus lesson** — 3 kanji from the 師範's specialty not covered in the main curriculum.
161. As a learner, I want achieving 皆伝 on an Elite Four battle to unlock an extended lore entry about that member's history.
162. As a learner, I want achieving 皆伝 on Lance's battle to unlock the hidden poem inside the Dragon Scroll — a verse Fukuda wrote as a young man.
163. As a learner, I want achieving 皆伝 on Red's battle (100% accuracy on 50 questions) to unlock **Fukuda's final letter** — a personal letter written as if to a student who has surpassed the master.
164. As a learner, I want aggregate 皆伝 achievements:
    - All 8 試練 at 皆伝 → title **"八印の主"** — Master of the Eight Seals
    - All Elite Four at 皆伝 → **古の記録** — special text on the history of Johto's kanji masters
    - Red at 皆伝 → **"無言の証明"** — permanent badge on profile

---

### Missions — intégrées à la carte

Missions no longer live on a separate `/missions` page. They are triggered directly from the map: either by a specific NPC who gives a longer writing/production task, or by Fukuda who leaves a written exercise as a map event (a scroll on a tile). The `/missions` route becomes **Carnet de Missions** — archive of completed missions only, accessible from the Profile tab.

165. As a learner, I want missions to appear on the map as special NPC interactions or Fukuda scroll events, so that production tasks feel anchored in the world rather than in a separate admin page.
166. As a learner, I want missions in various formats: written composition, haiku, translation, grammar exercise, urban exploration (photo 3 kanji in the real world) — so that production skills in both kanji and grammar are practiced in context.
167. As a learner, I want missions to unlock based on kanji studied milestones and grammar level reached (e.g., a grammar mission requiring ～てもらう only appears once the N4 grammar zone has been entered).

Grammar mission examples:
| Mission | Grammar point | Format | Unlock |
|---|---|---|---|
| 「毎日の習慣」 | ～ている (ongoing state) | Write 3 sentences about your daily habits | studied ≥ 100 |
| 「お願い」 | ～てもらえますか | Write a formal request to Fukuda | studied ≥ 300, N4 zone entered |
| 「条件の旅」 | ～たら / ～ば | Translate 2 conditional sentences from a Fukuda letter | studied ≥ 600 |
| 「推量」 | ～らしい / ～ようだ / ～そうだ | Compare 3 evidential forms with your own example for each | studied ≥ 1000, N2 zone entered |
| 「Dragon's Den」 | ～ものだ / ～わけだ | Translate the Den's final inscription in natural French | studied ≥ 1800, Dragon's Den visited |
168. As a learner, I want each mission to include structured feedback from Fukuda — not just a reaction, but a specific note on whether the expected grammar structure was used correctly. For grammar missions, the app checks the presence of the required structure (e.g., ～てもらえますか) and Fukuda's response is tailored: "Tu as bien utilisé ～てもらえますか ici" or "La structure attendue était ～てもらえますか — essaie de l'intégrer à ta réponse." For freer tasks (haiku, composition), Fukuda notes one specific strength and one specific point to improve.
169. As a learner, I want completed missions saved in the Carnet de Missions (/missions) — accessible from my profile — showing the original task, my answer, and Fukuda's feedback.
170. As a learner, I want certain missions to be secondary conditions for 道場 battles, so that real-world production of Japanese is eventually required for progression.

---

### Daily Challenges

171. As a learner, I want a new Daily Challenge each morning — visible as a banner overlay on my map — a specific goal beyond the standard review queue (e.g., "Beat 8 trainers today", "Achieve 87% accuracy", "Reach Violet City from your current position").
172. As a learner, I want completing a Daily Challenge to count toward 道場 unlock conditions and trigger a Fukuda acknowledgment.
173. As a learner, I want the challenge to feel spatially grounded on the map whenever possible (a navigation goal rather than an abstract stat goal).

---

### Streak

174. As a learner, I want my study streak to increment by one each calendar day I beat at least one trainer (complete at least one review).
175. As a learner, I want to receive one Streak Shield from Fukuda during onboarding.
176. As a learner, I want to earn one additional Shield for every 10 consecutive days, capped at 2 shields total.
177. As a learner, I want a Shield to auto-activate silently if I miss a day.
178. As a learner, I want to see my streak, shield count, and longest streak in my profile stats.

---

### Settings (/settings)

179. As a learner, I want to set how many new kanji I receive per day.
180. As a learner, I want to enable or disable push notifications, and choose 0, 1, or 2 per day.
181. As a learner, I want to mute background music and sound effects independently.
182. As a learner, I want to sign out.

---

### État Post-Game de la Carte (après Red battu)

Quand Red est vaincu (level 25, 2136 kanji étudiés), la carte ne revient pas à son état normal. Elle change visuellement pour refléter que le voyage est terminé :

- **Sommet du Mont Gris** : la neige devient permanente sur la zone `mt-silver-summit`. Red reste visible — sprite figé dans la neige.
- **Tour Jo (Ecorosa)** : les 5 Kimono Girls restent présentes et peuvent être revues. Leur dialogue change : "Tu es revenu. Certains ne reviennent jamais."
- **Emplacements Team Rocket** : chaque zone Rocket affiche une plaque commémorative tapable montrant ce qui s'est passé là et la réaction de Fukuda à l'époque.
- **Maison de Fukuda (Bourg-en-Vol)** : sa fenêtre est allumée en permanence. Taper la maison ouvre une version enrichie de la page `/sensei` avec une section "Messages d'Ancien Élève".
- **Panneau de départ (Route 29)** : un nouveau panneau est apparu pendant la nuit. Il lit : 「ここから始まった」 (Ici, tout a commencé). Tapable — montre la première leçon que tu as complétée.
- **EXP bar** : remplacée par le compteur 深く定着 (kanji avec stability ≥ 90 jours des deux cartes). Un nouveau horizon pour les reviewers à long terme.
- **Trainers de route** : continuent d'apparaître avec "!" quand les cartes SRS sont dues. Le jardin ne ferme pas — il arrête juste d'avoir des murs.

---

### Push Notifications (Pokégear)

183. As a learner, I want push notifications at 11:00 (Buena's Password morning kanji) and 19:00 (Buena's Password answer + dresseur reminder), so that the notification system is diegetic — not an app reminder, but a Pokégear call.
184. As a learner, I want trainer-specific rematch calls — "Tes 火 kanji sont prêts. Je t'attends sur la Route 29." — on the day FSRS schedules the card's next review.
185. As a learner, I want occasional Fukuda messages by Pokégear — short, characterful lines from my mentor.
186. As a learner, I want tapping any notification to open the app at the relevant location on the map.

---

## Implementation Decisions

> **Note sur les valeurs numériques :** les valeurs marquées ⚙ sont des points de départ à calibrer au playtesting. Elles seront extraites dans un `CONFIG.md` dédié avant la mise en production.

### Stack

- **Frontend:** Next.js (App Router) deployed on Vercel. PWA manifest and service worker for installability on iOS and Android.
- **Backend / Database:** Supabase (PostgreSQL). Auth, real-time sync, all persistent data. No separate API server.
- **Authentication:** Google OAuth via Supabase Auth.
- **SRS algorithm:** `ts-fsrs` npm package. All card scheduling delegated to this library.
- **Deployment:** Vercel free tier. `git push` → automatic deploy.

### Architecture de la Carte

The map is a **tile-based 2D sprite map** rendered as a fixed-size canvas or SVG layer, with the player avatar moving across it via tap-to-move.

**Map layers (bottom to top):**
1. **Background sprite** — static HGSS-style map image for each zone (49 zones, loaded progressively as the player explores).
2. **Tile grid overlay** — invisible grid of walkable/blocked tiles, defined in JSON (`/content/map/tiles.json`). Each tile has: `{ x, y, zone_id, walkable: bool, special?: "gym"|"center"|"shop"|"npc"|"event" }`.
3. **Trainer sprites** — rendered dynamically from `map_trainers` data (see below). Facing direction and "!" state computed client-side from FSRS card state.
4. **NPC sprites** — rendered from `map_npcs` data. Static position, tap to interact.
5. **HUD overlay** — trainer avatar, rank name, EXP bar, "!" count. Fixed position, always on top.

**Avatar movement:** tap a destination tile → avatar moves step-by-step along a pathfinding route. Movement is interrupted if any trainer's line-of-sight is crossed mid-path. Line-of-sight check runs on every step: if the avatar enters a facing trainer's sight cone → movement stops, "!" triggers, combat launches.

**Trainer line of sight:** each trainer has `facing: "up"|"down"|"left"|"right"` and `sight_range: 2–4`. Sight is a straight line of `sight_range` tiles in the facing direction. `isInSight(trainerPos, facing, sightRange, avatarPos)` is a pure function in ProgressionEngine.

**Map state persistence:** `user_map_state` table stores `(user_id, current_zone, avatar_x, avatar_y, unlocked_zones[], visited_buildings[])`. Updated on every zone transition and building visit.

### Content Architecture

All content is produced once before launch. No content maintenance required after launch.

**Content strategy — hybrid in three layers:**
1. **Existing sources**: Kanjidic2, KanjiVG, KRADFILE, JMdict, Tatoeba, Aozora Bunko, and supplementary materials sourced at production time.
2. **AI completion** (Claude API batch, run once): etymologies, mnemonics, compound stories, lesson chapters, NPC dialogue scripts, Team Rocket event dialogues, Kimono Girl dialogues, comprehension questions.
3. **Hand-written** (author): Fukuda narrative scripts, Silver dialogue, final boss dialogues, mission definitions, battle unlock conditions, NPC quest definitions, map tile data.

**Text content → Supabase:**

| Table | Content | Primary source |
|-------|---------|------------|
| `kanji` | character, meanings, readings, etymology, mnemonic | Kanjidic2 + AI batch + curated sources |
| `words` | word, reading, furigana, pitch_accent, jlpt_level, compound story | JMdict Extended (217k entries, furigana + 55,321 pitch accent patterns) + Yomitan JLPT vocab (8,113 word/level pairs N5→N1, CC BY-SA 4.0) + AI batch (compound stories) |
| `grammar` | title, short_explanation, formation, examples (JP+EN), jlpt_level | Hanabira.org grammar JSON (CC license) — 828 points N5→N1, 3,310 JP+EN examples (= direct Frappe Grammaire pool, no AI needed) |
| `lessons` | batch narrative, johto_zone, quiz questions, grammar_note | AI batch (grammar_note drawn from Hanabira formation patterns for the zone's JLPT tier) |
| `zones` | zone_id, display_name, zone_order (1–49), narrative_anchor, grammar_level | Hand-written (49 rows) |
| `sentences` | example sentences per word — jp_text, en_text, register | Tatoeba JP↔EN pipeline (248,769 JP sentences linked via links.csv; ~150–200k usable pairs; register: "neutral") + JESC filtered (~500k usable pairs after min-8-chars/min-1-jōyō/content filter; register: "spoken" — used for Silver/Rocket battle pools) |
| `texts` | unlockable texts JP + EN + questions + unlock_threshold + source | Aozora Bunko (16,951 works from `aozorabunko-clean.jsonl.gz`; import filter: 新字新仮名, 2,000–80,000 chars; v1 target: 200–500 works) + AI-generated texts |
| `dialogues` | narrative scenes + Fukuda messages keyed by trigger_type | Hand-written in `/content/dialogues/` |
| `missions` | mission definitions, Fukuda reactions | Hand-written in `/content/missions/` |
| `content` | tips pool, notification messages, welcome back | AI batch |
| `fukuda_messages` | per-user log: (user_id, trigger_type, trigger_ref, created_at) | Written server-side on qualifying events |
| `battle_unlock_conditions` | per-battle condition arrays | Hand-written in `/content/battles/` |
| `text_reads` | per-user reading sessions: (user_id, text_id, mode, score, read_at) | Server-side on completion |
| `map_trainers` | trainer definitions: (trainer_id, zone_id, tile_x, tile_y, facing, sight_range, kanji_pool[]) | Hand-written in `/content/map/trainers.json` |
| `map_npcs` | NPC definitions: (npc_id, zone_id, tile_x, tile_y, dialogue_ref, quest_ref, min_kanji_studied) | Hand-written in `/content/map/npcs.json` |
| `map_events` | rocket/kimono/obstacle events: (event_id, zone_id, trigger_condition, cleared_by_user) | Hand-written in `/content/map/events.json` |
| `user_map_state` | per-user map position and explored zones | Server-side, updated on movement |
| `battle_results` | (user_id, battle_id, score, accuracy, time_seconds, max_combo, rank, played_at) | Server-side on battle completion |
| `battle_rewards` | 皆伝 rewards unlocked per user | Server-side on first 皆伝 |
| `npc_quest_progress` | (user_id, quest_id, status, completed_at) | Server-side on quest completion |
| `rocket_event_progress` | (user_id, event_id, cleared_at) | Server-side on event completion |
| `apricorn_inventory` | (user_id, colour, count) | Server-side |
| `photo_collection` | (user_id, photo_id, earned_at) | Server-side on milestone |
| `lottery_history` | (user_id, date, result, prize) | Server-side daily — tirage journalier à la Tour Radio de Dorado (feature à spécifier) |

**Binary assets → `/public/`:**
```
/public/
├── sprites/
│   ├── trainers/     ← 25 rank sprites (Gamin → Red) + Fukuda (Sage)
│   ├── leaders/      ← Falkner, Bugsy... Clair, Lance, Elite Four
│   ├── rivals/       ← Silver (6 appearances), Kimono Girls (5)
│   ├── rocket/       ← Proton, Petrel, Ariana, Archer + generic grunts
│   └── npcs/         ← Kurt, Prof Elm, Buena, random NPCs
├── map/
│   ├── zones/        ← One sprite per zone (49 files, HGSS style)
│   └── tiles/        ← Tile definitions JSON
├── music/            ← HGSS OST in MP3
├── sfx/              ← Sound effects
└── assets/
    ├── washi-bg.webp
    └── hanko-stamp.png
```

### Data Pipeline (before any Next.js code)

1. Parse **Kanjidic2** → kanji table
2. Parse **KanjiVG** → kanji_components table
3. Parse **KRADFILE** → supplement component data
4. Parse **JMdict Extended** (`jmdictExtended-2026-06-23.json`, 217,625 entries) → words table. Fields: word, reading, furigana, pitch_accent (available for 55,321 entries), part_of_speech. Cross-reference **Yomitan JLPT vocab** (`yomitan-jlpt/`, 8,113 word/level pairs) to populate `jlpt_level` field. Filter to 7,836 JLPT words using Yomitan's N5–N1 lists as the authoritative whitelist.
5. Parse **Tatoeba** → sentences table (register: `"neutral"`). Pipeline: resolve `jpn_sentences.tsv` (248,769) + `eng_sentences.tsv` (2,030,118) via `links.csv` → JP↔EN pairs. Estimated 150–200k usable pairs after link resolution. Each sentence tagged with kanji coverage array for fast lookup by word.
5b. Parse **JESC** (`raw/raw`, 2,801,388 pairs) → sentences table (register: `"spoken"`). Filter pass: JP text ≥ 8 chars, ≥ 1 jōyō kanji present, no pure-ASCII fragments. Estimated 400–600k usable pairs after filtering. Used exclusively for Silver battles, Rocket Executive battles, and informal-register Traduction de Phrase questions.
6. Parse **Hanabira Grammar JSON** (5 files, N5→N1) → grammar table (828 points, 3,310 examples). No additional AI generation needed for Frappe Grammaire — the example sentences are the question pool.
7. **AI batch — kanji** (Claude API, run once): etymology + mnemonic for all 2136 kanji
8. **AI batch — words** (Claude API, run once): compound story for all 7836 JLPT words
9. **AI batch — lessons** (Claude API, run once): ~450 lesson chapters narrated by Fukuda, each assigned a `johto_zone` and a `grammar_note` (1 grammar point per lesson batch, drawn directly from the matching Hanabira `formation` pattern for the zone's JLPT tier); with end-of-lesson quiz questions
10. **AI batch — content pool**: 200+ session tips, 50+ notification messages, 10+ welcome back messages, NPC quest dialogue (constrained to Hanabira `formation` patterns for the zone's JLPT tier), Team Rocket event dialogue, Kimono Girl dialogue
11. **Aozora Bunko import** (`aozorabunko-clean.jsonl.gz`, 16,951 works): filter pass selects 新字新仮名 orthography, 2,000–80,000 chars. v1 target: 200–500 works selected to span kanji-coverage unlock thresholds from ~150 to 2,136 studied. Short-form literary works (Akutagawa, Dazai, Soseki) prioritised. Comprehension questions AI-generated in batch. Unlock threshold: 95% mastery of the text's jōyō kanji set.
12. **Hand-written content import**: `/content/dialogues/`, `/content/missions/`, `/content/battles/`, `/content/map/` → Supabase

### Narrative Story Arc

The narrative is fixed at launch. Two interlocking threads: the **trainer arc** (NPC → Red) and the **Fukuda/Silver arc**. Team Rocket and the Kimono Girls are woven in as parallel narrative threads that converge at the Plateau Indigo. Red is a shadow from the first session.

**Sensei Fukuda's character:** elderly retired archivist from Goldenrod Pokémon Lab, living in a dōjō at New Bark Town. Warm, unhurried, occasionally funny. His last student was Silver, who quit when asked to study the hardest kanji. Before Silver was Red — who completed everything, then disappeared to the summit of Mt. Silver without a word. The player is the third.

**Fukuda tone arc:**
- **Ranks 1–13 (Falkner–Whitney):** Measured, instructional. Hints at a previous student. Teaches more than he reveals.
- **Ranks 14–18 (Morty–Clair):** Warmer, more personal, increasingly vulnerable. Red references become specific. At Morty, he names regret for the first time.
- **Ranks 19–25 (Elite Four–Red):** Quiet, retrospective. Processing in real time. His final letter is the emotional endpoint of the entire arc.

**Scene inventory:**

| Trigger type | Trigger ref | Scene | Emotional beat |
|---|---|---|---|
| `onboarding` | `intro` | Fukuda introduces 一; hints at a student "who completed this" without naming Red | Plants Red's shadow |
| `threshold_event` | `rank_3_silver` | Silver letter 1 — appears at Pokémon Center | Dismissive of Fukuda |
| `threshold_event` | `rank_4_exercise` | Fukuda's 3-question exercise — note on map at New Bark Town | First time Fukuda speaks as observer |
| `lesson_aside` | `rank_5_aside` | Fukuda mentions a student before Silver, in a lesson | First hint that Red existed |
| `threshold_event` | `rank_7_silver` | Silver letter 2 — at Pokémon Center | Curious despite himself |
| `map_event` | `silver_azalea` | Silver — first encounter, Azalea Town | Dismissive; establishes antagonism |
| `map_event` | `silver_ecruteak` | Silver — second encounter, Ecruteak | Reveals he knows Fukuda |
| `map_event` | `silver_mahogany` | Silver — third encounter, Mahogany | Still convinced he was right to leave |
| `map_event` | `silver_antichambre` | Silver — fourth encounter, Antichambre | First crack in his certainty |
| `map_event` | `silver_route28` | Silver — fifth encounter, Route 28 | Admits wordlessly he was wrong |
| `map_event` | `silver_summit` | Silver — sixth encounter, Mt. Silver (post-Red) | Climbed to see for himself. Nods. Leaves. |
| `shiren_cleared` | `shiren-falkner` | Fukuda post-試練 — 空の印 | First indirect reference to Red |
| `shiren_cleared` | `shiren-bugsy` | Fukuda post-試練 — 虫の印 | What Silver skipped |
| `shiren_cleared` | `shiren-whitney` | Fukuda post-試練 — 常の印 | Red and Silver contrasted directly |
| `shiren_cleared` | `shiren-morty` | Fukuda post-試練 — 影の印 | First explicit regret about Silver |
| `shiren_cleared` | `shiren-chuck` | Fukuda post-試練 — 力の印 | Red described: "never hesitated" |
| `shiren_cleared` | `shiren-jasmine` | Fukuda post-試練 — 鋼の印 | Red's notebooks — Fukuda still has them |
| `shiren_cleared` | `shiren-pryce` | Fukuda post-試練 — 氷の印 | Pryce's question; no answer given |
| `shiren_cleared` | `shiren-clair` | Fukuda post-試練 — 竜の印 | Most vulnerable; Fukuda says what he should have said to Red |
| `map_event` | `silver_reconciliation` | Silver returns after Clair; asks about Red | Unanswered question; he leaves without saying goodbye |
| `antichambre_unlocked` | `antichambre` | Eight 印 complete; the Elite Four do not teach | Transition beat; Fukuda steps back |
| `antichambre_cleared` | `antichambre` | The gate is open | Minimal, final push |
| `elite_cleared` | `will` | Will mentions the silent trainer | Red's silence from outside |
| `elite_cleared` | `koga` | Koga's line on forgetting | Silver's deliberate choice to forget |
| `elite_cleared` | `bruno` | Effortlessness vs. preparation | Red's preparation described |
| `elite_cleared` | `karen` | Karen's letter; Fukuda's box of letters | Red left none |
| `threshold_event` | `rank_23_silver` | Silver's final message — kanji of distance | Does not sign |
| `champion_cleared` | `lance` | Lance battle + Dragon Scroll ceremony | Scroll contains Fukuda's hidden poem |
| `champion_cleared` | `lance_fukuda` | Fukuda message post-Lance | Reveals the poem; wonders what Red thought |
| `threshold_event` | `elm_callback` | Prof Elm appears; reveals he recommended the player to Fukuda | Full circle |
| `red_battle` | `red` | No dialogue. Snow. Silence. Red nods. | The only scene with no words |
| `reward_only` | `fukuda_final_letter` | Fukuda's final letter — unlocked at Red 皆伝 only | Standalone file: `/content/dialogues/fukuda_final_letter.md` |
| `rocket_arc_cleared` | `archer_telegram` | Archer's final telegram | All 12 Rocket events cleared; he disappears |
| `kimono_collective` | `tour_jo` | The 5 Kimono Girls at Tour Jo | All 5 beaten; the legendary lesson unlocks |
| `map_event` | `rocket_summit` | Le Grunt Solitaire — Mt. Silver | Melancholy; he never knew it ended |

**Each 師範 also has two in-scene dialogues:** pre-試練 intro + post-試練 印 ceremony, stored in `dialogues` under `trigger_type: "shiren_intro"` and `"inkan_ceremony"`.

### Zone Map (Johto → Mt. Silver)

Zones are narrative wrappers, not learning-order determinants. Non-linear traversal is by design: two learners at the same kanji count will have different map colorings. The map records where the learner's prerequisite chains took them — a personal artifact.

| `johto_zone` | Display Name | Lessons ⚙ | Narrative anchor |
|---|---|---|---|
| `new-bark-town` | Bourg-en-Vol | 1–12 | Fukuda's 道場; departure point |
| `route-29` | Route 29 | 13–22 | First steps on the road |
| `cherrygrove-city` | Bourg-en-Côteau | 23–32 | First town |
| `route-30` | Route 30 | 33–40 | — |
| `route-31` | Route 31 | 41–48 | — |
| `violet-city` | Cramola | 49–62 | Falkner's city |
| `sprout-tower` | Tour Grospignon | 63–70 | Tower of ancient teachings |
| `route-32` | Route 32 | 71–80 | Rocket Éclaireurs event |
| `ruins-of-alph` | Ruines Arcaniques | 81–90 | Ancient script; Safari Zone; Rocket Pillage event |
| `route-33` | Route 33 | 91–97 | — |
| `azalea-town` | Safrania | 98–110 | Bugsy's city; Kurt's house |
| `slowpoke-well` | Puits Ramoloss | 111–116 | Rocket Proton event |
| `ilex-forest` | Forêt Secte | 117–126 | — |
| `route-34` | Route 34 | 127–133 | — |
| `goldenrod-city` | Dorado City | 134–150 | Whitney's city; Radio Tower; Department Store; Lottery |
| `route-35` | Route 35 | 151–157 | — |
| `national-park` | Parc National | 158–164 | Bug Catching Contest; Pokéathlon Dome |
| `route-36` | Route 36 | 165–172 | Sudowoodo obstacle |
| `route-37` | Route 37 | 173–178 | — |
| `ecruteak-city` | Ecorosa City | 179–198 | Morty's city; Tour Jo; Kimono Girl 3 (lieu de l'événement collectif des 5 filles) |
| `burned-tower` | Tour Embrasée | 199–206 | Rocket Traque event |
| `route-38` | Route 38 | 207–213 | — |
| `route-39` | Route 39 | 214–220 | — |
| `olivine-city` | Amaris City | 221–232 | Jasmine's city; SS Aqua docks |
| `route-40` | Route 40 | 233–238 | Sea route (CS 水 required) |
| `cianwood-city` | Orsay City | 239–248 | Chuck's city; Kimono Girl 5 |
| `route-42` | Route 42 | 249–255 | — |
| `mt-mortar` | Mont Mortier | 256–262 | — |
| `mahogany-town` | Acajou Ville | 263–272 | Pryce's city; Rocket Repaire entrance |
| `lake-of-rage` | Lac Colère | 273–278 | Rocket Ariana event; Shiny 怒 event |
| `route-44` | Route 44 | 279–285 | — |
| `ice-path` | Chemin Glacé | 286–296 | Pryce's trial zone; Rocket Retardataires |
| `blackthorn-city` | Saupoudreville | 297–312 | Clair's city |
| `dragons-den` | Antre du Dragon | 313–320 | Dragon's Den quiz; Rocket Émissaire; N1 NPC quest |
| `route-45` | Route 45 | 321–326 | — |
| `dark-cave` | Grotte Sombre | 327–333 | — |
| `route-26` | Route 26 | 334–338 | — |
| `route-27` | Route 27 | 339–344 | Johto/Kanto border; Ronflex obstacle |
| `indigo-plateau-antichambre` | Plateau Indigo — Antichambre | 345–355 | 閉→開 gate; Silver 4th encounter |
| `indigo-plateau-will` | Salle de Will | 356–362 | — |
| `indigo-plateau-koga` | Salle de Koga | 363–369 | — |
| `indigo-plateau-bruno` | Salle de Bruno | 370–375 | — |
| `indigo-plateau-karen` | Salle de Karen | 376–381 | — |
| `indigo-plateau-lance` | Trône de Lance | 382–390 | Dragon Scroll ceremony |
| `mt-silver-route-28` | Route 28 | 391–400 | Silver 5th encounter |
| `mt-silver-base` | Gris — Base | 401–415 | Elm's note; last Pokémon Center |
| `mt-silver-lower` | Gris — Versants inférieurs | 416–428 | The climb begins |
| `mt-silver-upper` | Gris — Versants supérieurs | 429–440 | Rocket Grunt Solitaire |
| `mt-silver-summit` | Gris — Sommet | 441–450+ | Red. Snow. Silence. |

### Battle System — HP & Question Modes (Implementation)

All boss battles (Silver, Kimono Girls, Team Rocket Executives, Gym Leaders/試練, Elite Four, Lance, Red) use the HP system. Route trainer encounters use the SRS system (FSRS ratings). The two systems are distinct screens.

**HP computation:** `myHP = count(masteredKanji ∩ battleThemePool)`. Capped at ⚙100 HP display units regardless of actual mastered count; scaled proportionally. Opponent HP = fixed constant per battle type (⚙200 for 門弟, ⚙400 for 試練, ⚙600 for Elite Four, ⚙800 for Red).

**Question pool per battle:** drawn from `getDōjōKanji(theme, studiedSet)` — the intersection of the battle's thematic kanji pool and the user's studied set. Questions are shuffled; mode (1 of 7) is selected per question by weighted random: Frappe Signification 25%, Frappe Lecture 20%, Traduction de Phrase 15%, Frappe Grammaire 15%, Assemblage de Mot 10%, Invocation de Kanji 10%, Kanji Fantôme 5%. Weights are calibration targets. Grammar questions are drawn from `getGrammarForBattle(battleJlptTier, grammarPool)`.

**HP damage:** correct answer → opponent loses ⚙20 HP (⚙40 on Critical Hit, ⚙20 × combo_multiplier). Wrong answer → player loses ⚙15 HP. Opponent attack (unanswered timer) → player loses ⚙25 HP.


**Victory condition:** opponent HP reaches 0. Defeat: player HP reaches 0. Draw resolution: if both reach 0 in the same question, player wins (the attacking stance wins ties — a deliberate design choice favouring the learner).

**Results stored in `battle_results`:** `(user_id, battle_id, score, accuracy, time_seconds, max_combo, rank, played_at)`. Best rank per battle displayed; full history kept. HP system battles do not affect FSRS card state.

**Retry rules:** all failed battles — 試練, Silver, Kimono Girl, Rocket Executive, Elite Four, Lance, Red — can be retried immediately. No cooldowns anywhere. The gatekeeping is the mastery condition, not a timer.

### PNJ Porteurs (Implementation)

NPC quests are defined in `/content/map/npcs.json` as static records. Each NPC has:
```json
{
  "npc_id": "npc-violet-mountain",
  "zone_id": "violet-city",
  "tile_x": 14, "tile_y": 8,
  "sprite": "npcs/hiker.png",
  "min_kanji_studied": 100,
  "dialogue_jp": "山の上に赤い石があります。とってきてください！",
  "quest_type": "fetch",
  "target_zone": "sprout-tower",
  "target_tile_x": 7, "target_tile_y": 12,
  "reward_type": "apricorn",
  "reward_value": "red"
}
```

`min_kanji_studied` ensures the NPC only appears (sprite renders on map) once the player has enough studied kanji to plausibly understand the dialogue. The dialogue uses only kanji from the studied set plus at most 2 unknowns.

Dialogue is rendered in a standard dialogue box with Japanese text. Tapping an unknown kanji opens the standard popover (same component as the text reading popover, US 95). Quest progress stored in `npc_quest_progress`.

`getNPCsForZone(zoneId, studiedKanjiSet, completedQuests)` returns NPCs that should render on the map for the current zone and user state.

### Team Rocket Events (Implementation)

Each Rocket event is an entry in `map_events` with `event_type: "rocket"`. Events are stored with:
- `event_id`, `zone_id`, `blocking: bool` (whether it blocks a path or building access)
- `trigger_condition`: JSON condition object (same format as `battle_unlock_conditions`)
- `battle_pool`: array of kanji IDs for the HP battle
- `executive_id`: null for grunt events, populated for executive battles
- `dialogue_ref`: trigger_ref in the `dialogues` table for pre/post battle narrative

`getRocketEventsForZone(zoneId, clearedEvents, userStats)` returns which events are active, completed, or pending.

Cleared events are stored in `rocket_event_progress`. The total cleared count is used in 道場 unlock conditions.

### ProgressionEngine (the single test seam)

A pure TypeScript module at `src/lib/progression-engine.ts` with no I/O dependencies:

- `getAvailableKanji(studiedSet, allKanji, componentGraph)` — learning order logic
- `getAvailableWords(masteredKanjiSet, allWords, wordsAlreadyInDeck)` — word unlock logic
- `isTextUnlocked(textKanjiSet, masteredKanjiSet, textSource)` — 80% for `"ai-generated"`, 95% for `"aozora"`
- `getTrainerRank(studiedKanjiCount)` — 25-level rank table lookup
- `getStreakState(reviewHistory, today)` — streak + shield computation
- `getDōjōKanji(dōjōTheme, studiedSet)` — returns intersection of themed kanji and studied set, sorted by JLPT level, up to 20 results; supplements to 10 minimum with adjacent kanji if needed
- `getLessonQueue(availableKanji, completedLessons, queuedKanji)` — ordered list of upcoming lessons
- `getFrontierZone(completedLessons, lessonZoneMap, zoneOrder)` — zone with highest zone_order where at least one lesson completed; returns null if no lessons completed
- `getBattleUnlockStatus(battleId, conditions, userStats)` — evaluates each condition; returns per-condition status and overall `isUnlocked`
- `getBattleRank(score, battleConfig)` — returns 初伝/中伝/奥伝/皆伝
- `getEstimatedMasteryDays(studiedButUnmasteredCards, targetMasteryCount)` — projects days until targetMasteryCount cards reach stability ≥ 30 days
- `isInSight(trainerPos, facing, sightRange, avatarPos)` — pure function; returns bool; used for "!" detection on every avatar move step
- `getActiveTrainers(dueCards, mapTrainers, userMapState)` — maps due SRS cards to trainer positions on the current zone; returns list of trainers with "!" state
- `getNPCsForZone(zoneId, studiedKanjiSet, completedQuests)` — returns NPCs that should render for the current user
- `getRocketEventsForZone(zoneId, clearedEvents, userStats)` — returns active/cleared/pending Rocket events for a zone
- `getCSKanjiAbilities(masteredKanjiSet)` — returns the set of active map abilities (Cut, Surf, Fly, etc.) based on which CS-Kanji are mastered
- `getHPValues(masteredKanjiSet, battleThemePool, battleConfig)` — returns `{ playerHP, opponentHP }` for a given battle
- `getGrammarForBattle(battleJlptTier, grammarPool)` — returns `{ grammarPoint, exampleSentence, blankPosition, correctAnswer, distractors[3] }` for a Frappe Grammaire question. Draws directly from Hanabira examples for the given tier; no AI generation at runtime.
- `selectQuestionMode(questionIndex, weights)` — weighted random selection of 1 of 7 question modes
- `getKanjiInTheWild(kanjiChar, tatoebaSentences)` — returns `{ jp, en }` for 1 randomly selected Tatoeba sentence where `kanjiChar` appears. Falls back to JESC filtered pool if no Tatoeba sentence available for this kanji. Called on first mastery crossing only (stored in `mastery_events` to avoid re-firing).
- `getJlptDifficultyPool(studiedSet, allKanji, targetCount)` — returns up to `targetCount` kanji from the studied set sorted descending by JLPT difficulty (N1 > N2 > N3 > N4 > N5 > unranked). Used to build Red battle's 50-question pool.

### Learning Order

1. **Component prerequisite (hard constraint):** all KanjiVG visual components must be in studied set first.
2. **JLPT priority (soft sort):** N5 → N4 → N3 → N2 → N1 → unranked (by frequency within each tier).
3. **Lesson sequencing:** system selects the next lesson whose entire kanji set falls within the available pool. Queued kanji from a card push that lesson to the front. `getLessonQueue` returns the ordered list.

### Card Types

**Kanji cards** — 2 FSRS cards per kanji: meaning card + reading card, independent.
**Word cards** — 2 FSRS cards per word: meaning card + reading card, independent.

### Mastery Definition

A kanji or word is "mastered" when both its cards have FSRS `stability ≥ 30 days`. Mastery is recomputed live after every review. Achievements, Shiny badges, and CS-Kanji abilities are permanent once earned — they are never revoked even if mastery count drops.

### Word Unlock Mechanic

When a kanji reaches mastery, `getAvailableWords` is called. Newly eligible words enter the SRS queue subject to caps ⚙: (1) daily cap = 2× kanji lesson limit; (2) global pending queue cap = ⚙200 word cards (no new words admitted until below ⚙150). If daily kanji limit is 0, word daily cap defaults to ⚙10.

### Streak Mechanic

Streak increments per calendar day with ≥ 1 completed review (route trainer encounter or Pokémon Center session). Shields: 1 per 10 consecutive days, capped at 2. Miss a day with shield → shield consumed silently. No shield → streak resets.

### Map Screen Layout

The map is the home screen. Layout (portrait mobile):
- **Full-screen map canvas** (fills available space, pans with avatar movement)
- **Bottom HUD strip** (fixed, 64px height): trainer sprite | rank name | EXP bar | "!" count badge
- **Bottom navigation bar** (fixed, 48px): 地図 | 図書館 | 図鑑 | 先生 | 自分

On desktop, the map canvas is wider; the navigation bar may move to the side. The map always fills the primary visual field.

### Audio Map

| Context | Track |
|---------|-------|
| Map navigation (ranks 1–10) | New Bark Town |
| Map navigation (ranks 11–18) | Route 29 (shifts by zone in v2) |
| Map navigation (ranks 19–24) | Victory Road theme |
| Route trainer encounter (ranks 1–10) | Wild Pokémon Battle |
| Route trainer encounter (ranks 11–18) | Trainer Battle |
| Route trainer encounter (ranks 19–24) | Elite Four Battle |
| 門弟 battle | Trainer Battle |
| 試練 (HP battle, 師範) | Pokémon Gym Leader Battle |
| 印 ceremony | Victory fanfare → 師範 post-battle theme |
| Antichambre de la Ligue | Victory Road theme |
| Elite Four HP battle | Elite Four Battle |
| Lance HP battle | Lance/Red battle theme |
| Red HP battle | Silence |
| Silver HP battle | Silver (Rival) battle theme |
| Team Rocket Executive HP battle | Team Rocket battle theme |
| Kimono Girl HP battle | Ecruteak City (slowed) |
| Explorer | Professor Elm's Lab |
| Texts / Reading | Ecruteak City |
| Library (/library) | Ecruteak City |
| Pokéathlon Dome | Pokéathlon theme |
| SS Aqua | S.S. Aqua theme |
| Shiny encounter | Shiny fanfare |
| Lake of Rage | Lake of Rage theme |
| Achievement unlock | Victory Road fanfare |
| Welcome Back overlay | New Bark Town (soft fade in) |
| Lessons (reading) | Route 29 |
| Night on map (any zone) | Nighttime variant of zone track |

### Trainer Avatar System

25-level rank table maps studied-kanji ranges to HGSS character sprites. Fukuda uses the Sage-class sprite. Silver's sprite used for rank 10 display (rank name only). Sprites stored in `/public/sprites/trainers/`. Rank transitions trigger full-screen animation over the map.

### Achievements

Evaluated client-side after each session / event. Permanent once earned. Written to Supabase on first detection. See US 133 for complete list.

### Push Notifications (Pokégear)

Web Push API. Supabase Edge Function scheduling: ⚙10:55 (Buena morning) and ⚙18:55 (Buena evening + trainer rematch calls). Trainer rematch calls fire on the date FSRS schedules the card's next review. All notifications deep-link to the map at the relevant zone. Buena's Password notifications deep-link to the Radio Tower building.

### Assets

- **Sprites:** The Spriters Resource (NDS → HGSS → Characters)
- **Map sprites:** HGSS overworld map images — Bulbagarden Archives (535 PNG files downloaded to `public/maps/`)
- **Music:** HGSS OST MP3 from archive.org (172 tracks downloaded to `public/audio/ost/`), looped via Web Audio API
- **Sound effects:** The Sounds Resource — downloaded to `public/audio/sfx/`. Victory jingle on Good/Easy; Poké Ball burst + escape on Again; "!" sound on trainer detection; footstep sounds on avatar movement.
- **Washi textures:** Free assets for lesson UI background
- **Brush fonts:** Noto Serif JP / Zen Old Mincho (Google Fonts)
- **Grammar data:** Hanabira.org (CC license) — `scripts/sources/grammar_JLPT_N{5,4,3,2,1}.json` — 828 grammar points with title, formation, short/long explanation, and 4 example sentences each (JP + romaji + EN)
- **Content data sources** (`scripts/sources/`):
  - `jmdictExtended-2026-06-23.json` — JMdict Extended (217,625 entries, furigana + 55,321 pitch accent patterns)
  - `yomitan-jlpt/` — Yomitan JLPT vocab (8,113 word/level pairs N5→N1, CC BY-SA 4.0 Stephen Kraus)
  - `jpn_sentences.tsv` + `eng_sentences.tsv` + `links.csv` — Tatoeba (248,769 JP + 2M EN + 28M cross-language links)
  - `raw/raw` — JESC (2,801,388 EN↔JP subtitle pairs, Stanford NLP)
  - `aozorabunko-clean.jsonl.gz` — Aozora Bunko, 16,951 deduplicated works (globis-university/aozorabunko-clean, HuggingFace)
  - `nhkore/core/nhk_news_web_easy.yml` — nhkore (7,198 NHK Web Easy article URLs + word frequencies; full text deferred to v2)

### Texts (Unlockable Stories)

Three text sources, three unlock tiers:

- **Aozora Bunko** (`source: "aozora"`, threshold: **95% mastery**): 16,951 public-domain works from `aozorabunko-clean.jsonl.gz`. Import filter: 新字新仮名 orthography (modern kana), 2,000–80,000 chars, ≥ 1 jōyō kanji per 50 chars. v1 target: 200–500 works selected to span kanji-coverage thresholds from ~150 to 2,136 studied. Short-form literary works prioritised (Akutagawa Ryūnosuke, Dazai Osamu, Natsume Soseki, Miyazawa Kenji). Metadata: `作品名` (title), author name (姓 + 名 romanised), `公開日` (date). The first Aozora text should be unlockable by a player with ~150–200 studied kanji at 95% mastery.
- **AI-generated texts** (`source: "ai-generated"`, threshold: **80% mastery**): Accessible within 6–8 weeks of starting. Calibrated by zone: a text associated with Route 29 kanji unlocks once 80% of those kanji are mastered.
- **NHK Web Easy** (`source: "nhk-easy"`, threshold: **85% mastery**, v2): 7,198 article URLs available in `nhkore/core/nhk_news_web_easy.yml`. Full text requires a scraping script (deferred to v2). Contemporary non-fiction tier, positioned between AI-generated and Aozora.

`isTextUnlocked(textKanjiSet, masteredKanjiSet, textSource)` applies thresholds: `"aozora"` → 95%, `"ai-generated"` → 80%, `"nhk-easy"` → 85% (v2).
Comprehension questions AI-generated in batch. Format: 4-choice single answer. Stored in `texts` table.

---

## Testing Decisions

**What makes a good test:** tests call `ProgressionEngine` functions with explicit inputs and assert on outputs. No mocking the database, no rendering React components, no ts-fsrs internals.

**Module under test:** `ProgressionEngine` at `src/lib/progression-engine.ts`.

**Test cases to cover:**

- `getAvailableKanji`: unstudied components block; all components studied → returned; N5 before N4; unranked last.
- `getAvailableWords`: all kanji mastered → returned; one unmastered → not returned; already in deck → excluded.
- `isTextUnlocked`: aozora + 95% → true; aozora + 94.9% → false; ai-generated + 80% → true; 79.9% → false; 0-kanji text → true.
- `getTrainerRank`: 0 → level 1; 50 → level 2; 2136 → level 25; all 25 boundary values.
- `getStreakState`: no reviews → 0/0; 10 consecutive → streak 10 / shields 1; miss with shield → preserved; miss without → reset; 20 consecutive → capped at 2 shields.
- `getDōjōKanji`: all themed in studied → up to 20 returned; only 5 themed in studied → supplements to 10 minimum; sorted by JLPT level.
- `getBattleUnlockStatus`: all conditions met → isUnlocked true; one unmet → false with correct per-condition status.
- `getBattleRank`: scores at exact thresholds return expected rank; below 初伝 → not yet ranked.
- `getFrontierZone`: no lessons → null; one lesson zone 3 → zone 3; lessons in zones 3/7/15 → zone 15; non-contiguous → highest zone_order wins.
- `isInSight`: trainer facing right, avatar 2 tiles to the right → true; avatar behind → false; avatar out of range → false; avatar on same tile → true.
- `getActiveTrainers`: 5 due cards → 5 trainers with "!" in correct zone; 0 due cards → 0 "!" trainers; more due cards than ⚙8 cap → only ⚙8 rendered.
- `getCSKanjiAbilities`: 水 not mastered → no surf; 水 mastered → surf unlocked; 刀 mastered → cut unlocked; none mastered → empty set.
- `getHPValues`: mastered 50 themed kanji → playerHP scaled to ⚙100; opponent HP = fixed per battleConfig.
- `getKanjiInTheWild`: kanji present in Tatoeba corpus → returns valid `{ jp, en }` pair; kanji absent from Tatoeba → falls back to JESC filtered pool; result always has non-empty EN.
- `getJlptDifficultyPool`: studied set with N1×2, N3×1, N5×3 → returns N1 first, then N3, then N5; unranked kanji last; respects `targetCount` cap.

---

## Out of Scope

- Stroke order animation.
- NHK Web Easy full-text scraping (URLs available in nhkore; scraping script deferred to v2).
- Social features (leaderboards, sharing progress).
- Native iOS/Android app via Capacitor (PWA for v1).
- Graph visualisation of kanji network (v2).
- Multiple user accounts.
- Offline-first mode.
- Zone-based dynamic lesson music (v2 — architecture present, content not).
- Battle Coins / cosmetic shop (v2).
- Multiplayer or co-op battles.
- Kanto post-game expansion (v2 — SS Aqua route architecturally present, destination not built).
- Pokéwalker / step counter integration (v2 — requires native health API bridge).
- Two-phase missions. Missions are single-phase: objective → self-grade → Fukuda reacts.
- Mini-game high scores on profile. Scores accumulate for Pokéathlon shop only.
- Shield Fragment reward for Daily Challenges.

---

## Further Notes

**On assets and copyright:** HGSS sprites, music, and sounds are Nintendo intellectual property. This app is a personal learning tool, not a commercial product, and will not be distributed publicly.

**On the AI content generation pipeline:** The batch generation of etymologies, mnemonics, lessons, NPC dialogues, and Rocket event dialogues is a one-time offline step. Quality is the most important variable in whether the app is enjoyable. Review a sample before importing all 2136.

**On the data pipeline order:** Import scripts run before any Next.js development. The schema is the contract between the pipeline and the app. Define and seed first.

**On the map as new home screen:** The previous "dashboard" design (Hero / Action / Stats zones) is dissolved into the map HUD and the Profile tab. The map is not a page you navigate to — it is the page you are always on. All new features must be anchored to a building or landmark on the map, not to a standalone route.

**On the "!" system and SRS rhythm:** The "!" system does not force the player to clear all due reviews in one sitting. A player can walk around trainers, use the Pokémon Center's direct mode for a quick sweep, or simply leave trainers standing and come back. The map accommodates all play styles. The SRS engine is unchanged — it simply uses map position as its presentation layer.

**On Team Rocket as narrative arc:** Team Rocket events are not difficulty spikes — they are story beats. The kanji themes of each event are chosen for thematic resonance (Proton's event uses kanji of manipulation, Archer's uses kanji of power) not for difficulty. A player at the appropriate map zone will have the relevant kanji in their studied set.

**On zero content maintenance:** All content is generated or written once before launch. The Supabase Edge Function for Daily Challenges is the only runtime content generation. The game runs indefinitely without content updates.

**On the endgame:** After Red (level 25, 2136 kanji studied), trainer progression is complete. The map enters a post-journey state: the Red sprite remains, the EXP bar is replaced by a "深く定着" counter tracking kanji where both cards have FSRS stability ≥ 90 days. Fukuda continues periodic alumni messages. All 道場 battles remain replayable. All Rocket events remain visible (cleared). The trainer at the summit of Mt. Silver still stands in the snow, looking out. The garden does not close — it just stops having walls.

**On learning:** The user is learning to code through this project and wants to understand architectural decisions at each step. Implementation should proceed incrementally with explanation.

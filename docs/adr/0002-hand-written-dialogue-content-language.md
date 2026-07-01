---
status: accepted
---

# Hand-written dialogue content language: English

Project memory held a "Content language: English" decision, but it was originally set for content sourced from English-only data (JMdict, Hanabira examples). All the design docs themselves (PRD, curriculum-checkpoints, guidebook-adapted) are written in French, and the project owner is a French native speaker — so it was genuinely ambiguous whether hand-written narrative dialogue, which isn't sourced from any English dataset, should default to French instead.

**Decision:** hand-written dialogue translations (the `en` field on each Dialogue State page) are English — same as JMdict/Hanabira-sourced content, confirmed explicitly by the project owner.

**Why:** a single content language avoids two different translation conventions living side by side in the same `lessons`/`texts`/dialogue data, even though the design docs that describe the system stay in French.

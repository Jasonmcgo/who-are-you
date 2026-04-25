# Question Design Standard

## Purpose

Define how questions are constructed so that every question produces meaningful, traceable signals that can be used for interpretation and tension detection.

---

## Required Structure

Every question must define:

- card_id
- question_id
- type (forced | scale | ranking | freeform)
- question_text
- answer_options (if applicable)
- signals (one or more signal_ids produced by each answer option)
- pressure_level (low | medium | high)
- provenance_notes (optional context for interpretation)

---

## Signal Mapping Rule

Every answer option must map explicitly to one or more signal_ids.

No answer option should exist without a defined signal outcome.

Signals must be:
- deterministic (no guessing)
- traceable to a specific question_id
- consistent across the system

If an answer does not produce a signal, the question is incomplete.

---

## Question Quality Principles

Questions should force meaningful tradeoffs where appropriate.

Avoid:
- vague agreement
- moral signaling
- political labels
- therapy language
- questions where every answer sounds virtuous

Prefer:
- tradeoffs
- cost
- pressure
- ranking
- lived behavior
- freeform explanation

---

## Clarity Rule

If a user can select an answer without meaningfully revealing something about themselves, the question is too weak.

---

## Paired Question Rule

Some tensions require paired questions.

One question may capture present reality.  
Another may capture desired orientation, latent preference, or pressure-state behavior.

Example:

- Q-A1 captures current behavior: what the user actually spends time doing
- Q-A2 captures latent direction: where energy would go if obligations were lighter
- T-006 detects the gap between creator energy and maintainer/reaction reality

Canonical rule:

A tension should not be forced from a single question when the tension requires comparison between two different states.

---

## Pressure Design Principle

Questions should, where appropriate, introduce cost or consequence.

Good questions expose:
- what the user chooses when values collide
- what changes under pressure
- what remains stable under cost

---

## Freeform Rule

Freeform questions must still produce signals.

Even open-ended responses should be designed with:
- intended signal categories
- extraction pathways (manual or AI-assisted)
- clear interpretive purpose

Freeform questions are not unstructured—they are higher-resolution inputs.

---

## Canonical Rule

A question is not valid unless:
1. It produces at least one meaningful signal
2. That signal can be used in tension detection or interpretation
3. The answer reveals something non-obvious about the user
# Freeform Signal Extraction (Canonical)

## Purpose

Define how freeform (open-ended) responses are converted into structured signals without losing nuance.

Freeform input should increase resolution, not introduce ambiguity.

---

## Core Principle

Freeform responses are not exempt from structure.

They must still produce:
- signals
- provenance
- traceability
- user-confirmable interpretation

---

## Input Type

Freeform inputs are defined as:

```json
{
  "input_id": "string",
  "card_id": "conviction | formation | etc",
  "type": "freeform",
  "question": "string",
  "response": "string"
}
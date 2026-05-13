// CC-GRIP-TAXONOMY — server-only API endpoint for the runtime LLM
// Grip paragraph fallback. Mirrors `app/api/synthesis3/master-paragraph`.

import { NextResponse } from "next/server";
import type { GripParagraphInputs } from "../../../../lib/gripTaxonomyLlm";
import { lookupOrComputeGripParagraph } from "../../../../lib/gripTaxonomyLlmServer";

export const runtime = "nodejs";

const VALID_PRIMALS = new Set([
  "Am I safe?",
  "Am I secure?",
  "Am I loved?",
  "Am I wanted?",
  "Am I successful?",
  "Am I good enough?",
  "Do I have purpose?",
]);

function isGripParagraphInputs(value: unknown): value is GripParagraphInputs {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.primary === "string" &&
    VALID_PRIMALS.has(v.primary) &&
    Array.isArray(v.contributingGrips) &&
    typeof v.lensDominant === "string" &&
    typeof v.movementQuadrant === "string" &&
    Array.isArray(v.topCompass) &&
    (v.riskFormLetter === null || typeof v.riskFormLetter === "string") &&
    (v.secondary === undefined || typeof v.secondary === "string")
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 }
    );
  }
  if (!isGripParagraphInputs(body)) {
    return NextResponse.json(
      { error: "body does not match GripParagraphInputs shape" },
      { status: 400 }
    );
  }

  const paragraph = await lookupOrComputeGripParagraph(body);
  return NextResponse.json({ paragraph });
}

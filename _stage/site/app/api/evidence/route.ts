import { connection } from "next/server";
import { guarded, swayEvidence } from "@/lib/server/sway-api";

// Benchmark rows, read from the results/ folder by the Sway API on every call.
export async function GET() {
  await connection();
  return guarded(swayEvidence);
}

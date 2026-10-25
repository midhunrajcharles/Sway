import { connection } from "next/server";
import { readLedger } from "@/lib/server/sway-api";

// Every agent purchase that went through PayPal, newest first.
export async function GET() {
  await connection();
  const orders = await readLedger();
  return Response.json({ orders: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
}

import { connection } from "next/server";
import { guarded, swayTasks } from "@/lib/server/sway-api";

// Shopping tasks with their real Channel3 products, and the test webs the API can serve.
export async function GET() {
  await connection();
  return guarded(swayTasks);
}

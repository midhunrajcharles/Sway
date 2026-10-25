import { guarded, swayVerdict } from "@/lib/server/sway-api";

// ?task=&condition= → the full Sway check for one purchase: verdict, x-ray, pages, sentence.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const task = q.get("task");
  if (!task) return Response.json({ error: "task is required" }, { status: 400 });
  return guarded(() => swayVerdict(task, q.get("condition") ?? "clean"));
}

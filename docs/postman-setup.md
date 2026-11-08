# Postman public workspace — publishing steps

Collection: `docs/sway.postman_collection.json` (v2.1, 7 requests, variables `baseUrl`, `task`, `condition`).
Covers the six routes in `docs/openapi.yaml`: health, tasks, results (latest and named run), evidence, pick, verdict.

1. In Postman: **Import** → pick `docs/sway.postman_collection.json`.
2. Set the collection variable `baseUrl` to `https://sway-api.onrender.com` (or keep `http://127.0.0.1:8787` for local runs).
3. Create a **Team/Public workspace** named "Sway API" (Workspaces → Create workspace → Visibility: Public). Move the collection into it.
   Public workspaces require a Postman account; the visibility setting may be restricted by your team plan.
4. Check nothing private is in the collection (no keys; the file has none).
5. Copy the workspace URL (`https://www.postman.com/<handle>/workspace/sway-api`) and replace the placeholder in `README.md`.
6. Optional: **Fork/Run in Postman** button from the collection's Share menu.

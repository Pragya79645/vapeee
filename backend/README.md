Clover integration

This backend includes a lightweight Clover integration service at `services/cloverService.js`.

Environment variables required (optional - if you don't want Clover sync, leave them unset):

- CLOVER_API_TOKEN  (API token)
- CLOVER_MERCHANT_ID (merchant id / account id used in Clover API paths)

Endpoints:

- POST /api/admin/sync/clover  (admin only) - triggers a one-time pull from Clover to upsert items and orders into the local DB.
	- Optional body/query param: `mode` - `pull`, `push`, or `both`. Default: `both`.
		- `pull` - only pulls items, orders and categories from Clover to local DB
		- `push` - only pushes local product data (create/update) into Clover
		- `both` - do both pull & push in sequence

Notes:
- Product create/update/delete operations try to push changes to Clover in a best-effort (non-blocking) manner.
- Clover API shapes vary across installations; the service uses conservative mappings and may need adjustment for your Clover account.
- If your Node version <18, `node-fetch` is used as a fallback.

Usage:
- Set environment variables in `backend/.env` and restart the server.
- Call the sync endpoint while authenticated as admin to import items/orders from Clover.

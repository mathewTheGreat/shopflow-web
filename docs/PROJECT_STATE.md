# ShopFlow Project State

**Status snapshot:** 16 November 2026  
**Purpose:** A conversational handoff for someone continuing ShopFlow work. Treat this as a dated snapshot, not a guarantee that production or the database still has the same state.

## What ShopFlow is

ShopFlow is a retail and dairy-shop management system for sales, shifts, stock, production, expenses, payments, and reporting. The workspace contains three separate Git repositories:

| Repository | Main responsibility | Current task scope |
|---|---|---|
| `shopflow-web/` | Next.js browser application | In scope for recent feature and report work |
| `shopflow-api/` | Express/TypeScript API, Drizzle ORM, Neon PostgreSQL | In scope for business logic and data integrity |
| `shopflow-mobile/` | Expo/React Native application | Out of scope for recent work; do not assume it is supported or current |

The workspace root is not a Git repository. Each application repository has its own branch and working tree. The API and web repositories were both on `v1.0.2` at the time of this snapshot.

## How the system fits together

- The web client uses Clerk authentication and calls the API.
- The API owns business rules and persists data through Drizzle to PostgreSQL hosted on Neon.
- Shift, inventory, and financial reports combine records from multiple tables. A visible expense record does not by itself guarantee that the matching financial ledger entry exists.
- Shift corrections are intended to preserve the original activity and its audit history. Use the correction/reversal workflows rather than directly editing or deleting posted records. See [`shift-correction-guide.md`](./shift-correction-guide.md).

Relevant technology versions at the last manifest inspection: Next.js 16 / React 19 in the web app; Express 5, TypeScript, Drizzle ORM, and Neon in the API. Clerk provides web/API authentication.

## Verified work and current findings

### Expense posting and historical ledger gaps

Financial Breakdown gets its Expenses (Pay-Outs) figure from ledger entries. Expenses can therefore appear in the expense list while being absent from that report if the ledger leg is missing.

The API source has been changed to batch expense, shift pay-out, and ledger posting, with same-ID retry handling. The historical repair utility is [`shopflow-api/scripts/repair-expense-ledger.cjs`](../../shopflow-api/scripts/repair-expense-ledger.cjs). Its behavior is documented in [`shopflow-api/API_DOCUMENTATION.md`](../../shopflow-api/API_DOCUMENTATION.md).

A read-only dry run against the confirmed mirror configuration (`.env`) most recently reported:

| Dry-run result | Count |
|---|---:|
| Posted expenses scanned (all dates) | 2,027 |
| Eligible missing expense ledger legs | 1,501 |
| Missing-ledger expenses skipped for unsupported/missing tender | 366 |
| Expenses with an existing ledger leg, skipped for review | 160 |

The dry run made no database changes. Earlier repair activity was interrupted and completion is not established; these current counts still show 1,501 eligible gaps. There were also 1,791 expense payout movements reported as not linked to an expense. Do not equate these counts or automatically pair those movements with expenses: investigate the existing records and matching rules before any repair or source replay.

**Before any historical repair:** rerun the dry run for the exact target and date range, inspect skips and payout relationships, then obtain explicit authorization before using `--apply`. The script requires the exact database name as confirmation. Never assume `.env` means live or mirror; verify the target without exposing credentials.

### Opening float

A source-path fix for opening-float recording was implemented in the API shift-creation flow. The known implementation entry point is `shopflow-api/src/services/shift.service.ts` (`createShiftWithOpeningFloat`). The recurrence was a concern; do not represent it as conclusively resolved in production without reviewing deployment behavior and new records.

### Shift Performance Report

For the reported 3 November 2026 shift:

- Late stock-take corrections entered after the original shift had been incorrectly included in that shift's stock projection and movement lines. The API report logic now excludes `LATE_CORRECTION` from those calculations.
- Historical item sales were using current catalog prices. The API now returns stored sale-line totals, and the web report uses those totals.
- The report was checked against mirror and live at the time: item sales matched the payment-method split at KSh 30,872, and late-correction movement lines were absent.
- A Raw milk variance of -1 remained and was not explained by those fixes.

The API implementation is in `shopflow-api/src/services/shiftreconciliation.service.ts`; the web display is in `shopflow-web/components/reports/ShiftPerformanceDialog.tsx`.

For the reported 14 November 2026 second shift, opening stock for Pasteurized milk and Raw milk included late sales and purchase receipts attributed to an earlier 12 November shift that had entered correction review. Those records had 14 November `occurred_at` timestamps, so the opening calculation treated them as physical inter-shift movements even though they belonged to another shift. The API opening-stock helper now excludes records with `original_shift_id` set from inter-shift movement projection. A read-only mirror check returned openings of 290.4 Pasteurized milk and 8.7 Raw milk, matching the prior shift's counted balances. This verifies the source behavior against the mirror; production deployment and the remaining closing variances are not established by this check.

### Browser report-query error

A browser error showed a failed query on `stock_transactions` for a specific shift. The exact query and full Shift Performance report both succeeded against mirror and live during investigation. The client error wrapper did not expose the database/network cause, so the incident was not conclusively diagnosed. If it recurs, capture API/deployment logs and the underlying error cause, request ID, and timestamp; do not infer a schema failure from the client wrapper alone.

### Reports and correction behavior

The web Reports area includes Expenses and Customer Payments reports. A manager shift filter was also requested for expense reporting. Verify the current UI and role behavior before extending these features.

## Open follow-ups

1. Determine the real cause of recurring opening-float omissions from production evidence and verify that the source fix prevents recurrence.
2. Plan an auditable correction workflow for expense ledger gaps and a safe historical repair. Investigate orphan payout movements and the expense-to-ledger attribution rules first.
3. If the stock query error returns, obtain the underlying deployed API/database error rather than relying on the browser wrapper.
4. Revisit the remaining Raw milk variance against source records if it is still operationally relevant.
5. Continue bank-attribution analysis only with the relevant records and current business rules in view; avoid assuming expense attribution is identical to bank attribution.

These are follow-ups, not claims that the underlying issues are currently occurring in every environment.

## Working-tree and safety notes

At the last status check, the API had a local modification in `src/services/shiftreconciliation.service.ts`, and the web app had a local modification in `components/reports/ShiftPerformanceDialog.tsx`. Preserve these changes; do not reset, overwrite, or assume they are committed.

The mobile repository also had unrelated local changes and an untracked component at the time of the snapshot. Mobile work is out of scope here; do not alter or clean up that working tree.

Use the mirror for investigations when authorized and keep queries read-only unless a specific repair has been reviewed and approved. Do not put database URLs, tokens, customer details, or other secrets in this document, logs, or commits. The mirror counts above are aggregate, point-in-time results and should be refreshed before acting on them.

## Useful entry points and checks

- Web README and project notes: [`README.md`](../README.md), [`docs/`](.)
- Shift correction guidance: [`shift-correction-guide.md`](./shift-correction-guide.md)
- API business logic: `shopflow-api/src/services/`
- Expense repair: `shopflow-api/scripts/repair-expense-ledger.cjs`
- API documentation: `shopflow-api/API_DOCUMENTATION.md`

From `shopflow-api/`, `npm run build` performs the TypeScript build. Targeted projection checks include `npm run test:inventory-report-projection` and `npm run test:production-amendment-projection`. From `shopflow-web/`, use `npm run lint` for ESLint; the package does not define a separate type-check script.

## How to resume

1. Check `git status --short --branch` separately in the web and API repositories; preserve existing local changes.
2. Confirm which environment is being investigated and whether the request is read-only or explicitly authorizes a repair.
3. Read the relevant service and report paths before changing business logic. For historical data, run and review a dry run first.
4. Validate the focused API behavior and the corresponding web presentation. Update this document when verified state materially changes, and keep unresolved causes labeled as unresolved.

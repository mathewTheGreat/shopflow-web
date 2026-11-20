# Shift Correction Coverage Matrix (Web and API; Mobile Excluded)

This matrix compares the existing cashier-led and manager-led correction paths by
business entity. It describes code paths found in the repository; it does not
claim that every path has passed an end-to-end test against a live database.
“Cashier” means the user responsible for the shift. “Manager” includes users
recognized by the API's manager/admin or correction-review permissions where
noted.

## Current workflow at a glance

- Both roles use the same **Approvals → Corrections** tab and guided correction
  panel. A manager can open it preselected to a pending or rejected shift from
  the manager's review card; a cashier is limited in the UI to their own shifts.
- Non-manager case lists are filtered to cases created by that user. A case
  created by a manager is therefore not currently visible in the cashier's
  case list, even when it concerns that cashier's shift.
- A guided case stores a responsible shift and optional recording shift. The
  actions generally attribute changes to the responsible shift and keep the
  recording shift separately.
- Managers can create cases, but entity services do not consistently grant
  manager-recorded corrections. Production batch amendments explicitly require
  the responsible cashier.
- Saving a case action applies business mutations immediately. The case is
  subsequently submitted for review. In the shift-approval path, approving the
  shift finalizes pending correction cases; the UI does not provide a separate
  case-by-case finalization step.
- The guided workflow is feature-flagged. Some older correction tools remain
  visible in the Corrections tab even when legacy API routes are guarded.

## Specific business-event coverage: omissions and incorrect additions

This inventory makes the correction direction explicit. **Omitted** means a
business event should be on the responsible shift but was never recorded.
**Incorrectly added** means a duplicate or invalid event was posted. When an
event exists but its facts are wrong, the current pattern is generally to
reverse/void it and add a corrected replacement, not silently edit history.
Coverage below means an action is represented in the guided workflow; it does
not guarantee every entity service currently authorizes both roles.

| Specific business event | If omitted / missing | If incorrectly added / duplicate | Cashier workflow | Manager workflow |
|---|---|---|---|---|
| **Sale (item, quantity, price, sale category)** | `LATE_SALE` records the sale and its item/payment details against the responsible shift. | `VOID_SALE`; for wrong facts, void the source sale and add the corrected sale. | Can use the guided action for their own eligible shift. | Same action can target another eligible shift; verify service authorization. |
| **Sale tender / payment allocation** | Tender is entered as part of `LATE_SALE`; there is no separate guided late-tender action. | `VOID_SALE` reverses posted payment rows with the sale; add a corrected sale/payment allocation if needed. | Correct through the sale action, not a standalone payment-row correction. | Same limitation; inspect cash/M-Pesa and customer-account effects. |
| **Expense / payout** | `LATE_EXPENSE` records the missing expense. | `VOID_EXPENSE`; add a replacement expense separately if valid. | Guided action and some legacy late-expense path. | Same guided/legacy paths; entity-service authorization can differ. |
| **Cash or M-Pesa movement, including transfer-group legs** | `LATE_CASH_MOVEMENT` records a late movement. | `REVERSE_CASH_MOVEMENT` creates compensation; use the group-aware reversal for transfers. | Guided actions are shown; linked expense movements must be corrected through the expense. | Same guided actions; verify manager authorization and all transfer legs. |
| **Opening float (cash or M-Pesa)** | `LATE_OPENING_FLOAT` declares a missing float. | No dedicated opening-float void action is listed in the correction catalog; use the appropriate movement correction only after confirming baseline semantics. | Guided and legacy declaration paths exist. | Same guided action; legacy API allows manager or responsible cashier. |
| **Customer-account payment / transaction** | `LATE_CUSTOMER_TRANSACTION` records a missing customer payment. | `REVERSE_CUSTOMER_TRANSACTION`; for wrong facts, reverse then add the corrected transaction where supported. | Guided action is available; service authorization should be checked. | Same action can target another eligible shift; service authorization should be checked. |
| **Supplier delivery (supplier stock-in)** | A late stock-in can be represented by `LATE_STOCK_TRANSACTION`, but the guided form has no distinct **supplier delivery** event type; supplier linkage is currently exposed through its farmer-purchase entry mode. | `REVERSE_STOCK_TRANSACTION` can reverse an existing stock transaction, subject to eligibility. | No clearly named delivery-specific correction flow; verify whether the generic/farmer-purchase path preserves delivery identity and supplier details. | Same limitation; manager authorization and delivery-specific audit/report attribution need end-to-end verification. |
| **Farmer purchase / purchase receipt** | The late stock-entry form has a farmer-purchase mode (`LATE_STOCK_TRANSACTION`) and supplier/farmer selection. | `AMEND_PURCHASE_RECEIPT` can amend or void an eligible existing purchase receipt; generic reversal is not the supported route for amended receipts. | Guided actions are shown; check the underlying purchase service authorization. | Same case actions are offered, but manager access must be verified per service. |
| **Other stock movement (stock-in/out, waste, damage, loss, manual adjustment)** | `LATE_STOCK_TRANSACTION` records a missing movement with direction and quantity. | `REVERSE_STOCK_TRANSACTION`; for wrong facts, reverse then record the corrected movement. | Guided actions are available; movement changes live stock. | Same actions; verify target-shop/shift authorization and operational impact. |
| **Physical stock count / stock take** | `RECORD_STOCK_TAKE` records a late/corrected count. | A corrected count supersedes the earlier count; no separate duplicate-count reversal action is listed. | Guided case action is shown; the older corrections area also has a count tool. | Same action; resolve the report-only vs live-stock behavior before relying on its scope label. |
| **Closing cash/M-Pesa count (reconciliation)** | `LATE_RECONCILIATION` records a missing closing count. | `AMEND_RECONCILIATION` creates a corrected revision rather than deleting the earlier count. | Guided actions and a legacy cash-count form exist. | Same actions; compare corrected counts with recalculated expected totals. |
| **Bank deposit / register transfer** | `ATTRIBUTE_BANK_DEPOSIT` attaches an existing, previously unattributed deposit to the responsible shift; it does not create a missing deposit. | Cash Register has a deposit reversal path; it is not the same as shift attribution and may run outside the correction case. | Can start eligible attribution cases; standalone reversal behavior is separate. | Same attribution action and separate reversal path; ensure reversal reopens/reviews the affected shift. |
| **Physical cash or stock difference** | `RECORD_PHYSICAL_ADJUSTMENT` records a real, evidenced difference; this is not a substitute for an omitted ordinary transaction. | No duplicate-specific void is exposed in the guided catalog; a compensating physical adjustment requires an explicit, evidenced decision. | Not available to non-managers. | Manager-only guided action for cash or stock. |
| **Production batch inputs / outputs** | `RECORD_MISSING_PRODUCTION_BATCH` creates a finalized batch with linked input/output stock transactions, attributed to the responsible shift and separately marked with the recording shift. Managers can choose report-only or operational stock adjustment. | Dedicated batch amendment can correct existing inputs/outputs; manager execution is currently blocked by cashier-only service authorization. | No manager-only missing-batch action; existing batch editor is separate. | The guided case flow records the missing batch and routes the shift for review; insufficient stock blocks operational adjustment, while report-only leaves current stock levels unchanged. |

## Entity-by-entity matrix

| Entity / business event | Cashier correction workflow | Manager correction workflow | Responsible-shift reporting and related records | Gaps / risks to resolve |
|---|---|---|---|---|
| **Sale and tender** | Guided case: add a missing sale (`LATE_SALE`) or void a sale (`VOID_SALE`), then submit. The same panel is shown to cashiers. | Same actions and panel; manager can select another eligible shift. | A late sale and its payment rows carry the original/responsible shift, with the recording shift stored separately. A sale void marks the sale and its posted payments voided, reverses eligible stock-out rows, offsets linked customer-account debits, and posts compensating ledger entries. Shift sales reports filter posted sales by shift. Correction-case reversals now pass the recording shift through stock, customer-account, and cash-ledger compensations. | Multi-table reversal is not one encompassing transaction, so an error can temporarily leave a partial correction. Deterministic compensation IDs and retry paths allow unfinished legs to be resumed; integration coverage is still needed for failures/retries. For source-fact corrections, replacement actions should be explicitly linked to the reversed event. |
| **Expense and payout** | Guided case: add a late expense or void an expense. Legacy individual late-expense tool also remains available for some shift states. | Same guided/legacy entry points; manager can record against a selected shift. | Late expense is attributed to the responsible shift and optionally records which active shift captured it. A posted expense is represented by an expense row, linked shift cash movement, and cash-ledger entry. Voiding changes the expense status, creates a payout reversal, and posts a ledger compensation. Correction-case expense reversals now carry the recording shift on the payout and cash-ledger compensation. | Expense state/movement writes are batched in one service path, but ledger reversal occurs separately. Deterministic/idempotent reversal behavior supports retry recovery, but failure and retry integration tests are still needed. The legacy tool overlaps the case workflow and can have different review/idempotency behavior. |
| **Cash / M-Pesa movement and grouped float transfer** | Guided case: record a late movement or reverse a movement. | Same guided actions. Manager can choose the target shift. | Late movements store responsible and recorded shifts. Reversing a transfer-group movement creates opposite entries for all legs with deterministic IDs and then posts corresponding ledger entries. Expense-linked movements must be reversed through the expense, not directly. | Reversal rows are inserted together, but posting ledger rows happens afterward; failure at that stage can leave missing ledger legs. The UI accepts a pasted movement ID rather than offering an in-context record picker. A user can also choose a movement without seeing the full linked transfer group before submission. |
| **Customer payment / customer account transaction** | Guided case: record a missing customer payment or reverse a customer transaction. | Same actions; manager can create the case for another eligible shift. | Late customer transactions retain the responsible shift and recording shift. Reversal inserts a linked opposite transaction and updates the customer account balance, then posts a ledger effect where applicable. | The reversal spans transaction, cached account balance, and ledger posting; these do not run in one encompassing transaction. A partial failure could make the account balance disagree with history/ledger. Replacement payment linkage is not an explicit UI selection. Reversal authorization appears manager-only in the entity service. |
| **Generic stock movement** | Guided case: record a late stock in/out/adjustment or reverse an existing movement. | Same guided actions. | Late stock rows are attributed to the responsible shift and recording shift. A reversal inserts a linked opposite movement and updates the on-hand stock projection atomically in one SQL statement. Shift stock reports include responsible-shift-attributed rows. | Generic late movements change the live stock projection; confirm that report-only scope is never offered for a movement with operational impact. The UI uses a typed movement form but reversal uses a pasted ID. Eligibility/authorization should be validated against role and target shop/shift consistently. |
| **Farmer purchase / purchase receipt** | Guided case: amend or void an existing purchase receipt; add a late farmer purchase. | Same actions, but manager access must be checked end-to-end for each underlying purchase-correction service. | Purchase amendment records a correction history row, compensation stock transactions, and stock-level deltas. A late purchase stores responsible/recorded shift and can optionally adjust current stock. Existing purchase amendments prevent use of the generic reversal path. | Receipt corrections can involve original receipt, generated stock-take/adjustment rows, correction history, and stock levels. Validate these as one coherent amendment and ensure retry/partial-write recovery. The “adjust current stock” choice changes the effect scope and should be clearly visible to manager reviewers. |
| **Supplier delivery (supplier stock-in)** | `LATE_STOCK_TRANSACTION` can represent a missing stock-in, but the guided form only exposes supplier selection through the farmer-purchase entry mode; it has no distinct supplier-delivery event. | Same limitation; manager execution also depends on the underlying stock-transaction authorization. | Supplier deliveries are stock transactions linked to a supplier and appear in supplier-delivery/stock-movement reporting. Shift attribution and recording-shift reporting must be checked for both normal and late delivery records. | Do not assume farmer purchase and supplier delivery are interchangeable business events. Add a distinct delivery correction path or confirm that the shared stock-in path preserves supplier, delivery/reference, cost, and report semantics. Reversal must compensate stock and retain source linkage. |
| **Stock count / stock take** | Guided `RECORD_STOCK_TAKE` replaces the current count revision for the target shift and is report-only; the legacy late-stock-correction route is a separate path. | Same guided case action; manager can select another eligible shift. | Guided case: a new count revision is attributed to the responsible shift and recording shift, and the previous current revision is superseded; it does not change stock levels. Legacy route: computes counted-minus-live-level deltas, creates `ADJUSTMENT` stock transactions, and updates stock levels. | Keep these paths distinct in manager-facing UX. The legacy route mutates operational stock outside the correction case's effect-scope and review model, and its multiple writes are not uniformly atomic. Ensure managers see whether an action changes only the shift count or also current inventory. |
| **Reconciliation / closing cash counts** | Guided case: amend an existing reconciliation or record a missing one. Older individual “Correct Cash Counts” form also exists for rejected/correction-review shifts. | Same guided action; manager can amend the count directly. | Reconciliation corrections create a new revision, supersede the prior active revision, and retain responsible/recording shift references and reason. Reporting selects the active revision for the target shift. | Revision supersede and insertion are batched in one path, but shift/case status changes may happen separately. The direct legacy form and case workflow differ in audit/case linkage. Validate nonnegative values and compare the changed counts with recalculated expected cash/M-Pesa in manager review. |
| **Bank deposit attribution / deposit reversal** | Guided case can attribute an eligible existing, unreversed deposit to a shift. A cashier is permitted to start eligible cases in the case service, subject to membership. | Same guided action; manager can select the responsible shift. Cash Register separately provides deposit reversal. | Attribution validates the balanced ledger transfer, shift time window, and existing movement; then creates the shift-visible payout and updates both ledger legs' `shift_id` to the responsible shift. The migration adds `recorded_shift_id` to cash-ledger entries. Deposit reversal inserts both inverse ledger legs and, if a till movement exists, a corresponding movement reversal. | Attribution spans movement insertion and ledger-leg update; it can be partially completed if a later step fails. Distinguish **attribution** (existing money, report ownership) from **reversal** (undo transfer on both source/destination accounts). Reversal may be initiated outside the shift correction case, so ensure it flags/reopens the responsible shift for review and appears in its correction audit. |
| **Opening float declaration** | Guided case can declare a missing opening float. A separate legacy opening-float dialog/API path also exists. | Same guided action; legacy API explicitly allows responsible cashier or manager. | The float is reported against the rejected shift as an opening declaration; service comments indicate it should not add money to the shop register position. A movement row is created and ledger posting is invoked, so the opening-float exclusion/baseline logic must remain consistent. | Legacy opening-float route is not covered by the same correction-workflow route guard as other late entries. Guided and legacy behavior may diverge. Confirm exactly how its ledger row is excluded from shop balance but included in shift expected cash, and make retries atomic across cash and M-Pesa declarations. |
| **Physical cash / stock adjustment** | Case creation is explicitly denied to non-managers for `PHYSICAL_ADJUSTMENT`; not a cashier correction action. | Manager-only case/action. Cash posts a ledger adjustment; stock posts an adjustment transaction and updates stock. | Case action is attributed to the responsible shift. Cash records a register account ledger entry; stock records a stock transaction. Impact snapshots include shift financials, stock, and shop cash/M-Pesa before and after. | Cash-ledger insertion and stock mutation paths need consistent correction-case/audit atomicity and strong evidence/reason handling. Validate selected cash account and stock item in the UI rather than relying on opaque IDs. Impact capture is best-effort after the action, so a failed capture leaves the correction applied but its before/after delta incomplete. |
| **Production batch inputs / outputs** | The guided case supports an amendment action with a batch selector and editable input/output quantities. The dedicated batch UI also exposes “Correct Batch.” | Managers can launch a correction from shift review and use the case action; backend access allows the responsible cashier or a shop manager/reviewer. Shift approval remains a separate review step. | Batch amendment records before/after lines and totals and can post compensating stock transactions when the correction case's effect scope is operational. Responsible shift is derived from original/finalized/start shift; the case's recorded shift is now passed to the amendment and compensation rows. | The original cashier-only authorization dead end and incorrect recorded-shift attribution are fixed in the case path. Changes still span idempotent writes rather than one database transaction; failure/retry behavior and report attribution need targeted integration coverage. The dedicated non-case editor remains a separate path and should be consolidated later. |

## Cross-cutting issues that affect the matrix

1. **Correction case vs. entity authorization.** Case creation allows the
   responsible cashier or a manager, but action execution calls entity services
   with their own authorization rules. Some void/reverse methods require
   manager permissions; production amendments require the responsible cashier.
   The matrix therefore distinguishes an action being shown in the UI from an
   action being executable by that role.
2. **Case visibility is creator-based for non-managers.** A cashier may not see
   a correction case entered by a manager for the cashier's shift. Decide
   whether those cases should be shared read-only with the responsible cashier.
3. **Attribution has two meanings.** The responsible shift is where the event
   belongs for shift reporting; the recorded shift identifies where/when a late
   correction was entered. Review both fields in reports. Deposit attribution
   is a special case because it updates existing ledger legs rather than
   creating a new economic transfer.
4. **Side effects are not uniformly atomic.** Some paths use single SQL
   statements or batched writes; others make a sequence of service/database
   calls. Several reversal paths use deterministic IDs and can resume missing
   compensation legs on retry, but a failed request can still leave a temporary
   partial state until it is retried and verified.
5. **Review and correction are coupled at shift level.** Case actions are
   applied before submission. Approval requires unresolved editable cases to
   be submitted, and shift approval finalizes all pending-review cases for that
   shift. There is no separate per-case review UI on the manager card today.
6. **Workflow cutover is inconsistent.** The case API uses
   `SHIFT_CORRECTION_CASES_ENABLED`; legacy correction routes are guarded
   selectively, while the Corrections tab still renders individual tools.
   Confirm the active deployment flag separately; do not infer it from this
   source matrix.

## Suggested review order

1. Make the guided report-only stock-count correction and legacy operational
   stock correction visibly distinct; decide whether the legacy path should be
   migrated into the case/review workflow.
2. Decide the desired manager authorization policy per entity; remove the
   production cashier-only dead end if managers are expected to record batches.
3. For each multi-entity correction, enumerate source, compensation, projection,
   and ledger rows and define atomic/retry behavior.
4. Confirm responsible/recorded shift attribution in every relevant report
   query, especially deposits, reversals, counts, and production amendments.
5. Consolidate the visible workflow only after the intended behavior in this
   matrix is agreed.

## Source pointers

- Guided action catalog, forms, case submission, and impact display:
  [CorrectionCasePanel.tsx](../components/shifts/CorrectionCasePanel.tsx)
- Shift selection and overlapping legacy tools:
  [CorrectionsTab.tsx](../components/shifts/CorrectionsTab.tsx)
- Manager review card and correction-case display:
  [approvals/page.tsx](../app/approvals/page.tsx)
- Correction-case permissions, attribution, action dispatch, and audit records:
  [shiftcorrectioncase.service.ts](../../shopflow-api/src/services/shiftcorrectioncase.service.ts)
- Action-scope and source/replacement pairing rules:
  [shiftcorrection.policy.ts](../../shopflow-api/src/services/shiftcorrection.policy.ts)
- Shift correction guide:
  [shift-correction-guide.md](./shift-correction-guide.md)
- Cash-ledger recorded-shift migration:
  [0047_shift_recorded_deposit_reporting.sql](../../shopflow-api/drizzle/0047_shift_recorded_deposit_reporting.sql)

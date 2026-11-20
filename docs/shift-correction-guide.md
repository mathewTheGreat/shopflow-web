# Shift Correction Guide

Use this guide when a closed or in-progress shift contains a mistake that affects
cash, sales, stock, production, or the shift reports. The goal is to correct the
underlying record, keep the original action auditable, and have the responsible
shift reviewed again when the correction changes its results.

## Before making a correction

1. Identify the **responsible shift**: the shift where the sale, expense,
   movement, count, or production activity actually belongs.
2. Check the original entry and the relevant report before changing anything.
   Record the correct value and why it differs.
3. Use a correction or reversal action, not a second ordinary entry intended to
   cancel the first. Do not edit or delete database records directly.
4. Enter a clear reason. State what was wrong and what evidence supports the
   corrected value (for example, a receipt, till count, or production sheet).
5. After saving, check the shift's correction/approval status and review the
   relevant report. A correction does not itself mean that the shift has been
   approved.

Corrections are attributed to the responsible shift even when recorded later.
The system keeps the correction time and the correction record so the original
and its history can be distinguished.
For shift financial totals, the recording shift is audit metadata rather than a
second attribution; bank deposits remain visible to the shift that made the
register transfer.

## Manager-recorded corrections

From **Approvals**, select **Correct shift** on a pending shift or **Correct
this shift** on a rejected shift. This opens the Corrections tab with that
shift selected; verify the cashier and shift dates before recording anything.
Choose the specific missing, duplicate, or incorrect business event, provide a
reason and evidence, and review whether the correction changes operational
stock or cash balances.

Recording a correction is not approval. Return to the shift review after the
correction is saved, inspect the updated correction history and reports, then
make the explicit approve/reject decision. A manager may perform both steps,
but approval must remain a separate action after review.

## Common scenarios

| What happened | What to do | What to verify |
|---|---|---|
| A sale was omitted and entered after the responsible shift closed | Record the sale through the late-entry/correction workflow and select the shift it belongs to. Do not put it on the current shift just because that is when it was entered. | The original shift's sales and expected cash/M-Pesa should recalculate. For a stock item, its expected closing and variance should also reflect the sale. |
| A sale was recorded with the wrong item or quantity | Use the sale's correction/void action, with a reason, then record the correct sale against the responsible shift. Avoid leaving both the wrong and corrected sale posted. | The wrong sale should no longer count as posted; the corrected sale should appear once in the responsible shift's financial and stock figures. |
| A sale was recorded with the wrong tender/payment | Correct or reverse the incorrect sale/payment using its available correction action, then record the correct tender. | Check the cash and M-Pesa expected amounts separately, and confirm the sale is not counted twice. |
| A posted sale must be cancelled | Use the sale reversal/void action and provide the reason. A reversal preserves the original and appends compensating entries; do not enter a fake sale to offset it. | Confirm the sale is no longer included in posted-sales reports, the reversal is present in the audit history, and stock/customer balances have been restored as applicable. |
| A posted expense is wrong or should not have been recorded | Use the expense void/reversal action and provide the reason. If there is a valid replacement expense, record it separately with the correct details. | Voided expenses should not appear in expense totals or shift expense listings. Verify the cash/M-Pesa reversal is represented. |
| A cash or M-Pesa movement was forgotten on a closed shift | In the Corrections area, choose the responsible shift, enter the movement type, tender, amount, and a specific reason. | Check the shift's expected cash/M-Pesa and correction-review status. |
| A cash movement was entered with the wrong amount, type, or tender | Reverse the original movement with a reason, then record the correct movement against the responsible shift. | Confirm both the original and its reversal remain visible and their net effect is correct. |
| A bank deposit/register transfer is entirely missing | As a manager, choose **Something was missed → Record a missing bank deposit**, select Cash drawer or M-Pesa, enter the amount and transaction time, and provide a specific correction reason. The time must fall within the selected shift. The action posts linked, balanced ledger legs and a till payout against the responsible shift; it does not rely on an open shift. | Confirm the transfer group appears in the register statement, both ledger legs balance, and the responsible shift's cash/M-Pesa expected balance and bank-deposit line reflect the transaction. |
| The cash or M-Pesa closing count was wrong | In the Corrections area, select the responsible shift, enter the corrected counts, and give a reason. The correction creates a new reconciliation version rather than overwriting the old one. | Review the reconciliation history, confirm the latest version contains the corrected counts and reason, and check that the shift is awaiting correction review where applicable. |
| A duplicate or incorrect bank deposit/register transfer must be voided | In the responsible shift's Corrections area, choose **Remove a duplicate event → Reverse an incorrect or duplicate bank deposit**, select the original transfer, and enter a specific reason. A manager must record the reversal. The correction reverses the complete transfer group, including split-attribution legs. The existing Cash Register **Reverse** action remains available. | Check the correction action and reason, confirm the original remains in the statement with linked compensating entries, and verify drawer/M-Pesa, safe, bank, and affected shift totals. |
| A bank deposit/register transfer has incorrect account or amount details | In the responsible shift's Corrections area, choose **A recorded fact is wrong → Amend a bank deposit**, select the original, then confirm the corrected source account, destination account, and amount. A manager must record the amendment. The action reverses the full original transfer and posts a corrected transfer linked to the same audited correction case; it preserves the original carryover portion and attributes the remaining replacement amount to the responsible shift. | Confirm the original reversal and replacement transfer-group IDs appear in the correction case, verify both transfer groups remain in the register statement, and check account balances and the responsible shift's cash/M-Pesa totals. |
| A stock count on a shift was wrong | Enter a corrected stock count through the stock-take correction workflow for the responsible shift. Correct the count, not the computed variance. If an adjustment is generated, verify its direction and quantity. | Check the count history, adjustment movement, expected closing, counted balance, and variance in the shift performance/stock report. |
| A stock transaction (receipt, damage, loss, transfer, or manual movement) was wrong | Reverse the original stock transaction with a reason, then record the accurate transaction if needed. If the mistake is specifically a late stock count, use the stock-take correction workflow instead. | Confirm the original and compensation net correctly and that the responsible shift's report includes the correction. |
| Production inputs or outputs were entered incorrectly | For a shift correction, choose **A recorded fact is wrong → Correct production batch inputs or outputs**, select the batch belonging to the responsible shift, and enter the corrected quantities. Choose report-only or operational stock correction intentionally when starting the case. The dedicated batch editor remains available for the responsible cashier. | Review the amendment's before/after lines and stock-adjustment status. Check production totals and, if stock adjustment was selected, current stock and the responsible shift's expected closing/variance. |
| An entire production batch was omitted | As a manager, choose **Something was missed → Record a missing production batch**. Enter the process, every input and output item and quantity, then provide the correction reason/evidence. Choose report-only to preserve current stock levels, or operational adjustment to consume inputs and add outputs to current stock. | Confirm the finalized batch and its linked input/output transactions appear under the responsible shift in production and shift reporting. Check the recording shift attribution and verify operational stock was adjusted only when selected. |

## Correction review and approval

When a correction affects a shift that was already approved or rejected, the
system may move it to **Pending Correction Approval**. This makes the revised
shift available for the normal review process. A reviewer should:

1. Read the correction reason and inspect the original and corrected records.
2. Compare the recalculated financial and stock reports with the supporting
   evidence.
3. Approve the shift if the correction is supported, or reject it with a clear
   explanation if it is not.

Do not treat **Pending Correction Approval** as final approval. Some corrections
to an already pending shift leave it in the existing review queue.

## Report checks after a correction

Check only the reports affected by the correction, but check both sides of any
related stock or money movement:

- **Sales or tender correction:** sales totals, expected cash, expected M-Pesa,
  and (for stock items) expected closing and variance.
- **Expense or cash movement correction:** shift financial summary, cash/M-Pesa
  expected amounts, and expense totals where relevant.
- **Stock or production correction:** production input/output lines, stock
  movements, expected closing, counted balance, and variance.
- **Deposit reversal:** the source and destination register account balances,
  statement history, and any shift till movement affected by the deposit.
- **Reconciliation correction:** actual counts, latest reconciliation version,
  variance, and correction-review status.

If a report still looks wrong, capture the responsible shift, record IDs, report
name, and the correction reason, then escalate it. Do not add another
compensating transaction until the existing correction has been checked.

## Audit and data safety

- Corrections and reversals should preserve the original record; do not hard
  delete posted activity.
- Keep the reason factual and specific. Avoid generic reasons such as
  "correction" or "mistake."
- A retry after an error should use the existing record/correction flow. Check
  whether the first attempt was saved before submitting another entry.
- These workflows are intended to work with existing shift history. They add
  correction records rather than rewriting historic reports or silently changing
  the original activity.

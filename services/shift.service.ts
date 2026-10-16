import { apiClient } from "@/lib/api-client"
import { Shift, ShiftCashMovement, ShiftReconciliation } from "@/types/shift"
import { FinancialSummaryReport } from "@/types/financial-report"

export const shiftService = {
    // Current shift status
    getCurrentShift: (userId: string, shopId: string) =>
        apiClient.get<Shift | null>(`/api/shifts/current-v2?userId=${userId}&shopId=${shopId}`),

    // Step 1 & 2: Create and Float
    createShift: (data: Partial<Shift>) => apiClient.post<Shift>("/api/shifts", data),

    recordCashMovement: (data: Partial<ShiftCashMovement>) => {
        try {
            console.log(data)
            return apiClient.post<ShiftCashMovement>("/api/shift-cash-movements/v2", data)
        } catch (error) {
            console.log(error)
        }
    },


    // Step 3 & 4: Reconcile and Close
    createReconciliation: (data: Partial<ShiftReconciliation>) => {
        try {
            console.log(data)
            return apiClient.post<ShiftReconciliation>("/api/shift-reconciliation", data)
        } catch (error) {
            console.log(error)
        }
    },


    closeShiftRecord: (id: string) =>
        apiClient.patch<Shift>(`/api/shifts/${id}`, { is_closed: true, end_time: new Date().toISOString(), _last_modified_at: new Date().toISOString() }),

    // Reporting
    getShiftsByShopAndDate: (shopId: string, date: string, endDate?: string, cashierId?: string) => {
        const params = new URLSearchParams({ date });
        if (endDate) params.append('endDate', endDate);
        if (cashierId) params.append('cashierId', cashierId);
        return apiClient.get<Shift[]>(`/api/shifts/shop/${shopId}?${params.toString()}`);
    },

    getShiftsByShop: (shopId: string) =>
        apiClient.get<Shift[]>(`/api/shifts/shop/${shopId}`),

    reverseCashMovement: (id: string, reason: string) =>
        apiClient.post<any>(`/api/shift-cash-movements/${id}/reverse`, { reason }),

    // Late entry corrections (attributed to a prior shift; recordedShiftId is
    // the shift where the correction is entered, so both are retained)
    createLateSale: (originalShiftId: string, userId: string, payload: { saleData: any; items: any[]; payments: any[] }, recordedShiftId?: string) =>
        apiClient.post<any>(`/api/shifts/${originalShiftId}/late-entries/sales`, { userId, recordedShiftId, ...payload }),

    createLateExpense: (originalShiftId: string, userId: string, expenseData: any, recordedShiftId?: string) =>
        apiClient.post<any>(`/api/shifts/${originalShiftId}/late-entries/expenses`, { userId, recordedShiftId, expenseData }),

    createLateStockCorrection: (originalShiftId: string, userId: string, stockCorrections: any[], recordedShiftId?: string) =>
        apiClient.post<any>(`/api/shifts/${originalShiftId}/late-entries/stock-corrections`, { userId, recordedShiftId, stockCorrections }),

    createLateCashMovement: (originalShiftId: string, userId: string, cashMovementData: any, recordedShiftId?: string) =>
        apiClient.post<any>(`/api/shifts/${originalShiftId}/late-entries/cash-movements`, { userId, recordedShiftId, cashMovementData }),

    createLateReconciliation: (originalShiftId: string, userId: string, reconciliationData: any, recordedShiftId?: string) =>
        apiClient.post<any>(`/api/shifts/${originalShiftId}/late-entries/reconciliation`, { userId, recordedShiftId, reconciliationData }),

    getShiftPerformanceReport: (shiftId: string) =>
        apiClient.get<any>(`/api/shift-reconciliation/shift/${shiftId}/performance-report`),

    getExpectedFinancials: (shiftId: string) =>
        apiClient.get<any>(`/api/shift-reconciliation/shift/${shiftId}/expected-financials`),

    getShiftReconciliation: (shiftId: string) =>
        apiClient.get<ShiftReconciliation | null>(`/api/shift-reconciliation/shift/${shiftId}`),

    getActiveShift: (shopId: string) =>
        apiClient.get<Shift | null>(`/api/shifts/shop/${shopId}/active-shift`),

    // Float Allocation
    simulateFloatAllocation: (data: { shiftId: string; amount: number }) =>
        apiClient.post<any>("/api/shifts/float/simulate", data),

    allocateFloat: (data: {
        targetShiftId: string;
        amount: number;
        paymentMethod: string;
        reason?: string;
    }) => apiClient.post<any>("/api/shifts/float/allocate", data),

    getFloatSources: (shopId: string, shiftStartTime: string) =>
        apiClient.get<any>(`/api/shifts/float/sources?shopId=${shopId}&shiftStartTime=${shiftStartTime}`),

    getFloatTransaction: (floatTransactionId: string) =>
        apiClient.get<any>(`/api/shifts/float/transaction/${floatTransactionId}`),

    getFinancialSummaryReport: (params: { shopId: string; startDate: string; endDate: string; cashierId?: string }) => {
        const queryParams = new URLSearchParams({
            shopId: params.shopId,
            startDate: params.startDate,
            endDate: params.endDate
        });
        if (params.cashierId) {
            queryParams.append("cashierId", params.cashierId);
        }
        return apiClient.get<FinancialSummaryReport>(`/api/shift-reconciliation/financial-summary-report?${queryParams.toString()}`);
    },

    // V2: Immutable approval
    submitForApprovalV2: (id: string, userId: string) =>
        apiClient.post<any>(`/api/shifts/${id}/submit-for-approval-v2`, { userId }),

    approveShiftV2: (id: string, userId: string) =>
        apiClient.post<any>(`/api/shifts/${id}/approve-v2`, { userId }),

    rejectShiftV2: (id: string, reason: string, userId: string) =>
        apiClient.post<any>(`/api/shifts/${id}/reject-v2`, { reason, userId }),

    approveRejectedShiftV2: (id: string, userId: string) =>
        apiClient.post<any>(`/api/shifts/${id}/approve-rejected-v2`, { userId }),

    getRejectedShiftsV2: (shopId: string) =>
        apiClient.get<Shift[]>(`/api/shifts/v2/rejected/list?shopId=${shopId}`),

    // Approval events
    getApprovalEvents: (shiftId: string) =>
        apiClient.get<any[]>(`/api/shifts/${shiftId}/approval-events`),

    // Legacy approval workflow (backward compatible)
    submitForApproval: (id: string) =>
        apiClient.post<any>(`/api/shifts/${id}/submit-for-approval`),

    approveShift: (id: string, userId: string) =>
        apiClient.post<any>(`/api/shifts/${id}/approve`, { userId }),

    rejectShift: (id: string, reason: string, userId: string) =>
        apiClient.post<any>(`/api/shifts/${id}/reject`, { reason, userId }),

    getPendingApprovalShifts: (shopId: string) =>
        apiClient.get<Shift[]>(`/api/shifts/pending-approval/list?shopId=${shopId}`),

    getRejectedShifts: (shopId: string, userId: string) =>
        apiClient.get<Shift[]>(`/api/shifts/rejected/list?shopId=${shopId}&userId=${userId}`),

    amendReconciliation: (shiftId: string, data: { actual_cash_amount?: number; actual_mpesa_amount?: number }) =>
        apiClient.patch<any>(`/api/shift-reconciliation/shift/${shiftId}/amend`, data),

    getShiftCashMovements: (shiftId: string) =>
        apiClient.get<ShiftCashMovement[]>(`/api/shift-cash-movements/shift/${shiftId}`),

    getClosePreview: (shiftId: string) =>
        apiClient.get<{
            sales: number; salePayments: number; expenses: number; cashMovements: number;
            stockTakes: number; stockTransactions: number; reconciliations: number;
            customerTransactions: number; productionBatches: number; approvalEvents: number;
            hasOperationalActivity: boolean; hasAnyActivity: boolean;
        }>(`/api/shifts/${shiftId}/close-preview`),

    abandonShift: (shiftId: string, reason: string) =>
        apiClient.post<any>(`/api/shifts/${shiftId}/abandon`, { reason }),

    updateCashMovement: (id: string, data: { amount: number }) =>
        apiClient.patch<any>(`/api/shift-cash-movements/${id}`, data),
}

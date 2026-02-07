import { apiClient } from "@/lib/api-client"
import { Shift, ShiftCashMovement, ShiftReconciliation } from "@/types/shift"

export const shiftService = {
    // Current shift status
    getCurrentShift: (userId: string, shopId: string) =>
        apiClient.get<Shift | null>(`/api/shifts/current?userId=${userId}&shopId=${shopId}`),

    // Step 1 & 2: Create and Float
    createShift: (data: Partial<Shift>) => apiClient.post<Shift>("/api/shifts", data),

    recordCashMovement: (data: Partial<ShiftCashMovement>) => {
        try {
            console.log(data)
            return apiClient.post<ShiftCashMovement>("/api/shift-cash-movements", data)
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
        apiClient.patch<Shift>(`/api/shifts/${id}`, { is_closed: true, end_time: new Date().toISOString() }),

    // Reporting
    getShiftsByShopAndDate: (shopId: string, date: string) =>
        apiClient.get<Shift[]>(`/api/shifts/shop/${shopId}?date=${date}`),

    getShiftPerformanceReport: (shiftId: string) =>
        apiClient.get<any>(`/api/shift-reconciliation/shift/${shiftId}/performance-report`),
}

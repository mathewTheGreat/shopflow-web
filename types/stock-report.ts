export interface StockVarianceItem {
    stock_count_time: string;
    counted_by: string;
    item_name: string;
    expected_qty: number;
    counted_qty: number;
    variance: number;
    notes: string;
}

export interface VarianceReportSummary {
    totalItems: number;
    perfectMatches: number;
    overCounts: number;
    underCounts: number;
    averageVariance: number;
    maxVariance: number;
    totalAbsoluteVariance: number;
}

export interface VarianceReportData {
    summary: VarianceReportSummary;
    stockTakes: StockVarianceItem[];
}

export interface VarianceExcelReport {
    varianceData: VarianceReportData;
    shopName: string;
    userName: string;
    shiftDate: string;
    shiftName?: string;
    shiftId?: string;
}

export interface CashierVarianceSummary {
    cashierId: string;
    cashierName: string;
    stockTakesCount: number;
    totalItems: number;
    perfectMatches: number;
    overCounts: number;
    underCounts: number;
    averageVariance: number;
    totalAbsoluteVariance: number;
    accuracyRate: number;
}

export interface VarianceSummaryOverall {
    totalStockTakes: number;
    totalItems: number;
    overallPerfectMatches: number;
    overallOverCounts: number;
    overallUnderCounts: number;
    overallAverageVariance: number;
    totalAbsoluteVariance: number;
    accuracyRate: number;
}

export interface VarianceSummaryStockTake {
    created_at: string | null;
    cashierId: string;
    cashierName: string;
    shiftId: string;
    item_name: string;
    expected_qty: number;
    counted_qty: number;
    variance: number;
    notes: string | null;
}

export interface VarianceSummaryReport {
    summary: VarianceSummaryOverall;
    byCashier: CashierVarianceSummary[];
    stockTakes: VarianceSummaryStockTake[];
}

export interface VarianceSummaryExcelReport {
    reportData: VarianceSummaryReport;
    shopName: string;
    userName: string;
    startDate: string;
    endDate: string;
    cashierFilter: string;
}

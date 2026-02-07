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
    totalAbsoluteVariance: number; // Inferred from usage in Excel export
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

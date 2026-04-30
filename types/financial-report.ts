export interface CashierFinancialSummary {
    cashierId: string;
    cashierName: string;
    shiftCount: number;
    expectedCashSales: number;
    expectedMpesaSales: number;
    customerCashInflows: number;
    customerMpesaInflows: number;
    cashOpeningFloat: number;
    cashAdditionalFloat: number;
    cashPayIn: number;
    cashPayOut: number;
    mpesaOpeningFloat: number;
    mpesaAdditionalFloat: number;
    mpesaPayIn: number;
    mpesaPayOut: number;
    totalExpectedCash: number;
    totalExpectedMpesa: number;
    totalExpected: number;
    actualCashAmount: number;
    actualMpesaAmount: number;
    totalActual: number;
    cashVariance: number;
    mpesaVariance: number;
    totalVariance: number;
    accuracyRate: number;
}

export interface FinancialSummaryOverall {
    totalShifts: number;
    totalExpectedCashSales: number;
    totalExpectedMpesaSales: number;
    totalCustomerCashInflows: number;
    totalCustomerMpesaInflows: number;
    totalCashOpeningFloat: number;
    totalCashAdditionalFloat: number;
    totalCashPayIn: number;
    totalCashPayOut: number;
    totalMpesaOpeningFloat: number;
    totalMpesaAdditionalFloat: number;
    totalMpesaPayIn: number;
    totalMpesaPayOut: number;
    totalExpectedCash: number;
    totalExpectedMpesa: number;
    totalExpected: number;
    totalActualCash: number;
    totalActualMpesa: number;
    totalActual: number;
    totalCashVariance: number;
    totalMpesaVariance: number;
    totalVariance: number;
    overallAccuracyRate: number;
}

export interface FinancialSummaryTransaction {
    date: string;
    cashierName: string;
    shiftId: string;
    expectedCash: number;
    expectedMpesa: number;
    actualCash: number;
    actualMpesa: number;
    cashVariance: number;
    mpesaVariance: number;
    totalVariance: number;
    status: string;
}

export interface FinancialSummaryReport {
    summary: FinancialSummaryOverall;
    byCashier: CashierFinancialSummary[];
    shifts: FinancialSummaryTransaction[];
}

export interface FinancialSummaryExcelReport {
    reportData: FinancialSummaryReport;
    shopName: string;
    userName: string;
    startDate: string;
    endDate: string;
    cashierFilter: string;
}

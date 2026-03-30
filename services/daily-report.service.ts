import { apiClient } from "@/lib/api-client"

export interface DailyReportResponse {
  date: string
  shopId: string
  shifts: Array<{
    id: string
    name: string
    startTime: string
    endTime: string
    managerName: string
  }>
  
  stockItems: Array<{
    itemName: string
    itemId: string
    unitOfMeasure: string
    balanceBf: number
    received: number
    sold: number
    productionOut: number
    otherOut: number
    balanceCf: number
  }>
  
  production: Array<{
    batchId: string
    inputItem: string
    inputItemId: string
    outputItems: Array<{
      name: string
      itemId: string
      quantity: number
    }>
    loss: number
  }>
  
  sales: Array<{
    item: string
    itemId: string
    prices: Array<{
      label: string
      price: number
      quantity: number
      total: number
    }>
    totalQuantity: number
    totalAmount: number
  }>
  
  payments: {
    cash: number
    mpesa: number
    card: number
    other: number
  }
  
  immediateSales: {
    cash: number
    mpesa: number
  }
  
  advances: Array<{
    customer: string
    item: string
    quantity: number
    amount: number
  }>
  
  credit: Array<{
    customer: string
    item: string
    quantity: number
    amount: number
  }>
  
  expenses: Array<{
    category: string
    amount: number
  }>
  
  staffVariance: Array<{
    staffName: string
    item: string
    variance: number
  }>
}

export const dailyReportService = {
  generateDailyReport: (shopId: string, date: string) =>
    apiClient.get<DailyReportResponse>(`/api/daily-report?shopId=${shopId}&date=${date}`),
}

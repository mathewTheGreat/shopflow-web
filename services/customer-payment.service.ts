import { apiClient } from "@/lib/api-client";
import {
    CustomerPaymentAccount,
    CustomerPaymentTransaction,
    CreatePaymentDTO,
    CreateDebitDTO
} from "@/types/customer-payment";
import { buildListQuery, ListParams, PagedResult } from "@/types/list";
import { CustomerNetPositionReport } from "@/types/customer-report";

export const customerPaymentService = {
    // 1. Record Debit Transaction (Charge Customer)
    recordWithdrawal: async (data: CreateDebitDTO) => {
        return apiClient.post<{ transaction: CustomerPaymentTransaction }>('/api/customer-payments/record', data);
    },

    // 2. Record Credit Transaction (Customer Payment)
    recordPayment: async (data: CreatePaymentDTO) => {
        return apiClient.post<{ transaction: CustomerPaymentTransaction }>('/api/customer-payments/credit', data);
    },

    // 3. Get Account Details
    getAccount: async (customerId: string) => {
        return apiClient.get<{
            account: CustomerPaymentAccount;
            recentTransactions: CustomerPaymentTransaction[];
            calculatedBalance: number;
        }>(`/api/customer-payments/account/customer/${customerId}`);
    },

    // 4. Get Transaction History
    getHistory: async (customerId: string, limit?: number) => {
        const query = limit ? `?limit=${limit}` : '';
        return apiClient.get<CustomerPaymentTransaction[]>(`/api/customer-payments/history/customer/${customerId}${query}`);
    },

    // 5. Get Recent Transactions by Shop
    getShopTransactions: async (shopId: string, params?: ListParams) => {
        return apiClient.get<PagedResult<CustomerPaymentTransaction>>(`/api/customer-payments/transactions/shop/${shopId}${buildListQuery(params)}`);
    },

    // 6. Get Net Position Report
    getNetPosition: async (customerId: string, startDate: string, endDate: string) => {
        const query = new URLSearchParams({ customerId, startDate, endDate }).toString();
        return apiClient.get<CustomerNetPositionReport>(`/api/customer-payments/net-position?${query}`);
    },

    // 7. Reverse a posted transaction (manager, reason required)
    reverseTransaction: async (id: string, reason: string) => {
        return apiClient.post<CustomerPaymentTransaction>(`/api/customer-payments/transactions/${id}/reverse`, { reason });
    }
};

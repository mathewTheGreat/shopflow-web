import { apiClient } from "@/lib/api-client";
import {
    CustomerPaymentAccount,
    CustomerPaymentTransaction,
    CreatePaymentDTO,
    CreateDebitDTO
} from "@/types/customer-payment";
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
    getShopTransactions: async (shopId: string, limit: number = 50) => {
        return apiClient.get<CustomerPaymentTransaction[]>(`/api/customer-payments/transactions/shop/${shopId}?limit=${limit}`);
    },

    // 6. Get Net Position Report
    getNetPosition: async (customerId: string, startDate: string, endDate: string) => {
        const query = new URLSearchParams({ customerId, startDate, endDate }).toString();
        return apiClient.get<CustomerNetPositionReport>(`/api/customer-payments/net-position?${query}`);
    }
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerPaymentService } from "@/services/customer-payment.service";
import { CreateDebitDTO, CreatePaymentDTO } from "@/types/customer-payment";
import { toast } from "sonner";

// Fetch recent shop transactions
export function useShopTransactions(shopId: string | undefined, limit: number = 50) {
    return useQuery({
        queryKey: ["customer-payments", "shop", shopId],
        queryFn: () => {
            if (!shopId) return [];
            return customerPaymentService.getShopTransactions(shopId, limit);
        },
        enabled: !!shopId,
        staleTime: 1000 * 60, // 1 minute
    });
}

// Fetch specific customer account
export function useCustomerAccount(customerId: string | undefined) {
    return useQuery({
        queryKey: ["customer-payments", "account", customerId],
        queryFn: () => {
            if (!customerId) return null;
            return customerPaymentService.getAccount(customerId);
        },
        enabled: !!customerId,
    });
}

// Fetch customer history
export function useCustomerTransactionHistory(customerId: string | undefined, limit?: number) {
    return useQuery({
        queryKey: ["customer-payments", "history", customerId],
        queryFn: () => {
            if (!customerId) return [];
            return customerPaymentService.getHistory(customerId, limit);
        },
        enabled: !!customerId,
    });
}

// Mutation: Record Payment (Credit)
export function useRecordPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePaymentDTO) => customerPaymentService.recordPayment(data),
        onSuccess: (_, variables) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] }); // To update balances in customer list if shown
            toast.success("Payment recorded successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to record payment");
        }
    });
}

// Mutation: Record Withdrawal (Debit)
export function useRecordWithdrawal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateDebitDTO) => customerPaymentService.recordWithdrawal(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Charge recorded successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to record charge");
        }
    });
}

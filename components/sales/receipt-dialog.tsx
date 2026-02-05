"use client"

import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Loader2 } from "lucide-react"
import { useSaleReceipt } from "@/hooks/use-sales"
import { useRef } from "react"
import { useReactToPrint } from "react-to-print"

interface ReceiptDialogProps {
    saleId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ReceiptDialog({ saleId, open, onOpenChange }: ReceiptDialogProps) {
    const { data: sale, isLoading } = useSaleReceipt(saleId)
    const contentRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `Receipt-${sale?.id || "unknown"}`,
    })

    if (!open) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[400px] p-0 overflow-hidden bg-white text-black">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Loading receipt...</p>
                    </div>
                ) : !sale ? (
                    <div className="p-8 text-center text-red-500">Failed to load receipt data</div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto max-h-[80vh] bg-white p-6" ref={contentRef}>
                            <style jsx global>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #receipt-content, #receipt-content * {
                    visibility: visible;
                  }
                  #receipt-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    margin: 0;
                    padding: 5mm;
                  }
                  @page {
                    size: 80mm auto;
                    margin: 0;
                  }
                }
              `}</style>

                            <div id="receipt-content" className="flex flex-col items-center text-center space-y-4 text-xs font-mono">
                                {/* Header */}
                                <div className="space-y-1">
                                    <h2 className="text-lg font-bold uppercase">{sale.shop?.name || "Shop Name"}</h2>
                                    <p>{sale.shop?.address}</p>
                                    <p>{sale.shop?.city}</p>
                                    <p>{sale.shop?.phone}</p>
                                </div>

                                <div className="w-full border-t border-dashed border-gray-300 my-2" />

                                <div className="w-full text-left space-y-1">
                                    <div className="flex justify-between">
                                        <span>Date:</span>
                                        <span>{new Date(sale.sale_date).toLocaleString('en-US', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            hour12: true
                                        })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Rcpt #:</span>
                                        <span>{sale.id.slice(0, 8)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Cashier:</span>
                                        <span>{sale.createdBy?.name || "Staff"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Customer:</span>
                                        <span className="font-medium">{sale.customer?.name || "Walk-In Customer"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Type:</span>
                                        <span className="font-medium">{sale.sale_category}</span>
                                    </div>
                                </div>

                                <div className="w-full border-t border-dashed border-gray-300 my-2" />

                                {/* Date/Time */}
                                {/* <div className="w-full text-left">
                  <p>{new Date(sale.sale_date).toLocaleDateString()} {new Date(sale.sale_date).toLocaleTimeString()}</p>
                  <p>Receipt #: {sale.id.slice(0, 8)}</p>
                  <p>Cashier: {sale.createdBy?.name || "Staff"}</p>
                </div> */}

                                {/* Items */}
                                <div className="w-full space-y-2">
                                    <div className="flex font-bold border-b border-black pb-1">
                                        <span className="flex-1 text-left">Item</span>
                                        <span className="w-8 text-right">Qty</span>
                                        <span className="w-16 text-right">Price</span>
                                        <span className="w-16 text-right">Total</span>
                                    </div>
                                    {sale.saleItems.map((item: any) => (
                                        <div key={item.id} className="flex text-left">
                                            <span className="flex-1 truncate pr-2">{item.item?.name || "Item"}</span>
                                            <span className="w-8 text-right">{item.quantity}</span>
                                            <span className="w-16 text-right">{item.unit_price}</span>
                                            <span className="w-16 text-right font-medium">{item.total_price}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="w-full border-t border-dashed border-gray-300 my-2" />

                                {/* Totals */}
                                <div className="w-full space-y-1 text-right">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{sale.total_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-sm">
                                        <span>TOTAL:</span>
                                        <span>KES {sale.total_amount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="w-full border-t border-dashed border-gray-300 my-2" />

                                {/* Payments */}
                                <div className="w-full space-y-1">
                                    {sale.salePayments.map((payment: any) => (
                                        <div key={payment.id} className="flex justify-between">
                                            <span>{payment.payment_method}:</span>
                                            <span>{payment.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="pt-4 text-center text-[10px] space-y-1">
                                    <p>Thank you for shopping with us!</p>
                                    <p>Powered by ShopFlow</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-muted/20 border-t flex justify-between gap-4">
                            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                            <Button onClick={() => handlePrint()} className="flex-1 gap-2">
                                <Printer className="h-4 w-4" />
                                Print Receipt
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

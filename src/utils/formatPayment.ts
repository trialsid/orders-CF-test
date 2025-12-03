import { PaymentMethod, PaymentCollectedMethod } from "../types";

export const formatPaymentMethod = (method?: string | null): string => {
    if (!method) return "Unknown";
    switch (method) {
        case PaymentMethod.PayOnDelivery:
            return "Pay on Delivery";
        case PaymentMethod.PayNow:
            return "Pay Now";
        default:
            return method;
    }
};

export const formatPaymentCollectedMethod = (method?: string | null): string => {
    if (!method) return "Unknown";
    switch (method) {
        case PaymentCollectedMethod.Cash:
            return "Cash";
        case PaymentCollectedMethod.UPI:
            return "UPI";
        default:
            return method;
    }
};

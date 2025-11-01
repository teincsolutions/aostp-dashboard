import { ExchangeRate } from "./exchangeRate";
import { Invoice } from "./invoice";

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  paymentMethod: string;
  reference?: string;
  processedAt: string;
  processedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  paymentCode: string;
  exchangeRate?: ExchangeRate;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  receipt?: {
    receiptNumber: string;
  };
  receiptKey?: string;
  createdAt: string;
  updatedAt: string;
  invoices: Invoice[];
}

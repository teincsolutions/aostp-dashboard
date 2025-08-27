export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  paymentMethod: string;
  reference?: string;
  processedAt: string;
  processedBy: string;
  paymentCode: string;
  customer: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  receipt?: {
    receiptNumber: string;
  };
  invoices: import("./invoice").Invoice[];
}

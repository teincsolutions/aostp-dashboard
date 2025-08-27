// src/types/exchangeRate.ts

export interface ExchangeRate {
  id: string;
  fromCurrency: string; // e.g. "USD"
  toCurrency: string;   // e.g. "GHS"
  rate: number;
  effectiveFrom: string; // ISO DateTime
  effectiveTo?: string;  // ISO DateTime, optional
  isActive: boolean;
  setBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRateCreatePayload {
  fromCurrency: string; // always "USD"
  toCurrency: string;   // always "GHS"
  rate: number;
  effectiveFrom: string; // ISO DateTime
}

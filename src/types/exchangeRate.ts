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

// Shipping Rate types
export enum ShippingMode {
  SEA = "SEA",
  AIR = "AIR",
}

export enum AirShippingType {
  NORMAL_AIR = "NORMAL_AIR",
  EXPRESS_AIR = "EXPRESS_AIR",
  BATTERY_GOODS = "BATTERY_GOODS",
  PHONES = "PHONES",
}

export interface ShippingRate {
  id: string;
  shippingMode: ShippingMode;
  airShippingType?: AirShippingType; // Only for AIR mode
  rate: number; // Cost per unit (CBM for SEA, KG for AIR)
  currency: string; // e.g. "USD"
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  setBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface ShippingRateCreatePayload {
  shippingMode: ShippingMode;
  airShippingType?: AirShippingType;
  rate: number;
  currency?: string; // defaults to "USD"
  effectiveFrom: string;
}

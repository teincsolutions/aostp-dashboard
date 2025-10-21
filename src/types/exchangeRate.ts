// src/types/exchangeRate.ts

export interface ExchangeRate {
  id: string;
  fromCurrency: string; // e.g. "USD"
  toCurrency: string; // e.g. "GHS"
  rate: number;
  effectiveFrom: string; // ISO DateTime
  effectiveTo?: string; // ISO DateTime, optional
  isActive: boolean;
  setBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRateCreatePayload {
  fromCurrency: string; // always "USD"
  toCurrency: string; // always "GHS"
  rate: number;
  effectiveFrom: string; // ISO DateTime
}

// City types
export interface City {
  id: string;
  name: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface CityQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  country?: string;
  search?: string;
}

export interface CitiesResponse {
  data: City[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  correlationId: string;
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
  airShippingType?: AirShippingType | null; // Only for AIR mode
  cityId?: string;
  ratePerUnit?: number;
  currency: string; // e.g. "USD"
  effectiveFrom: string;
  effectiveTo?: string | null;
  city: City;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  correlationId?: string;
}

export interface ShippingRateCreatePayload {
  shippingMode: ShippingMode;
  airShippingType?: AirShippingType;
  cityId: string;
  ratePerUnit: number;
  currency?: string; // defaults to "USD"
  effectiveFrom: string;
}

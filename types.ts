
export interface AdData {
  // Identifiers and Dates
  reportingStarts: Date;
  reportingEnds: Date;
  campaignName: string;
  adSetName?: string; // Ad set name might be useful
  adName?: string; // Ad name
  country: string; // Assuming country is a key breakdown

  // Delivery and Budget
  adSetDelivery?: string;
  adSetBudget?: number;
  budgetType?: string; // e.g., Daily, Lifetime

  // Core Performance Metrics
  amountSpentUSD: number;
  reach: number;
  impressions: number;
  linkClicks?: number; // Optional as not all ads might have link clicks
  
  // Results and Conversions
  results?: number;
  resultIndicator?: string; // e.g., "actions:app_custom_event.fb_mobile_purchase"
  costPerResult?: number;
  valueSum?: number; // Sum of conversion values
  totalROAS?: number; // Return on Ad Spend

  // Engagement Metrics
  cpm?: number; // Cost Per Mille (1000 impressions)
  ctrAll?: number; // Click-Through Rate (All)
  cpcAll?: number; // Cost Per Click (All)
  
  // App-Specific Metrics
  appInstalls?: number;
  inAppPurchases?: number;
  inAppPurchasesConversionValue?: number;
  costPerInAppPurchase?: number;

  // Video Metrics (optional)
  videoPlays3Sec?: number;
  videoPlaysTo25Percent?: number;
  videoPlaysTo50Percent?: number;
  videoPlaysTo75Percent?: number;
  videoPlaysTo95Percent?: number;
  videoPlaysTo100Percent?: number;
  costPer3SecVideoPlay?: number;

  // Other potential metrics
  frequency?: number;
  uniqueLinkClicks?: number;
  
  // Custom fields for processed data
  dateStr?: string; // For grouping by date string
}

export interface ChartDataItem {
  name: string; // Typically date, country, or campaign name
  [key: string]: number | string | undefined; // Allows for multiple metric values
}

export enum ChartMetric {
  AmountSpent = "amountSpentUSD",
  Reach = "reach",
  Impressions = "impressions",
  LinkClicks = "linkClicks",
  CTR = "ctrAll",
  CPM = "cpm",
  CPC = "cpcAll",
  Results = "results",
  CostPerResult = "costPerResult",
  ROAS = "totalROAS", // Or calculated ROAS
  AppInstalls = "appInstalls",
  InAppPurchases = "inAppPurchases",
  CalculatedROAS = "calculatedROAS", // For valueSum / amountSpentUSD
  CalculatedCTR = "calculatedCTR",
  CalculatedCPM = "calculatedCPM",
  CalculatedCPC = "calculatedCPC",
  CalculatedCostPerResult = "calculatedCostPerResult",
}

export interface FilterState {
  dateRange: { start: Date | null; end: Date | null };
  countries: string[];
  campaigns: string[];
}

export type UnifiedDataType = AdData; // Alias for clarity if types diverge later
    
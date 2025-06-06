
// Comprehensive mapping for robustness. Keys are lowercase and trimmed.
export const COLUMN_HEADER_MAP: { [key: string]: keyof import('./types').AdData } = {
  // Dates
  'reporting starts': 'reportingStarts',
  'дата початку звіту': 'reportingStarts',
  'reporting ends': 'reportingEnds',
  'дата завершення звіту': 'reportingEnds',
  
  // Identifiers
  'campaign name': 'campaignName',
  'назва кампанії': 'campaignName',
  'ad set name': 'adSetName',
  'назва групи оголошень': 'adSetName',
  'ad name': 'adName',
  'назва оголошення': 'adName',
  'country': 'country',
  'країна': 'country',

  // Delivery & Budget
  'ad set delivery': 'adSetDelivery',
  'доставка групи оголошень': 'adSetDelivery',
  'ad set budget': 'adSetBudget',
  'бюджет групи оголошень': 'adSetBudget',
  'budget type': 'budgetType',
  'тип бюджету': 'budgetType',

  // Core Performance
  'amount spent (usd)': 'amountSpentUSD',
  'витрачена сума (usd)': 'amountSpentUSD',
  'amount spent': 'amountSpentUSD', // Common variation
  'витрати': 'amountSpentUSD',
  'reach': 'reach',
  'охоплення': 'reach',
  'impressions': 'impressions',
  'покази': 'impressions',
  'link clicks': 'linkClicks',
  'кліки за посиланням': 'linkClicks',
  'clicks (all)': 'linkClicks', // Meta sometimes uses this for primary clicks

  // Results & Conversions
  'results': 'results',
  'результати': 'results',
  'result indicator': 'resultIndicator',
  'індикатор результату': 'resultIndicator',
  'cost per result': 'costPerResult',
  'ціна за результат': 'costPerResult',
  'conversion value': 'valueSum', // Generic term for value
  'purchase roas [usd]': 'totalROAS', // Example specific ROAS
  'total roas': 'totalROAS',
  'roas загалом': 'totalROAS',
  'roas для покупок загалом': 'totalROAS',
  'value sum': 'valueSum', // From image
  'сума цінності': 'valueSum',
  'сума цінності конверсії для покупок': 'valueSum', // More specific
  
  // Engagement
  'cpm (cost per 1,000 impressions)': 'cpm',
  'cpm (вартість за 1000 показів)': 'cpm',
  'ctr (all)': 'ctrAll',
  'ctr (усі)': 'ctrAll',
  'ctr (link click-through rate)': 'ctrAll', // More specific CTR
  'cpc (all) (cost per link click)': 'cpcAll',
  'cpc (усі) (вартість за клік за посиланням)': 'cpcAll',
  'cpc (cost per link click)': 'cpcAll',

  // App Specific
  'app installs': 'appInstalls',
  'установлення додатка': 'appInstalls',
  'mobile app installs': 'appInstalls',
  'in-app purchases': 'inAppPurchases',
  'покупки в додатку': 'inAppPurchases',
  'in-app purchases conversion value': 'inAppPurchasesConversionValue',
  'сума цінності конверсії покупок у додатку': 'inAppPurchasesConversionValue',
  'cost per in-app purchase': 'costPerInAppPurchase',
  'ціна за покупку в додатку': 'costPerInAppPurchase',

  // Video Metrics
  '3-second video plays': 'videoPlays3Sec',
  '3-секундні перегляди відео': 'videoPlays3Sec',
  'video plays at 25%': 'videoPlaysTo25Percent',
  'відтворення відео до 25%': 'videoPlaysTo25Percent',
  'video plays at 50%': 'videoPlaysTo50Percent',
  'відтворення відео до 50%': 'videoPlaysTo50Percent',
  'video plays at 75%': 'videoPlaysTo75Percent',
  'відтворення відео до 75%': 'videoPlaysTo75Percent',
  'video plays at 95%': 'videoPlaysTo95Percent',
  'відтворення відео до 95%': 'videoPlaysTo95Percent',
  'video plays at 100%': 'videoPlaysTo100Percent',
  'відтворення відео до 100%': 'videoPlaysTo100Percent',
  'cost per 3-second video play': 'costPer3SecVideoPlay',
  'ціна за 3-секундний перегляд відео': 'costPer3SecVideoPlay',

  // Other
  'frequency': 'frequency',
  'частота': 'frequency',
  'unique link clicks': 'uniqueLinkClicks',
  'унікальні кліки за посиланням': 'uniqueLinkClicks',
};

export const NUMERIC_COLUMNS: (keyof import('./types').AdData)[] = [
  'adSetBudget', 'amountSpentUSD', 'reach', 'impressions', 'linkClicks',
  'results', 'costPerResult', 'valueSum', 'totalROAS', 'cpm', 'ctrAll', 'cpcAll',
  'appInstalls', 'inAppPurchases', 'inAppPurchasesConversionValue', 'costPerInAppPurchase',
  'videoPlays3Sec', 'videoPlaysTo25Percent', 'videoPlaysTo50Percent',
  'videoPlaysTo75Percent', 'videoPlaysTo95Percent', 'videoPlaysTo100Percent',
  'costPer3SecVideoPlay', 'frequency', 'uniqueLinkClicks'
];

export const DATE_COLUMNS: (keyof import('./types').AdData)[] = [
  'reportingStarts', 'reportingEnds'
];

// Define which metrics are percentages and need /100 if input as "5.5%" string
export const PERCENTAGE_METRICS: (keyof import('./types').AdData)[] = ['ctrAll'];
    
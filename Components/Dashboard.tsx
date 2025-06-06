
import React from 'react';
import { AdData, ChartDataItem, ChartMetric } from '../types';
import ChartCard from './ChartCard';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface DashboardProps {
  data: AdData[];
}

const aggregateDataByDate = (data: AdData[], metrics: ChartMetric[], calculatedMetrics?: ChartMetric[]): ChartDataItem[] => {
  const groupedByDate: { [date: string]: Partial<AdData> & { count: number, valueSumAgg?: number, amountSpentAgg?: number, impressionsAgg?: number, linkClicksAgg?: number, resultsAgg?: number } } = {};

  data.forEach(item => {
    if (!item.dateStr) return; // Should have dateStr from parsing
    if (!groupedByDate[item.dateStr]) {
      groupedByDate[item.dateStr] = { dateStr: item.dateStr, count: 0 };
      metrics.forEach(metric => groupedByDate[item.dateStr]![metric] = 0);
      // Initialize aggregates for calculated metrics
      groupedByDate[item.dateStr]!.valueSumAgg = 0;
      groupedByDate[item.dateStr]!.amountSpentAgg = 0;
      groupedByDate[item.dateStr]!.impressionsAgg = 0;
      groupedByDate[item.dateStr]!.linkClicksAgg = 0;
      groupedByDate[item.dateStr]!.resultsAgg = 0;
    }
    
    metrics.forEach(metric => {
      if (typeof item[metric] === 'number') {
        (groupedByDate[item.dateStr]![metric] as number) += item[metric] as number;
      }
    });
    // Sum up components for calculated metrics
    groupedByDate[item.dateStr]!.valueSumAgg! += item.valueSum || 0;
    groupedByDate[item.dateStr]!.amountSpentAgg! += item.amountSpentUSD || 0;
    groupedByDate[item.dateStr]!.impressionsAgg! += item.impressions || 0;
    groupedByDate[item.dateStr]!.linkClicksAgg! += item.linkClicks || 0;
    groupedByDate[item.dateStr]!.resultsAgg! += item.results || 0;

    groupedByDate[item.dateStr]!.count!++;
  });
  
  return Object.values(groupedByDate).map(item => {
    const chartItem: ChartDataItem = { name: item.dateStr! };
    metrics.forEach(metric => {
      // For metrics that are averages (like CTR, CPM, CPC if they are pre-calculated daily averages in source data), divide by count.
      // However, it's usually better to calculate these from sums (see below).
      // For now, if it's a direct sum from source (like Reach, Impressions, Spend), it's fine.
      chartItem[metric] = item[metric];
    });

    // Add calculated metrics
    if (calculatedMetrics) {
        if (calculatedMetrics.includes(ChartMetric.CalculatedROAS)) {
            chartItem[ChartMetric.CalculatedROAS] = item.amountSpentAgg! > 0 ? (item.valueSumAgg! / item.amountSpentAgg!) : 0;
        }
        if (calculatedMetrics.includes(ChartMetric.CalculatedCTR)) {
            chartItem[ChartMetric.CalculatedCTR] = item.impressionsAgg! > 0 ? (item.linkClicksAgg! / item.impressionsAgg!) * 100 : 0;
        }
        if (calculatedMetrics.includes(ChartMetric.CalculatedCPM)) {
            chartItem[ChartMetric.CalculatedCPM] = item.impressionsAgg! > 0 ? (item.amountSpentAgg! / item.impressionsAgg!) * 1000 : 0;
        }
        if (calculatedMetrics.includes(ChartMetric.CalculatedCPC)) {
            chartItem[ChartMetric.CalculatedCPC] = item.linkClicksAgg! > 0 ? (item.amountSpentAgg! / item.linkClicksAgg!) : 0;
        }
        if (calculatedMetrics.includes(ChartMetric.CalculatedCostPerResult)) {
            chartItem[ChartMetric.CalculatedCostPerResult] = item.resultsAgg! > 0 ? (item.amountSpentAgg! / item.resultsAgg!) : 0;
        }
    }
    return chartItem;
  }).sort((a, b) => new Date(a.name as string).getTime() - new Date(b.name as string).getTime());
};


const aggregateDataByCategory = (data: AdData[], categoryKey: keyof AdData, valueKey: ChartMetric, isAverage: boolean = false, calculatedMetric?: ChartMetric): ChartDataItem[] => {
  const grouped: { [category: string]: { sum: number; count: number; valueSumAgg?: number; amountSpentAgg?: number; impressionsAgg?: number; linkClicksAgg?: number; resultsAgg?: number } } = {};

  data.forEach(item => {
    const category = String(item[categoryKey] || 'Unknown');
    if (!grouped[category]) {
      grouped[category] = { sum: 0, count: 0, valueSumAgg: 0, amountSpentAgg: 0, impressionsAgg: 0, linkClicksAgg: 0, resultsAgg: 0 };
    }
    if (typeof item[valueKey] === 'number') {
      grouped[category].sum += item[valueKey] as number;
    }
    // Aggregate for calculated metrics
    grouped[category].valueSumAgg! += item.valueSum || 0;
    grouped[category].amountSpentAgg! += item.amountSpentUSD || 0;
    grouped[category].impressionsAgg! += item.impressions || 0;
    grouped[category].linkClicksAgg! += item.linkClicks || 0;
    grouped[category].resultsAgg! += item.results || 0;

    grouped[category].count++;
  });

  return Object.entries(grouped).map(([categoryName, values]) => {
    let finalValue;
    if (calculatedMetric) {
        switch (calculatedMetric) {
            case ChartMetric.CalculatedROAS:
                finalValue = values.amountSpentAgg! > 0 ? (values.valueSumAgg! / values.amountSpentAgg!) : 0;
                break;
            case ChartMetric.CalculatedCTR:
                finalValue = values.impressionsAgg! > 0 ? (values.linkClicksAgg! / values.impressionsAgg!) * 100 : 0;
                break;
            // Add other calculated metrics for categorical charts if needed
            default: finalValue = isAverage && values.count > 0 ? values.sum / values.count : values.sum;
        }
    } else {
        finalValue = isAverage && values.count > 0 ? values.sum / values.count : values.sum;
    }
    return {
      name: categoryName,
      [valueKey]: finalValue,
    };
  }).sort((a,b) => (b[valueKey] as number) - (a[valueKey] as number)); // Sort descending by value
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded-md border border-slate-200">
        <p className="label text-sm font-semibold text-slate-700">{`${label}`}</p>
        {payload.map((pld, index) => (
          <p key={index} style={{ color: pld.color }} className="text-xs">
            {`${pld.name}: ${typeof pld.value === 'number' ? pld.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2}) : pld.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


const chartColors = ["#38bdf8", "#fb923c", "#34d399", "#a78bfa", "#f472b6", "#fbbf24", "#4ade80", "#60a5fa"];


const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-10 text-slate-500">No data available to display charts.</div>;
  }

  // Time Series Data
  const spendOverTime = aggregateDataByDate(data, [ChartMetric.AmountSpent]);
  const reachImpressionsOverTime = aggregateDataByDate(data, [ChartMetric.Reach, ChartMetric.Impressions]);
  const engagementRatesOverTime = aggregateDataByDate(data, [], [ChartMetric.CalculatedCTR, ChartMetric.CalculatedCPM, ChartMetric.CalculatedCPC]);
  const resultsCostPerResultOverTime = aggregateDataByDate(data, [], [ChartMetric.Results, ChartMetric.CalculatedCostPerResult]);
  const roasOverTime = aggregateDataByDate(data, [], [ChartMetric.CalculatedROAS]);
  const appActivityOverTime = aggregateDataByDate(data, [ChartMetric.AppInstalls, ChartMetric.InAppPurchases]);

  // Categorical Data
  const spendByCountry = aggregateDataByCategory(data, 'country', ChartMetric.AmountSpent);
  const resultsByCountry = aggregateDataByCategory(data, 'country', ChartMetric.Results);
  const spendByCampaign = aggregateDataByCategory(data, 'campaignName', ChartMetric.AmountSpent);
  const resultsByCampaign = aggregateDataByCategory(data, 'campaignName', ChartMetric.Results);
  const roasByCampaign = aggregateDataByCategory(data, 'campaignName', ChartMetric.AmountSpent, false, ChartMetric.CalculatedROAS); // Use CalculatedROAS
  const ctrByCampaign = aggregateDataByCategory(data, 'campaignName', ChartMetric.Impressions, false, ChartMetric.CalculatedCTR);


  const timeSeriesCharts = [
    { title: "Spend Over Time", data: spendOverTime, metrics: [{ key: ChartMetric.AmountSpent, name: "Spend (USD)", color: chartColors[0] }] },
    { title: "Reach & Impressions Over Time", data: reachImpressionsOverTime, metrics: [{ key: ChartMetric.Reach, name: "Reach", color: chartColors[1] }, { key: ChartMetric.Impressions, name: "Impressions", color: chartColors[2] }] },
    { title: "Engagement Rates Over Time (CTR, CPM, CPC)", data: engagementRatesOverTime, metrics: [{ key: ChartMetric.CalculatedCTR, name: "CTR (%)", color: chartColors[3] }, { key: ChartMetric.CalculatedCPM, name: "CPM (USD)", color: chartColors[4] }, { key: ChartMetric.CalculatedCPC, name: "CPC (USD)", color: chartColors[5] }]},
    { title: "Results & Cost Per Result Over Time", data: resultsCostPerResultOverTime, metrics: [{ key: ChartMetric.Results, name: "Results", color: chartColors[0] }, { key: ChartMetric.CalculatedCostPerResult, name: "Cost/Result (USD)", color: chartColors[1] }]},
    { title: "ROAS Over Time", data: roasOverTime, metrics: [{ key: ChartMetric.CalculatedROAS, name: "ROAS", color: chartColors[2] }] },
    { title: "App Installs & In-App Purchases Over Time", data: appActivityOverTime, metrics: [{ key: ChartMetric.AppInstalls, name: "App Installs", color: chartColors[3] }, { key: ChartMetric.InAppPurchases, name: "In-App Purchases", color: chartColors[4] }] },
  ];

  const categoricalCharts = [
    { title: "Total Spend by Country", data: spendByCountry.slice(0,10), metric: ChartMetric.AmountSpent, name: "Spend (USD)", color: chartColors[0] }, // Top 10
    { title: "Total Results by Country", data: resultsByCountry.slice(0,10), metric: ChartMetric.Results, name: "Results", color: chartColors[1] },
    { title: "Total Spend by Campaign", data: spendByCampaign.slice(0,10), metric: ChartMetric.AmountSpent, name: "Spend (USD)", color: chartColors[2] },
    { title: "Total Results by Campaign", data: resultsByCampaign.slice(0,10), metric: ChartMetric.Results, name: "Results", color: chartColors[3] },
    { title: "ROAS by Campaign", data: roasByCampaign.slice(0,10), metric: ChartMetric.AmountSpent, name: "ROAS", color: chartColors[4] }, // Metric here is a bit confusing, it's what the bar represents. It should be ChartMetric.CalculatedROAS
    { title: "CTR by Campaign", data: ctrByCampaign.slice(0,10), metric: ChartMetric.Impressions, name: "CTR (%)", color: chartColors[5] }, // Metric here should be ChartMetric.CalculatedCTR
  ];


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {timeSeriesCharts.map((chartInfo, index) => (
        <ChartCard key={index} title={chartInfo.title}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartInfo.data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#666" />
              <YAxis tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} tick={{ fontSize: 10 }} stroke="#666"/>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{fontSize: "12px"}}/>
              {chartInfo.metrics.map(metric => (
                <Line key={metric.key} type="monotone" dataKey={metric.key} name={metric.name} stroke={metric.color} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      ))}

      {categoricalCharts.map((chartInfo, index) => (
         <ChartCard key={`bar-${index}`} title={chartInfo.title}>
           <ResponsiveContainer width="100%" height={300}>
            {/* Use chartInfo.dataKey which should match the calculated metric's name or the original valueKey */}
             <BarChart data={chartInfo.data} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
               <XAxis type="number" tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} tick={{ fontSize: 10 }} stroke="#666"/>
               <YAxis dataKey="name" type="category" tick={{ fontSize: 10, width:100 }} width={120} interval={0} stroke="#666"/>
               <Tooltip content={<CustomTooltip />}/>
               <Legend wrapperStyle={{fontSize: "12px"}}/>
               {/* For categorical charts, metric.key is the dataKey, metric.name is display name */}
               <Bar dataKey={Object.keys(chartInfo.data[0] || {}).find(k => k !== 'name')} name={chartInfo.name} fill={chartInfo.color} barSize={20}/>
             </BarChart>
           </ResponsiveContainer>
         </ChartCard>
       ))}
    </div>
  );
};

export default Dashboard;
    
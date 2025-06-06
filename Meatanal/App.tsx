
import React, { useState, useEffect, useCallback } from 'react';
import { AdData, FilterState } from './types';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import FilterControls from './components/FilterControls';
import { Loader2, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [allData, setAllData] = useState<AdData[]>([]);
  const [filteredData, setFilteredData] = useState<AdData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [uniqueCountries, setUniqueCountries] = useState<string[]>([]);
  const [uniqueCampaigns, setUniqueCampaigns] = useState<string[]>([]);
  const [minDate, setMinDate] = useState<Date | null>(null);
  const [maxDate, setMaxDate] = useState<Date | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: null, end: null },
    countries: [],
    campaigns: [],
  });

  const handleDataLoaded = useCallback((data: AdData[], fileName: string) => {
    setAllData(data);
    setError(null);

    if (data.length > 0) {
      const countries = Array.from(new Set(data.map(d => d.country).filter(Boolean))).sort();
      const campaigns = Array.from(new Set(data.map(d => d.campaignName).filter(Boolean))).sort();
      setUniqueCountries(countries);
      setUniqueCampaigns(campaigns);

      const dates = data.map(d => d.reportingStarts).filter(d => d instanceof Date && !isNaN(d.getTime()));
      if (dates.length > 0) {
        const newMinDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const newMaxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        setMinDate(newMinDate);
        setMaxDate(newMaxDate);
        setFilters(prev => ({
          ...prev,
          dateRange: { start: newMinDate, end: newMaxDate },
          countries: [], // Reset country filter
          campaigns: []  // Reset campaign filter
        }));
      } else {
        setMinDate(null);
        setMaxDate(null);
         setFilters(prev => ({
          ...prev,
          dateRange: { start: null, end: null },
          countries: [],
          campaigns: []
        }));
      }
    } else {
      setUniqueCountries([]);
      setUniqueCampaigns([]);
      setMinDate(null);
      setMaxDate(null);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    let currentData = [...allData];

    // Date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      currentData = currentData.filter(d => {
        if (!d.reportingStarts || !(d.reportingStarts instanceof Date) || isNaN(d.reportingStarts.getTime())) return false;
        const itemDate = new Date(d.reportingStarts);
        itemDate.setHours(0,0,0,0); // Normalize item date
        
        const startDate = new Date(filters.dateRange.start!);
        startDate.setHours(0,0,0,0); // Normalize start date
        const endDate = new Date(filters.dateRange.end!);
        endDate.setHours(23,59,59,999); // Normalize end date to include the whole day
        
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // Country filter
    if (filters.countries.length > 0) {
      currentData = currentData.filter(d => filters.countries.includes(d.country));
    }

    // Campaign filter
    if (filters.campaigns.length > 0) {
      currentData = currentData.filter(d => filters.campaigns.includes(d.campaignName));
    }
    
    setFilteredData(currentData);
    setIsLoading(false);
  }, [allData, filters]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-sky-700">Meta Ads Analyzer</h1>
        <p className="text-slate-600 mt-2">Upload your Meta Ads export (Excel or CSV) to visualize performance metrics.</p>
      </header>

      <main>
        <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-2xl mb-8">
          <FileUpload 
            onDataLoaded={handleDataLoaded} 
            setIsLoading={setIsLoading} 
            setError={setError} 
          />
        </div>

        {error && (
          <div className="max-w-6xl mx-auto bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md mb-8" role="alert">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 mr-3" />
              <div>
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && allData.length === 0 && ( // Show general loading spinner only if no data yet
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 text-sky-600 animate-spin" />
            <p className="ml-4 text-slate-600 text-lg">Processing data...</p>
          </div>
        )}

        {allData.length > 0 && (
          <>
            <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-2xl mb-8">
              <FilterControls 
                filters={filters} 
                setFilters={setFilters}
                uniqueCountries={uniqueCountries}
                uniqueCampaigns={uniqueCampaigns}
                minDate={minDate}
                maxDate={maxDate}
                disabled={isLoading} // Disable filters while data is processing (due to filter change)
              />
            </div>
            {isLoading && <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 text-sky-600 animate-spin" /><p className="ml-3 text-slate-500">Updating charts...</p></div>}
            {!isLoading && filteredData.length === 0 && allData.length > 0 && (
                 <div className="max-w-6xl mx-auto bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 rounded-md shadow-md mb-8 text-center" role="alert">
                    <p className="font-semibold">No data matches the current filters.</p>
                    <p>Try adjusting your filter selection or uploading a new dataset.</p>
                </div>
            )}
            {!isLoading && filteredData.length > 0 && <Dashboard data={filteredData} />}
          </>
        )}
      </main>
      <footer className="text-center mt-12 py-4 border-t border-slate-300">
        <p className="text-sm text-slate-500">Meta Ads Analyzer &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
    
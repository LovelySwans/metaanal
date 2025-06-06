
import React, { useState, useEffect } from 'react';
import { FilterState } from '../types';
import { CalendarDays, MapPin, Megaphone, X } from 'lucide-react';

interface FilterControlsProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  uniqueCountries: string[];
  uniqueCampaigns: string[];
  minDate: Date | null;
  maxDate: Date | null;
  disabled?: boolean;
}

// Helper to format date to YYYY-MM-DD for input type="date"
const formatDateForInput = (date: Date | null): string => {
  if (!date) return '';
  // Adjust for timezone offset to display local date correctly in input
  const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return adjustedDate.toISOString().split('T')[0];
};


const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  setFilters,
  uniqueCountries,
  uniqueCampaigns,
  minDate,
  maxDate,
  disabled = false,
}) => {

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const newDate = e.target.value ? new Date(e.target.value) : null;
    // If newDate is not null, adjust it to be UTC midnight to avoid timezone issues with comparisons
    const adjustedDate = newDate ? new Date(Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())) : null;

    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [type]: adjustedDate }
    }));
  };
  
  const handleMultiSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>, 
    filterKey: 'countries' | 'campaigns'
  ) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFilters(prev => ({ ...prev, [filterKey]: selectedOptions }));
  };

  const clearFilter = (filterKey: keyof FilterState) => {
    if (filterKey === 'dateRange') {
        setFilters(prev => ({ ...prev, dateRange: { start: minDate, end: maxDate } }));
    } else {
        setFilters(prev => ({ ...prev, [filterKey]: [] }));
    }
  };


  return (
    <div className="space-y-6 p-2">
      <h3 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">Filter Data</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Date Range Filter */}
        <div className="space-y-2">
          <label htmlFor="startDate" className="block text-sm font-medium text-slate-600 flex items-center">
            <CalendarDays size={16} className="mr-2 text-sky-600" /> Date Range
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              id="startDate"
              value={formatDateForInput(filters.dateRange.start)}
              min={minDate ? formatDateForInput(minDate) : undefined}
              max={filters.dateRange.end ? formatDateForInput(filters.dateRange.end) : (maxDate ? formatDateForInput(maxDate) : undefined)}
              onChange={(e) => handleDateChange(e, 'start')}
              className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm disabled:opacity-50"
              disabled={disabled}
            />
            <span className="text-slate-500">-</span>
            <input
              type="date"
              id="endDate"
              value={formatDateForInput(filters.dateRange.end)}
              min={filters.dateRange.start ? formatDateForInput(filters.dateRange.start) : (minDate ? formatDateForInput(minDate) : undefined)}
              max={maxDate ? formatDateForInput(maxDate) : undefined}
              onChange={(e) => handleDateChange(e, 'end')}
              className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm disabled:opacity-50"
              disabled={disabled}
            />
             { (filters.dateRange.start && filters.dateRange.start.getTime() !== (minDate ? minDate.getTime() : 0)) || 
               (filters.dateRange.end && filters.dateRange.end.getTime() !== (maxDate ? maxDate.getTime() : 0)) ? (
                <button onClick={() => clearFilter('dateRange')} className="p-2 text-slate-500 hover:text-sky-600 disabled:opacity-50" title="Clear date filter" disabled={disabled}>
                    <X size={18} />
                </button>
            ) : <div className="w-[34px]"></div> } {/* Placeholder for alignment */}
          </div>
        </div>

        {/* Country Filter */}
        <div className="space-y-2">
          <label htmlFor="countryFilter" className="block text-sm font-medium text-slate-600 flex items-center">
            <MapPin size={16} className="mr-2 text-sky-600" /> Countries
          </label>
          <div className="flex items-center space-x-2">
            <select
              id="countryFilter"
              multiple
              value={filters.countries}
              onChange={(e) => handleMultiSelectChange(e, 'countries')}
              className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm h-24 disabled:opacity-50"
              disabled={disabled || uniqueCountries.length === 0}
            >
              {uniqueCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            {filters.countries.length > 0 && (
                <button onClick={() => clearFilter('countries')} className="p-2 text-slate-500 hover:text-sky-600 disabled:opacity-50" title="Clear country filter" disabled={disabled}>
                    <X size={18} />
                </button>
            )}
          </div>
          {uniqueCountries.length === 0 && <p className="text-xs text-slate-400">No country data available.</p>}
        </div>

        {/* Campaign Filter */}
        <div className="space-y-2">
          <label htmlFor="campaignFilter" className="block text-sm font-medium text-slate-600 flex items-center">
            <Megaphone size={16} className="mr-2 text-sky-600" /> Campaigns
          </label>
          <div className="flex items-center space-x-2">
            <select
              id="campaignFilter"
              multiple
              value={filters.campaigns}
              onChange={(e) => handleMultiSelectChange(e, 'campaigns')}
              className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm h-24 disabled:opacity-50"
              disabled={disabled || uniqueCampaigns.length === 0}
            >
              {uniqueCampaigns.map(campaign => (
                <option key={campaign} value={campaign}>{campaign}</option>
              ))}
            </select>
            {filters.campaigns.length > 0 && (
                <button onClick={() => clearFilter('campaigns')} className="p-2 text-slate-500 hover:text-sky-600 disabled:opacity-50" title="Clear campaign filter" disabled={disabled}>
                    <X size={18} />
                </button>
            )}
          </div>
           {uniqueCampaigns.length === 0 && <p className="text-xs text-slate-400">No campaign data available.</p>}
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
    
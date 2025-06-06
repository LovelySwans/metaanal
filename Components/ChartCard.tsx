
import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-2">{title}</h3>
      {children}
    </div>
  );
};

export default ChartCard;
    
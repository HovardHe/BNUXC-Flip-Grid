import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, highlight = false }) => {
  return (
    <div className={`flex flex-col items-center p-3 rounded-lg border shadow-sm min-w-[100px] ${highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-mono font-bold ${highlight ? 'text-blue-600' : 'text-gray-800'}`}>
        {value}
      </div>
    </div>
  );
};
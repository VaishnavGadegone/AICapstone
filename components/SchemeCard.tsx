import React from 'react';
import { SchemeConfig } from '../types';

interface SchemeCardProps {
  scheme: SchemeConfig;
  isSelected: boolean;
  onClick: () => void;
}

const SchemeCard: React.FC<SchemeCardProps> = ({ scheme, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-start p-4 rounded-xl border transition-all duration-300 w-full text-left
        ${isSelected 
          ? `border-${scheme.color.split('-')[1]}-500 ring-2 ring-${scheme.color.split('-')[1]}-200 bg-white shadow-lg` 
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
        }
      `}
    >
      <div className={`p-3 rounded-lg mb-3 ${scheme.bgColor}`}>
        <span className="text-2xl">{scheme.icon}</span>
      </div>
      <h3 className={`font-bold text-lg mb-1 ${scheme.color}`}>
        {scheme.title}
      </h3>
      <p className="text-slate-500 text-xs sm:text-sm line-clamp-2">
        {scheme.description}
      </p>
    </button>
  );
};

export default SchemeCard;

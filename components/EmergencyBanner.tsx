import React from 'react';
import { PhoneIcon, ShieldAlertIcon } from './Icons';

const EmergencyBanner: React.FC = () => {
  return (
    <div className="bg-red-600 text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-between shadow-md sticky top-0 z-50">
      <div className="flex items-center space-x-2 mb-1 sm:mb-0">
        <ShieldAlertIcon className="w-5 h-5 text-red-200" />
        <span className="font-bold text-sm tracking-wide uppercase">Emergency Mode</span>
      </div>
      <div className="flex items-center space-x-6 text-sm font-medium">
        <a href="tel:181" className="flex items-center hover:text-red-100 transition-colors">
          <PhoneIcon className="w-4 h-4 mr-2" />
          <span>Women Helpline: 181</span>
        </a>
        <a href="tel:1098" className="flex items-center hover:text-red-100 transition-colors">
          <PhoneIcon className="w-4 h-4 mr-2" />
          <span>Childline: 1098</span>
        </a>
      </div>
    </div>
  );
};

export default EmergencyBanner;

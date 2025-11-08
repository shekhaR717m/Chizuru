import React from 'react';

const BotIcon: React.FC = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5 text-white" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="M12 8V4H8"></path>
        <rect x="4" y="12" width="16" height="8" rx="2"></rect>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="M12 20v-4"></path>
        <path d="m16 8-3-3-3 3"></path>
    </svg>
);

export default BotIcon;

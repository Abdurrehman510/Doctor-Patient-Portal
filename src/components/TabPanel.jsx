import { useState } from 'react';

const TabPanel = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
              activeTab === index
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.notification && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {tab.notification}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="p-6 transition-all duration-300 ease-in-out">
        {tabs[activeTab].content}
      </div>
    </div>
  );
};

export default TabPanel;
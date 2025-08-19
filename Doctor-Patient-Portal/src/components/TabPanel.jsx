import { useState } from 'react';

const TabPanel = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-200 relative ${
              activeTab === index
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.icon && <span className={activeTab === index ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}>{tab.icon}</span>}
            {tab.label}
            {tab.notification && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {tab.notification}
              </span>
            )}
            {activeTab === index && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></span>
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
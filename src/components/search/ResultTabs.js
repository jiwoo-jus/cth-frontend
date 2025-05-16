import React from 'react';

const ResultTabs = ({ activeTab, onTabChange }) => {
  // Basic tabs logic (can be expanded)
  return (
    <div className="result-tabs">
      <button
        className={activeTab === 'pm' ? 'active' : ''}
        onClick={() => onTabChange('pm')}
      >
        PubMed
      </button>
      <button
        className={activeTab === 'ctg' ? 'active' : ''}
        onClick={() => onTabChange('ctg')}
      >
        ClinicalTrials.gov
      </button>
    </div>
  );
};

export default ResultTabs;
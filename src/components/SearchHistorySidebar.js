// filepath: src/components/SearchHistorySidebar.js
import React from 'react';

// 사용자 친화적 레이블 매핑 (필요에 따라 확장 가능)
const labelMap = {
  cond: "Condition",
  intr: "Intervention",
  other_term: "Other Term",
  journal: "Journal",
  sex: "Sex",
  age: "Age Group",
  studyType: "Study Type",
  sponsor: "Sponsor",
  location: "Location",
  status: "Status"
};

const SearchHistorySidebar = ({ history, onSelect, isOpen, toggleSidebar, sidebarWidth }) => {
  return (
    <div
      className="bg-white shadow-md p-2 overflow-auto sticky top-0"
      style={{ width: isOpen ? sidebarWidth : "2rem", transition: "width 0.3s" }}
    >
      <button onClick={toggleSidebar} className="text-sm text-blue-500 focus:outline-none">
        {isOpen ? "<<" : ">>"}
      </button>
      {isOpen && (
        <div className="mt-2 text-sm break-words">
          <h3 className="font-semibold mb-2">Search History</h3>
          {history.length === 0 ? (
            <p className="text-gray-500">No history yet.</p>
          ) : (
            <ul>
              {history.map((item, index) => (
                <li key={index} className="mb-2 border-b pb-1">
                  <button 
                    onClick={() => onSelect(item)}
                    className="block text-left w-full text-gray-700 hover:bg-gray-100 rounded p-1"
                  >
                    {Object.entries(item).map(([key, value]) => {
                      if (!value) return null;
                      return (
                        <div key={key}>
                          <span className="font-bold">{labelMap[key] || key}:</span> {value}
                        </div>
                      );
                    })}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchHistorySidebar;

// filepath: src/components/SearchHistorySidebar.js
import React from 'react';
import PropTypes from 'prop-types';


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


SearchHistorySidebar.propTypes = {
  history: PropTypes.arrayOf(
    PropTypes.shape({
      cond: PropTypes.string,
      intr: PropTypes.string,
      other_term: PropTypes.string,
      journal: PropTypes.string,
      sex: PropTypes.string,
      age: PropTypes.string,
      studyType: PropTypes.string,
      sponsor: PropTypes.string,
      location: PropTypes.string,
      status: PropTypes.string,
      // 페이지네이션 등 추가 값이 있다면 함께 정의할 수 있습니다.
      page: PropTypes.number,
      pageSize: PropTypes.number,
      isRefined: PropTypes.bool,
      refinedQuery: PropTypes.any
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  sidebarWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};


export default SearchHistorySidebar;
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { PanelLeft, PanelRight } from 'lucide-react'; // Import icons

const DetailSidebar = ({
  selectedResult,
  defaultOpen = false,
  expandedWidth = '30%',
  collapsedWidth = '3rem', // Adjusted for icon visibility
}) => {
  // Local state to control sidebar open/closed status
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // selectedResult prop이 변경될 때 사이드바를 열도록 하는 useEffect 추가
  useEffect(() => {
    // selectedResult가 null이 아니고 유효한 객체일 때만 isOpen을 true로 설정
    if (selectedResult) {
      setIsOpen(true);
    }
    // selectedResult가 변경될 때마다 이 effect를 실행
  }, [selectedResult]);

  // Function to toggle sidebar open/closed state
  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  // Render content based on the selected result
  const renderContent = () => {
    if (!selectedResult) {
      return <p className="text-sm text-gray-500">Select a result to view details.</p>;
    }
    if (selectedResult.source === 'PM' || selectedResult.source === 'PMC') {
      const abstract = selectedResult.abstract;
      if (!abstract) {
        return <p className="text-sm text-gray-500">No abstract available.</p>;
      }
      return (
        <div>
          <h4 className="font-bold text-lg mb-2">Abstract</h4>
          {Object.entries(abstract).map(([key, value]) => (
            <div key={key} className="mb-2">
              <span className="font-bold block">{key}</span>
              <span className="block">{value}</span>
            </div>
          ))}
        </div>
      );
    } else if (selectedResult.source === 'CTG') {
      if (!selectedResult.references || selectedResult.references.length === 0) {
        return <p className="text-sm text-gray-500">No references available.</p>;
      }
      return (
        <div>
          {/* CTG specific rendering content */}
          <p className="text-sm text-gray-500">CTG content goes here.</p>
        </div>
      );
    } else {
      return <p className="text-sm text-gray-500">Details not available.</p>;
    }
  };

  return (
    <div
      className={`h-screen overflow-y-auto bg-white shadow-lg border-l border-gray-200 sticky top-0 transition-all duration-300 ease-in-out ${isOpen ? 'rounded-r-2xl' : ''} flex-shrink-0`}
      style={{
        width: isOpen ? expandedWidth : collapsedWidth,
      }}
    >
      {/* Removed bg-gray-50, adjusted padding and justification */}
      <div className={`flex items-center ${isOpen ? 'justify-end' : 'justify-center'} p-2 border-b border-gray-200`}>
        <button
          type="button"
          aria-controls="sidebar-drawer"
          aria-expanded={isOpen}
          className="p-1 text-primary-44 hover:text-primary-100 duration-short ease-curve-a cursor-pointer transition-colors" // Adjusted padding
          aria-label="Toggle navigation sidebar"
          onClick={toggleSidebar}
        >
          {/* Conditionally render icons */}
          {isOpen ? <PanelLeft size={18} /> : <PanelRight size={18} />}
        </button>
      </div>
      {/* Content is only rendered when open */}
      {isOpen && (
        <div className="px-4 py-2 text-sm text-gray-700 overflow-hidden"> {/* Added overflow-hidden */}
          {renderContent()}
        </div>
      )}
    </div>
  );
};

DetailSidebar.propTypes = {
  selectedResult: PropTypes.object,
  defaultOpen: PropTypes.bool,
  expandedWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  collapsedWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default DetailSidebar;

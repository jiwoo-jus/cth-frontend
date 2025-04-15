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
        // Removed H4 title from here
        <div>
          {Object.entries(abstract).map(([key, value]) => (
            <div key={key} className="mb-2">
              {/* Unified emphasis style: text-base font-semibold */}
              <span className="font-semibold block text-base mb-1">{key}</span>
              {/* Unified content style: text-sm */}
              <span className="block text-sm">{value}</span>
            </div>
          ))}
        </div>
      );
    } else if (selectedResult.source === 'CTG') {
      // Access the nested references array
      const references = selectedResult?.structured_info?.protocolSection?.referencesModule?.references;

      if (!references || references.length === 0) {
        return <p className="text-sm text-gray-500">No references available.</p>;
      }

      // Grouping logic from the old code
      const groupMap = {
        BACKGROUND: 'General',
        RESULT: 'Study Results',
        DERIVED: 'From PubMed',
      };
      const groupDescriptions = {
        General: 'These publications are provided voluntarily by the person who enters information about the study.',
        'Study Results': 'These publications are about the study results.',
        'From PubMed': 'These publications come from PubMed, a public database of scientific and medical articles.',
        Other: 'Other related publications.',
      };

      const groups = {};
      references.forEach((ref) => {
        const groupName = groupMap[ref.type] || 'Other';
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(ref);
      });

      return (
        // Removed H3 title from here
        <div>
          {Object.entries(groups).map(([groupName, refs]) => (
            <div key={groupName} className="mb-4">
              {/* Unified emphasis style: text-base font-semibold */}
              <h4 className="font-semibold text-base mb-1">{groupName}</h4>
              {/* Description style remains text-sm */}
              {groupDescriptions[groupName] && (
                <p className="text-sm text-gray-500 mb-2">{groupDescriptions[groupName]}</p>
              )}
              {/* Render each reference within the group */}
              {refs.map((ref, index) => (
                <div key={ref.pmid || `${groupName}-${index}`} className="mb-2 border-b pb-2 last:border-b-0">
                  {/* Unified content style: text-sm */}
                  {ref.citation && <p className="text-sm mb-1">{ref.citation}</p>}
                  {ref.pmid && (
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      // Unified content style: text-sm
                      className="text-sm text-blue-600 hover:underline block"
                    >
                      PMID: {ref.pmid}
                    </a>
                  )}
                  {/* Optionally display type if needed, though it's used for grouping */}
                  {/* <p className="text-xs text-gray-500 mt-1">Type: {ref.type}</p> */}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    } else {
      return <p className="text-sm text-gray-500">Details not available.</p>;
    }
  };

  // Determine the title based on selectedResult and content availability
  const getTitle = () => {
    if (!selectedResult || !isOpen) return null;

    if ((selectedResult.source === 'PM' || selectedResult.source === 'PMC') && selectedResult.abstract) {
      return 'Abstract';
    } else if (selectedResult.source === 'CTG' && selectedResult?.structured_info?.protocolSection?.referencesModule?.references?.length > 0) {
      return 'References';
    }
    return null;
  };

  const title = getTitle();

  return (
    <div
      className={`h-screen overflow-y-auto bg-white shadow-lg border-l border-gray-200 sticky top-0 transition-all duration-300 ease-in-out ${isOpen ? 'rounded-r-2xl' : ''} flex-shrink-0`}
      style={{
        width: isOpen ? expandedWidth : collapsedWidth,
      }}
    >
      {/* Header Section */}
      <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} p-2 border-b border-gray-200`}>
        {/* Title - Only shown when open and title exists */}
        {isOpen && title && (
          <h3 className="font-bold text-lg ml-2">{title}</h3> // Main title remains text-lg font-bold
        )}
        {/* Spacer for when title is not shown but sidebar is open, to keep button right-aligned */}
        {isOpen && !title && <div />}

        {/* Toggle Button */}
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
        <div className="px-4 py-2 text-sm text-gray-700 overflow-y-auto" style={{ height: 'calc(100vh - 41px)' }}> {/* Adjust height based on header height */}
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

import PropTypes from 'prop-types';
import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { PanelLeft, PanelRight, X } from 'lucide-react'; // Added X icon for closing

// Helper function to detect and linkify URLs and NCT IDs
const linkify = (text) => {
  if (!text) return text;

  // Regex to find URLs or NCT IDs
  // Group 1: URLs (https?://...)
  // Group 2: NCT IDs (NCT followed by digits)
  const combinedRegex = /(https?:\/\/[^\s]+)|(NCT\d+)/g;
  const urlPattern = /^https?:\/\//; // Simple check if a match is a URL
  const nctPattern = /^NCT\d+$/;    // Simple check if a match is an NCT ID

  // Split the text by the regex. Capturing groups ensure delimiters are kept.
  const parts = text.split(combinedRegex);

  return parts.map((part, index) => {
    // Ignore empty strings that can result from split
    if (!part) return null;

    // Check if the part is a URL
    if (part.match(urlPattern)) {
      return (
        <a
          key={`url-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {part}
        </a>
      );
    }
    // Check if the part is an NCT ID
    else if (part.match(nctPattern)) {
      const nctid = part;
      return (
        <a
          key={`nct-${index}`}
          href={`https://clinicaltrials.gov/study/${nctid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {nctid}
        </a>
      );
    }
    // Otherwise, it's a plain text segment
    else {
      // Return the plain text part. Use React Fragment for keys if needed,
      // but simple string return is often sufficient here.
      return part;
    }
  }).filter(Boolean); // Filter out any null parts created by empty strings
};

const DetailSidebar = ({
  selectedResult,
  defaultOpen = false,
  expandedWidth = '30%',
  collapsedWidth = '3rem', // Adjusted for icon visibility
  onClose, // Callback when user explicitly closes the sidebar
}) => {
  // Local state to control sidebar open/closed status
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // selectedResult prop이 변경될 때 사이드바를 열도록 하는 useEffect 추가
  useEffect(() => {
    // selectedResult가 null이 아니고 유효한 객체일 때만 isOpen을 true로 설정
    if (selectedResult) {
      console.log('[DetailSidebar] Received new selectedResult, opening sidebar.');
      setIsOpen(true);
    }
    // selectedResult가 변경될 때마다 이 effect를 실행
  }, [selectedResult]);

  // Function to toggle sidebar open/closed state
  const toggleSidebar = useCallback(() => {
    console.log('[DetailSidebar] Toggling sidebar visibility.');
    setIsOpen((prev) => !prev);
  }, []);

  // Handle explicit close action
  const handleClose = useCallback(() => {
    console.log('[DetailSidebar] Closing sidebar via close button.');
    setIsOpen(false);
    if (onClose) {
      onClose(); // Notify parent component (e.g., SearchPage to set selectedResult to null)
    }
  }, [onClose]);

  // Render content based on the selected result
  const renderContent = () => {
    if (!selectedResult) {
      return isOpen ? <p className="text-sm text-gray-500 p-4">Select a result to view details.</p> : null;
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
            <div key={key} className="mb-3"> {/* Increased margin */}
              {/* Unified emphasis style: text-base font-semibold */}
              <span className="font-semibold block text-base mb-1">{key}</span>
              {/* Unified content style: text-sm, apply linkify */}
              <span className="block text-sm">{linkify(value)}</span>
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
        General: 'Voluntarily provided publications.',
        'Study Results': 'Publications about study results.',
        'From PubMed': 'Publications sourced from PubMed.',
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
                <p className="text-xs text-gray-500 mb-2">{groupDescriptions[groupName]}</p>
              )}
              {/* Render each reference within the group */}
              {refs.map((ref, index) => (
                <div key={ref.pmid || `${groupName}-${index}`} className="mb-2 border-b pb-2 last:border-b-0">
                  {/* Unified content style: text-sm, apply linkify */}
                  {ref.citation && <p className="text-sm mb-1">{linkify(ref.citation)}</p>}
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
      return <p className="text-sm text-gray-500 p-4">Details not available for this source.</p>;
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
    return selectedResult ? 'Details' : null;
  };

  const title = getTitle();

  return (
    <aside // Use aside element for semantic meaning
      className={`h-screen overflow-hidden bg-white shadow-lg border-l border-gray-200 sticky top-0 transition-all duration-300 ease-in-out flex flex-col flex-shrink-0`}
      style={{ width: isOpen ? expandedWidth : collapsedWidth }}
      aria-label="Details Sidebar"
    >
      {/* Header Section */}
      <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} p-2 border-b border-gray-200 flex-shrink-0`}>
        {/* Title - Only shown when open and title exists */}
        {isOpen && title && (
          <h3 className="font-bold text-lg ml-2 truncate" title={title}>{title}</h3> // Added truncate and title
        )}
        {/* Spacer for alignment when title is hidden */}
        {isOpen && !title && <div className="flex-grow" />}

        {/* Buttons Container */}
        <div className="flex items-center">
          {/* Close Button (only show when open) */}
          {isOpen && onClose && (
            <button
              type="button"
              className="p-1 text-gray-500 hover:text-gray-800 duration-short ease-curve-a cursor-pointer transition-colors mr-1" // Added margin
              aria-label="Close details sidebar"
              onClick={handleClose}
            >
              <X size={18} />
            </button>
          )}
          {/* Toggle Button */}
          <button
            type="button"
            aria-controls="sidebar-drawer"
            aria-expanded={isOpen}
            className="p-1 text-gray-500 hover:text-gray-800 duration-short ease-curve-a cursor-pointer transition-colors"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            onClick={toggleSidebar}
          >
            {isOpen ? <PanelLeft size={18} /> : <PanelRight size={18} />}
          </button>
        </div>
      </div>

      {/* Content Area - Scrollable */}
      {/* Render content wrapper only when open to prevent unnecessary rendering */}
      {isOpen && (
        <div className="px-4 py-3 text-sm text-gray-700 overflow-y-auto flex-grow"> {/* Use flex-grow for remaining space */}
          {renderContent()}
        </div>
      )}
    </aside>
  );
};

DetailSidebar.propTypes = {
  selectedResult: PropTypes.object,
  defaultOpen: PropTypes.bool,
  expandedWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  collapsedWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onClose: PropTypes.func, // Callback function to notify parent when closed
  // onViewFullDetail: PropTypes.func, // Optional: Callback for navigating
};

// Memoize the component as its rendering depends only on props
export default React.memo(DetailSidebar);

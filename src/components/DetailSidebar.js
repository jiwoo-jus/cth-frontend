import PropTypes from 'prop-types';
import React from 'react';

const DetailSidebar = ({
  selectedResult,
  defaultOpen = false,
  expandedWidth = '60rem',
  collapsedWidth = '3rem',
}) => {
  // Local state to control sidebar open/closed status
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

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
      className={`h-screen overflow-y-auto bg-white shadow-lg border-l border-gray-200 sticky top-0 transition-all duration-300 ease-in-out ${isOpen ? 'rounded-r-2xl' : ''}`}
      style={{
        width: isOpen ? expandedWidth : collapsedWidth,
      }}
    >
      <div className="flex items-center justify-end p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          aria-controls="sidebar-drawer"
          aria-expanded={isOpen}
          className="p-xs text-primary-44 hover:text-primary-100 duration-short ease-curve-a cursor-pointer transition-colors hidden md:block"
          aria-label="Toggle navigation sidebar"
          onClick={toggleSidebar}
        >
          <svg width="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M9.35719 3H14.6428C15.7266 2.99999 16.6007 2.99998 17.3086 3.05782C18.0375 3.11737 18.6777 3.24318 19.27 3.54497C20.2108 4.02433 20.9757 4.78924 21.455 5.73005C21.7568 6.32234 21.8826 6.96253 21.9422 7.69138C22 8.39925 22 9.27339 22 10.3572V13.6428C22 14.7266 22 15.6008 21.9422 16.3086C21.8826 17.0375 21.7568 17.6777 21.455 18.27C20.9757 19.2108 20.2108 19.9757 19.27 20.455C18.6777 20.7568 18.0375 20.8826 17.3086 20.9422C16.6008 21 15.7266 21 14.6428 21H9.35717C8.27339 21 7.39925 21 6.69138 20.9422C5.96253 20.8826 5.32234 20.7568 4.73005 20.455C3.78924 19.9757 3.02433 19.2108 2.54497 18.27C2.24318 17.6777 2.11737 17.0375 2.05782 16.3086C1.99998 15.6007 1.99999 14.7266 2 13.6428V10.3572C1.99999 9.27341 1.99998 8.39926 2.05782 7.69138C2.11737 6.96253 2.24318 6.32234 2.54497 5.73005C3.02433 4.78924 3.78924 4.02433 4.73005 3.54497C5.32234 3.24318 5.96253 3.11737 6.69138 3.05782C7.39926 2.99998 8.27341 2.99999 9.35719 3ZM6.85424 5.05118C6.24907 5.10062 5.90138 5.19279 5.63803 5.32698C5.07354 5.6146 4.6146 6.07354 4.32698 6.63803C4.19279 6.90138 4.10062 7.24907 4.05118 7.85424C4.00078 8.47108 4 9.26339 4 10.4V13.6C4 14.7366 4.00078 15.5289 4.05118 16.1458C4.10062 16.7509 4.19279 17.0986 4.32698 17.362C4.6146 17.9265 5.07354 18.3854 5.63803 18.673C5.90138 18.8072 6.24907 18.8994 6.85424 18.9488C7.17922 18.9754 7.55292 18.9882 8 18.9943V5.0057C7.55292 5.01184 7.17922 5.02462 6.85424 5.05118ZM10 5V19H14.6C15.7366 19 16.5289 18.9992 17.1458 18.9488C17.7509 18.8994 18.0986 18.8072 18.362 18.673C18.9265 18.3854 19.3854 17.9265 19.673 17.362C19.8072 17.0986 19.8994 16.7509 19.9488 16.1458C19.9992 15.5289 20 14.7366 20 13.6V10.4C20 9.26339 19.9992 8.47108 19.9488 7.85424C19.8994 7.24907 19.8072 6.90138 19.673 6.63803C19.3854 6.07354 18.9265 5.6146 18.362 5.32698C18.0986 5.19279 17.7509 5.10062 17.1458 5.05118C16.5289 5.00078 15.7366 5 14.6 5H10Z" fill="currentColor"></path>
          </svg>
        </button>
      </div>
      {isOpen && (
        <div className="px-4 py-2 text-sm text-gray-700">
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

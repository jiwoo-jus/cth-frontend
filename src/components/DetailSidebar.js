// src/components/DetailSidebar.js
import React from 'react';
import PropTypes from 'prop-types';

const DetailSidebar = ({ selectedResult, isOpen, toggleSidebar, sidebarWidth }) => {
  const renderCTGContent = (references) => {
    const groupMap = {
      BACKGROUND: "General",
      RESULT: "Study Results",
      DERIVED: "From PubMed"
    };
    const groups = {};
    references.forEach((ref) => {
      const group = groupMap[ref.type] || "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(ref);
    });
    return (
      <div>
        {Object.entries(groups).map(([group, refs]) => (
          <div key={group} className="mb-4">
            <h4 className="font-bold text-lg mb-1">{group}</h4>
            {group === "General" && (
              <p className="text-sm text-gray-600 mb-1">
                These publications are provided voluntarily by the person who enters information about the study.
              </p>
            )}
            {group === "Study Results" && (
              <p className="text-sm text-gray-600 mb-1">
                These publications are about the study results.
              </p>
            )}
            {group === "From PubMed" && (
              <p className="text-sm text-gray-600 mb-1">
                These publications come from PubMed, a public database of scientific and medical articles.
              </p>
            )}
            <ul className="space-y-1">
              {refs.map((ref, idx) => (
                <li key={idx} className="text-sm text-gray-700 border-b pb-1">
                  {ref.pmid && (
                    <div>
                      <span className="font-bold">PMID:</span> {ref.pmid}
                    </div>
                  )}
                  <div>
                    <span className="font-bold">Citation:</span> {ref.citation}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    if (!selectedResult) {
      return <p className="text-sm text-gray-500">Select a result to view details.</p>;
    }
    if (selectedResult.source === 'PM' || selectedResult.source === 'PMC') {
      const abstract = selectedResult.abstract;
      if (!abstract)
        return <p className="text-sm text-gray-500">No abstract available.</p>;
      return (
        <div>
          <h4 className="font-bold text-lg mb-2">Abstract</h4>
          {Object.entries(abstract).map(([key, value]) => (
            <div key={key} className="mb-2">
              <span className="font-bold">{key}:</span> <span>{value}</span>
            </div>
          ))}
        </div>
      );
    } else if (selectedResult.source === 'CTG') {
      const references = selectedResult.references;
      if (!references || references.length === 0) {
        return <p className="text-sm text-gray-500">No references available.</p>;
      }
      return renderCTGContent(references);
    } else {
      return <p className="text-sm text-gray-500">Details not available.</p>;
    }
  };

  return (
    <div
      className="bg-white shadow-md p-2 overflow-auto sticky top-0"
      style={{ width: isOpen ? sidebarWidth : "2rem", transition: "width 0.3s" }}
    >
      <button onClick={toggleSidebar} className="text-sm text-blue-500 focus:outline-none">
        {isOpen ? ">>" : "<<"}
      </button>
      {isOpen && (
        <div className="mt-2 text-sm break-words">
          {renderContent()}
        </div>
      )}
    </div>
  );
};

DetailSidebar.propTypes = {
  selectedResult: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  sidebarWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default DetailSidebar;

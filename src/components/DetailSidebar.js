import PropTypes from 'prop-types';
// src/components/DetailSidebar.js
import React from 'react';

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
              <p className="text-sm text-custom-text-subtle mb-1">
                These publications are provided voluntarily by the person who enters information about the study.
              </p>
            )}
            {group === "Study Results" && (
              <p className="text-sm text-custom-text-subtle mb-1">
                These publications are about the study results.
              </p>
            )}
            {group === "From PubMed" && (
              <p className="text-sm text-custom-text-subtle mb-1">
                These publications come from PubMed, a public database of scientific and medical articles.
              </p>
            )}
            <ul className="space-y-1">
              {refs.map((ref, idx) => (
                <li key={idx} className="text-sm text-custom-text border-b pb-1">
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
      return <p className="text-sm text-custom-text-subtle">Select a result to view details.</p>;
    }
    if (selectedResult.source === 'PM' || selectedResult.source === 'PMC') {
      const abstract = selectedResult.abstract;
      if (!abstract)
        return <p className="text-sm text-custom-text-subtle">No abstract available.</p>;
      return (
        <div>
        <h4 className="font-bold text-lg mb-2">Abstract</h4>
        {Object.entries(selectedResult.abstract).map(([key, value]) => (
          <div key={key} className="mb-2">
            <span className="font-bold block">{key}</span>
            <span className="block">{value}</span>
          </div>
        ))}
      </div>
      );
    } else if (selectedResult.source === 'CTG') {
      const references = selectedResult.references;
      if (!references || references.length === 0) {
        return <p className="text-sm text-custom-text-subtle">No references available.</p>;
      }
      return renderCTGContent(references);
    } else {
      return <p className="text-sm text-custom-text-subtle">Details not available.</p>;
    }
  };

  return (
    <div
    className={`h-screen overflow-y-auto bg-white shadow-md border-l sticky top-0 transition-all duration-300 ease-in-out`}
    style={{ width: isOpen ? sidebarWidth : '2rem' }}
  >
    <div className="p-2 border-b flex justify-end">
      <button
        onClick={toggleSidebar}
        className="text-xs font-bold text-custom-blue hover:underline focus:outline-none"
      >
        {isOpen ? '>>' : '<<'}
      </button>
    </div>
    {isOpen && (
      <div className="px-4 py-2 text-sm break-words">{renderContent()}</div>
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

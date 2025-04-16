import { ChevronsDownUp, ChevronsUpDown, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';
// Import PropTypes
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import FullText from './FullText';

// Assuming FullText is in the same directory or adjust path

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';

// Helper function (moved from DetailPage)
async function getPmcidFromPmid(pmid) {
  try {
    console.log(`Fetching PMCID for PMID ${pmid} via backend ReferenceList.js`);
    const response = await fetch(`${BASE_URL}/api/utils/convert_pmid_to_pmcid?pmid=${pmid}`);
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No PMCID found for PMID ${pmid} via backend.`);
        return null;
      }
      throw new Error(`Failed to convert PMID ${pmid}. Status: ${response.status}`);
    }
    const data = await response.json();
    return data.pmcid;
  } catch (error) {
    console.error("Error calling backend for PMID to PMCID conversion:", error);
    return null;
  }
}

const ReferenceList = forwardRef(({ references }, ref) => {
  const [expandedReferenceIndex, setExpandedReferenceIndex] = useState(null);
  const [referenceFullText, setReferenceFullText] = useState('');
  const [isFetchingReference, setIsFetchingReference] = useState(false);
  const referenceFullTextRef = useRef(null);

  // Expose the highlightEvidence function via ref
  useImperativeHandle(ref, () => ({
    highlightEvidence: (evidenceText) => {
      referenceFullTextRef.current?.highlightEvidence?.(evidenceText);
    }
  }));

  const handleReferenceToggle = async (index, refData) => {
    if (index === expandedReferenceIndex) {
      setExpandedReferenceIndex(null);
      setReferenceFullText('');
    } else {
      setIsFetchingReference(true);
      setExpandedReferenceIndex(index);
      setReferenceFullText('');

      try {
        let targetPmcid = refData.pmcid;
        if (!targetPmcid && refData.pmid) {
          targetPmcid = await getPmcidFromPmid(refData.pmid);
        }

        if (targetPmcid) {
          const res = await fetch(`${BASE_URL}/api/paper/pmc_full_text_html?pmcid=${targetPmcid}`);
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const htmlString = await res.text();

          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlString, 'text/html');
          const article = doc.querySelector("#main-content > article");
          if (article) {
            article.querySelectorAll("ul.d-buttons.inline-list").forEach(el => el.remove());
            article.querySelectorAll("section").forEach(section => {
              if (section.getAttribute("aria-label") === "Article citation and metadata") {
                section.remove();
              }
            });
            setReferenceFullText(article.outerHTML);
          } else {
            setReferenceFullText(htmlString);
          }
        } else {
          setReferenceFullText('<p>Full text not available (No PMCID found).</p>');
        }
      } catch (error) {
        console.error("Error fetching reference full text:", error);
        setReferenceFullText('<p>Error loading reference full text.</p>');
      } finally {
        setIsFetchingReference(false);
      }
    }
  };

  // Grouping logic (moved from DetailPage)
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
    <>
      <h2 className="text-xl font-semibold text-custom-blue-deep border-b border-custom-border pb-2 mb-4">
        References
      </h2>
      {references.length > 0 ? (
        <>
          {Object.entries(groups).map(([groupName, refs]) => (
            <div key={groupName} className="mb-6">
              <h3 className="font-semibold text-base mb-1">{groupName}</h3>
              {groupDescriptions[groupName] && (
                <p className="text-sm text-custom-text-subtle mb-3">{groupDescriptions[groupName]}</p>
              )}
              <div className="space-y-4 text-sm">
                {refs.map((ref, index) => {
                  const originalIndex = references.findIndex(r =>
                    r.pmid === ref.pmid && r.citation === ref.citation);
                  return (
                    <div key={ref.pmid || `${groupName}-${index}`} className="border-b border-custom-border-light pb-3 last:border-b-0">
                      <div className="mb-2">
                        {ref.citation || 'No citation available'}
                        {ref.pmid && (
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-custom-blue hover:underline ml-2 text-xs"
                          >
                            (PubMed)
                          </a>
                        )}
                        {ref.pmcid && (
                          <a
                            href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${ref.pmcid}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-custom-blue hover:underline ml-2 text-xs"
                          >
                            (PMC)
                          </a>
                        )}
                      </div>
                      {(ref.pmid || ref.pmcid) && (
                        <button
                          onClick={() => handleReferenceToggle(originalIndex, ref)}
                          disabled={isFetchingReference && expandedReferenceIndex === originalIndex}
                          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                            expandedReferenceIndex === originalIndex
                              ? 'bg-custom-blue-lightest text-custom-blue-deep'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } transition-colors disabled:opacity-50`}
                        >
                          {isFetchingReference && expandedReferenceIndex === originalIndex ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : expandedReferenceIndex === originalIndex ? (
                            <ChevronsDownUp size={12} />
                          ) : (
                            <ChevronsUpDown size={12} />
                          )}
                          {expandedReferenceIndex === originalIndex ? 'Collapse Full Text' : 'Expand Full Text'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      ) : (
        <p className="text-custom-text-subtle">No references available.</p>
      )}
      {expandedReferenceIndex !== null && (
        <div className="mt-4 pt-4 border-t border-custom-border">
          <h3 className="text-lg font-semibold text-custom-blue-deep mb-2">Full Text for Reference {expandedReferenceIndex + 1}</h3>
          <FullText ref={referenceFullTextRef} fullText={referenceFullText} />
        </div>
      )}
    </>
  );
});

// Add the displayName property here
ReferenceList.displayName = 'ReferenceList';

// Define propTypes
ReferenceList.propTypes = {
  references: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string,
    pmid: PropTypes.string,
    pmcid: PropTypes.string,
    citation: PropTypes.string,
    // Add other expected properties of a reference object if needed
  })).isRequired,
};

export default ReferenceList;
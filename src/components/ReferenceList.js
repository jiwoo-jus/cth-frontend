import { ChevronsDownUp, ChevronsUpDown, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Added useEffect

import FullText from './FullText';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';

// Remove the old single getPmcidFromPmid helper function
// async function getPmcidFromPmid(pmid) { ... } // REMOVED

const ReferenceList = forwardRef(({ references }, ref) => {
  const [expandedReferenceIndex, setExpandedReferenceIndex] = useState(null);
  const [referenceFullText, setReferenceFullText] = useState('');
  const [isFetchingReference, setIsFetchingReference] = useState(false);
  const referenceFullTextRef = useRef(null);
  const [pmcidMap, setPmcidMap] = useState({}); // State to store PMID -> PMCID mapping
  const [loadingPmcids, setLoadingPmcids] = useState(false); // State for loading indicator

  // Fetch PMCIDs in batch when references change
  useEffect(() => {
    const pmidsInReferences = references
      ?.map(ref => ref.pmid)
      .filter(pmid => pmid); // Get all valid PMIDs from references

    // Filter out PMIDs that are already present in pmcidMap (regardless of value)
    const pmidsToFetchArray = pmidsInReferences?.filter(pmid => !(pmid in pmcidMap)) || [];

    if (pmidsToFetchArray.length > 0) {
      const pmidsToFetchString = pmidsToFetchArray.join(',');
      setLoadingPmcids(true);

      fetch(`${BASE_URL}/api/utils/pmid_to_pmcid_batch?pmids=${pmidsToFetchString}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(records => {
          const mapUpdate = {};
          // Create a quick lookup map from the response records
          const responseMap = records.reduce((acc, record) => {
            if (record.pmid) {
              // Store the PMCID if available, otherwise mark as attempted (null)
              acc[record.pmid] = record.pmcid || null;
            }
            return acc;
          }, {});

          // For every PMID we requested, add an entry to mapUpdate
          pmidsToFetchArray.forEach(pmid => {
            // Use the found PMCID from responseMap, or null if not found/error
            mapUpdate[pmid] = responseMap[pmid] !== undefined ? responseMap[pmid] : null;
          });

          // Merge new results with existing map
          setPmcidMap(prevMap => ({ ...prevMap, ...mapUpdate }));
          console.log("Fetched PMCID map update:", mapUpdate);
        })
        .catch(error => {
          console.error("Error fetching PMCID batch:", error);
          // On error, mark all requested PMIDs as attempted (null) to prevent retries
          const errorMapUpdate = {};
          pmidsToFetchArray.forEach(pmid => {
            errorMapUpdate[pmid] = null; // Mark as attempted even on fetch error
          });
          setPmcidMap(prevMap => ({ ...prevMap, ...errorMapUpdate }));
        })
        .finally(() => {
          setLoadingPmcids(false);
        });
    }
  }, [references, pmcidMap]); // Add pmcidMap to the dependency array

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
      setReferenceFullText(''); // Clear previous text

      try {
        // Use PMCID directly from refData if available, otherwise check the fetched map
        let targetPmcid = refData.pmcid || pmcidMap[refData.pmid];

        // If still no PMCID after checking map, maybe log or handle?
        // (The old single fetch is removed, relying on the batch fetch now)
        if (!targetPmcid) {
           console.warn(`No PMCID found for PMID ${refData.pmid} in refData or fetched map.`);
           // Optionally, try a single fetch as a fallback? Or just show message.
           // For now, show message:
           setReferenceFullText('<p>Full text not available (No PMCID found).</p>');
           setIsFetchingReference(false);
           return;
        }

        // Fetch full text using the determined PMCID
        const res = await fetch(`${BASE_URL}/api/paper/pmc_full_text_html?pmcid=${targetPmcid}`);
        if (!res.ok) throw new Error(`HTTP error fetching full text! status: ${res.status}`);
        const htmlString = await res.text();

        // Parse and clean HTML (same logic as before)
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
          setReferenceFullText(htmlString || '<p>Full text content not found in response.</p>');
        }
      } catch (error) {
        console.error("Error fetching reference full text:", error);
        setReferenceFullText('<p>Error loading reference full text.</p>');
      } finally {
        setIsFetchingReference(false);
      }
    }
  };

  // Grouping logic (remains the same)
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
                  const displayPmcid = ref.pmcid || pmcidMap[ref.pmid]; // Get PMCID from ref or map

                  return (
                    <div key={ref.pmid || `${groupName}-${index}`} className="border-b border-custom-border-light pb-3 last:border-b-0">
                      <div className="mb-1"> {/* Reduced margin bottom */}
                        {ref.citation || 'No citation available'}
                      </div>
                      {/* Display PMID and PMCID links */}
                      {(ref.pmid || displayPmcid) && (
                        <div className="text-xs text-custom-text-subtle mb-2">
                          {ref.pmid && (
                            <a
                              href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-custom-blue hover:underline"
                            >
                              PMID: {ref.pmid}
                            </a>
                          )}
                          {/* Show separator only if both exist */}
                          {ref.pmid && displayPmcid && <span className="mx-1">|</span>}
                          {displayPmcid && (
                            <a
                              href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${displayPmcid}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-custom-blue hover:underline"
                            >
                              PMCID: {displayPmcid}
                            </a>
                          )}
                          {/* Optional: Show loading indicator per item if needed */}
                          {ref.pmid && !displayPmcid && loadingPmcids && <span className="ml-2 text-xs">(loading PMCID...)</span>}
                        </div>
                      )}
                      {/* Expand button - enable if PMID or PMCID exists */}
                      {(ref.pmid || ref.pmcid || pmcidMap[ref.pmid]) && ( // Enable if we have an ID to fetch with
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
      {/* Full text display area (remains the same) */}
      {expandedReferenceIndex !== null && (
        <div className="mt-4 pt-4 border-t border-custom-border">
          <h3 className="text-lg font-semibold text-custom-blue-deep mb-2">Full Text for Reference {expandedReferenceIndex + 1}</h3>
          {isFetchingReference ? (
             <div className="flex justify-center items-center h-20">
               <Loader2 size={24} className="animate-spin text-custom-blue-deep" />
             </div>
          ) : (
             <FullText ref={referenceFullTextRef} fullText={referenceFullText} />
          )}
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
    pmcid: PropTypes.string, // Keep this, might be provided directly
    citation: PropTypes.string,
  })).isRequired,
};

export default ReferenceList;
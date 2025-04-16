import { ChevronsDownUp, ChevronsUpDown, Loader2 } from 'lucide-react';
// src/pages/DetailPage.js
import queryString from 'query-string';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Import icons

import ChatBot from '../components/ChatBot';
import FullText from '../components/FullText';
import StructuredInfoTabs from '../components/StructuredInfoTabs';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';

// Helper function to get PMCID (you might need a backend endpoint for conversion)
// This is a placeholder - implement actual PMID to PMCID conversion if needed
async function getPmcidFromPmid(pmid) {
  try {
    const response = await fetch(`${BASE_URL}/api/utils/convert_pmid_to_pmcid?pmid=${pmid}`);
    if (!response.ok) {
      // Handle cases where the backend returns 404 (not found) or 500 (server error)
      if (response.status === 404) {
        console.log(`No PMCID found for PMID ${pmid} via backend.`);
        return null;
      }
      throw new Error(`Failed to convert PMID ${pmid}. Status: ${response.status}`);
    }
    const data = await response.json();
    return data.pmcid; // Return the pmcid from the backend response
  } catch (error) {
    console.error("Error calling backend for PMID to PMCID conversion:", error);
    return null; // Return null on any fetch error
  }
}


const DetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { paperId, pmcid, nctId, source } = queryString.parse(location.search);

  const metadata = location.state?.metadata || {
    title: 'No Title Available',
    pmid: paperId || '',
    pmcid: pmcid || '',
    nctId: nctId || '',
    doi: '',
    studyType: '',
    authors: [],
    pubDate: '',
    structured_info: null, // Expect structured_info for CTG here
  };

  const [structuredInfo, setStructuredInfo] = useState(null);
  const [fullText, setFullText] = useState(''); // For PMC source
  const [fullTextExpanded, setFullTextExpanded] = useState(false); // For PMC source
  const [expandedReferenceIndex, setExpandedReferenceIndex] = useState(null); // For CTG references
  const [referenceFullText, setReferenceFullText] = useState(''); // For CTG references
  const [isFetchingReference, setIsFetchingReference] = useState(false); // Loading state for reference fetch
  const fullTextRef = useRef(null); // Ref for PMC FullText component
  const referenceFullTextRef = useRef(null); // Ref for Reference FullText component

  useEffect(() => {
    // --- PMC Source Logic ---
    if ((source === 'PM' || source === 'PMC') && metadata.pmcid) { // Use metadata.pmcid
      // Fetch Full Text HTML for PMC
      fetch(`${BASE_URL}/api/paper/pmc_full_text_html?pmcid=${metadata.pmcid}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.text();
         })
        .then((htmlString) => {
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
            setFullText(article.outerHTML);
            setFullTextExpanded(true); // Expand by default if fetched
          } else {
            setFullText(htmlString); // Fallback to raw HTML
            if (htmlString) setFullTextExpanded(true);
          }
        })
        .catch(error => {
            console.error("Error fetching PMC full text HTML:", error);
            setFullText("<p>Error loading full text.</p>");
            setFullTextExpanded(true);
        });

      // Fetch Structured Info for PMC
      fetch(`${BASE_URL}/api/paper/structured_info?pmcid=${metadata.pmcid}`)
        .then((res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then((data) => setStructuredInfo(data.structured_info))
        .catch(error => {
            console.error("Error fetching structured info:", error);
            setStructuredInfo(null); // Indicate loading failed
        });
    }
    // --- CTG Source Logic ---
    else if (source === 'CTG' && metadata.structured_info) {
        console.log("Using structured_info from location state for CTG:", metadata.structured_info);
        setStructuredInfo(metadata.structured_info);
        // No separate full text for CTG itself, references are handled below
        setFullText('');
        setFullTextExpanded(false);
    } else if (source === 'CTG' && nctId && !metadata.structured_info) {
        // Fallback: Fetch CTG detail if not passed via state (should ideally not happen)
        console.warn("Fetching CTG detail as fallback - was it not passed in location.state?");
        fetch(`${BASE_URL}/api/paper/ctg_detail?nctId=${nctId}`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                setStructuredInfo(data.structured_info);
                setFullText(''); // CTG itself doesn't have a single 'full text' like PMC
                setFullTextExpanded(false);
            })
            .catch(error => {
                console.error("Error fetching CTG detail:", error);
                setStructuredInfo(null);
            });
    }

    // Cleanup reference expansion state when source changes
    return () => {
        setExpandedReferenceIndex(null);
        setReferenceFullText('');
        setIsFetchingReference(false);
    };

  }, [metadata.pmcid, nctId, source, metadata.structured_info]); // Add metadata.structured_info dependency

  const handleReferenceToggle = async (index, ref) => {
    if (index === expandedReferenceIndex) {
      // Collapse current
      setExpandedReferenceIndex(null);
      setReferenceFullText('');
    } else {
      // Expand new one
      setIsFetchingReference(true);
      setExpandedReferenceIndex(index); // Show loading state for the clicked item
      setReferenceFullText(''); // Clear previous text

      try {
        let targetPmcid = ref.pmcid; // Prefer direct PMCID
        if (!targetPmcid && ref.pmid) {
          // If no PMCID, try converting PMID (implement getPmcidFromPmid properly)
          targetPmcid = await getPmcidFromPmid(ref.pmid);
        }

        if (targetPmcid) {
          const res = await fetch(`${BASE_URL}/api/paper/pmc_full_text_html?pmcid=${targetPmcid}`);
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const htmlString = await res.text();

          // Basic HTML cleaning (similar to PMC source)
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
            setReferenceFullText(htmlString); // Fallback
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


  const scrollToEvidence = (evidenceText) => {
    if (source === 'CTG' && expandedReferenceIndex !== null) {
        referenceFullTextRef.current?.highlightEvidence?.(evidenceText);
    } else if (source !== 'CTG') {
        fullTextRef.current?.highlightEvidence?.(evidenceText);
    }
  };

  // Extract references correctly for CTG
  const ctgReferences = structuredInfo?.protocolSection?.referencesModule?.references || [];

  // --- Prepare CTG Metadata for display (similar to SearchResults) ---
  let ctgDetailsRowItems = [];
  if (source === 'CTG' && structuredInfo) {
    const studyType = structuredInfo.protocolSection?.designModule?.studyType;
    const referencesCount = ctgReferences.length;
    const status = structuredInfo.protocolSection?.statusModule?.overallStatus;
    const hasResults = structuredInfo.hasResultsData; // Assuming this field exists in the fetched CTG detail

    if (studyType) ctgDetailsRowItems.push(studyType);
    if (referencesCount > 0) ctgDetailsRowItems.push(<strong key="ref">{referencesCount} references</strong>); else ctgDetailsRowItems.push('0 references');
    if (status) ctgDetailsRowItems.push(status);
    if (hasResults !== undefined) {
        if (hasResults) ctgDetailsRowItems.push(<strong key="res">has results</strong>); else ctgDetailsRowItems.push('no results');
    }
  }
  const ctgOrganization = structuredInfo?.protocolSection?.identificationModule?.organization?.fullName;
  const ctgStartDate = structuredInfo?.protocolSection?.statusModule?.startDateStruct?.date;
  const ctgCompletionDateInfo = structuredInfo?.protocolSection?.statusModule?.completionDateStruct;
  const ctgCompletionDate = ctgCompletionDateInfo?.type === 'ACTUAL' ? ctgCompletionDateInfo?.date : null;
  // --- End CTG Metadata Preparation ---


  return (
    <div className="px-6 py-8 max-w-screen-2xl mx-auto"> {/* max-w-7xl -> max-w-screen-2xl */}
      <h1
        className="text-3xl font-bold text-black tracking-tight text-center cursor-pointer mb-6 hover:opacity-80 transition" // Adjusted: text-4xl -> text-3xl, font-extrabold -> font-semibold
        onClick={() => navigate(-1)} // Go back to previous page (Search)
      >
        Clinical Trials Hub
      </h1>

      {/* 메타데이터 카드 - Display based on source */}
      {/* --- PMC/PM Metadata Card --- */}
      {source !== 'CTG' && metadata.title !== 'No Title Available' && (
        <div className="bg-custom-bg-soft border border-custom-border p-5 rounded-2xl shadow-lg mb-8">
           {/* Source Indicator */}
           <p className="text-xs text-custom-text-subtle mb-1">from PubMed</p>
           <h2 className="text-lg font-semibold text-custom-blue-deep mb-1"> {/* Adjusted: text-2xl -> text-lg */}
            {metadata.title}
          </h2>
          {metadata.authors?.length > 0 && (
            <p className="text-sm text-custom-text-subtle mt-1"> {/* Adjusted: text-base -> text-sm, added pt-1 */}
              {metadata.authors.join(', ')}
            </p>
          )}
          <p className="text-sm text-custom-text mt-1">
            {metadata.journal && <span>{metadata.journal}</span>}
            {metadata.journal && metadata.pubDate && <span className="mx-1">|</span>}
            {metadata.pubDate && <span>{metadata.pubDate}</span>}
          </p>
          <p className="text-xs text-custom-text-subtle mt-1">
            {metadata.pmid && (
                <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${metadata.pmid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-custom-blue hover:underline"
                >
                    {metadata.pmid}
                </a>
            )}
            {metadata.pmid && metadata.pmcid && <span className="mx-1">|</span>}
            {metadata.pmcid && (
                <a
                    href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${metadata.pmcid}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-custom-blue hover:underline"
                >
                    {metadata.pmcid}
                </a>
            )}
            {/* Removed NCT ID display for PM/PMC source */}
          </p>
          {/* Include Study Type if available */}
          {metadata.studyType && (
            <p className="text-sm text-custom-text mt-1">
              <strong>Study Type:</strong> {metadata.studyType}
            </p>
          )}
        </div>
      )}

       {/* --- CTG Metadata Card --- */}
      {source === 'CTG' && structuredInfo && (
        <div className="bg-custom-bg-soft border border-custom-border p-5 rounded-2xl shadow-lg mb-8">
            {/* Source Indicator */}
            <p className="text-xs text-custom-text-subtle mb-1">from ClinicalTrials.gov</p>
            <h2 className="text-lg font-semibold text-custom-blue-deep mb-1"> {/* Changed text-custom-green-deep to text-custom-blue-deep */}
                {structuredInfo.protocolSection?.identificationModule?.briefTitle || metadata.title}
            </h2>
            {/* Organization, Start Date, Completion Date */}
            {(ctgOrganization || ctgStartDate || ctgCompletionDate) && (
              <p className="text-sm text-custom-text mt-1">
                {ctgOrganization}
                {ctgOrganization && (ctgStartDate || ctgCompletionDate) && <span className="mx-1">|</span>}
                {ctgStartDate && `Start: ${ctgStartDate}`}
                {ctgStartDate && ctgCompletionDate && <span className="mx-1">|</span>}
                {ctgCompletionDate && `Completion: ${ctgCompletionDate}`}
              </p>
            )}
            {/* Type | References | Status | Results */}
            {ctgDetailsRowItems.length > 0 && (
              <p className="text-sm text-custom-text mt-1">
                {ctgDetailsRowItems.map((item, index) => (
                  <React.Fragment key={index}>
                    {item}
                    {index < ctgDetailsRowItems.length - 1 && <span className="mx-1">|</span>}
                  </React.Fragment>
                ))}
              </p>
            )}
            {/* NCT ID Link */}
            <p className="text-xs text-custom-text-subtle mt-1">
                <a
                    href={`https://clinicaltrials.gov/study/${nctId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-custom-blue hover:underline" // Changed text-custom-green to text-custom-blue
                >
                    {nctId}
                </a>
            </p>
        </div>
      )}

      {/* 챗봇 & 구조화 정보 영역 (4:6 그리드 레이아웃) */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-6 mb-8">
        <div className="md:col-span-4 border border-custom-border rounded-2xl shadow-lg p-5 bg-white">
          <h2 className="text-xl font-semibold text-custom-blue-deep border-b border-custom-border pb-2 mb-2">
            ChatBot
          </h2>
          <ChatBot
            // Pass appropriate data based on source and expansion state
            paperId={source === 'CTG' ? nctId : pmcid || paperId}
            data={source === 'CTG' ? referenceFullText : fullText} // Pass reference text if expanded, else PMC text
            onResponse={({ evidence }) =>
              console.log('Chat response evidence:', evidence)
            }
            onEvidenceClick={scrollToEvidence}
          />
        </div>
        <div className="md:col-span-6 border border-custom-border rounded-2xl shadow-lg p-5 bg-white">
          <h2 className="text-xl font-semibold text-custom-blue-deep border-b border-custom-border pb-2 mb-2">
            Structured Information
          </h2>
          {structuredInfo ? (
            <StructuredInfoTabs structuredInfo={structuredInfo} />
          ) : (
            <div className="flex justify-center items-center text-custom-text-subtle h-28 text-sm">
              Loading structured info...
            </div>
          )}
        </div>
      </div>

      {/* References (CTG) / Full Text (PMC) 영역 */}
      <div className="border border-custom-border rounded-2xl shadow-lg p-5 mb-8 bg-white">
        {source === 'CTG' ? (
          <>
            <h2 className="text-xl font-semibold text-custom-blue-deep border-b border-custom-border pb-2 mb-4">
              References
            </h2>
            <div className="space-y-4 text-sm"> {/* Increased spacing */}
              {ctgReferences.length > 0 ? (
                ctgReferences.map((ref, index) => (
                  <div key={index} className="border-b border-custom-border-light pb-3 last:border-b-0"> {/* Add light border */}
                    {/* Citation and Links */}
                    <div className="mb-2">
                        {ref.citation || 'No citation available'}
                        {ref.pmid && (
                        <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-custom-blue hover:underline ml-2 text-xs" // Smaller link
                        >
                            (PubMed)
                        </a>
                        )}
                        {ref.pmcid && (
                        <a
                            href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${ref.pmcid}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-custom-blue hover:underline ml-2 text-xs" // Smaller link
                        >
                            (PMC)
                        </a>
                        )}
                    </div>

                    {/* Expand/Collapse Button for references with potential full text */}
                    {(ref.pmid || ref.pmcid) && (
                      <button
                        onClick={() => handleReferenceToggle(index, ref)}
                        disabled={isFetchingReference && expandedReferenceIndex === index}
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                          expandedReferenceIndex === index
                            ? 'bg-custom-blue-lightest text-custom-blue-deep'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } transition-colors disabled:opacity-50`}
                      >
                        {isFetchingReference && expandedReferenceIndex === index ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : expandedReferenceIndex === index ? (
                          <ChevronsDownUp size={12} />
                        ) : (
                          <ChevronsUpDown size={12} />
                        )}
                        {expandedReferenceIndex === index ? 'Collapse Full Text' : 'Expand Full Text'}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-custom-text-subtle">No references available.</p>
              )}
            </div>
             {/* Conditionally render FullText for the selected reference */}
            {expandedReferenceIndex !== null && (
                <div className="mt-4 pt-4 border-t border-custom-border">
                    <h3 className="text-lg font-semibold text-custom-blue-deep mb-2">Full Text for Reference {expandedReferenceIndex + 1}</h3>
                    <FullText ref={referenceFullTextRef} fullText={referenceFullText} />
                </div>
            )}
          </>
        ) : ( // --- PMC Full Text Section ---
          <>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-custom-blue-deep border-b border-custom-border pb-2">
                Full Text
              </h2>
              {fullText && ( // Only show button if fullText has content
                <button
                    onClick={() => setFullTextExpanded((prev) => !prev)}
                    className="p-1.5 text-custom-blue-deep rounded-full hover:bg-custom-blue-lightest transition-colors"
                    title={fullTextExpanded ? 'Collapse' : 'Expand'}
                >
                    {fullTextExpanded ? <ChevronsDownUp size={18} strokeWidth={2.5}/> : <ChevronsUpDown size={18} strokeWidth={2.5}/>}
                </button>
              )}
            </div>
            {fullTextExpanded && fullText ? (
              <FullText ref={fullTextRef} fullText={fullText} />
            ) : fullTextExpanded && !fullText ? (
                <div className="flex justify-center items-center text-custom-text-subtle h-28 text-sm">
                    Loading full text...
                </div>
            ) : null}
            {!fullText && !fullTextExpanded && (
                <p className="text-custom-text-subtle text-sm">Full text is collapsed or not available.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DetailPage;

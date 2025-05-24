import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import queryString from 'query-string';
import React, { useCallback, useEffect, useRef, useState } from 'react';
// Added useCallback
// Removed unused imports if any
import { useLocation, useNavigate } from 'react-router-dom';

import ChatBot from '../components/ChatBot';
import FullText from '../components/FullText';
import ReferenceList from '../components/ReferenceList';
// Import the new component
import StructuredInfoTabs from '../components/StructuredInfoTabs';
// Import glossary for MeSH terms component
import MeSHGlossary from '../components/MeSHGlossary';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';

// getPmcidFromPmid function removed - moved to ReferenceList.js

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
    structured_info: null,
  };

  const [structuredInfo, setStructuredInfo] = useState(null);
  const [fullText, setFullText] = useState(''); // For PMC source full text
  const [fullTextExpanded, setFullTextExpanded] = useState(false);
  const [selectedReferenceInfo, setSelectedReferenceInfo] = useState(null); // { pmcid: string, fullText: string } | null
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const fullTextRef = useRef(null);
  const referenceListRef = useRef(null); // Ref for ReferenceList component

  useEffect(() => {
    // Reset selected reference when source/id changes
    setSelectedReferenceInfo(null);

    // --- PMC Source Logic ---
    if ((source === 'PM' || source === 'PMC') && (pmcid || metadata.pmcid)) {
      const currentPmcid = pmcid || metadata.pmcid;
      // Fetch Full Text HTML for PMC
      fetch(`${BASE_URL}/api/paper/pmc_full_text_html?pmcid=${currentPmcid}`)
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
            setFullTextExpanded(true);
          } else {
            setFullText(htmlString);
            if (htmlString) setFullTextExpanded(true);
          }
        })
        .catch(error => {
            console.error("Error fetching PMC full text HTML:", error);
            setFullText("<p>Error loading full text.</p>");
            setFullTextExpanded(true);
        });

      // Fetch Structured Info for PMC
      fetch(`${BASE_URL}/api/paper/structured_info?pmcid=${currentPmcid}`)
        .then((res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then((data) => setStructuredInfo(data.structured_info))
        .catch(error => {
            console.error("Error fetching structured info:", error);
            setStructuredInfo(null);
        });
    }
    // --- CTG Source Logic ---
    else if (source === 'CTG') {
        if (metadata.structured_info) {
            console.log("Using structured_info from location state for CTG:", metadata.structured_info);
            setStructuredInfo(metadata.structured_info);
            setFullText('');
            setFullTextExpanded(false);
        } else if (nctId) {
            console.warn("Fetching CTG detail as fallback - was it not passed in location.state?");
            fetch(`${BASE_URL}/api/paper/ctg_detail?nctId=${nctId}`)
                .then((res) => {
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    return res.json();
                })
                .then((data) => {
                    setStructuredInfo(data.structured_info);
                    setFullText('');
                    setFullTextExpanded(false);
                })
                .catch(error => {
                    console.error("Error fetching CTG detail:", error);
                    setStructuredInfo(null);
                });
        }
    }

  }, [metadata.pmcid, nctId, source, metadata.structured_info, pmcid]); // metadata.structured_info dependency might cause re-runs if it's fetched async, review if needed

  // Callback for ReferenceList to update selected reference state
  const handleActiveReferenceChange = (refInfo) => {
    setSelectedReferenceInfo(refInfo);
  };

  // Function to check if evidence text can be found in the relevant content
  const canHighlightEvidence = useCallback((evidenceText) => {
    if (typeof evidenceText !== 'string') return false;

    // Clean surrounding quotes (redundant if cleaned in ChatMessage, but safe)
    const cleanedText = evidenceText.trim().replace(/^['"]|['"]$/g, '');
    if (!cleanedText) return false;

    let contentToCheck = '';
    if (source === 'CTG') {
        // Check selected reference's full text if available
        if (selectedReferenceInfo && selectedReferenceInfo.fullText) {
            contentToCheck = selectedReferenceInfo.fullText;
        } else {
            // Cannot highlight if no reference selected/loaded
            return false;
        }
    } else { // PM/PMC source
        contentToCheck = fullText;
    }

    if (!contentToCheck) return false;

    // Case-insensitive check
    // Using includes for simplicity, could use regex for more complex matching if needed
    return contentToCheck.toLowerCase().includes(cleanedText.toLowerCase());
  }, [source, fullText, selectedReferenceInfo]); // Dependencies for the check

  const scrollToEvidence = (evidenceText) => {
    // Ensure evidenceText is a string before proceeding
    if (typeof evidenceText !== 'string' || !evidenceText) {
        console.warn("scrollToEvidence called with invalid text:", evidenceText);
        return;
    }
    // Clean text just in case it wasn't cleaned before calling
    const cleanedText = evidenceText.trim().replace(/^['"]|['"]$/g, '');
    if (!cleanedText) return;

    if (source === 'CTG' && selectedReferenceInfo) {
        // Attempt highlight in the selected reference's view
        referenceListRef.current?.highlightEvidenceInSelected?.(cleanedText);
    } else if (source !== 'CTG') {
        // Attempt highlight in the main full text view
        fullTextRef.current?.highlightEvidence?.(cleanedText);
    }
     // If source is CTG but no reference selected, highlighting isn't applicable to a specific text view
  };

  const ctgReferences = structuredInfo?.protocolSection?.referencesModule?.references || [];

  // --- Prepare CTG Metadata for display (logic remains the same) ---
  let ctgDetailsRowItems = [];
  if (source === 'CTG' && structuredInfo) {
    const studyType = structuredInfo.protocolSection?.designModule?.studyType;
    const referencesCount = ctgReferences.length;
    const status = structuredInfo.protocolSection?.statusModule?.overallStatus;
    const hasResults = structuredInfo.hasResultsData;

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

  // Determine ChatBot props based on source and selected reference
  const getChatBotProps = () => {
      if (source === 'CTG') {
          if (selectedReferenceInfo) {
              // Case 2: CTG source, reference selected
              return {
                  paperId: selectedReferenceInfo.pmcid, // Keep for potential use
                  data: selectedReferenceInfo.fullText, // Use reference full text
                  source: 'PM', // Treat selected reference as a PubMed paper
                  relevantId: selectedReferenceInfo.pmcid, // ID is the PMCID
                  key: `chatbot-${selectedReferenceInfo.pmcid}`
              };
          } else {
              // Case 1: CTG source, no reference selected
              return {
                  paperId: nctId, // Keep for potential use
                  data: structuredInfo ? JSON.stringify(structuredInfo, null, 2) : null, // Use structured info (pretty-printed)
                  source: 'CTG', // Source is CTG
                  relevantId: nctId, // ID is the NCT ID
                  key: `chatbot-${nctId}`
              };
          }
      } else {
          // Default: PM/PMC source
          const currentPmcid = pmcid || metadata.pmcid; // Ensure we have the pmcid
          return {
              paperId: currentPmcid || paperId, // Use PMCID or PMID
              data: fullText, // Use main full text
              source: source || 'PM', // Use original source or default to PM
              relevantId: currentPmcid, // ID is the PMCID
              key: `chatbot-${currentPmcid || paperId}`
          };
      }
  };

  const chatBotProps = getChatBotProps();

  useEffect(() => {
    if (structuredInfo || fullText) {
      setIsDataLoaded(true);
    }
  }, [structuredInfo, fullText]);

  return (
    <div className="px-6 py-8 max-w-screen-2xl mx-auto">
      <h1
        className="text-3xl font-bold text-black tracking-tight text-center cursor-pointer mb-6 hover:opacity-80 transition"
        onClick={() => navigate(-1)}
      >
        Clinical Trials Hub
      </h1>

      {/* 메타데이터 카드 - PMC/PM */}
      {source !== 'CTG' && metadata.title !== 'No Title Available' && (
        <div className="bg-custom-bg-soft border border-custom-border p-5 rounded-2xl shadow-lg mb-8">
          <p className="text-xs text-custom-text-subtle mb-1">from PubMed</p>
          <h2 className="text-lg font-semibold text-custom-blue-deep mb-1">
            {metadata.title}
          </h2>
          {metadata.authors?.length > 0 && (
            <p className="text-sm text-custom-text-subtle mt-1">
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
          </p>
          {metadata.studyType && (
            <p className="text-sm text-custom-text mt-1">
              <strong>Study Type:</strong> {metadata.studyType}
            </p>
          )}
        </div>
      )}

       {/* 메타데이터 카드 - CTG */}
      {source === 'CTG' && structuredInfo && (
        <div className="bg-custom-bg-soft border border-custom-border p-5 rounded-2xl shadow-lg mb-8">
            <p className="text-xs text-custom-text-subtle mb-1">from ClinicalTrials.gov</p>
            <h2 className="text-lg font-semibold text-custom-blue-deep mb-1">
                {structuredInfo.protocolSection?.identificationModule?.briefTitle || metadata.title}
            </h2>
            {(ctgOrganization || ctgStartDate || ctgCompletionDate) && (
              <p className="text-sm text-custom-text mt-1">
                {ctgOrganization}
                {ctgOrganization && (ctgStartDate || ctgCompletionDate) && <span className="mx-1">|</span>}
                {ctgStartDate && `Start: ${ctgStartDate}`}
                {ctgStartDate && ctgCompletionDate && <span className="mx-1">|</span>}
                {ctgCompletionDate && `Completion: ${ctgCompletionDate}`}
              </p>
            )}
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
            <p className="text-xs text-custom-text-subtle mt-1">
                <a
                    href={`https://clinicaltrials.gov/study/${nctId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-custom-blue hover:underline"
                >
                    {nctId}
                </a>
            </p>
        </div>
      )}

      {/* 챗봇 & 구조화 정보 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-6 mb-8 md:items-start">
        {/* ChatBot Column */}
        <div className="md:col-span-4 border border-custom-border rounded-2xl shadow-lg p-5 bg-white flex flex-col">
          {/* ChatBot Heading */}
          <div className="flex justify-between items-center border-b border-custom-border pb-2 mb-2">
             <h2 className="text-xl font-semibold text-custom-blue-deep">
                ChatBot
             </h2>
          </div>
          {/* ChatBot Component Wrapper - Let it grow naturally */}
          {/* Removed flex-1 min-h-0 as parent no longer has fixed height */}
          <div>
            {isDataLoaded ? (
              <ChatBot
                key={chatBotProps.key}
                paperId={chatBotProps.paperId}
                data={chatBotProps.data}
                source={chatBotProps.source}
                relevantId={chatBotProps.relevantId}
                onResponse={({ evidence }) =>
                  console.log('Chat response evidence:', evidence)
                }
                onEvidenceClick={scrollToEvidence}
                // Pass the checking function down
                canHighlightEvidence={canHighlightEvidence}
              />
            ) : (
              <div>Loading...</div>
            )}
          </div>

          <div >
            <MeSHGlossary/>
          </div>
        </div>

        {/* Structured Info Column */}
        <div className="md:col-span-6 border border-custom-border rounded-2xl shadow-lg p-5 bg-white">
          <h2 className="text-xl font-semibold text-custom-blue-deep border-b border-custom-border pb-2 mb-2">
            Structured Information
          </h2>
          {structuredInfo ? (
            // ---> Problem likely originates here or within this component <---
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
          // Pass the callback to ReferenceList
          <ReferenceList
            ref={referenceListRef}
            references={ctgReferences}
            onActiveReferenceChange={handleActiveReferenceChange} // Pass the callback
          />
        ) : ( // --- PMC Full Text Section ---
          <>
            <div className="flex justify-between items-center mb-2">
              {/* Corrected h2 tag structure */}
              <h2 className="text-xl font-semibold text-custom-blue-deep border-b border-custom-border pb-2">
                Full Text
              </h2>
              {fullText && (
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

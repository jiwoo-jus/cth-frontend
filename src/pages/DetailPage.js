import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import queryString from 'query-string';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import ChatBot from '../components/ChatBot';
import FullText from '../components/FullText';
import ReferenceList from '../components/ReferenceList';
import StructuredInfoTabs from '../components/StructuredInfoTabs';

// Use consistent environment variable access
// eslint-disable-next-line no-undef
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';

const DetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { paperId, pmcid: pmcidFromUrl, nctId: nctIdFromUrl, source } = queryString.parse(location.search);

  // --- State ---
  const [structuredInfo, setStructuredInfo] = useState(null);
  const [fullText, setFullText] = useState('');
  const [fullTextExpanded, setFullTextExpanded] = useState(false);
  const [selectedReferenceInfo, setSelectedReferenceInfo] = useState(null); // { pmcid: string, fullText: string } | null
  const [isLoading, setIsLoading] = useState(false); // Loading state for API calls
  const [error, setError] = useState(null); // Error state

  // --- Refs ---
  const fullTextRef = useRef(null);
  const referenceListRef = useRef(null);

  // --- Metadata Extraction ---
  // Prioritize data from location state, fallback to URL params or defaults
  const metadata = location.state?.metadata || {};
  const effectivePmcid = pmcidFromUrl || metadata.pmcid || null;
  const effectiveNctId = nctIdFromUrl || metadata.nctId || null;
  const effectivePaperId = paperId || metadata.pmid || null; // Assuming paperId often corresponds to pmid

  // --- Effects ---
  useEffect(() => {
    console.log('[DetailPage] Effect triggered. Source:', source, 'PMCID:', effectivePmcid, 'NCTID:', effectiveNctId);
    // Reset state on ID/source change
    setSelectedReferenceInfo(null);
    setStructuredInfo(null);
    setFullText('');
    setFullTextExpanded(false);
    setError(null);
    setIsLoading(true);

    const fetchPmcData = async (pmcidToFetch) => {
      try {
        console.log(`[DetailPage] Fetching PMC data for PMCID: ${pmcidToFetch}`);
        // Fetch Full Text HTML
        const textResponse = await fetch(`${BASE_URL}/api/paper/pmc_full_text_html?pmcid=${pmcidToFetch}`);
        if (!textResponse.ok) throw new Error(`HTTP error fetching full text! status: ${textResponse.status}`);
        const htmlString = await textResponse.text();

        // Basic HTML processing (consider moving to a utility if complex)
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const article = doc.querySelector("#main-content > article");
        let processedHtml = htmlString; // Default to original string
        if (article) {
          article.querySelectorAll("ul.d-buttons.inline-list, section[aria-label='Article citation and metadata']").forEach(el => el.remove());
          processedHtml = article.outerHTML;
        }
        setFullText(processedHtml);
        setFullTextExpanded(!!processedHtml); // Expand if content exists

        // Fetch Structured Info
        const infoResponse = await fetch(`${BASE_URL}/api/paper/structured_info?pmcid=${pmcidToFetch}`);
        if (!infoResponse.ok) throw new Error(`HTTP error fetching structured info! status: ${infoResponse.status}`);
        const infoData = await infoResponse.json();
        setStructuredInfo(infoData.structured_info);

      } catch (fetchError) {
        console.error("[DetailPage] Error fetching PMC data:", fetchError);
        setError(fetchError.message || 'Failed to load paper details.');
        setFullText("<p>Error loading full text.</p>"); // Show error in content area
        setFullTextExpanded(true);
      }
    };

    const fetchCtgData = async (nctIdToFetch) => {
      try {
        console.log(`[DetailPage] Fetching CTG data for NCTID: ${nctIdToFetch}`);
        const response = await fetch(`${BASE_URL}/api/paper/ctg_detail?nctId=${nctIdToFetch}`);
        if (!response.ok) throw new Error(`HTTP error fetching CTG detail! status: ${response.status}`);
        const data = await response.json();
        setStructuredInfo(data.structured_info);
        setFullText(''); // No separate full text for CTG main view
        setFullTextExpanded(false);
      } catch (fetchError) {
        console.error("[DetailPage] Error fetching CTG data:", fetchError);
        setError(fetchError.message || 'Failed to load trial details.');
      }
    };

    // --- Determine Data Source and Fetch ---
    const fetchData = async () => {
      setIsLoading(true); // Ensure loading is true at the start
      try {
        if ((source === 'PM' || source === 'PMC') && effectivePmcid) {
          await fetchPmcData(effectivePmcid);
        } else if (source === 'CTG') {
          console.log("JW metadata.structured_info: ", metadata.structured_info);
          console.log("JW effectiveNctId: ", effectiveNctId);
          // Prioritize structured_info from location state if available
          if (metadata.structured_info) {
            console.log("[DetailPage] Using structured_info from location state for CTG.");
            setStructuredInfo(metadata.structured_info);
            setFullText('');
            setFullTextExpanded(false);
          } else if (effectiveNctId) {
            // Fetch only if not passed via state
            console.warn("[DetailPage] Fetching CTG detail as fallback - consider passing via location.state from SearchPage.");
            await fetchCtgData(effectiveNctId);
          } else {
            console.error("[DetailPage] CTG source selected but no NCT ID found.");
            setError("No ClinicalTrials.gov ID provided.");
          }
        } else {
          console.warn("[DetailPage] No valid source or ID found to fetch data.");
          setError("Invalid source or ID specified.");
        }
      } catch (err) {
        // Errors inside fetch functions should already set the error state
        console.error("[DetailPage] Top-level fetch error:", err);
        if (!error) { // Set a generic error if not already set
          setError("An unexpected error occurred while loading details.");
        }
      } finally {
        setIsLoading(false); // Set loading false after fetch attempt (success or fail)
      }
    };

    fetchData(); // Call the async function

  }, [source, effectivePmcid, effectiveNctId, metadata.structured_info]); // Dependencies


  // --- Callbacks ---
  const handleActiveReferenceChange = useCallback((refInfo) => {
    console.log('[DetailPage] Active reference changed:', refInfo?.pmcid);
    setSelectedReferenceInfo(refInfo);
  }, []);

  const canHighlightEvidence = useCallback((evidenceText) => {
    if (typeof evidenceText !== 'string' || !evidenceText) return false;
    const cleanedText = evidenceText.trim().replace(/^['"]|['"]$/g, '');
    if (!cleanedText) return false;

    let contentToCheck = '';
    if (source === 'CTG') {
      // Only check selected reference's full text for CTG
      contentToCheck = selectedReferenceInfo?.fullText || '';
    } else { // PM/PMC source
      contentToCheck = fullText;
    }

    if (!contentToCheck) return false;
    // Case-insensitive check
    return contentToCheck.toLowerCase().includes(cleanedText.toLowerCase());
  }, [source, fullText, selectedReferenceInfo]);

  const scrollToEvidence = useCallback((evidenceText) => {
    if (typeof evidenceText !== 'string' || !evidenceText) {
      console.warn("[DetailPage] scrollToEvidence called with invalid text:", evidenceText);
      return;
    }
    const cleanedText = evidenceText.trim().replace(/^['"]|['"]$/g, '');
    if (!cleanedText) return;

    console.log(`[DetailPage] Attempting to scroll to evidence: "${cleanedText.substring(0, 50)}..."`);

    if (source === 'CTG') {
      if (selectedReferenceInfo && referenceListRef.current) {
        console.log('[DetailPage] Scrolling within selected CTG reference.');
        referenceListRef.current.highlightEvidenceInSelected?.(cleanedText);
      } else {
        console.log('[DetailPage] Cannot scroll for CTG: No reference selected or ref component not ready.');
      }
    } else if (fullTextRef.current) { // PM/PMC source
      console.log('[DetailPage] Scrolling within main PMC full text.');
      fullTextRef.current.highlightEvidence?.(cleanedText);
    } else {
       console.log('[DetailPage] Cannot scroll: Full text component not ready.');
    }
  }, [source, selectedReferenceInfo]); // Dependencies

  // --- Derived Data ---
  const ctgReferences = structuredInfo?.protocolSection?.referencesModule?.references || [];

  // Prepare CTG Metadata for display
  const getCtgDisplayDetails = () => {
    if (source !== 'CTG' || !structuredInfo) return { detailsRowItems: [], organization: null, startDate: null, completionDate: null };

    const protocolSection = structuredInfo.protocolSection;
    const detailsRowItems = [
      protocolSection?.designModule?.studyType,
      ctgReferences.length > 0 ? <strong key="ref">{`${ctgReferences.length} reference${ctgReferences.length !== 1 ? 's' : ''}`}</strong> : '0 references',
      protocolSection?.statusModule?.overallStatus,
      structuredInfo.hasResultsData !== undefined ? (structuredInfo.hasResultsData ? <strong key="res">has results</strong> : 'no results') : null,
    ].filter(Boolean);

    const organization = protocolSection?.identificationModule?.organization?.fullName;
    const startDate = protocolSection?.statusModule?.startDateStruct?.date;
    const completionDateInfo = protocolSection?.statusModule?.completionDateStruct;
    const completionDate = completionDateInfo?.type === 'ACTUAL' ? completionDateInfo?.date : null;

    return { detailsRowItems, organization, startDate, completionDate };
  };
  const { detailsRowItems: ctgDetailsRowItems, organization: ctgOrganization, startDate: ctgStartDate, completionDate: ctgCompletionDate } = getCtgDisplayDetails();

  // Determine ChatBot props based on source and selected reference
  const getChatBotProps = useCallback(() => {
    if (source === 'CTG') {
      if (selectedReferenceInfo) {
        // Case 2: CTG source, reference selected
        console.log('[DetailPage] ChatBot using selected CTG reference:', selectedReferenceInfo.pmcid);
        return {
          paperId: selectedReferenceInfo.pmcid, // Use PMCID of the reference
          data: selectedReferenceInfo.fullText,
          source: 'PM', // Treat as PubMed source for chat context
          relevantId: selectedReferenceInfo.pmcid,
          key: `chatbot-ref-${selectedReferenceInfo.pmcid}` // Unique key per reference
        };
      } else {
        // Case 1: CTG source, no reference selected
        console.log('[DetailPage] ChatBot using main CTG data:', effectiveNctId);
        return {
          paperId: effectiveNctId,
          data: structuredInfo ? JSON.stringify(structuredInfo, null, 2) : null, // Use structured info
          source: 'CTG',
          relevantId: effectiveNctId,
          key: `chatbot-ctg-${effectiveNctId}` // Unique key for main CTG
        };
      }
    } else {
      // Default: PM/PMC source
      console.log('[DetailPage] ChatBot using main PMC/PM data:', effectivePmcid || effectivePaperId);
      return {
        paperId: effectivePmcid || effectivePaperId, // Use PMCID or fallback to paperId (PMID)
        data: fullText,
        source: source || 'PM',
        relevantId: effectivePmcid, // Primarily use PMCID if available
        key: `chatbot-pmc-${effectivePmcid || effectivePaperId}` // Unique key
      };
    }
  }, [source, selectedReferenceInfo, effectiveNctId, structuredInfo, effectivePmcid, effectivePaperId, fullText]); // Dependencies

  const chatBotProps = getChatBotProps();

  // --- Render ---
  return (
    <div className="px-6 py-8 max-w-screen-2xl mx-auto">
      {/* Header */}
      <h1
        className="text-3xl font-bold text-black tracking-tight text-center cursor-pointer mb-6 hover:opacity-80 transition"
        onClick={() => navigate(-1)} // Go back to previous page (likely SearchPage)
        title="Go back to search results"
      >
        Clinical Trials Hub
      </h1>

      {/* Loading/Error State */}
      {isLoading && <div className="text-center text-gray-600 my-4">Loading details...</div>}
      {error && <div className="text-center text-red-600 my-4 bg-red-100 border border-red-400 p-3 rounded">Error: {error}</div>}

      {/* Metadata Card - PMC/PM */}
      {source !== 'CTG' && metadata.title && metadata.title !== 'No Title Available' && !isLoading && !error && (
        <div className="bg-custom-bg-soft border border-custom-border p-5 rounded-2xl shadow-lg mb-8">
          <p className="text-xs text-custom-text-subtle mb-1">from PubMed/PMC</p>
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
                    className="text-custom-blue hover:underline mr-2" // Added margin
                >
                    PMID: {metadata.pmid}
                </a>
            )}
            {metadata.pmcid && (
                <a
                    href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${metadata.pmcid}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-custom-blue hover:underline"
                >
                    PMCID: {metadata.pmcid}
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

       {/* Metadata Card - CTG */}
      {source === 'CTG' && structuredInfo && !isLoading && !error && (
        <div className="bg-custom-bg-soft border border-custom-border p-5 rounded-2xl shadow-lg mb-8">
            <p className="text-xs text-custom-text-subtle mb-1">from ClinicalTrials.gov</p>
            <h2 className="text-lg font-semibold text-custom-blue-deep mb-1">
                {structuredInfo.protocolSection?.identificationModule?.briefTitle || metadata.title || 'No Title Available'}
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
                    href={`https://clinicaltrials.gov/study/${effectiveNctId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-custom-blue hover:underline"
                >
                    {effectiveNctId}
                </a>
            </p>
        </div>
      )}

      {/* Main Content Grid (ChatBot & Structured Info) */}
      {!isLoading && !error && (structuredInfo || fullText) && (
        <div className="grid grid-cols-1 md:grid-cols-10 gap-6 mb-8 md:items-start"> {/* Added mb-8 */}
          {/* ChatBot Column */}
          <div className="md:col-span-4 border border-custom-border rounded-2xl shadow-lg p-5 bg-white flex flex-col">
            <div className="flex justify-between items-center border-b border-custom-border pb-2 mb-2">
               <h2 className="text-xl font-semibold text-custom-blue-deep">
                  ChatBot
               </h2>
            </div>
            <div>
              {/* Render ChatBot only when necessary data is available */}
              {chatBotProps.data ? (
                  <ChatBot
                    key={chatBotProps.key} // Key ensures re-mount on source/ID change
                    paperId={chatBotProps.paperId}
                    data={chatBotProps.data}
                    source={chatBotProps.source}
                    relevantId={chatBotProps.relevantId}
                    onResponse={({ evidence }) =>
                      console.log('[DetailPage] Chat response evidence:', evidence)
                    }
                    onEvidenceClick={scrollToEvidence}
                    canHighlightEvidence={canHighlightEvidence}
                  />
              ) : (
                 <div className="text-center text-custom-text-subtle p-4">ChatBot data unavailable.</div>
              )}
            </div>
          </div>

          {/* Right Column (Structured Info ONLY) */}
          <div className="md:col-span-6 space-y-6">
            {/* Structured Info Section */}
            {structuredInfo && (
              <div className="border border-custom-border rounded-2xl shadow-lg p-5 bg-white">
                <h2 className="text-xl font-semibold text-custom-blue-deep border-b border-custom-border pb-2 mb-4"> {/* Increased margin */}
                  Structured Information
                </h2>
                <StructuredInfoTabs structuredInfo={structuredInfo} />
              </div>
            )}
            {/* Removed References/Full Text from here */}
          </div>
        </div>
      )}

      {/* References (CTG) / Full Text (PMC) Section - Moved outside the grid */}
      {!isLoading && !error && (structuredInfo || fullText) && (
        <div className="border border-custom-border rounded-2xl shadow-lg p-5 bg-white mb-8"> {/* Added mb-8 */}
          {source === 'CTG' ? (
            <ReferenceList
              ref={referenceListRef}
              references={ctgReferences}
              onActiveReferenceChange={handleActiveReferenceChange}
            />
          ) : ( // --- PMC Full Text Section ---
            <>
              <div className="flex justify-between items-center mb-4"> {/* Increased margin */}
                <h2 className="text-xl font-semibold text-custom-blue-deep border-b border-custom-border pb-2 flex-grow"> {/* Title takes available space */}
                  Full Text
                </h2>
                {fullText && ( // Only show button if there is text
                  <button
                      onClick={() => setFullTextExpanded((prev) => !prev)}
                      className="p-1.5 text-custom-blue-deep rounded-full hover:bg-custom-blue-lightest transition-colors ml-2" // Added margin
                      title={fullTextExpanded ? 'Collapse' : 'Expand'}
                      aria-expanded={fullTextExpanded}
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
              {!fullTextExpanded && fullText && ( // Show message only if text exists but is collapsed
                  <p className="text-custom-text-subtle text-sm">Full text is collapsed.</p>
              )}
               {!fullText && ( // Show message if no full text was loaded/found
                  <p className="text-custom-text-subtle text-sm">Full text not available.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Wrap with memo if DetailPage itself doesn't rely heavily on context changes
// export default React.memo(DetailPage);
export default DetailPage; // Keep as default export for now

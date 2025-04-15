// src/pages/DetailPage.js
import queryString from 'query-string';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'; // Import icons

import ChatBot from '../components/ChatBot';
import FullText from '../components/FullText';
import StructuredInfoTabs from '../components/StructuredInfoTabs';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';

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
  };

  const [structuredInfo, setStructuredInfo] = useState(null);
  const [fullText, setFullText] = useState('');
  const [fullTextExpanded, setFullTextExpanded] = useState(false);
  const fullTextRef = useRef(null);

  useEffect(() => {
    if ((source === 'PM' || source === 'PMC') && pmcid) {
      fetch(`${BASE_URL}/api/paper/pmc_full_text_html?pmcid=${pmcid}`)
        .then((res) => res.text())
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
            // Initially expand if content is fetched successfully
            setFullTextExpanded(true);
          } else {
            setFullText(htmlString);
            // Expand even if parsing fails but content exists
            if (htmlString) setFullTextExpanded(true);
          }
        })
        .catch(console.error);
    }
    if ((source === 'PM' || source === 'PMC') && pmcid) {
      fetch(`${BASE_URL}/api/paper/structured_info?pmcid=${pmcid}`)
        .then((res) => res.json())
        .then((data) => setStructuredInfo(data.structured_info))
        .catch(console.error);
    }
    if (source === 'CTG' && nctId) {
      fetch(`${BASE_URL}/api/paper/ctg_detail?nctId=${nctId}`)
        .then((res) => res.json())
        .then((data) => {
          setStructuredInfo(data.structured_info);
          setFullText(data.full_text || '');
          // Expand if full_text exists
          if (data.full_text) setFullTextExpanded(true);
        })
        .catch(console.error);
    }
  }, [paperId, pmcid, nctId, source]);

  const scrollToEvidence = (evidenceText) => {
    fullTextRef.current?.highlightEvidence?.(evidenceText);
  };

  return (
    <div className="px-6 py-8 max-w-screen-2xl mx-auto"> {/* max-w-7xl -> max-w-screen-2xl */}
      <h1
        className="text-3xl font-bold text-black tracking-tight text-center cursor-pointer mb-6 hover:opacity-80 transition" // Adjusted: text-4xl -> text-3xl, font-extrabold -> font-semibold
        onClick={() => navigate(-1)}
      >
        Clinical Trials Hub
      </h1>

      {/* 메타데이터 카드 */}
      {(source === 'PM' || source === 'PMC') && (
        <div className="bg-custom-bg-soft border border-custom-border p-5 rounded-2xl shadow-lg mb-8">
          <h2 className="text-lg font-semibold text-custom-blue-deep mb-2"> {/* Adjusted: text-2xl -> text-xl */}
            {metadata.title}
          </h2>
          <div className="mt-2 space-y-2 text-sm text-custom-text"> {/* Adjusted: text-base -> text-sm */}
            {metadata.authors?.length > 0 && (
              <p className="text-sm text-custom-text-subtle pt-1"> {/* Adjusted: text-base -> text-sm, added pt-1 */}
                {metadata.authors.join(', ')}
              </p>
            )}
            <div className="flex flex-wrap gap-x-8 gap-y-1"> {/* Adjusted gap */}
              {metadata.studyType && (
                <p>
                  <strong>Study Type:</strong> {metadata.studyType}
                </p>
              )}
              {metadata.pubDate && (
                <p>
                  {metadata.pubDate} {metadata.doi && `(${metadata.doi})`}  
                  {metadata.journal && <span>{metadata.journal}, </span>}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1"> {/* Adjusted gap */}
              {metadata.pmid && <p>PMID: {metadata.pmid}</p>}
              {metadata.pmcid && <p>PMCID: {metadata.pmcid}</p>}
              {metadata.nctId && <p>NCT ID: {metadata.nctId}</p>}
            </div>
            
          </div>
        </div>
      )}

      {/* 챗봇 & 구조화 정보 영역 (4:6 그리드 레이아웃) */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-6 mb-8">
        <div className="md:col-span-4 border border-custom-border rounded-2xl shadow-lg p-4 bg-white">
          <h2 className="text-xl font-semibold text-custom-blue-deep border-b border-custom-border pb-2 mb-2"> {/* Adjusted: text-2xl -> text-xl, added border color */}
            ChatBot
          </h2>
          <ChatBot
            paperId={paperId}
            data={fullText}
            onResponse={({ evidence }) =>
              console.log('Chat response evidence:', evidence)
            }
            onEvidenceClick={scrollToEvidence}
          />
        </div>
        <div className="md:col-span-6 border border-custom-border rounded-2xl shadow-lg p-4 bg-white">
          <h2 className="text-xl font-semibold text-custom-blue-deep border-b border-custom-border pb-2 mb-2"> {/* Adjusted: text-2xl -> text-xl, added border color */}
            Structured Information
          </h2>
          {structuredInfo ? (
            <StructuredInfoTabs structuredInfo={structuredInfo} />
          ) : (
            <div className="flex justify-center items-center text-custom-text-subtle h-28 text-sm"> {/* Adjusted: text-base -> text-sm */}
              Loading structured info...
            </div>
          )}
        </div>
      </div>

      {/* References / Full Text 영역 */}
      <div className="border border-custom-border rounded-2xl shadow-lg p-4 mb-8 bg-white">
        {source === 'CTG' ? (
          <>
            <h2 className="text-xl font-semibold text-custom-blue-deep border-b border-custom-border pb-2 mb-4"> {/* Adjusted: text-2xl -> text-xl, added border color */}
              References
            </h2>
            <div className="space-y-3 text-sm"> {/* Adjusted: text-base -> text-sm */}
              {structuredInfo?.references?.length > 0 ? (
                structuredInfo.references.map((ref, index) => (
                  <div key={index}>
                    {ref.pmid ? (
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-custom-blue hover:underline" // Use custom-blue for consistency
                      >
                        {ref.citation}
                      </a>
                    ) : (
                      <span>{ref.citation}</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-custom-text-subtle">No references available.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-custom-blue-deep border-b border-custom-border pb-2"> {/* Adjusted: text-2xl -> text-xl, added border color */}
                Full Text
              </h2>
              <button
                onClick={() => setFullTextExpanded((prev) => !prev)}
                className="p-1.5 text-custom-blue-deep rounded-full hover:bg-custom-blue-lightest transition-colors" // Adjusted styling for icon button
                title={fullTextExpanded ? 'Collapse' : 'Expand'} // Add title
              >
                {fullTextExpanded ? <ChevronsDownUp size={18} strokeWidth={2.5}/> : <ChevronsUpDown size={18} strokeWidth={2.5}/>} {/* Use icons */}
              </button>
            </div>
            {fullTextExpanded && (
              <FullText ref={fullTextRef} fullText={fullText} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DetailPage;

import queryString from 'query-string';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
        .then(res => res.text())
        .then(htmlString => {
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
          }
        })
        .catch(console.error);
    }

    if ((source === 'PM' || source === 'PMC') && pmcid) {
      fetch(`${BASE_URL}/api/paper/structured_info?pmcid=${pmcid}`)
        .then(res => res.json())
        .then(data => setStructuredInfo(data.structured_info))
        .catch(console.error);
    }

    if (source === 'CTG' && nctId) {
      fetch(`${BASE_URL}/api/paper/ctg_detail?nctId=${nctId}`)
        .then(res => res.json())
        .then(data => {
          setStructuredInfo(data.structured_info);
          setFullText(data.full_text || '');
          if (data.full_text) setFullTextExpanded(true);
        })
        .catch(console.error);
    }
  }, [paperId, pmcid, nctId, source]);

  const scrollToEvidence = (evidenceText) => {
    fullTextRef.current?.highlightEvidence?.(evidenceText);
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <h1
        className="text-3xl font-bold text-blue-900 tracking-tight text-center cursor-pointer mb-6"
        onClick={() => navigate(-1)}
      >
        Clinical Trials Hub
      </h1>

      {(source === 'PM' || source === 'PMC') && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">{metadata.title}</h2>
          <div className="mt-2 space-y-2 text-sm text-gray-700">
            <div className="flex flex-wrap gap-6">
              {metadata.studyType && <p><strong>Study Type:</strong> {metadata.studyType}</p>}
              {metadata.pubDate && (
                <p>{metadata.journal && <span>{metadata.journal}, </span>}{metadata.pubDate} {metadata.doi}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              {metadata.pmid && <p>PMID: {metadata.pmid}</p>}
              {metadata.pmcid && <p>PMCID: {metadata.pmcid}</p>}
              {metadata.nctId && <p>NCT ID: {metadata.nctId}</p>}
            </div>
            {metadata.authors?.length > 0 && (
              <p className="text-sm text-gray-600">{metadata.authors.join(', ')}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-10 gap-4 mb-6">
        <div className="md:col-span-4 border rounded-md shadow-sm p-4">
          <h2 className="text-lg font-semibold text-blue-800 border-b pb-1 mb-3">ChatBot</h2>
          <ChatBot
            paperId={paperId}
            data={fullText}
            onResponse={({ evidence }) => console.log('Chat response evidence:', evidence)}
            onEvidenceClick={scrollToEvidence}
          />
        </div>
        <div className="md:col-span-6 border rounded-md shadow-sm p-4">
          <h2 className="text-lg font-semibold text-blue-800 border-b pb-1 mb-3">Structured Info</h2>
          {structuredInfo ? (
            <StructuredInfoTabs structuredInfo={structuredInfo} />
          ) : (
            <div className="flex justify-center items-center text-gray-500 h-24">
              Loading structured info...
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-md shadow-sm p-4 mb-6">
        {source === 'CTG' ? (
          <>
            <h2 className="text-lg font-semibold text-blue-800 border-b pb-1 mb-3">References</h2>
            <div className="space-y-2 text-sm">
              {structuredInfo?.references?.length > 0 ? (
                structuredInfo.references.map((ref, index) => (
                  <div key={index}>
                    {ref.pmid ? (
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 underline"
                      >
                        {ref.citation}
                      </a>
                    ) : (
                      <span>{ref.citation}</span>
                    )}
                  </div>
                ))
              ) : (
                <p>No references available.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-blue-800 border-b pb-1">Full Text</h2>
              <button
                onClick={() => setFullTextExpanded(prev => !prev)}
                className="bg-blue-800 text-white font-semibold text-sm px-4 py-1 rounded hover:bg-blue-900 transition"
              >
                {fullTextExpanded ? 'Collapse ▲' : 'Expand ▼'}
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

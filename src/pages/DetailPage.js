// src/pages/DetailPage.js
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

  const [structuredInfo, setStructuredInfo] = useState(null);
  const [fullText, setFullText] = useState('');
  const [fullTextExpanded, setFullTextExpanded] = useState(false);

  const fullTextRef = useRef(null);

  useEffect(() => {
    // Fetch Full Text First
    if ((source === 'PM' || source === 'PMC') && pmcid) {
      fetch(`${BASE_URL}/api/paper/pmc_full_text_html?pmcid=${pmcid}`)
        .then(res => res.text())
        .then(htmlString => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlString, 'text/html');
          const article = doc.querySelector("#main-content > article");
          if (article) {
            const btnLists = article.querySelectorAll("ul.d-buttons.inline-list");
            btnLists.forEach(el => el.remove());
            const sections = article.querySelectorAll("section");
            sections.forEach(section => {
              if (section.hasAttribute("aria-label") 
                && section.getAttribute("aria-label") === "Article citation and metadata") {
                section.remove();
              }
            });
            const cleanedHtml = article.outerHTML;
            setFullText(cleanedHtml);
            // Auto-expand if full text is available
            setFullTextExpanded(true);
          } else {
            setFullText(htmlString);
          }
        })
        .catch((err) => console.error(err));
    }

    // Fetch Structured Info Second
    if ((source === 'PM' || source === 'PMC') && pmcid) {
      fetch(`${BASE_URL}/api/paper/structured_info?pmcid=${pmcid}`)
        .then(res => res.json())
        .then((data) => setStructuredInfo(data.structured_info))
        .catch((err) => console.error(err));
    }

    if (source === 'CTG' && nctId) {
      fetch(`${BASE_URL}/api/paper/ctg_detail?nctId=${nctId}`)
        .then((res) => res.json())
        .then((data) => {
          setStructuredInfo(data.structured_info);
          setFullText(data.full_text || '');
          // Auto-expand if full text is available
          if (data.full_text) {
            setFullTextExpanded(true);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [paperId, pmcid, nctId, source]);

  const scrollToEvidence = (evidenceText) => {
    if (fullTextRef.current?.highlightEvidence) {
      fullTextRef.current.highlightEvidence(evidenceText);
    }
  };

  const handleChatResponse = (response) => {
    console.log('Chat response evidence:', response.evidence);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <h1
          style={{
            cursor: 'pointer',
            flex: 1,
            fontSize: '2rem', // Larger font size for h1
            fontWeight: 'bold', // Bold font
            color: '#003366', // Dark blue color
            margin: 0,
            padding: 0,
          }}
          onClick={handleBack}
        >
          Clinical Trials Hub
        </h1>
        <button
          style={{
            backgroundColor: '#003366',
            color: '#fff',
            fontWeight: 'bold',
            border: 'none',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
          onClick={handleBack}
        >
          Back
        </button>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 3, border: '1px solid #ccc', padding: '1rem' }}>
          <h2
            style={{
              fontSize: '1.5rem', // Slightly smaller than h1
              fontWeight: 'bold',
              color: '#00509E', // Lighter blue
              borderBottom: '2px solid #00509E', // Add underline
              paddingBottom: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            ChatBot
          </h2>
          <ChatBot
            paperId={paperId}
            data={fullText}
            onResponse={handleChatResponse}
            onEvidenceClick={scrollToEvidence}
          />
        </div>
        <div style={{ flex: 7, border: '1px solid #ccc', padding: '1rem' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#00509E',
              borderBottom: '2px solid #00509E',
              paddingBottom: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            Structured Info
          </h2>
          {structuredInfo ? (
            <StructuredInfoTabs structuredInfo={structuredInfo} />
          ) : (
            // Enhanced Loading Indicator
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100px', // Give it some height
              color: '#666', 
              fontSize: '1.1rem' 
            }}>
              Loading structured info...
            </div>
          )}
        </div>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
        {source === 'CTG' ? (
          <>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#00509E',
                borderBottom: '2px solid #00509E',
                paddingBottom: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              References
            </h2>
            <div style={{ border: '1px solid #ccc', padding: '1rem', overflow: 'auto' }}>
              {structuredInfo && structuredInfo.references && structuredInfo.references.length > 0 ? (
                structuredInfo.references.map((ref, index) => (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    {ref.pmid ? (
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0645AD', textDecoration: 'underline' }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#00509E',
                  borderBottom: '2px solid #00509E',
                  paddingBottom: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                Full Text
              </h2>
              <button
                style={{
                  backgroundColor: '#00509E',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem', // Add spacing for icon
                  transition: 'background 0.3s ease, color 0.3s ease',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#003366')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#00509E')}
                onClick={() => setFullTextExpanded(prev => !prev)}
              >
                {fullTextExpanded ? 'Collapse' : 'Expand'}
                <span style={{ fontSize: '1rem' }}>{fullTextExpanded ? '▲' : '▼'}</span> {/* Add chevron icon */}
              </button>
            </div>
            {fullTextExpanded && (
              <FullText
                ref={fullTextRef}
                fullText={fullText}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DetailPage;

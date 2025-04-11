import queryString from 'query-string';
// src/pages/DetailPage.js
import React, { useEffect, useState } from 'react';
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
  const [highlightedEvidence, setHighlightedEvidence] = useState([]);

  useEffect(() => {
    // PM/PMC인 경우: pmcid를 사용하여 structured info와 full text 호출
    if ((source === 'PM' || source === 'PMC') && pmcid) {
      fetch(`${BASE_URL}/api/paper/structured_info?pmcid=${pmcid}`)
        .then((res) => res.json())
        .then((data) => setStructuredInfo(data.structured_info))
        .catch((err) => console.error(err));

      fetch(`${BASE_URL}/api/paper/pmc_full_text_html?pmcid=${pmcid}`)
      .then(res => res.text())
      .then(htmlString => {
        // DOMParser로 문자열을 HTML 문서 객체로 파싱
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        
        // 원하는 영역 추출: #main-content > article
        const article = doc.querySelector("#main-content > article");
        if (article) {
          // 불필요한 버튼 제거: 예를 들어 ul 요소를 모두 찾아서 제거
          const btnLists = article.querySelectorAll("ul.d-buttons.inline-list");
          btnLists.forEach(el => el.remove());
          const sections = article.querySelectorAll("section");
          sections.forEach(section => {
            if (section.hasAttribute("aria-label") && section.getAttribute("aria-label") === "Article citation and metadata") {
              section.remove();
            }
          })
          // 정제된 HTML을 문자열로 얻기
          const cleanedHtml = article.outerHTML;
          setFullText(cleanedHtml);
        } else {
          setFullText(htmlString);
        }
      })
      .catch(err => console.error(err));
    }
    // CTG인 경우: nctId를 사용하여 상세 정보 호출
    if (source === 'CTG' && nctId) {
      fetch(`${BASE_URL}/api/paper/ctg_detail?nctId=${nctId}`)
        .then((res) => res.json())
        .then((data) => {
          setStructuredInfo(data.structured_info);
          setFullText(data.full_text || '');
        })
        .catch((err) => console.error(err));
    }
  }, [paperId, pmcid, nctId, source]);

  const handleChatResponse = (response) => {
    setHighlightedEvidence(response.evidence || []);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ cursor: 'pointer', flex: 1 }} onClick={handleBack}>
          Clinical Trials Hub
        </h1>
        <button onClick={handleBack}>Back</button>
      </header>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 3, border: '1px solid #ccc', padding: '1rem' }}>
          <h2>ChatBot</h2>
          <ChatBot 
            paperId={paperId} 
            data={fullText} 
            onResponse={handleChatResponse} 
          />
        </div>
        <div style={{ flex: 7, border: '1px solid #ccc', padding: '1rem' }}>
          <h2>Structured Info</h2>
          {structuredInfo ? (
            <StructuredInfoTabs structuredInfo={structuredInfo} />
          ) : (
            <div>Loading structured info...</div>
          )}
        </div>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
        {source === "CTG" ? (
          <>
            <h2>References</h2>
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
              <h2>Full Text</h2>
              <button onClick={() => setFullTextExpanded(prev => !prev)}>
                {fullTextExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {fullTextExpanded && (
              <FullText fullText={fullText} highlightedEvidence={highlightedEvidence} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DetailPage;

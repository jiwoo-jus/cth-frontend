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

  // ChatBot에서 evidence를 하이라이트하지 않고, 바로 iframe 내부에서 스크롤
  // => 이 경우, 별도 evidenceList state는 필요치 않음.
  // const [evidenceList, setEvidenceList] = useState([]);

  // FullText 컴포넌트를 참조하기 위한 ref
  const fullTextRef = useRef(null);

  useEffect(() => {
    // PM/PMC 케이스
    if ((source === 'PM' || source === 'PMC') && pmcid) {
      fetch(`${BASE_URL}/api/paper/structured_info?pmcid=${pmcid}`)
        .then(res => res.json())
        .then((data) => setStructuredInfo(data.structured_info))
        .catch((err) => console.error(err));

      fetch(`${BASE_URL}/api/paper/pmc_full_text_html?pmcid=${pmcid}`)
        .then(res => res.text())
        .then(htmlString => {
          // 원본 코드에서 불필요한 영역 제거
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
          } else {
            setFullText(htmlString);
          }
        })
        .catch((err) => console.error(err));
    }
    // CTG 케이스
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

  // evidence "바로가기" 버튼 -> iframe 내부 스크롤 & 하이라이트
  const scrollToEvidence = (evidenceText) => {
    if (fullTextRef.current?.highlightEvidence) {
      fullTextRef.current.highlightEvidence(evidenceText);
    }
  };

  // ChatBot 응답 핸들러
  // (굳이 evidenceList를 따로 보관하지 않고, scrollToEvidence만 사용)
  const handleChatResponse = (response) => {
    console.log('Chat response evidence:', response.evidence);
    // 만약 백엔드에서 "highlighted_article"처럼 iframe 쓰지 않고 div로 렌더링할 때만 쓰도록 한 코드를
    // 제거하거나 무시해도 됨. 현재는 iframe이라 highlight 코드는 scrollToEvidence로 처리.
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
          {/* evidence 바로가기 -> scrollToEvidence로 전달 */}
          <ChatBot
            paperId={paperId}
            data={fullText}
            onResponse={handleChatResponse}
            onEvidenceClick={scrollToEvidence}
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
        {source === 'CTG' ? (
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
              // iframe 버전을 사용하는 FullText
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

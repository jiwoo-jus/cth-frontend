// src/pages/DetailPage.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import queryString from 'query-string';
import ChatBot from '../components/ChatBot';
import StructuredInfoTabs from '../components/StructuredInfoTabs';
import FullText from '../components/FullText';

const DetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { paperId, pmcid, nctId, source } = queryString.parse(location.search);

  // 각 영역의 상태 선언 (챗봇, structured info, fulltext 등)
  const [structuredInfo, setStructuredInfo] = useState(null);
  const [fullText, setFullText] = useState('');
  const [fullTextExpanded, setFullTextExpanded] = useState(false);
  const [highlightedEvidence, setHighlightedEvidence] = useState([]);

  useEffect(() => {
    // PM/PMC인 경우: pmcid를 사용하여 structured info와 full text 호출
    if ((source === 'PM' || source === 'PMC') && pmcid) {
      // API 호출 예시 (구현에 맞게 변경)
      fetch(`/paper/structured_info?pmcid=${pmcid}`)
        .then(res => res.json())
        .then(data => setStructuredInfo(data.structured_info))
        .catch(err => console.error(err));
      fetch(`/paper/pmc_full_text_html?pmcid=${pmcid}`)
        .then(res => res.json())
        .then(data => setFullText(data.pmc_full_text_html || ''))
        .catch(err => console.error(err));
    }
    // CTG인 경우: nctId 기반 호출 (구현에 따라 다름)
    if (source === 'CTG' && nctId) {
      fetch(`/paper/ctg_detail?nctId=${nctId}`)
        .then(res => res.json())
        .then(data => {
          setStructuredInfo(data.structured_info);
          setFullText(data.full_text || '');
        })
        .catch(err => console.error(err));
    }
  }, [paperId, pmcid, nctId, source]);

  const handleChatResponse = (response) => {
    // ChatBot에서 evidence 반환 시 상위로 받아 FullText 하이라이트에 적용
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Full Text</h2>
          <button onClick={() => setFullTextExpanded(prev => !prev)}>
            {fullTextExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
        {fullTextExpanded && (
          <FullText fullText={fullText} highlightedEvidence={highlightedEvidence} />
        )}
      </div>
    </div>
  );
};

export default DetailPage;

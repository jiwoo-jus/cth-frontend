// src/components/FullText.js
import React from 'react';
import PropTypes from 'prop-types';

function highlightEvidence(fullText, evidenceList) {
  let highlighted = fullText;
  if (!evidenceList || evidenceList.length === 0) return highlighted;
  
  evidenceList.forEach(evi => {
    // 단순한 문자열 검색; 80% 매칭은 복잡하므로 여기서는 exact match 또는 substring match로 처리합니다.
    if (evi && highlighted.includes(evi)) {
      // 이미 하이라이트된 부분은 중복 처리하지 않기 위해 정규 표현식의 global, case-insensitive 플래그 사용
      const regex = new RegExp(evi, 'gi');
      highlighted = highlighted.replace(regex, `<mark>${evi}</mark>`);
    }
  });
  return highlighted;
}

const FullText = ({ fullText, highlightedEvidence }) => {
  const displayedText = highlightEvidence(fullText, highlightedEvidence);
  
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', overflow: 'auto' }}>
      <div dangerouslySetInnerHTML={{ __html: displayedText }} />
    </div>
  );
};

FullText.propTypes = {
  fullText: PropTypes.string.isRequired,
  highlightedEvidence: PropTypes.arrayOf(PropTypes.string)
};

export default FullText;

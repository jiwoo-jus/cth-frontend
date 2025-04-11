// src/components/FullText.js
import React from 'react';
import PropTypes from 'prop-types';

function highlightEvidence(fullText, evidenceList) {
  let highlighted = fullText;
  if (!evidenceList || evidenceList.length === 0) return highlighted;
  
  evidenceList.forEach(evi => {
    if (evi && highlighted.includes(evi)) {
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

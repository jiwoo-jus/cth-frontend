// src/components/StructuredInfoTabs.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FoldableNode from './FoldableNode';

const TAB_KEYS = [
  "protocolSection",
  "resultsSection",
  "annotationSection",
  "documentSection",
  "derivedSection",
  "hasResults"
];

const StructuredInfoTabs = ({ structuredInfo }) => {
  const [activeTab, setActiveTab] = useState(TAB_KEYS[0]);
  const tabContent = structuredInfo[activeTab];

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
        {TAB_KEYS.map(key => (
          <button
            key={key}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderBottom: activeTab === key ? '3px solid blue' : 'none',
              background: 'none',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab(key)}
          >
            {key}
          </button>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        {tabContent ? (
          <FoldableNode nodeKey={activeTab} data={tabContent} depth={0} defaultExpandDepth={2} />
        ) : (
          <div>No data available for {activeTab}</div>
        )}
      </div>
    </div>
  );
};

StructuredInfoTabs.propTypes = {
  structuredInfo: PropTypes.object.isRequired,
};

export default StructuredInfoTabs;

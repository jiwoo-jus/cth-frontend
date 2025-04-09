// src/components/StructuredInfoTabs.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FoldableNode from './FoldableNode'; // 기존 FoldableNode.js 파일로 가정

const TAB_KEYS = [
  "protocolSection",
  "resultsSection",
  "annotationSection",
  "documentSection",
  "derivedSection",
  "hasResults"
];

const StructuredInfoTabs = ({ structuredInfo }) => {
  // 기본 탭: 첫 번째 키
  const [activeTab, setActiveTab] = useState(TAB_KEYS[0]);

  // structuredInfo가 객체라면 각 탭의 데이터 추출
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
          // FoldableNode를 통해 데이터 렌더링; defaultExpandDepth는 필요에 따라 조정
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

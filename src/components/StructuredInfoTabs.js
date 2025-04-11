// filepath: cth-frontend/src/components/StructuredInfoTabs.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FoldableNode from './FoldableNode';

/**
 * StructuredInfoTabs:
 * 1) 상단 탭으로 protocolSection, resultsSection 등 필드를 보여줌.
 * 2) 각 탭 클릭 시, 해당하는 구조화 정보를 FoldableNode로 렌더링.
 * 
 * 요구사항 반영:
 *  - depth1은 이미 탭으로 존재하므로, 탭 콘텐츠 내부에서는 "루트 레이블"을 표시하지 않음.
 *  - depth2부터는 접혀서 보이도록 defaultCollapsedDepth=2 옵션 사용.
 *  - 따라서 FoldableNode에 nodeKey=""를 주고, children만 depth=0으로 렌더링함.
 */

const TAB_KEYS = [
  'protocolSection',
  'resultsSection',
  'annotationSection',
  'documentSection',
  'derivedSection',
  'hasResults',
];

const StructuredInfoTabs = ({ structuredInfo }) => {
  const [activeTab, setActiveTab] = useState(TAB_KEYS[0]);

  if (!structuredInfo) {
    return <div>No structured info available.</div>;
  }

  // 현재 탭에 해당하는 최상위 데이터
  const tabContent = structuredInfo[activeTab];

  return (
    <div>
      {/* 탭 헤더 */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
        {TAB_KEYS.map(key => (
          <button
            key={key}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderBottom: activeTab === key ? '3px solid #00509E' : 'none', // Blue underline for active tab
              background: activeTab === key ? '#f0f8ff' : 'none', // Light blue background for active tab
              fontWeight: activeTab === key ? 'bold' : 'normal', // Bold font for active tab
              color: activeTab === key ? '#00509E' : '#333', // Blue text for active tab
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0', // Rounded corners for tabs
              transition: 'background 0.3s ease, color 0.3s ease', // Smooth hover effect
            }}
            onClick={() => setActiveTab(key)}
            onMouseEnter={(e) => {
              if (activeTab !== key) e.target.style.background = '#f9f9f9'; // Light gray on hover
            }}
            onMouseLeave={(e) => {
              if (activeTab !== key) e.target.style.background = 'none'; // Reset background on hover out
            }}
          >
            {key}
          </button>
        ))}
      </div>
      
      {/* 탭 콘텐츠 영역 */}
      <div style={{ overflowX: 'auto' }}>
        {tabContent ? (
          // depth=0부터 렌더링, 루트 레이블은 nodeKey=""로 숨김
          <FoldableNode
            nodeKey=""
            data={tabContent}
            depth={0}
            // depth2부터 접힘
            defaultCollapsedDepth={2}
          />
        ) : (
          <div>No data for {activeTab}</div>
        )}
      </div>
    </div>
  );
};

StructuredInfoTabs.propTypes = {
  structuredInfo: PropTypes.object.isRequired,
};

export default StructuredInfoTabs;

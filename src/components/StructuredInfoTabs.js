import PropTypes from 'prop-types';
import React, { useState } from 'react';

import FoldableNode from './FoldableNode';

/**
 * StructuredInfoTabs:
 * - Provides top-level tabs for each structured section.
 * - On tab click, renders FoldableNode tree for that section.
 * - Root label is hidden (nodeKey=""), rendering starts from depth 0.
 */

const TAB_KEYS = [
  'protocolSection',
  'resultsSection',
  'annotationSection',
  'documentSection',
  'derivedSection',
  // 'hasResults',
];

const StructuredInfoTabs = ({ structuredInfo }) => {
  const [activeTab, setActiveTab] = useState(TAB_KEYS[0]);

  if (!structuredInfo) return <div>No structured info available.</div>;

  const tabContent = structuredInfo[activeTab];

  return (
    <div className="w-full">
      {/* 탭 헤더 (scrollable if overflow) */}
      <div className="flex flex-wrap gap-2 overflow-x-auto border-b mb-4 pb-1">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            className={`text-sm px-3 py-1 rounded-t font-semibold font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === key
                ? 'text-blue-800 border-blue-600 bg-blue-50'
                : 'text-gray-600 border-transparent hover:border-gray-300'
            }`}
            onClick={() => setActiveTab(key)}
          >
            {key}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="overflow-x-auto">
        {tabContent ? (
          <FoldableNode
            nodeKey=""
            data={tabContent}
            depth={0}
            defaultCollapsedDepth={0}
          />
        ) : (
          <div className="text-gray-500 text-sm">No data for {activeTab}</div>
        )}
      </div>
    </div>
  );
};

StructuredInfoTabs.propTypes = {
  structuredInfo: PropTypes.object.isRequired,
};

export default StructuredInfoTabs;

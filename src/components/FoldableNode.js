import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react'; 
// ※ lucide-react 패키지가 없다면, 
// <svg>를 직접 넣거나 설치: `npm install lucide-react`
// 혹은 ▼▶ 문자로 대체해도 됩니다.

/**
 * FoldableNode: JSON 구조(오브젝트/배열/프리미티브)를 폴더블 트리로 표시
 */

const FoldableNode = ({
  nodeKey,
  data,
  depth,
  defaultCollapsedDepth,
  isArrayItem,
  arrayIndex,
}) => {
  // 초기 접힘/펼침 설정
  const isRootWrapper = nodeKey === "";
  const [expanded, setExpanded] = useState(isRootWrapper || depth < defaultCollapsedDepth);

  const toggleExpand = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // 들여쓰기(12px * depth)
  const indentStyle = {
    marginLeft: depth * 12,
    transition: 'all 0.2s ease-in-out', // 부드러운 전환
  };

  // "array item" 불렛포인트 스타일
  const bulletStyle = {
    marginRight: '6px',
    fontSize: '0.6rem',
    fontWeight: 'bold',
    color: '#555555'
  };

  // 객체 또는 배열
  if (typeof data === 'object' && data !== null) {
    // [1] 배열인 경우
    if (Array.isArray(data)) {
      return (
        <div className="my-1 text-sm" style={indentStyle}> {/* text-sm 추가 */}
          {/* 노드 키가 있고, 배열의 "부모"라면 펼침/접힘 토글을 표시 */}
          {nodeKey && !isArrayItem && (
            <div 
              className="flex items-center gap-1 cursor-pointer text-custom-blue-deep font-semibold hover:text-custom-blue" // text-sm 제거 (부모에서 적용)
              onClick={toggleExpand}
            >
              {expanded ? (
                <ChevronDown size={14} className="inline-block" />
              ) : (
                <ChevronRight size={14} className="inline-block" />
              )}
              <span>{nodeKey}</span>
            </div>
          )}
          {expanded && (
            <div style={{ marginLeft: (nodeKey && !isArrayItem) ? 12 : 0 }}>
              {data.map((el, idx) => (
                <FoldableNode
                  key={idx}
                  nodeKey={String(idx)}
                  data={el}
                  depth={depth + (nodeKey && !isArrayItem ? 1 : 0)}
                  defaultCollapsedDepth={defaultCollapsedDepth}
                  isArrayItem
                  arrayIndex={idx}
                />
              ))}
            </div>
          )}
        </div>
      );
    } else {
      // [2] 일반 객체인 경우
      const entries = Object.entries(data);

      return (
        <div className="my-1 text-sm" style={indentStyle}> {/* text-sm 추가 */}
          {/* 루트 노드가 아니라면 토글 UI를 표시 */}
          {nodeKey && (
            <div
              className="flex items-center gap-1 cursor-pointer text-custom-blue-deep font-semibold hover:text-custom-blue" // text-sm 제거 (부모에서 적용)
              onClick={toggleExpand}
            >
              {expanded ? (
                <ChevronDown size={14} className="inline-block" />
              ) : (
                <ChevronRight size={14} className="inline-block" />
              )}
              <span>{nodeKey}</span>
            </div>
          )}
          {expanded && (
            <div className="pl-3 border-l border-gray-200" style={{ marginLeft: nodeKey ? 4 : 0 }}>
              {entries.map(([key, value]) => (
                <FoldableNode
                  key={key}
                  nodeKey={key}
                  data={value}
                  depth={depth + (nodeKey ? 1 : 0)}
                  defaultCollapsedDepth={defaultCollapsedDepth}
                />
              ))}
            </div>
          )}
        </div>
      );
    }
  } else {
    // [3] 기본 자료형(문자열, 숫자, 불린, null)
    return (
      <div className="my-1 text-sm" style={indentStyle}> {/* text-sm 추가 */}
        {isArrayItem ? (
          <div> {/* flex 제거됨 */}
            <span style={bulletStyle}>•</span>
            {/* 배열 인덱스와 노드 키가 다를 경우에만 "key:" 표시 */}
            {nodeKey !== String(arrayIndex) && (
              <strong className="text-custom-blue-deep mr-1 font-semibold">{nodeKey}:</strong>
            )}
            {/* inline-block 제거, break-all 유지 */}
            <span className="text-custom-text break-all">{String(data)}</span> 
          </div>
        ) : (
          <div> {/* flex 제거됨 */}
            <strong className="text-custom-blue-deep mr-1 font-semibold">{nodeKey}:</strong> {/* font-semibold 추가 */}
            {/* inline-block 제거, break-all 유지 */}
            <span className="text-custom-text break-all">{String(data)}</span> 
          </div>
        )}
      </div>
    );
  }
};

FoldableNode.propTypes = {
  nodeKey: PropTypes.string.isRequired,
  data: PropTypes.any,
  depth: PropTypes.number,
  defaultCollapsedDepth: PropTypes.number, 
  isArrayItem: PropTypes.bool,            
  arrayIndex: PropTypes.number,           
};

FoldableNode.defaultProps = {
  depth: 0,
  defaultCollapsedDepth: 1,
  isArrayItem: false,
  arrayIndex: 0,
};

export default FoldableNode;

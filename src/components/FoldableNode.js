import PropTypes from 'prop-types';
import React, { useState } from 'react';

/**
 * FoldableNode: JSON 구조(오브젝트/배열/프리미티브)를 폴더블 트리로 표시
 * 
 * 주요 수정 사항:
 * 1) defaultCollapsedDepth를 두어서, 특정 depth 이상은 접힌 상태로 시작하도록 함.
 * 2) 배열일 때의 인덱스 표시(최소화) 및 스타일을 조정해 공간 낭비를 줄임.
 *    - isArrayItem, arrayIndex 프로퍼티로 제어
 * 3) nodeKey가 빈 문자열("")일 경우, 상위 레이블을 숨길 수 있도록 처리 (루트 노드 스킵할 때 활용).
 */

const FoldableNode = ({
  nodeKey,
  data,
  depth,
  defaultCollapsedDepth,
  isArrayItem,
  arrayIndex,
}) => {
  // depth < defaultCollapsedDepth 이면 초기에 펼쳐짐(expanded) 상태로
  // depth >= defaultCollapsedDepth 이면 접힘(!expanded) 상태로.

  // depth 계산과 접힘 여부 설정
  const isRootWrapper = nodeKey === "";
  const [expanded, setExpanded] = useState(isRootWrapper || depth < defaultCollapsedDepth);


  const toggleExpand = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // 들여쓰기 (depth*12px)와 폰트 사이즈 축소
  const indentStyle = {
    marginLeft: depth * 12, // 16px에서 12px로 줄임
    padding: '3px 0', // 4px에서 2px로 줄임
    fontSize: '0.875rem', // text-sm에 해당하는 크기
    lineHeight: '1.25rem',
  };

  // 객체 또는 배열
  if (typeof data === 'object' && data !== null) {
    // 배열인 경우
    if (Array.isArray(data)) {
      return (
        <div style={indentStyle}>
          {/* nodeKey가 빈 문자열이 아니고, 배열의 "부모" 노드라면 토글 UI를 표시 */}
          {nodeKey && !isArrayItem && (
            <div
              onClick={toggleExpand}
              style={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              <span style={{ color: '#000000', fontSize: '0.75rem' }}>{expanded ? '▼' : '▶'}</span> {nodeKey}
            </div>
          )}
          {expanded && (
            <div style={{ marginLeft: (nodeKey && !isArrayItem) ? 12 : 0 }}> {/* 16px에서 12px로 줄임 */}
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
      // 일반 객체인 경우
      const entries = Object.entries(data);
      // nodeKey가 ""(빈 문자열)이면 상단 레이블 없이 바로 children만 표시
      return (
        <div style={indentStyle}>
          {nodeKey && (
            <div
              onClick={toggleExpand}
              style={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              <span style={{ color: '#000000', fontSize: '0.75rem' }}>{expanded ? '▼' : '▶'}</span> {nodeKey}
            </div>
          )}
          {expanded && (
            <div style={{ marginLeft: nodeKey ? 12 : 0 }}> {/* 16px에서 12px로 줄임 */}
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
    // 기본 자료형(문자열/숫자/불린/null)
    return (
      <div style={indentStyle}>
        {isArrayItem ? (
          // 배열 항목일 때는 불렛포인트로 표시
          <>
            <span style={{ 
              color: '#000000', 
              marginRight: '6px',
              fontSize: '0.4rem',  // 불렛포인트 크기 증가
              fontWeight: 'bold' // 더 두껍게 표시
            }}>
              ●
            </span>
            {nodeKey !== String(arrayIndex) && (
              <>
                <strong>{nodeKey}:</strong>{' '}
              </>
            )}
            <span>{String(data)}</span>
          </>
        ) : (
          <>
            <strong>{nodeKey}:</strong> <span>{String(data)}</span>
          </>
        )}
      </div>
    );
  }
};

FoldableNode.propTypes = {
  nodeKey: PropTypes.string.isRequired,
  data: PropTypes.any,
  depth: PropTypes.number,
  defaultCollapsedDepth: PropTypes.number, // 이 depth 이상이면 접힘
  isArrayItem: PropTypes.bool,            // 배열 내부 아이템 여부
  arrayIndex: PropTypes.number,           // 배열 인덱스
};

FoldableNode.defaultProps = {
  depth: 0,
  defaultCollapsedDepth: 1,
  isArrayItem: false,
  arrayIndex: 0,
};

export default FoldableNode;

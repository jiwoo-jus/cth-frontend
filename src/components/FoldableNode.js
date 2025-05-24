import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react'; 
// ※ lucide-react 패키지가 없다면, 
// <svg>를 직접 넣거나 설치: `npm install lucide-react`
// 혹은 ▼▶ 문자로 대체해도 됩니다.

const isArrayOfObjectsWithPrimitiveValues = (array) => {
  return (
    Array.isArray(array) &&
    array.every(
      (item) =>
        (typeof item === 'object' &&
          item !== null &&
          Object.values(item).every(
            (value) =>
              value === null ||
              ['string', 'number', 'boolean'].includes(typeof value) ||
              (Array.isArray(value) && value.every((subItem) => typeof subItem === 'string'))
          )) 
    )
  );
};


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
  const [expanded, setExpanded] = useState(isRootWrapper || depth <= 1 || depth > 2);

  const toggleExpand = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // 들여쓰기(12px * depth)
  const indentStyle = {
    marginLeft: depth/2,
    transition: 'all 0.2s ease-in-out', // 부드러운 전환
  };

  // "array item" 불렛포인트 스타일
  const bulletStyle = {
    marginRight: '6px',
    marginLeft: '12px',
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#555555'
  };

  // 객체 또는 배열
  if (typeof data === 'object' && data !== null) {
    // [1] 배열인 경우
if (Array.isArray(data)) {
  if (isArrayOfObjectsWithPrimitiveValues(data)) {
    // Check if data[0] exists and is an object
    const headers = data[0] && typeof data[0] === 'object' ? Object.keys(data[0]) : [];
    return (
      <div className="my-1 text-sm" style={{ indentStyle }}>
        {nodeKey && (
          <div
            className={`flex items-center gap-1 cursor-pointer text-custom-blue-deep font-semibold
             hover:text-custom-blue`}
            onClick={toggleExpand}
          >
            {expanded ? (
              <ChevronDown size={14} className="inline-block" />
            ) : (
              <ChevronRight size={14} className="inline-block" />
            )}
            <span>{nodeKey} </span>
          </div>
        )}
        {expanded && (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table className="table-auto border-collapse border border-gray-300 w-full mt-3">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="border border-gray-300 px-2 py-1 text-left font-semibold bg-blue-100"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="even:bg-gray-50 odd:bg-white">
                    {headers.map((header) => (
                      <td
                        key={header}
                        className="border border-gray-300 px-2 py-1"
                      >
                        {header === "pmid" ? (
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${row[header]}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            {row[header]}
                          </a>
                        ) : (
                          String(row[header])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Default rendering for arrays
  return (
    <div className="my-1 text-sm" style={{ ...indentStyle, marginTop: depth <=1 ? '9px' : '0', marginBottom: depth <=1 ? '9px' : '0' }}>
      {nodeKey && !isArrayItem && (
        <div
          className="flex items-center gap-1 cursor-pointer text-custom-blue-deep font-semibold hover:text-custom-blue"
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
        <div style={{ marginLeft: (nodeKey && !isArrayItem) ? 0.5 : 0 }}>
          {data.map((el, idx) => (
            <div key={idx} className={` ${
      typeof el === 'object' && el !== null //&& depth < 4
        ? 'm-2 p-2 border  '
        : ''
    }`}>
            <FoldableNode
              key={idx}
              nodeKey=""
              data={el}
              depth={depth + (nodeKey && !isArrayItem ? 1 : 0)}
              defaultCollapsedDepth={defaultCollapsedDepth}
              isArrayItem
              arrayIndex={idx}
            />
          </div>
          ))}
        </div>
      )}
    </div>
  );
} else {
      // [2] 일반 객체인 경우
      const entries = Object.entries(data);

      return (
        <div className="my-1 text-sm" style={{ ...indentStyle, marginTop: depth <=1 ? '9px' : '0', marginBottom: depth <=1 ? '9px' : '0' }} > {/* text-sm 추가 */}
          {/* 루트 노드가 아니라면 토글 UI를 표시 */}
          { nodeKey && (
            <div
              className={`flex items-center gap-1 cursor-pointer ${ depth === 0 ? "w-full text-left px-4 py-2 bg-custom-blue-deep font-semibold text-white hover:bg-gray-700 transition-colors mt-3" 
                : "text-custom-blue-deep font-semibold" 
              } `} // text-sm 제거 (부모에서 적용)
              style={{
                cursor: depth != 1 ? "pointer" : "default", // Only show pointer cursor for depth === 0
               }}
              onClick={depth !=1 ? toggleExpand : undefined}
            >
              
              <span>
                {depth === 0 && (expanded ? '▽ ' : '▷ ')} {/* Triangles for depth 0 */}
                {depth > 1 && (
                  expanded ? (
                    <ChevronDown size={14} className="inline-block" />
                  ) : (
                    <ChevronRight size={14} className="inline-block" />
                  )
                )} {/* Chevrons for depth 1 */}
                {nodeKey}
              </span>
            </div>
          )}
          {expanded && (
            <div className="pl-1" style={{ marginLeft: nodeKey ? depth*2 : 0 }}>
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
      <div className="my-1 text-sm" style={{ ...indentStyle, marginTop: depth <=1 ? '9px' : '0', marginBottom: depth <=1 ? '9px' : '0' }}> 
        {isArrayItem ? (
          <div> {/* flex 제거됨 */}
            <span style={bulletStyle}>•</span>
            {/* 배열 인덱스와 노드 키가 다를 경우에만 "key:" 표시 */}
            {nodeKey && nodeKey !== String(arrayIndex) && (
              <strong className="text-custom-blue-deep mr-1 font-semibold">{nodeKey}:</strong>
            )}
            {/* inline-block 제거, break-all 유지 */}
            <span className="text-custom-text break-all">{String(data)}</span> 
          </div>
        ) : (
          <div> {/* flex 제거됨 */}
            <strong className={`my-1 text-sm ${ depth > 1 ? "text-black" : "text-custom-blue-deep" } font-semibold `}>{nodeKey}:</strong> {/* font-semibold 추가 */}
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
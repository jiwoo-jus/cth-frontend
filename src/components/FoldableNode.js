import PropTypes from 'prop-types';
import React, { useState } from 'react';

const FoldableNode = ({ nodeKey, data, depth }) => {
  const [expanded, setExpanded] = useState(true);
  const toggleExpand = () => setExpanded(!expanded);
  const indentStyle = {
    marginLeft: depth * 16,
    padding: '4px 0'
  };

  if (typeof data === 'object' && data !== null) {
    return (
      <div style={indentStyle}>
        <div onClick={toggleExpand} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          {nodeKey} {expanded ? '-' : '+'}
        </div>
        {expanded && (
          <div style={{ marginLeft: 16 }}>
            {Object.entries(data).map(([key, value]) => (
              <FoldableNode key={key} nodeKey={key} data={value} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={indentStyle}>
      <strong>{nodeKey}:</strong> <span>{String(data)}</span>
    </div>
  );
};

FoldableNode.propTypes = {
  nodeKey: PropTypes.string.isRequired,
  data: PropTypes.any,
  depth: PropTypes.number,
};

FoldableNode.defaultProps = {
  depth: 0,
};

export default FoldableNode;

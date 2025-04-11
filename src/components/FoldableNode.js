// src/components/FoldableNode.js
import React from 'react';
import PropTypes from 'prop-types';

const FoldableNode = ({ nodeKey, data, depth }) => {
  return (
    <div style={{ marginLeft: depth * 16, borderLeft: '2px solid #666', paddingLeft: 8 }}>
      <strong>{nodeKey}:</strong> {typeof data === 'object' ? JSON.stringify(data) : data.toString()}
    </div>
  );
};

FoldableNode.propTypes = {
  nodeKey: PropTypes.string.isRequired,
  data: PropTypes.any.isRequired,
  depth: PropTypes.number,
};

FoldableNode.defaultProps = {
  depth: 0,
};

export default FoldableNode;

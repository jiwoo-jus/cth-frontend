import PropTypes from 'prop-types';
import React from 'react';

function FullText({ fullText }) {
  if (!fullText) return <div>Loading content...</div>;

  return (
    <iframe
      srcDoc={fullText}      // this is the raw HTML string
      title="PMC Article"
      style={{ width: '100%', height: '80vh', border: 'none' }}
    />
  );
}


FullText.propTypes = {
  fullText: PropTypes.string.isRequired,
};

export default FullText;

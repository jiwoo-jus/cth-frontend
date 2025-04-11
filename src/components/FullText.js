// src/components/FullText.js
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import PropTypes from 'prop-types';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const FullText = forwardRef(({ fullText }, ref) => {
  const iframeRef = useRef(null);

  useImperativeHandle(ref, () => ({
    highlightEvidence: (evidenceText) => {
      const iframeEl = iframeRef.current;
      if (!iframeEl) return;
      const iDoc = iframeEl.contentDocument;
      if (!iDoc) return;

      let html = iDoc.body.innerHTML;
      // 기존의 하이라이트가 있다면 제거
      html = html.replace(/<span class="evidence-highlight" id="targetEvidence">(.*?)<\/span>/gi, '$1');

      // inline 스타일을 함께 추가하도록 수정
      const pattern = new RegExp(`(${escapeRegExp(evidenceText)})`, 'i');
      const replacement = `<span id="targetEvidence" style="background-color: yellow; transition: background-color 0.5s ease;">$1</span>`;
      const newHtml = html.replace(pattern, replacement);

      iDoc.body.innerHTML = newHtml;
      const target = iDoc.getElementById("targetEvidence");
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          target.removeAttribute('id');
          // 스타일은 그대로 남아있더라도 제거하고 싶으면 target.removeAttribute('style');
        }, 3000);
      }
    }
  }));

  return (
    <iframe
      ref={iframeRef}
      srcDoc={fullText}
      title="PMC Article"
      style={{ width: '100%', height: '80vh', border: 'none' }}
    />
  );
});

FullText.displayName = 'FullText';

FullText.propTypes = {
  fullText: PropTypes.string.isRequired,
};

export default FullText;

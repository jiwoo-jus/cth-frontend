import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import PropTypes from 'prop-types';

export const SearchBar = ({ query, setQuery, onSubmit }) => {
  // 순환할 플레이스홀더 문구들
  const placeholderTexts = [
    "Search clinical terms, conditions, or interventions...",
    "Explore medical research and clinical trials...",
    "Find information on treatments and studies..."
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const textareaRef = useRef(null);

  // 3초마다 플레이스홀더 변경
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % placeholderTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholderTexts.length]);

  // Enter키는 Shift 없이 누르면 제출, Shift+Enter 는 줄바꿈
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  // 입력값이 바뀔 때마다 텍스트영역 높이 자동 조절
  const handleChange = (e) => {
    setQuery(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  return (
    <div className="relative z-40 mx-auto w-full max-w-[768px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="relative"
      >
        <label
          className="
            relative flex w-full cursor-text flex-col overflow-hidden
            rounded-2xl px-4 py-3
            light:border-primary-12 dark:bg-primary-4 light:bg-secondary-100
            light:shadow-splash-chatpgpt-input
          "
        >
          <div className="sr-only">Search</div>

          {/* query가 비어있을 때만 플레이스홀더 문구 노출 */}
          {!query && (
            <div className="absolute left-4 top-3 text-custom-text-subtle pointer-events-none transition-opacity duration-300">
              {placeholderTexts[currentIdx]}
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows="1"
            placeholder=" " // 실제 placeholder는 공백 처리
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="
              relative w-full pr-12 bg-transparent text-base leading-relaxed
              resize-none overflow-hidden focus:outline-none
            "
          />

          <div className="absolute bottom-3 right-3 flex justify-end">
            <button
              type="submit"
              aria-label="Send search query"
              className="
                bg-primary-100 text-secondary-100 disabled:bg-primary-4 disabled:text-primary-44
                relative h-9 w-9 rounded-full p-0 transition-colors hover:opacity-70 disabled:hover:opacity-100
              "
            >
              <Search size={16} />
            </button>
          </div>
        </label>
      </form>
    </div>
  );
};

SearchBar.propTypes = {
  query: PropTypes.string.isRequired,
  setQuery: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

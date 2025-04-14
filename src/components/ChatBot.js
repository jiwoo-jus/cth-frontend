import PropTypes from 'prop-types';
import React, { useState } from 'react';

import api from '../api';

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => console.log("Copied:", text))
    .catch(err => console.error("Copy failed", err));
}

const ChatMessage = ({ message, onToggle, onEvidenceClick }) => {
  const handleCopyAll = () => {
    const allText = `Q: ${message.question}\nA: ${message.answer}${
      message.evidence?.length ? `\nEvidence:\n${message.evidence.join('\n')}` : ''}`;
    copyToClipboard(allText);
  };

  return (
    <div className="mb-3 border border-gray-300 rounded p-3 text-sm">
      {/* Question */}
      <div className="flex items-start gap-2 mb-2">
        <strong>Q:</strong>
        <div className="flex-1 whitespace-pre-wrap">{message.question}</div>
      </div>

      {/* Answer */}
      {message.expanded ? (
        <>
          <div className="flex items-start gap-2 mb-2">
            <strong>A:</strong>
            <div className="flex-1 whitespace-pre-wrap">{message.answer}</div>
          </div>

          {/* Evidence */}
          {message.evidence?.length > 0 && (
            <div className="mb-2">
              <strong className="block mb-1">Evidence:</strong>
              <ul className="list-none space-y-2 pl-0">
                {message.evidence.map((evi, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <button
                      className="text-gray-700 hover:text-blue-700 text-xs mt-0.5"
                      onClick={() => onEvidenceClick(evi)}
                      title="Highlight in full text"
                    >
                      🔍
                    </button>
                    <span className="whitespace-pre-wrap leading-snug text-sm">{evi}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="italic text-gray-600">(Answer collapsed)</div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap gap-2 mt-3 text-xs">
        <button
          onClick={onToggle}
          className="px-2 py-1 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-colors font-medium"
        >
          {message.expanded ? 'Collapse ▲' : 'Expand ▼'}
        </button>
        <button
          onClick={handleCopyAll}
          className="text-gray-500 hover:text-black transition-colors"
        >
          Copy
        </button>
      </div>
    </div>
  );
};

const ChatBot = ({ paperId, data, onResponse, onEvidenceClick }) => {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    try {
      const payload = data
        ? { content: data, userQuestion: question }
        : { paperId, userQuestion: question };

      const response = await api.post('/api/chat', payload);

      const newMessage = {
        question,
        answer: response.data.answer,
        evidence: response.data.evidence || [],
        expanded: true,
      };

      setConversation([...conversation, newMessage]);
      setQuestion('');
      if (onResponse) onResponse(response.data);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMessage = (index) => {
    setConversation(prev => {
      const updated = [...prev];
      updated[index].expanded = !updated[index].expanded;
      return updated;
    });
  };

  return (
    <div className="text-sm">
      <div>
        {conversation.map((msg, index) => (
          <ChatMessage
            key={index}
            message={msg}
            onToggle={() => toggleMessage(index)}
            onEvidenceClick={onEvidenceClick}
          />
        ))}
      </div>
      {loading && (
        <div className="text-center py-4 text-gray-500 text-sm">Loading response...</div>
      )}
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          placeholder="Ask a question about this paper..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
          disabled={loading}
          className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className={`text-white font-semibold rounded px-3 py-0.5 text-sm transition-colors ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-900'
          }`}
        >
          {loading ? 'Asking...' : 'Ask'}
        </button>
      </div>
    </div>
  );
};

ChatBot.propTypes = {
  paperId: PropTypes.string,
  data: PropTypes.string,
  onResponse: PropTypes.func,
  onEvidenceClick: PropTypes.func,
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    question: PropTypes.string,
    answer: PropTypes.string,
    evidence: PropTypes.arrayOf(PropTypes.string),
    expanded: PropTypes.bool,
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onEvidenceClick: PropTypes.func.isRequired,
};

export default ChatBot;

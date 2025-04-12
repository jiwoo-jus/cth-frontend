// src/components/ChatBot.js
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
      message.evidence?.length ? `\nEvidence:\n${message.evidence.join('\n')}` : ''
    }`;
    copyToClipboard(allText);
  };

  return (
    <div className="mb-4 border border-gray-300 rounded p-3">
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
            <div>
              <strong>Evidence:</strong>
              <ul className="pl-5 list-disc mt-1">
                {message.evidence.map((evi, idx) => (
                  <li
                    key={idx}
                    className="whitespace-pre-wrap mb-1 flex items-start gap-2"
                    style={{
                      borderBottom: '1px solid #eee', // Subtle bottom border
                      paddingBottom: '0.5rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <button
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem', // Keep the emoji size consistent
                        alignSelf: 'flex-start', // Align to the top
                      }}
                      onClick={() => onEvidenceClick(evi)}
                    >
                      🔍
                    </button>
                    <span className="flex-1">{evi}</span>
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
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={onToggle}
          style={{
            backgroundColor: 'transparent',
            color: '#00509E',
            border: '1px solid #00509E',
            padding: '0.3rem 0.6rem',
            cursor: 'pointer',
            borderRadius: '4px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            transition: 'background 0.3s ease, color 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#00509E';
            e.target.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#00509E';
          }}
        >
          {message.expanded ? 'Collapse' : 'Expand'}
          <span style={{ fontSize: '0.8rem' }}>{message.expanded ? '▲' : '▼'}</span>
        </button>
        <button
          onClick={handleCopyAll}
          style={{
            backgroundColor: 'transparent',
            color: '#aaa',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e) => (e.target.style.color = '#000')}
          onMouseLeave={(e) => (e.target.style.color = '#aaa')}
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
  const [loading, setLoading] = useState(false); // Add loading state

  const handleAsk = async () => {
    if (!question.trim() || loading) return; // Prevent multiple requests

    setLoading(true); // Set loading to true
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
      // Optionally display an error message to the user
    } finally {
      setLoading(false); // Set loading to false after request finishes
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
    <div>
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
      {/* Display loading indicator below conversation */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
          Loading response...
        </div>
      )}
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          placeholder="Ask a question about this paper..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAsk()} // Optional: Allow Enter key to submit
          disabled={loading} // Disable input while loading
          className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAsk}
          disabled={loading} // Disable button while loading
          style={{
            backgroundColor: loading ? '#ccc' : '#00509E', // Gray out button when loading
            color: '#fff',
            border: 'none',
            padding: '0.5rem 1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            fontWeight: 'bold',
            transition: 'background 0.3s ease',
          }}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#003366')}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#00509E')}
        >
          {loading ? 'Asking...' : 'Ask'} {/* Change button text */}
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

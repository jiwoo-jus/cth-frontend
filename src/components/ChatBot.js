// src/components/ChatBot.js
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import api from '../api';

// api/index.js
// import './ChatBot.css';

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => console.log("Copied:", text))
    .catch(err => console.error("Copy failed", err));
}

const ChatMessage = ({ message, onToggle }) => {
  const handleCopyAll = () => {
    const allText = `Q: ${message.question}\nA: ${message.answer}${
      message.evidence && message.evidence.length > 0
        ? `\nEvidence:\n${message.evidence.join("\n")}`
        : ""
    }`;
    copyToClipboard(allText);
  };

  return (
    <div style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '4px' }}>
        <strong style={{ marginRight: '4px' }}>Q:</strong>
        <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
          {message.question}
        </div>
        <button className="copy-button" style={{ alignSelf: 'flex-start' }} onClick={() => copyToClipboard(message.question)}>
          copy
        </button>
      </div>
      {message.expanded ? (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '4px' }}>
            <strong style={{ marginRight: '4px' }}>A:</strong>
            <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
              {message.answer}
            </div>
            <button className="copy-button" style={{ alignSelf: 'flex-start' }} onClick={() => copyToClipboard(message.answer)}>
              copy
            </button>
          </div>
          {message.evidence && message.evidence.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              <strong>Evidence:</strong>
              <ul style={{ paddingLeft: '20px' }}>
                {message.evidence.map((evi, idx) => (
                  <li key={idx} style={{ whiteSpace: 'pre-wrap', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>{evi}</div>
                      <button className="copy-button" style={{ alignSelf: 'flex-start' }} onClick={() => copyToClipboard(evi)}>
                        copy
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div style={{ marginTop: '4px', fontStyle: 'italic' }}>(Answer collapsed)</div>
      )}
      <button onClick={onToggle} style={{ marginTop: '4px' }}>
        {message.expanded ? 'Collapse' : 'Expand'}
      </button>
      <button className="copy-button" onClick={handleCopyAll} style={{ marginTop: '4px' }}>
        Copy All
      </button>
    </div>
  );
};

const ChatBot = ({ paperId, data, onResponse }) => {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    try {
      const payload = data 
        ? { content: data, userQuestion: question }
        : { paperId, userQuestion: question };
      // const response = await api.post('/chat', payload);
      const response = await api.post('/api/chat', payload)
      const newMessage = {
        question: question,
        answer: response.data.answer,
        evidence: response.data.evidence || [],
        expanded: true,
      };
      setConversation([...conversation, newMessage]);
      setQuestion('');
      if (onResponse) {
        onResponse(response.data);
      }
    } catch (error) {
      console.error('Chat error:', error);
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
          <ChatMessage key={index} message={msg} onToggle={() => toggleMessage(index)} />
        ))}
      </div>
      <input
        type="text"
        placeholder="Ask a question about this paper..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        style={{ width: '100%', marginTop: '8px' }}
      />
      <button onClick={handleAsk}>Ask</button>
    </div>
  );
};

ChatBot.propTypes = {
  paperId: PropTypes.string,
  data: PropTypes.string,
  onResponse: PropTypes.func
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    question: PropTypes.string,
    answer: PropTypes.string,
    evidence: PropTypes.arrayOf(PropTypes.string),
    expanded: PropTypes.bool
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default ChatBot;

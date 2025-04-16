// src/components/ChatBot.js
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import api from '../api';
import { SendHorizontal, Clipboard, ClipboardCheck, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'; // Import new icons

function copyToClipboard(text) {
  return navigator.clipboard.writeText(text); // Return the promise
}

const ChatMessage = ({ message, onToggle, onEvidenceClick }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyAll = () => {
    const allText = `Q: ${message.question}\nA: ${message.answer}${
      message.evidence?.length ? `\nEvidence:\n${message.evidence.join('\n')}` : ''}`;
    copyToClipboard(allText)
      .then(() => {
        console.log("Copied:", allText);
        setIsCopied(true);
        // Reset icon after a short delay
        setTimeout(() => setIsCopied(false), 1500);
      })
      .catch(err => console.error("Copy failed", err));
  };

  return (
    <div className="mb-4 bg-white border border-custom-border rounded-2xl shadow-sm p-4 text-sm group"> {/* Add group class */}
      {/* Question */}
      <div className="flex items-start gap-2 mb-3">
        <strong className="text-custom-blue-deep">Q:</strong>
        <div className="flex-1 whitespace-pre-wrap text-custom-text">{message.question}</div>
      </div>

      {/* Answer */}
      {message.expanded ? (
        <>
          <div className="flex items-start gap-2 mb-3">
            <strong className="text-custom-blue-deep">A:</strong>
            <div className="flex-1 whitespace-pre-wrap text-custom-text">{message.answer}</div>
          </div>

          {/* Evidence */}
          {message.evidence?.length > 0 && (
            <div className="mb-3">
              <strong className="block mb-1 text-custom-blue-deep">Evidence:</strong>
              <ul className="list-none space-y-2 pl-0">
                {message.evidence.map((evi, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <button
                      className="text-custom-blue hover:text-custom-blue-hover text-xs mt-0.5"
                      onClick={() => onEvidenceClick(evi)}
                      title="Highlight in full text"
                    >
                      🔍
                    </button>
                    <span className="whitespace-pre-wrap leading-snug text-sm text-custom-text">{evi}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="italic text-custom-text-subtle">(Answer collapsed)</div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 mt-4"> {/* Reduced gap from gap-3 to gap-2 */}
        <button
          onClick={onToggle}
          className="p-1.5 text-custom-blue-deep rounded-full hover:bg-custom-blue-lightest transition-colors" // Adjusted padding, removed background/border, made round
          title={message.expanded ? 'Collapse' : 'Expand'} // Add title
        >
          {message.expanded ? <ChevronsDownUp size={16} strokeWidth={2.5}/> : <ChevronsUpDown size={16} strokeWidth={2.5}/>} {/* Use icons */}
        </button>
        <button
          onClick={handleCopyAll}
          className="p-1.5 text-custom-blue-deep rounded-full hover:bg-custom-blue-lightest transition-colors" // Changed text color, removed opacity classes, adjusted padding, added hover effect
          title="Copy Q&A" // Add title for accessibility
        >
          {isCopied ? <ClipboardCheck size={16} strokeWidth={2.5} className="block" /> : <Clipboard size={16} strokeWidth={2.5} className="block" />} {/* Added strokeWidth */}
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

      setConversation(prev => [...prev, newMessage]);
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
        <div className="text-center py-4 text-custom-text-subtle text-sm">
          Loading response...
        </div>
      )}
      <div className="flex items-center gap-3 mt-4"> {/* Added items-center */}
        <input
          type="text"
          placeholder="Ask a question about this paper..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
          disabled={loading}
          className="flex-1 border border-custom-border rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-custom-blue" // Changed focus ring color
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className={`p-2 rounded-md transition-colors ${ // Removed background, size classes, adjusted padding
            loading
              ? 'text-custom-disabled cursor-not-allowed' // Use text color for disabled state
              : 'text-custom-blue-deep hover:bg-custom-blue-lightest' // Set text color, add subtle hover background
          }`}
          aria-label="Ask question" // Add aria-label for accessibility
        >
          <SendHorizontal size={20} strokeWidth={2.5} /> {/* Use SendHorizontal icon, adjusted size and strokeWidth for boldness */}
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

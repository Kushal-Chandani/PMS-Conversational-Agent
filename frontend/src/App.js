import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = true;
  recognition.lang = 'en-US';
  recognition.interimResults = true;
}

const speechSynthesis = window.speechSynthesis;

function App() {
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you with your booking today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatBoxRef = useRef(null);
  const speechTimeoutRef = useRef(null);

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-mode' : '';
  }, [theme]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const speak = (text) => {
    if (isMuted || !speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    speechSynthesis.speak(utterance);
  };

  const sendMessage = async (message) => {
    if (message.trim() === '') return;

    setMessages(prevMessages => [...prevMessages, { text: message, sender: 'user' }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [...messages, { text: message, sender: 'user' }] }),
      });
      const data = await response.json();
      setMessages(prevMessages => [...prevMessages, { text: data.response, sender: 'bot' }]);
      speak(data.response);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = 'Sorry, something went wrong.';
      setMessages(prevMessages => [...prevMessages, { text: errorMessage, sender: 'bot' }]);
      speak(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const handleListen = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }

    recognition.onresult = (event) => {
      if (isSpeaking) return;
      
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      setInput(finalTranscript + interimTranscript);

      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }

      speechTimeoutRef.current = setTimeout(() => {
        if (finalTranscript.trim() !== '') {
            sendMessage(finalTranscript);
        }
      }, 1000);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
        if (isListening) {
            recognition.start();
        }
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="agent-info">
          <img src="https://i.pravatar.cc/40" alt="Avatar" />
          <h2>Booking Assistant</h2>
        </div>
        <div className="settings-icon" onClick={() => setShowSettings(!showSettings)}>
          ⚙️
        </div>
        {showSettings && (
          <div className="settings-panel">
            <div className="theme-switcher">
              <span>Dark Mode</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={theme === 'dark'}
                  onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="theme-switcher">
              <span>Mute</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={isMuted}
                  onChange={() => setIsMuted(!isMuted)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        )}
      </div>
      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}-message`}>
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Type your message..."
        />
        {recognition && (
          <button onClick={handleListen}>
            {isListening ? '...' : '🎤'}
          </button>
        )}
        <button onClick={() => sendMessage(input)}>Send</button>
      </div>
    </div>
  );
}

export default App;

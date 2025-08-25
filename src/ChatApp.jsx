import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function formatTimestamp(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Listen for messages from other users (sabotaged)
    socket.on('message-received', (data) => {
      const newMessage = {
        text: data.text,
        originalText: data.originalText,
        sender: 'other',
        username: data.username,
        timestamp: new Date(data.timestamp),
        sabotaged: data.sabotaged
      };
      setMessages((msgs) => [...msgs, newMessage]);
    });

    // Listen for your own message confirmation
    socket.on('message-sent', (data) => {
      const newMessage = {
        text: data.text,
        sender: 'user',
        username: data.username,
        timestamp: new Date(data.timestamp),
        sabotaged: false
      };
      setMessages((msgs) => [...msgs, newMessage]);
    });

    // Listen for users joining/leaving
    socket.on('user-joined', (data) => {
      const systemMessage = {
        text: data.message,
        sender: 'system',
        timestamp: new Date(data.timestamp)
      };
      setMessages((msgs) => [...msgs, systemMessage]);
    });

    socket.on('user-left', (data) => {
      const systemMessage = {
        text: data.message,
        sender: 'system',
        timestamp: new Date(data.timestamp)
      };
      setMessages((msgs) => [...msgs, systemMessage]);
    });

    // Listen for users list updates
    socket.on('users-list', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off('message-received');
      socket.off('message-sent');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('users-list');
    };
  }, []);

  const joinChat = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.emit('join-chat', username);
      setIsJoined(true);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && isJoined) {
      socket.emit('send-message', {
        text: input,
        username: username
      });
      setInput('');
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isJoined) {
    return (
      <div className="join-container">
        <div className="join-form">
          <h2>Join Sabotage Chat</h2>
          <p>Your messages will be "autocorrected" with funny typos before reaching others! 😈</p>
          <form onSubmit={joinChat}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username..."
              maxLength={20}
            />
            <button type="submit">Join Chat</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-app">
      <div className="chat-header">
        <h3>Sabotage Chat - {username}</h3>
        <div className="online-users">
          Online: {onlineUsers.length} users
          <div className="users-list">
            {onlineUsers.map((user, idx) => (
              <span key={idx} className="user-tag">{user}</span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="chat-container">
        <div className="chat-window">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble ${
                msg.sender === 'user' ? 'user' : 
                msg.sender === 'system' ? 'system' : 'other'
              }`}
            >
              <div className="bubble-content">
                {msg.sender === 'other' && (
                  <div className="message-header">
                    <strong>{msg.username}</strong>
                    {msg.sabotaged && <span className="sabotage-tag">📱 autocorrected</span>}
                  </div>
                )}
                <span>{msg.text}</span>
                <div className="timestamp">{formatTimestamp(msg.timestamp)}</div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        
        <form className="input-area" onSubmit={sendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message... (it will be sabotaged for others! 😈)"
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default ChatApp;

import React, { useState } from 'react';
import axios from 'axios';

const Chat = ({ chatHistory, updateChatHistory }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    const newMessage = { user: 'user', text: input };
    setMessages([...messages, newMessage]);

    try {
      const token = localStorage.getItem('token');
      console.log(input)
      console.log(chatHistory)
      const response = await axios.post('http://localhost:5000/api/chat', 
        { 
          user_input: input, 
          history: chatHistory 
        }, 
        {
        headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      console.log(response.data);
      const botMessage = { user: 'bot', text: response.data.system_response };
      setMessages([...messages, newMessage, botMessage]);
      updateChatHistory(response.data.history);
    } catch (error) {
      console.error("There was an error with the chat!", error);
    }

    setInput('');
  };

  return (
    <div>
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={msg.user === 'user' ? 'user-message' : 'bot-message'}>
            {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
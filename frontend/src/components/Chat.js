import React, { useState } from 'react';
import axios from 'axios';
import { Box, TextField, Button, Typography } from '@mui/material';

const Chat = ({ chatHistory, updateChatHistory }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const newMessage = { user: 'user', text: input };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInput(''); // Clear the input field immediately
    setLoading(true);

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await axios.post('http://localhost:5000/api/chat', 
        { 
          user_input: input, 
          history: chatHistory 
        }, 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      console.log(response.data)
      const botMessage = { user: 'bot', text: response.data.system_response };
      setMessages(prevMessages => [...prevMessages, botMessage]);
      updateChatHistory(response.data.history);
    } catch (error) {
      console.error("There was an error with the chat!", error);
    }

    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h6" align="center" gutterBottom>
        Chat
      </Typography>
      <Box
        className="chat-window"
        sx={{
          maxHeight: 400,
          overflowY: 'auto',
          mb: 2,
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '10px',
          minHeight: '300px'
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: msg.user === 'user' ? 'flex-end' : 'flex-start',
              my: 1,
            }}
          >
            <Typography
              sx={{
                background: msg.user === 'user' ? '#DCF8C6' : '#E4E6EB',
                borderRadius: '10px',
                padding: '10px',
                maxWidth: '80%',
              }}
            >
              {msg.text}
            </Typography>
          </Box>
        ))}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              my: 1,
            }}
          >
            <Typography
              sx={{
                background: '#E4E6EB',
                borderRadius: '10px',
                padding: '10px',
                maxWidth: '80%',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <span className="dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </Typography>
          </Box>
        )}
      </Box>
      <TextField
        fullWidth
        variant="outlined"
        label="Type a message"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
        disabled={loading} // Disable the input field while loading
        sx={{ mb: 2 }}
      />
      <Button variant="contained" color="primary" onClick={sendMessage} disabled={loading}>
        Send
      </Button>
    </Box>
  );
};

export default Chat;
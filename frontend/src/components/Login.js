import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, Typography, Box, Modal, Alert } from '@mui/material';
import Register from './Register';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

const Login = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      setIsLoggedIn(true);
      history.push('/');
    }
  }, [history, setIsLoggedIn]);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/login', { email, password });
      localStorage.setItem('jwt_token', response.data.access_token);
      setMessage('Login successful!');
      setIsLoggedIn(true);
      history.push('/');
    } catch (error) {
      console.error('Error logging in', error);
      setMessage('Error logging in: ' + error.response.data.message);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Define modal styles
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  return (
    <Container maxWidth="sm">
      <Box mt={8} display="flex" flexDirection="column" alignItems="center">
        <Typography component="h1" variant="h5">Login</Typography>
        {message && <Alert severity="info">{message}</Alert>}
        <form onSubmit={handleLogin} style={{ width: '100%', marginTop: 1 }}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }}>
            Sign In
          </Button>
          <Button fullWidth variant="outlined" color="primary" onClick={handleOpen}>
            Register
          </Button>
        </form>
        <Modal open={open} onClose={handleClose}>
          <Box sx={modalStyle}>
            <Register onClose={handleClose} />
          </Box>
        </Modal>
      </Box>
    </Container>
  );
};

export default Login;

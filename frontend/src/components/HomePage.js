import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, Grid, Button, TextField, Alert, AppBar, Toolbar, IconButton, MenuItem, Select, FormControl, InputLabel, Modal, Autocomplete } from '@mui/material';
import { useHistory } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import ChatIcon from '@mui/icons-material/Chat';
import axios from 'axios';
import Chat from './Chat';

const HomePage = () => {
  const [name, setName] = useState('');
  const [checkingBalance, setCheckingBalance] = useState('');
  const [savingsBalance, setSavingsBalance] = useState('');
  const [showCheckingInput, setShowCheckingInput] = useState(false);
  const [showSavingsInput, setShowSavingsInput] = useState(false);
  const [checkingAmount, setCheckingAmount] = useState('');
  const [savingsAmount, setSavingsAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [recipient, setRecipient] = useState(null);
  const [recipientInputValue, setRecipientInputValue] = useState('');
  const [sourceAccountType, setSourceAccountType] = useState('checking');
  const [destinationAccountType, setDestinationAccountType] = useState('savings');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [openTransfer, setOpenTransfer] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const history = useHistory();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const userResponse = await axios.get('http://localhost:5000/api/user_info', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setName(userResponse.data.name);

        const balanceResponse = await axios.get('http://localhost:5000/api/account_balance', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCheckingBalance(balanceResponse.data.checking);
        setSavingsBalance(balanceResponse.data.savings);

        const usersResponse = await axios.get('http://localhost:5000/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setUsers(usersResponse.data);
        setFilteredUsers(usersResponse.data);
      } catch (error) {
        console.error('Error fetching user info or balances', error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleAddMoney = async (accountType) => {
    setErrorMessage('');
    try {
      const token = localStorage.getItem('jwt_token');
      const amount = accountType === 'checking' ? checkingAmount : savingsAmount;
      await axios.post('http://localhost:5000/api/add_money', {
        account_type: accountType,
        amount: parseFloat(amount)
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (accountType === 'checking') {
        setCheckingBalance(prevBalance => prevBalance + parseFloat(amount));
        setShowCheckingInput(false);
      } else {
        setSavingsBalance(prevBalance => prevBalance + parseFloat(amount));
        setShowSavingsInput(false);
      }
      setCheckingAmount('');
      setSavingsAmount('');
    } catch (error) {
      setErrorMessage('Error adding money: ' + error.message);
    }
  };

  const handleTransferMoney = async () => {
    setTransferMessage('');
    try {
      const token = localStorage.getItem('jwt_token');
      await axios.post('http://localhost:5000/api/transfer_money', {
        // recipient_name: recipient.name,
        recipient_email: recipient.name,
        source_account_type: sourceAccountType,
        destination_account_type: destinationAccountType,
        amount: parseFloat(transferAmount)
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTransferMessage('Transfer successful!');
      setRecipient(null);
      setRecipientInputValue('');
      setSourceAccountType('checking');
      setDestinationAccountType('savings');
      setTransferAmount('');
      setOpenTransfer(false);
      window.location.reload()
    } catch (error) {
      setTransferMessage('Error transferring money: ' + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    history.push('/login');
  };

  const handleOpenTransfer = () => setOpenTransfer(true);
  const handleCloseTransfer = () => setOpenTransfer(false);
  const handleOpenChat = () => setOpenChat(true);
  const handleCloseChat = () => setOpenChat(false);
  const updateChatHistory = (newHistory) => setChatHistory(newHistory);

  const handleRecipientChange = (event, value) => {
    setRecipient(value);
  };

  const handleInputChange = (event, value) => {
    setRecipientInputValue(value);
    setFilteredUsers(users.filter(user => 
      (user.name && user.name.toLowerCase().includes(value.toLowerCase())) || 
      (user.email && user.email.toLowerCase().includes(value.toLowerCase()))
    ));
  };

  return (
    <Container maxWidth="sm">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Banking App
          </Typography>
          <IconButton edge="end" color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box mt={4} display="flex" justifyContent="center" alignItems="center" flexDirection="column">
        <Typography component="h1" variant="h4">
          Hello, {name}
        </Typography>
        <Grid container spacing={4} mt={2}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" component="div">
                  Checking Account
                </Typography>
                <Typography variant="h4" component="div">
                  ${checkingBalance}
                </Typography>
                {showCheckingInput ? (
                  <Box mt={2} display="flex" flexDirection="column" alignItems="center">
                    <TextField
                      label="Amount"
                      variant="outlined"
                      value={checkingAmount}
                      onChange={(e) => setCheckingAmount(e.target.value)}
                      fullWidth
                      margin="normal"
                    />
                    {errorMessage ? (
                      <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{errorMessage}</Alert>
                    ) : (
                      <Button variant="contained" color="primary" onClick={() => handleAddMoney('checking')} sx={{ mt: 2 }}>
                        Add Money
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Button variant="outlined" color="primary" onClick={() => setShowCheckingInput(true)} sx={{ mt: 2 }}>
                    Add Money
                  </Button>
                )}
              </CardContent>
            </Card>
            <Box mt={2} display="flex" justifyContent="center">
              <IconButton color="primary" onClick={handleOpenTransfer}>
                <AddIcon fontSize="large" />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" component="div">
                  Savings Account
                </Typography>
                <Typography variant="h4" component="div">
                  ${savingsBalance}
                </Typography>
                {showSavingsInput ? (
                  <Box mt={2} display="flex" flexDirection="column" alignItems="center">
                    <TextField
                      label="Amount"
                      variant="outlined"
                      value={savingsAmount}
                      onChange={(e) => setSavingsAmount(e.target.value)}
                      fullWidth
                      margin="normal"
                    />
                    {errorMessage ? (
                      <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{errorMessage}</Alert>
                    ) : (
                      <Button variant="contained" color="primary" onClick={() => handleAddMoney('savings')} sx={{ mt: 2 }}>
                        Add Money
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Button variant="outlined" color="primary" onClick={() => setShowSavingsInput(true)} sx={{ mt: 2 }}>
                    Add Money
                  </Button>
                )}
              </CardContent>
            </Card>
            <Box mt={2} display="flex" justifyContent="center">
              <IconButton color="primary" onClick={handleOpenChat}>
                <ChatIcon fontSize="large" />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Modal open={openTransfer} onClose={handleCloseTransfer}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" align="center" gutterBottom>
            Make a Transfer
          </Typography>
          {transferMessage && <Alert severity={transferMessage.startsWith('Error') ? 'error' : 'success'}>{transferMessage}</Alert>}
          <Autocomplete
            options={filteredUsers}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Recipient" 
                variant="outlined" 
                fullWidth 
                margin="normal" 
              />
            )}
            onChange={handleRecipientChange}
            inputValue={recipientInputValue}
            onInputChange={handleInputChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Source Account Type</InputLabel>
            <Select
              value={sourceAccountType}
              onChange={(e) => setSourceAccountType(e.target.value)}
              label="Source Account Type"
            >
              <MenuItem value="checking">Checking</MenuItem>
              <MenuItem value="savings">Savings</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Destination Account Type</InputLabel>
            <Select
              value={destinationAccountType}
              onChange={(e) => setDestinationAccountType(e.target.value)}
              label="Destination Account Type"
            >
              <MenuItem value="checking">Checking</MenuItem>
              <MenuItem value="savings">Savings</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Amount"
            variant="outlined"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button variant="contained" color="primary" onClick={handleTransferMoney} sx={{ mt: 2 }}>
            Transfer Money
          </Button>
        </Box>
      </Modal>

      <Modal open={openChat} onClose={handleCloseChat}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          <Chat chatHistory={chatHistory} updateChatHistory={updateChatHistory} />
        </Box>
      </Modal>
    </Container>
  );
};

export default HomePage;

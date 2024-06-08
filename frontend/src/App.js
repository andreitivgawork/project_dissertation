import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import Chat from './Chat';
import './App.css';

const App = () => {
  const [balances, setBalances] = useState({ checking: 0.0, savings: 0.0 });
  const [message, setMessage] = useState('');
  const [accountType, setAccountType] = useState('');
  const [amount, setAmount] = useState(0);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sourceAccountType, setSourceAccountType] = useState('');
  const [destinationAccountType, setDestinationAccountType] = useState('');

  const [chatHistory, setChatHistory] = useState([]);

  const history = useHistory();

  useEffect(() => {
    fetchBalances();
  }, [accountType]);

  const fetchBalances = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/account_balance';
      if (accountType) {
        url += `?type=${accountType}`;
      }
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (accountType) {
        setBalances(prevBalances => ({
          ...prevBalances,
          [accountType]: response.data[accountType]
        }));
      } else {
        setBalances(response.data);
      }
    } catch (error) {
      console.error("There was an error fetching the account balances!", error);
      setMessage('Failed to fetch account balances.');
    }
  };

  const handleAddMoney = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/add_money', {
        amount,
        account_type: accountType
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessage(response.data.message);
      fetchBalances();
    } catch (error) {
      console.error("There was an error adding money!", error);
      setMessage('Failed to add money.');
    }
  };

  const handleTransferMoney = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/transfer_money', {
        recipient_email: recipientEmail,
        amount,
        source_account_type: sourceAccountType,
        destination_account_type: destinationAccountType
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessage(response.data.message);
      fetchBalances();
    } catch (error) {
      console.error("There was an error transferring money!", error);
      setMessage('Failed to transfer money.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  const updateChatHistory = (newHistory) => {
    setChatHistory(newHistory);
  };

  return (
    <div>
      {message && <p>{message}</p>}
      <button onClick={handleLogout}>Logout</button>
      <h2>Account Balances</h2>
      <div>
        <label>Account Type:</label>
        <select value={accountType} onChange={e => setAccountType(e.target.value)}>
          <option value="">All</option>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </select>
      </div>
      <p>Checking: ${balances.checking}</p>
      <p>Savings: ${balances.savings}</p>

      <h2>Add Money</h2>
      <div>
        <label>Amount:</label>
        <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} />
        <label>Account Type:</label>
        <select value={accountType} onChange={e => setAccountType(e.target.value)}>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </select>
        <button onClick={handleAddMoney}>Add Money</button>
      </div>

      <h2>Transfer Money</h2>
      <div>
        <label>Recipient Email:</label>
        <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} />
        <label>Amount:</label>
        <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} />
        <label>Source Account Type:</label>
        <select value={sourceAccountType} onChange={e => setSourceAccountType(e.target.value)}>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </select>
        <label>Destination Account Type:</label>
        <select value={destinationAccountType} onChange={e => setDestinationAccountType(e.target.value)}>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </select>
        <button onClick={handleTransferMoney}>Transfer Money</button>
      </div>
      <Chat chatHistory={chatHistory} updateChatHistory={updateChatHistory} />
    </div>
  );
};

export default App;

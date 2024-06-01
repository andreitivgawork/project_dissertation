import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
  const [info, setInfo] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/info')
      .then(response => {
        setInfo(response.data.message);
      })
      .catch(error => {
        console.error("There was an error fetching the data!", error);
      });

      fetchUsers();

  }, []);

  const fetchUsers = () => {
    axios.get('http://localhost:5000/api/users')
      .then(response => {
        setUsers(response.data);
      })
      .catch(error => {
        console.error("There was an error fetching the users!", error);
      });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    axios.post('http://localhost:5000/api/add_user', { name, email })
      .then(response => {
        setMessage(response.data.message);
        setName('');
        setEmail('');
      })
      .catch(error => {
        console.error("There was an error adding the user!", error);
      });
  };

  return (
<div>
      <h1>{info}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">Add User</button>
      </form>
      {message && <p>{message}</p>}
      <h2>User List</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name} ({user.email})</li>
        ))}
      </ul>
    </div>
  );
};

export default App;
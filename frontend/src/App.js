import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

const App = () => {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setUsers(response.data);
      } catch (error) {
        console.error("There was an error fetching the users!", error);
        setMessage('Failed to fetch users.');
      }
    };

    fetchUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  return (
    <div>
      {message && <p>{message}</p>}
      <button onClick={handleLogout}>Logout</button>
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

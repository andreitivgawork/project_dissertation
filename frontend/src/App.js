import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
  const [info, setInfo] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/info')
      .then(response => {
        setInfo(response.data.message);
      })
      .catch(error => {
        console.error("There was an error fetching the data!", error);
      });
  }, []);

  return (
    <div>
      <h1>{info} lalala</h1>
      <h1>{info} lalala</h1>
      <h1>{info} lalala</h1>
    </div>
  );
};

export default App;
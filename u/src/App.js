import React, { useState } from 'react';
import Web3 from 'web3';

function App() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const sendMessage = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const accounts = await web3.eth.getAccounts();
      const from = accounts[0];

      const messageToSign = JSON.stringify({ to, subject, content });
      const signature = await web3.eth.personal.sign(messageToSign, from, '');

      console.log('From:', from);
      console.log('Message to sign:', messageToSign);
      console.log('Signature:', signature);

      const response = await fetch('http://localhost:3001/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          content,
          signature
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Message sent successfully!');
        setTo('');
        setSubject('');
        setContent('');
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Detailed error:', error);
      alert('An error occurred: ' + error.message);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h1>Send Mailchain Message</h1>
      <input
        value={to}
        onChange={e => setTo(e.target.value)}
        placeholder="To Address (e.g., username@mailchain.com, 0x...@ethereum.mailchain.com)"
        style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
      />
      <input
        value={subject}
        onChange={e => setSubject(e.target.value)}
        placeholder="Subject"
        style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Content"
        style={{ width: '100%', marginBottom: '10px', padding: '5px', height: '100px' }}
      />
      <button onClick={sendMessage} style={{ width: '100%', padding: '10px' }}>Send Message</button>
    </div>
  );
}

export default App;

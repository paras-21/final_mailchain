require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Mailchain } = require('@mailchain/sdk');
const { resolveAddress } = require('@mailchain/sdk/internal');
const ethers = require('ethers');

const app = express();
app.use(cors());
app.use(express.json());

console.log('Ethers version:', ethers.version);

const mailchain = Mailchain.fromSecretRecoveryPhrase(process.env.MAILCHAIN_SECRET_RECOVERY_PHRASE);
console.log('Mailchain initialized:', !!mailchain);

app.post('/send-message', async (req, res) => {
  const { from, to, subject, content, signature } = req.body;

  try {
    console.log('Received request:', { from, to, subject, content, signature });

    // Recreate the message that was signed
    const message = JSON.stringify({ to, subject, content });
    
    // Recover the signer's address using ethers v6 API
    const signerAddress = ethers.verifyMessage(message, signature);

    console.log('Signer Address:', signerAddress);

    if (signerAddress.toLowerCase() !== from.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Resolve the 'to' address
    const { data: resolvedAddress, error: resolveError } = await resolveAddress(to);
    if (resolveError) {
      return res.status(400).json({ error: `Invalid recipient address: ${resolveError.message}` });
    }

    // Determine the correct 'from' address format
    let fromAddress = from;
    if (!from.includes('@')) {
      fromAddress = `${from}@ethereum.mailchain.com`;
    }

    // Send the message
    await mailchain.sendMail({
      from: fromAddress,
      to: [to],
      subject,
      content: { text: content, html: `<p>${content}</p>` },
    });

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

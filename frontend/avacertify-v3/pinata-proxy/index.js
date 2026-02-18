import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
    if (!origin || allowedOrigin === '*') return callback(null, true);

    // Allow Lovable preview URLs
    if (origin.endsWith('.lovable.app') || origin.includes('localhost')) {
      return callback(null, true);
    }

    if (origin === allowedOrigin) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['POST', 'OPTIONS']
}));
app.options('*', cors());

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

// Auth middleware — verify Privy JWT
async function verifyPrivyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const privyResponse = await fetch('https://auth.privy.io/api/v1/token/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'privy-app-id': process.env.PRIVY_APP_ID,
        'Authorization': `Bearer ${process.env.PRIVY_APP_SECRET}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!privyResponse.ok) return res.status(401).json({ error: 'Invalid token' });
    req.userId = (await privyResponse.json()).userId;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Auth verification failed' });
  }
}

// POST /api/pin-file — upload image to IPFS
app.post('/api/pin-file', limiter, verifyPrivyToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No valid file' });

  const form = new FormData();
  form.append('file', req.file.buffer, {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
  });

  try {
    const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_API_SECRET,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!pinataRes.ok) {
      const text = await pinataRes.text();
      console.error('Pinata error:', text);
      return res.status(500).json({ error: 'Upload failed' });
    }
    const { IpfsHash } = await pinataRes.json();
    res.json({ ipfsHash: IpfsHash });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/pin-json — upload metadata to IPFS
app.post('/api/pin-json', limiter, verifyPrivyToken, async (req, res) => {
  const { metadata } = req.body;
  if (!metadata || typeof metadata !== 'object')
    return res.status(400).json({ error: 'Invalid metadata' });

  try {
    const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_API_SECRET,
      },
      body: JSON.stringify({ pinataContent: metadata }),
    });

    if (!pinataRes.ok) return res.status(500).json({ error: 'Metadata upload failed' });
    const { IpfsHash } = await pinataRes.json();
    res.json({ ipfsHash: IpfsHash });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Metadata upload failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

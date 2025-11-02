
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { prisma } = require('./prisma');

const app = express();

// CORS
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = BodySchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash } });

    res.status(201).json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (err) {
    if (err.issues) {
      return res.status(400).json({ error: 'Invalid input', details: err.issues });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = BodySchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET missing' });

    const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    if (err.issues) {
      return res.status(400).json({ error: 'Invalid input', details: err.issues });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

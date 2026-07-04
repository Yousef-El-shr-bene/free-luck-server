require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

const app = express();
const port = 3000;

const { spotValidator } = require('./proses');
const Spot = require('./models/spotModel');

app.use(cors({
    origin: [
        'http://localhost:5173', // للسماح بالطلبات أثناء التطوير المحلي
        'https://free-luck.vercel.app' // للسماح بالطلبات من واجهة المستخدم المرفوعة
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true // مهم إذا كنت تستخدم Cookies أو Sessions
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

function setAdminToken() {
  return Buffer.from(`${Date.now()}:admin`).toString('base64');
}

function isAdmin(token) {
  return typeof token === 'string' && token.length > 0;
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.token || app.locals.token;
  if (!token || !isAdmin(token)) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
  next();
}

// app.use(express.static(path.join(__dirname, 'dist')));

app.get('/api/auth', (req, res) => {
  const enteredPassword = req.query.password;
  const configuredPassword = process.env.PASSWORD || process.env.password || 'admin123';

  if (enteredPassword === configuredPassword) {
    app.locals.token = setAdminToken();
    res.cookie('token', app.locals.token, { httpOnly: true, sameSite: 'lax', path: '/' });
    return res.json({ ok: true, message: 'Admin token set' });
  }

  return res.status(401).json({ ok: false, message: 'Unauthorized' });
});

app.get('/api/auth/status', (req, res) => {
  const token = req.cookies?.token || app.locals.token;
  return res.json({ ok: Boolean(token && isAdmin(token)) });
});

app.get('/api/spot', async (req, res) => {
  const spotData = await Spot.find().sort({ isMain: -1, amount: -1, createdAt: -1 });
  res.json(spotData);
});

app.post('/api/spin', async (req, res) => {
  const allSpots = await Spot.find().sort({ isMain: -1, amount: -1, createdAt: -1 });
  console.log(allSpots,"All Spots");
  
  const eligibleSpots = allSpots.filter((spot) => Number(spot.amount) > 0 && Number(spot.isMain) > 0);

  if (!eligibleSpots.length) {
    return res.status(404).json({ message: 'No eligible spots' });
  }

  const winner = eligibleSpots[Math.floor(Math.random() * eligibleSpots.length)];
  const updatedWinner = await Spot.findByIdAndUpdate(
    winner._id,
    { $inc: { amount: -1 } },
    { new: true }
  );

  return res.json({ spot: updatedWinner || winner, message: 'Congratulations! You won a prize.' });
});

app.post('/api/spot', requireAdmin, async (req, res) => {
  console.log(req.body);
  
  const payload = {
    ...req.body,
    name: typeof req.body?.name === 'string' ? req.body.name.trim() : '',
    value: typeof req.body?.value === 'string' ? req.body.value.trim() : '',
    description: typeof req.body?.description === 'string' ? req.body.description.trim() : '',
    amount: Number(req.body?.amount ?? 0),
    isMain: Boolean(req.body?.isMain),
  };

  if (!spotValidator(payload)) {
    console.log(!spotValidator(payload));
    
    return res.status(400).json({ ok: false, message: 'Invalid spot data' });
  }

  const newSpot = new Spot(payload);
  await newSpot.save();
  console.log(newSpot);
  
  return res.json(newSpot);
});

app.put('/api/spot/:id', requireAdmin, async (req, res) => {
  console.log(req.body);
  req.body = req.body || {};
  const payload = {
    ...req.body,
    name: typeof req.body?.name === 'string' ? req.body.name.trim() : '',
    value: typeof req.body?.value === 'string' ? req.body.value.trim() : '',
    description: typeof req.body?.description === 'string' ? req.body.description.trim() : '',
    amount: Number(req.body?.amount ?? 0),
    isMain: Boolean(req.body?.isMain),
  };

  if (!spotValidator(payload)) {
    return res.status(400).json({ ok: false, message: 'Invalid spot data' });
  }

  req.query = req.query || {};
  const updatedSpot = await Spot.findByIdAndUpdate(req.params.id, payload, { new: true });
  return res.json(updatedSpot);
});

app.delete('/api/spot/:id', requireAdmin, async (req, res) => {
  const deletedSpot = await Spot.findByIdAndDelete(req.params.id);
  if (!deletedSpot) {
    return res.status(404).json({ ok: false, message: 'Spot not found' });
  }
  return res.json(deletedSpot);
});


app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

//weall spots



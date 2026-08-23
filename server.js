const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Atlas Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://crickmaxoffical_db_user:xureUmFWpTEtHzKV@cluster0.unceciv.mongodb.net/win2earn?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('Database Connection Error:', err));

// User Schema & Model
const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  walletBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Basic Health Check Route
app.get('/', (req, res) => {
  res.send('Win2Earn Backend Server Running Live!');
});

// User Registration API Route
app.post('/api/register', async (req, res) => {
  try {
    const { phone, password } = req.body;
    let user = await User.findOne({ phone });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ phone, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

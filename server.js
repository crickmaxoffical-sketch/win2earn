const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Frontend index.html serve karne ke liye
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error:', err));

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date }
});

const User = mongoose.model('User', UserSchema);

// Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Register & Send OTP API
app.post('/api/register', async (req, res) => {
  const { email, phone, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(400).json({ message: 'Email pehle se registered hai!' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (!user) {
      user = new User({ email, phone, password, otp, otpExpires });
    } else {
      user.phone = phone;
      user.password = password;
      user.otp = otp;
      user.otpExpires = otpExpires;
    }

    await user.save();

    const mailOptions = {
      from: `"Win2Earn Support" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Win2Earn Account OTP Code',
      text: `Aapka OTP code hai: ${otp}. Ye code 10 minute tak valid hai.`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP aapke email par bhej diya gaya hai!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, OTP nahi bheja gaya.' });
  }
});

// Verify OTP API
app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User nahi mila!' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Galat ya expired OTP!' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified! Ab aap login kar sakte hain.' });

  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

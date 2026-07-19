require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const chatRoute = require('./routes/chat');
const voiceRoute = require('./routes/voice');
const schemesRoute = require('./routes/schemes');
const reportRoute = require('./routes/report');

const app = express();
connectDB();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use('/api/chat', chatRoute);
app.use('/api/voice', voiceRoute);
app.use('/api/schemes', schemesRoute);
app.use('/api/report', reportRoute);

app.get('/', (req, res) => res.send('Yojana Mitra API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
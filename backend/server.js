const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./config/db');

dotenv.config();

initDB();

const app = express();

app.use(cors());
app.use(express.json());
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const userRoutes = require('./routes/userRoutes.js');
const questionRoutes = require('./routes/questionRoutes.js');
const staffRoutes = require('./routes/staffRoutes.js');
const subjectRoutes = require('./routes/subjectRoutes.js');
const feedbackFormRoutes = require('./routes/feedbackFormRoutes.js');

app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/feedback-forms', feedbackFormRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));

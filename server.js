// server.js

const express = require('express');
const dotenv = require('dotenv');
const emailRoutes = require('./routes/emailRoutes');
const userRoutes = require('./routes/userRoutes');
const aboRoutes = require('./routes/aboRoutes'); // Importez le routeur des abonnements
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User'); // Importez le modèle User

dotenv.config();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: 'http://localhost:5173' // Autoriser uniquement les requêtes de ce domaine
}));
app.use(express.static('public'));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/email', emailRoutes);
app.use('/api/users', userRoutes);
app.use('/abonnement', aboRoutes); // Utilisez les routes des abonnements

app.get('/', (req, res) => {
  res.send('The Backend of my Invoice App');
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch(err => console.error('Failed to connect to MongoDB', err));

mongoose.set('debug', true);

async function fetchUsers() {
  try {
    const users = await User.find({});
    console.log("All users:", users);
  } catch (err) {
    console.error("Error fetching users:", err);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

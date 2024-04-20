const express = require("express");
const dotenv = require("dotenv");
const emailRoutes = require("./routes/emailRoutes");
const paiementRoutes = require('./routes/paiementRoutes');
const userRoutes = require('./routes/userRoutes');
const mongoose = require('mongoose'); // Importez mongoose
const cors = require('cors');
const User = require('./models/User'); // Assurez-vous que le chemin vers User est correct

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Routes
app.use("/email", emailRoutes);
app.use("/paiement", paiementRoutes);
app.use('/api/users', userRoutes);

app.get("/", (req, res) => {
  res.send("The Backend of my Invoice App");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    // Utilisez async/await pour récupérer les utilisateurs
    fetchUsers();
  })
  .catch(err => console.error("Failed to connect to MongoDB", err));

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

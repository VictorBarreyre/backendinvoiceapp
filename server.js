const express = require("express");
const dotenv = require("dotenv");
const emailRoutes = require("./routes/emailRoutes");
const paiementRoutes = require('./routes/paiementRoutes');
const mongoose = require('mongoose'); // Importez mongoose
const cors = require('cors');

dotenv.config();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: 'http://localhost:5173'  // Autoriser uniquement les requêtes de ce domaine
}));
app.use(express.static('public'));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



// Routes
app.use("/email", emailRoutes);
app.use("/paiement", paiementRoutes);

app.get("/", (req, res) => {
  res.send("The Backend of my Invoice App");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
  
  })
  .catch(err => console.error("Failed to connect to MongoDB", err));

mongoose.set('debug', true);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

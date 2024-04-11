const express = require("express");
const dotenv = require("dotenv");
const emailRoutes = require("./routes/emailRoutes");
const paiementRoutes = require('./routes/paiementRoutes');
const mongoose = require('mongoose'); // Importez mongoose
const cors = require('cors')

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('public'));


// Routes
app.use("/email", emailRoutes);
app.use("/paiement", paiementRoutes);


app.get("/", (req, res) => {
  res.send("The Backend of my Invoice App");
});

// Utilisez mongoose pour connecter à MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("Connected to MongoDB successfully"))
.catch(err => console.error("Failed to connect to MongoDB", err));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

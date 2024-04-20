const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // 'Bearer TOKEN_HERE'
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = decoded; // Ajouter les données décodées à l'objet request pour un usage ultérieur
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Authentication failed'
    });
  }
};

module.exports = authenticate;

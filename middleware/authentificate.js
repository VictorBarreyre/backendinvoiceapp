const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  // Récupération du header d'autorisation
  const authHeader = req.headers.authorization;

  // Vérifiez si l'en-tête d'autorisation est présent
  if (!authHeader) {
    return res.status(401).json({ message: 'Auth token is missing' });
  }

  // Essayez de récupérer le token après le mot-clé "Bearer"
  const tokenParts = authHeader.split(' ');

  // Vérifiez si le token suit le format correct "Bearer [token]"
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Bearer token is missing or malformed' });
  }

  const token = tokenParts[1];

  try {
    // Vérifiez la validité du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Ajoutez les données décodées à l'objet de requête pour une utilisation ultérieure dans les routes protégées
    req.userData = decoded;
    next();
  } catch (error) {
    // Gestion différenciée des erreurs de validation du token
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token has expired' });
    } else {
      return res.status(401).json({ message: 'Authentication failed', error: error.message });
    }
  }
};

module.exports = authenticate;

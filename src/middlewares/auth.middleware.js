const jwt = require('jsonwebtoken');

function ensureAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'unauthorized' });
  const token = auth.split(' ')[1];
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = { ensureAuth };

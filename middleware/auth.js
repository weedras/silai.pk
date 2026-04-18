const requireUserSession = (req, res, next) => {
  if (req.session?.user) return next();
  res.status(401).json({ error: 'User authentication required.' });
};

const requireAdminSession = (req, res, next) => {
  if (req.session?.user?.role === 'admin') return next();
  res.status(403).json({ error: 'Admin access denied.' });
};

module.exports = {
  requireUserSession,
  requireAdminSession
};

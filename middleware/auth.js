exports.requireAuth = (req, res, next) => req.session.user ? next() : res.status(401).json({ message: 'Please sign in first.' });
exports.requireAdmin = (req, res, next) => req.session.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Admin access required.' });

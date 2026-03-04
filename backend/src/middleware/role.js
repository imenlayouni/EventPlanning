module.exports = (role) => {
  return (req, res, next) => {
    if (!req.user || !req.user.hasRole(role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

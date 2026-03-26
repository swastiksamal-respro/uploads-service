//middleware/auth.js
module.exports = (req, res, next) => {
  // DEV MODE → skip auth
  if (process.env.NODE_ENV !== "production") {
    req.user = {
      id: 1,
      app_id: req.headers["x-app-id"] || "dev-app",
      role: "developer"
    };
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  // Minimal production-safe placeholder (JWT validation later)
  // Expected format in future: "Bearer <token>"
  req.user = {
    id: null,
    app_id: req.headers["x-app-id"] || null,
    role: "user"
  };

  return next();
};

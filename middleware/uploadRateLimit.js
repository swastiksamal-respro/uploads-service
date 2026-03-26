const rateLimit = require("express-rate-limit");

console.log("🔥 uploadRateLimit loaded");

// CREATE LIMITER ONCE (outside request)
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,              // test with 1

  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    console.log("🔥 RATE LIMIT BLOCKED");
    res.status(429).json({
      message: "Too many uploads from this IP. Try again later."
    });
  }
});

module.exports = uploadLimiter;

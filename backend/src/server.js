import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Import rate limiters
import { 
  apiLimiter, 
  authLimiter, 
  passwordResetLimiter,
  verificationLimiter,
  createCustomLimiter 
} from "./middleware/rateLimit.middleware.js";

import { authRouter } from "./routes/auth.routes.js";
import { studentsRouter } from "./routes/students.routes.js";
import { laptopsRouter } from "./routes/laptops.routes.js";
import { verificationRouter } from "./routes/verification.routes.js";
import { alertsRouter } from "./routes/alerts.routes.js";
import { logsRouter } from "./routes/logs.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { auditRouter } from "./routes/audit.routes.js";
import { settingsRouter } from "./routes/settings.routes.js";

dotenv.config({ override: true });

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// Health check endpoint (no rate limiting)
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Apply rate limiting to all API routes
app.use("/api/", apiLimiter);

// Apply stricter rate limiting to specific routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/change-password", authLimiter);
app.use("/api/auth/bootstrap-admin", authLimiter);

// Password reset endpoints
app.use("/api/auth/reset-password", passwordResetLimiter);

// Verification endpoints (security staff might scan many IDs)
app.use("/api/verification", verificationLimiter);

// Create custom limiters for specific endpoints if needed
const studentCreationLimiter = createCustomLimiter(
  60 * 60 * 1000, // 1 hour
  50, // 50 student creations per hour
  "Too many student creation attempts, please try again later"
);
app.use("/api/students", studentCreationLimiter);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/students", studentsRouter);
app.use("/api", laptopsRouter);
app.use("/api/verification", verificationRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/logs", logsRouter);
app.use("/api/users", usersRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/audit", auditRouter);
app.use("/api/settings", settingsRouter);

// Error handling middleware for validation errors
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 400,
      message: 'Validation Error',
      errors: err.errors
    });
  }
  
  // Handle rate limit errors
  if (err.name === 'RateLimitError') {
    return res.status(429).json({
      status: 429,
      message: 'Too many requests, please try again later'
    });
  }
  
  next(err);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

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

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

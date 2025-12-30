import express from "express";
import cors from "cors";
import authRoutes from "../server/routes/auth";
import repositoryRoutes from "../server/routes/repositories";
import aiRoutes from "../server/routes/ai";
import integrationRoutes from "../server/routes/integrations";
import usersRoutes from "../server/routes/users";

// Vercel provides env vars; dotenv is only for local development.
if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("dotenv").config();
  } catch {
    // dotenv is optional in environments where it's not installed
  }
}

const app = express();

const corsOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "https://gitverse-1tl3z6dxh-nisshchayas-projects.vercel.app",
  "https://gitverse-two.vercel.app",
];

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "GitVerse API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/repositories", repositoryRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/users", usersRoutes);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

export default app;

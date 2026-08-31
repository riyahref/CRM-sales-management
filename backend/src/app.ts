import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import leadRoutes from "./routes/lead.routes";
import userRoutes from "./routes/user.routes";
import opportunityRoutes from "./routes/opportunity.routes";
import customerRoutes from "./routes/customer.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

// CORS configuration for production deployment and local development
const defaultOrigins = [
  "https://crm-sales-management.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173"
];

const customOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim().replace(/\/$/, ""))
  : [];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...customOrigins]));

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or non-browser health checks without origin header
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed === origin) return true;
      // Match Vercel deployment preview URLs matching crm-sales-management*.vercel.app
      if (origin.endsWith(".vercel.app") && origin.includes("crm-sales-management")) {
        return true;
      }
      return false;
    });

    if (isAllowed) {
      return callback(null, true);
    }

    // Pass false instead of Error to prevent Express 500 Internal Server Error crash
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Enable preflight OPTIONS handling for all routes
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json());

// Public health check endpoint for hosting platform probes
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/opportunities", opportunityRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.use(errorHandler);

export default app;

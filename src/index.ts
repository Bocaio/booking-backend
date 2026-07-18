import express from "express";
import cors from "cors";
import database from "./config/database.js";
import cookieParser from "cookie-parser";
import errorMiddleWare from "./middlewares/error.js";
import redisClient from "./config/redis.js";
import { authRouter } from "./routes/auth.js";
import { CONFIGS } from "./config/index.js";
import { bookingRouter } from "./routes/booking.js";
import authMiddleware from "./middlewares/auth.js";
import { userRouter } from "./routes/user.js";
import { roleRouter } from "./routes/role.js";
import { summaryRouter } from "./routes/summary.js";

const app = express();
const port = CONFIGS.PORT;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/booking", authMiddleware, bookingRouter);
app.use("/user", authMiddleware, userRouter);
app.use("/role", authMiddleware, roleRouter);
app.use("/summary", authMiddleware, summaryRouter);

app.use(errorMiddleWare);

async function main() {
  await redisClient.connect();
  console.log("server connection to Redis");

  const server = app.listen(port);

  server.on("listening", () => {
    console.log(`app listening on port ${port}`);
  });

  server.on("error", (err) => {
    if (err.name === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use — another server is running.`,
      );
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });

  process.on("SIGINT", async () => {
    console.log("Shutting down gracefully...");

    try {
      await database.destroy();
      if (redisClient.isOpen) {
        await redisClient.close();
      }
      server.close(() => {
        console.log("Server closed.");
        console.log("Redis closed");
        process.exit(0);
      });
    } catch (err) {
      console.error("Shutdown error:", err);
      process.exit(1);
    }
  });
}

main().catch((err) => {
  console.log("Server failed to start", err);
  process.exit(1);
});

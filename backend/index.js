import express from "express";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config({
  path: "./.env",
});

import { connectToSocket } from "./src/controllers/socketManager.js";
import userRoutes from "./src/routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);


app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

app.get("/", (req, res) => {
  return res.send("hemlo domstom kaimse homm!!");
});

app.get('/api/check-token', (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];
  // Check if the token exists in the database
  User.findOne({ token: token }, (err, user) => {
      if (err || !user) {
          return res.status(401).json({ valid: false });
      }
      res.json({ valid: true });
  });
});

const start = async () => {
  try {                                          
    const connectionDb = await mongoose.connect("mongodb+srv://adityaMishra:adityaMishra@cluster0.9bkny.mongodb.net/");
    console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);

    server.listen(process.env.PORT || 8001, () => {
      console.log("Server is listening on port 8000");
    });
  } catch (error) {
    console.log("MONGODB connection failed: ", error);
  }
};

start();

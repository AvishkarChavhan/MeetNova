import express from "express";
import { createServer } from "node:http";
import dotenv from 'dotenv';
dotenv.config();
import mongoose from "mongoose";
import cors from "cors";
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

const app    = express();
const server = createServer(app);
const io     = connectToSocket(server);

app.set("port", (process.env.PORT || 8000));

// ── CORS: allow localhost in dev, Vercel URL in production ──
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://meet-nova-c7p0ajerp-avishkarchavhans-projects.vercel.app",
        /\.vercel\.app$/
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

const start = async () => {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Database connected...");
    server.listen(app.get("port"), () => {
        console.log(`Server listening on port ${app.get("port")}`);
    });
};

start();
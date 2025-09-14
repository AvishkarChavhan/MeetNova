import express from "express";
import {createServer} from "node:http";
import dotenv from 'dotenv';
dotenv.config();
import {Server} from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import {connectToSocket} from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js"
const app=express();
const server=createServer(app);
const io=connectToSocket(server);
app.set("port",(process.env.PORT || 8000));
app.use(cors());
app.use(express.json());
const dbURL = process.env.MONGO_URL;

app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb",extended:true}));
app.use("/api/v1/users",userRoutes);


const start=async ()=>{
    await mongoose.connect(dbURL);
    console.log("Database connected...");
    server.listen(app.get("port"),()=>{
        console.log("server listening on port 8000");

    });


}
start();
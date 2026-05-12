import { Server } from "socket.io";

let connections = {};   // roomPath → [socketId, ...]
let messages    = {};   // roomPath → [{sender, data, socket-id-sender}]
let timeOnline  = {};   // socketId → Date
let roomAdmin   = {};   // roomPath → socketId of admin (first joiner)

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {

        // ── User joins a room ──────────────────────────────────────────────────
        socket.on("join-call", (path) => {
            if (!connections[path]) connections[path] = [];

            // First person to join becomes the admin
            const isFirstJoiner = connections[path].length === 0;
            if (isFirstJoiner) {
                roomAdmin[path] = socket.id;
                // Tell them they are the host
                io.to(socket.id).emit('is-admin');
            }

            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            // Tell everyone (including new joiner) about the updated room list
            connections[path].forEach(socketId => {
                io.to(socketId).emit("user-joined", socket.id, connections[path]);
            });

            // Replay past messages to the new joiner
            if (messages[path]) {
                messages[path].forEach(msg => {
                    io.to(socket.id).emit(
                        "chat-message", msg.data, msg.sender, msg["socket-id-sender"]
                    );
                });
            }
        });

        // ── Broadcast display name to everyone else in the room ───────────────
        socket.on("user-name", (name) => {
            for (const [, socketIds] of Object.entries(connections)) {
                if (socketIds.includes(socket.id)) {
                    socketIds.forEach(id => {
                        if (id !== socket.id) io.to(id).emit("user-name", socket.id, name);
                    });
                    break;
                }
            }
        });

        // ── WebRTC signalling ─────────────────────────────────────────────────
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        // ── Chat message ──────────────────────────────────────────────────────
        socket.on("chat-message", (data, sender) => {
            let matchingRoom = null;
            for (const [roomKey, roomValue] of Object.entries(connections)) {
                if (roomValue.includes(socket.id)) { matchingRoom = roomKey; break; }
            }
            if (matchingRoom) {
                if (!messages[matchingRoom]) messages[matchingRoom] = [];
                messages[matchingRoom].push({ sender, data, "socket-id-sender": socket.id });
                connections[matchingRoom].forEach(id => {
                    io.to(id).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        // ── Admin explicitly ends the meeting ─────────────────────────────────
        // Frontend emits 'end-meeting' when the host clicks End Call.
        // We notify ALL users (including the admin themselves) so every tab
        // gets redirected to /home cleanly.
        socket.on("end-meeting", () => {
            for (const [key, socketIds] of Object.entries(connections)) {
                if (roomAdmin[key] === socket.id) {
                    // Notify every user in the room including the admin
                    socketIds.forEach(id => {
                        io.to(id).emit("meeting-ended");
                    });
                    // Clean up room data
                    delete connections[key];
                    delete messages[key];
                    delete roomAdmin[key];
                    break;
                }
            }
        });

        // ── User disconnects (tab closed / network drop) ──────────────────────
        socket.on("disconnect", () => {
            delete timeOnline[socket.id];

            for (const [key, socketIds] of Object.entries(connections)) {
                if (!socketIds.includes(socket.id)) continue;

                // If admin disconnects without clicking End Call, still end for everyone
                if (roomAdmin[key] === socket.id) {
                    socketIds.forEach(id => {
                        if (id !== socket.id) io.to(id).emit("meeting-ended");
                    });
                    delete connections[key];
                    delete messages[key];
                    delete roomAdmin[key];
                } else {
                    // Non-admin left — notify others, remove from room
                    socketIds.forEach(id => io.to(id).emit("user-left", socket.id));
                    connections[key] = socketIds.filter(id => id !== socket.id);
                    if (connections[key].length === 0) {
                        delete connections[key];
                        delete messages[key];
                        delete roomAdmin[key];
                    }
                }
                break;
            }
        });
    });

    return io;
};
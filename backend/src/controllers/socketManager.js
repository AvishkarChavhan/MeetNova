import { Server } from "socket.io";

// These objects store connections, messages, and online time by socket ID or room path
let connections = {};
let messages = {};
let timeOnline = {};

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

        // ✅ Handle when a user joins a call room
        socket.on("join-call", (path) => {
            // ✅ Initialize the connections array if undefined
            if (!connections[path]) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            // ✅ Send all previous messages in the room to the newly joined socket
            if (messages[path]) {
                messages[path].forEach(msg => {
                    io.to(socket.id).emit(
                        "chat-message",
                        msg.data,
                        msg.sender,
                        msg["socket-id-sender"]
                    );
                });
            }
        });

        // ✅ Handle signaling messages for peer connections
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        // ✅ Handle incoming chat messages
        socket.on("chat-message", (data, sender) => {
            // ✅ Find the room the socket belongs to
            const [matchingRoom, found] = Object.entries(connections).reduce(([room, isFound], [roomKey, roomValue]) => {
                if (!isFound && roomValue.includes(socket.id)) {
                    return [roomKey, true];
                }
                return [room, isFound];
            }, ['', false]);

            if (found) {
                // ✅ Initialize messages array if it doesn't exist
                if (!messages[matchingRoom]) {
                    messages[matchingRoom] = [];
                }

                // ✅ Store the incoming message
                messages[matchingRoom].push({
                    sender: sender,
                    data: data,
                    "socket-id-sender": socket.id
                });

                console.log("message", data, ";", sender);

                // ✅ Broadcast the message to everyone in the room
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        // ✅ Handle when a socket disconnects
        socket.on("disconnect", () => {
            const diffTime = Math.abs(timeOnline[socket.id] - new Date());
            let key;

            // ✅ Iterate over connections to find which room the socket belonged to
            for (const [k, v] of Object.entries(connections)) {
                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k;
                        // ✅ Notify all other users in the room that this user left
                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id);
                        }
                        // ✅ Remove the socket from the room
                        const index = connections[key].indexOf(socket.id);
                        if (index !== -1) {
                            connections[key].splice(index, 1);
                        }
                        // ✅ If the room is empty, delete it
                        if (connections[key].length === 0) {
                            delete connections[key];
                        }
                    }
                }
            }
        });
    });

    return io;
};

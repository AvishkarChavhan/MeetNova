import axios from "axios";
import httpStatus from "http-status";
import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

const BACKEND_URL = "https://meetnova-mtfo.onrender.com";

const client = axios.create({
    baseURL: `${BACKEND_URL}/api/v1/users`
});

export const AuthProvider = ({ children }) => {

    const [userData, setUserData] = useState(() => {
        const username = sessionStorage.getItem("username");
        const name     = sessionStorage.getItem("name");
        return username ? { username, name: name || username } : {};
    });
    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            });
            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    };

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });

            if (request.status === httpStatus.OK) {
                sessionStorage.setItem("token",    request.data.token);
                sessionStorage.setItem("username", request.data.username);
                sessionStorage.setItem("name",     request.data.name || request.data.username);
                setUserData({
                    username: request.data.username,
                    name:     request.data.name || request.data.username
                });
                router("/home");
            }
        } catch (err) {
            throw err;
        }
    };

    const addToUserHistory = async (meetingCode) => {
        // ─── FIX 2 ──────────────────────────────────────────────────────────
        // Original stored history in localStorage (shared across tabs — wrong),
        // and never sent it to the server, so history.jsx's getHistoryOfUser()
        // (which calls the API) would always get nothing back.
        //
        // Fix: send the meeting code to the backend so it's persisted properly
        // per user. We pass the token from sessionStorage (per-tab) in the
        // Authorization header so the server knows which user this belongs to.
        // ─────────────────────────────────────────────────────────────────────
        try {
            const token = sessionStorage.getItem("token");
            await client.post(
                "/add_to_activity",
                { meeting_code: meetingCode },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error("Failed to save meeting to history:", err);
            // Non-fatal: don't block the user from joining the call
        }
    };

    const getHistoryOfUser = async () => {
        // ─── FIX 3 ──────────────────────────────────────────────────────────
        // This function was missing from the original AuthContext entirely,
        // which is why History.jsx always showed nothing — it called
        // getHistoryOfUser() but the function was undefined in the context.
        //
        // Fix: fetch the meeting history from the backend using the per-tab
        // sessionStorage token.
        // ─────────────────────────────────────────────────────────────────────
        try {
            const token = sessionStorage.getItem("token");
            const request = await client.get("/get_all_activity", {
                headers: { Authorization: `Bearer ${token}` }
            });
            return request.data;
        } catch (err) {
            console.error("Failed to fetch history:", err);
            throw err;
        }
    };

    const data = {
        userData,
        setUserData,
        handleRegister,
        handleLogin,
        addToUserHistory,
        getHistoryOfUser   // ← was missing before, History.jsx needs this
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};
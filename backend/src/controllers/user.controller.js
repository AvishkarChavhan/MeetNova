import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

// ─── Helper: extract token from Authorization header ─────────────────────────
// AuthContext now sends:  Authorization: "Bearer <token>"
// This helper reads it consistently across all protected routes.
// ─────────────────────────────────────────────────────────────────────────────
const getTokenFromHeader = (req) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return null;
    // Header format: "Bearer <token>"
    const parts = authHeader.split(" ");
    return parts.length === 2 ? parts[1] : null;
};

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide username and password" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password" });
        }

        const token = crypto.randomBytes(20).toString("hex");
        user.token = token;
        await user.save();

        return res.status(httpStatus.OK).json({
            token,
            username: user.username,
            name: user.name
        });

    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e}` });
    }
};

const register = async (req, res) => {
    const { name, username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.FOUND).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, username, password: hashedPassword });
        await newUser.save();

        return res.status(httpStatus.CREATED).json({ message: "User registered successfully" });

    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e}` });
    }
};

const getUserHistory = async (req, res) => {
    // ─── FIX ──────────────────────────────────────────────────────────────
    // Was: const { token } = req.query  (read from URL query string)
    // AuthContext now sends the token in the Authorization header, not the
    // query string. Reading from query string would give undefined, causing
    // User.findOne({ token: undefined }) to fail silently or return wrong data.
    // ─────────────────────────────────────────────────────────────────────
    const token = getTokenFromHeader(req);

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "No token provided" });
    }

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const meetings = await Meeting.find({ user_id: user.username });
        return res.status(httpStatus.OK).json(meetings);

    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e}` });
    }
};

const addToHistory = async (req, res) => {
    // ─── FIX ──────────────────────────────────────────────────────────────
    // Was: const { token, meeting_code } = req.body
    // Token was expected in the request body, but AuthContext now sends it
    // in the Authorization header. The meeting_code still comes from req.body.
    // ─────────────────────────────────────────────────────────────────────
    const token = getTokenFromHeader(req);
    const { meeting_code } = req.body;

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "No token provided" });
    }
    if (!meeting_code) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting code is required" });
    }

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });
        await newMeeting.save();

        return res.status(httpStatus.CREATED).json({ message: "Added to history" });

    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e}` });
    }
};

export { login, register, getUserHistory, addToHistory };
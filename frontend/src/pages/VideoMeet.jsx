import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import styles from "../styles/vedioComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';

const server_url = "http://localhost:8000";

// Peer connections live outside component to avoid re-creation on re-render
var connections = {};

const peerConfigConnections = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export default function VideoMeetComponent() {

    const socketRef    = useRef();
    const socketIdRef  = useRef();
    const localVideoref = useRef();
    const messagesEndRef = useRef();

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video,          setVideo]          = useState(true);
    const [audio,          setAudio]          = useState(true);
    const [screen,         setScreen]         = useState();
    const [showModal,      setModal]          = useState(false);
    const [screenAvailable,setScreenAvailable]= useState(false);
    const [messages,       setMessages]       = useState([]);
    const [message,        setMessage]        = useState("");
    const [newMessages,    setNewMessages]    = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username,       setUsername]       = useState("");
    const [videos,         setVideos]         = useState([]);
    const [userNames,      setUserNames]      = useState({});  // socketId → name
    const [isAdmin,        setIsAdmin]        = useState(false); // true = room creator

    // ── On mount: get camera/mic permission and show lobby preview ────────────
    useEffect(() => {
        getPermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Re-acquire media when video/audio toggle changes ──────────────────────
    useEffect(() => {
        if (video !== undefined && audio !== undefined && !askForUsername) {
            getUserMedia();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [video, audio]);

    // ── Auto-scroll chat to bottom on new message ─────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Screen share toggle ───────────────────────────────────────────────────
    useEffect(() => {
        if (screen !== undefined) getDislayMedia();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    // ─────────────────────────────────────────────────────────────────────────
    // MEDIA HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    const getPermissions = async () => {
        try {
            const vp = await navigator.mediaDevices.getUserMedia({ video: true });
            setVideoAvailable(!!vp);
            vp?.getTracks().forEach(t => t.stop());

            const ap = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioAvailable(!!ap);
            ap?.getTracks().forEach(t => t.stop());

            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

            // Lobby preview stream
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            window.localStream = stream;
            if (localVideoref.current) localVideoref.current.srcObject = stream;
        } catch (e) { console.log(e); }
    };

    const silence = () => {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const dst = osc.connect(ctx.createMediaStreamDestination());
        osc.start(); ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    };

    const black = ({ width = 640, height = 480 } = {}) => {
        const canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        return Object.assign(canvas.captureStream().getVideoTracks()[0], { enabled: false });
    };

    const replaceTracksAndOffer = (stream) => {
        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            const senders = connections[id].getSenders();
            stream.getTracks().forEach(track => {
                const sender = senders.find(s => s.track?.kind === track.kind);
                if (sender) sender.replaceTrack(track);
                else connections[id].addTrack(track, stream);
            });
            connections[id].createOffer()
                .then(desc => connections[id].setLocalDescription(desc))
                .then(() => socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription })))
                .catch(e => console.log(e));
        }
    };

    const getUserMediaSuccess = (stream) => {
        try { window.localStream?.getTracks().forEach(t => t.stop()); } catch (e) {}
        window.localStream = stream;
        if (localVideoref.current) localVideoref.current.srcObject = stream;

        replaceTracksAndOffer(stream);

        stream.getTracks().forEach(track => {
            track.onended = () => {
                setVideo(false); setAudio(false);
                try { localVideoref.current?.srcObject?.getTracks().forEach(t => t.stop()); } catch (e) {}
                const bs = new MediaStream([black(), silence()]);
                window.localStream = bs;
                if (localVideoref.current) localVideoref.current.srcObject = bs;
                replaceTracksAndOffer(bs);
            };
        });
    };

    const getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video, audio })
                .then(getUserMediaSuccess)
                .catch(e => console.log(e));
        } else {
            try { localVideoref.current?.srcObject?.getTracks().forEach(t => t.stop()); } catch (e) {}
        }
    };

    const getDislayMediaSuccess = (stream) => {
        try { window.localStream?.getTracks().forEach(t => t.stop()); } catch (e) {}
        window.localStream = stream;
        if (localVideoref.current) localVideoref.current.srcObject = stream;
        replaceTracksAndOffer(stream);

        stream.getTracks().forEach(track => {
            track.onended = () => {
                setScreen(false);
                try { localVideoref.current?.srcObject?.getTracks().forEach(t => t.stop()); } catch (e) {}
                const bs = new MediaStream([black(), silence()]);
                window.localStream = bs;
                if (localVideoref.current) localVideoref.current.srcObject = bs;
                getUserMedia();
            };
        });
    };

    const getDislayMedia = () => {
        if (screen && navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then(getDislayMediaSuccess)
                .catch(e => console.log(e));
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SOCKET + WebRTC
    // ─────────────────────────────────────────────────────────────────────────

    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });
        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketIdRef.current = socketRef.current.id;

            // Join the room (URL path is the room key)
            socketRef.current.emit('join-call', window.location.href);
            // Broadcast our display name to everyone in the room
            socketRef.current.emit('user-name', username);

            // ── Server tells us we are the host ──
            socketRef.current.on('is-admin', () => setIsAdmin(true));

            // ── CHAT: receive messages from server ──
            // This listener was missing — without it no messages ever appeared.
            // We skip messages from ourselves since sendMessage() adds them locally already.
            socketRef.current.on('chat-message', (data, sender, socketIdSender) => {
                if (socketIdSender === socketIdRef.current) return; // already added locally
                setMessages(prev => [...prev, { sender, data }]);
                setNewMessages(p => p + 1);
            });

            // ── Receive another user's display name ──
            socketRef.current.on('user-name', (id, name) => {
                setUserNames(prev => ({ ...prev, [id]: name }));
            });

            // ── A user left the room ──
            socketRef.current.on('user-left', (id) => {
                connections[id]?.close();
                delete connections[id];
                setVideos(v => v.filter(v => v.socketId !== id));
                setUserNames(prev => { const n = { ...prev }; delete n[id]; return n; });
            });

            // ── ADMIN ENDED MEETING ──────────────────────────────────────────
            // Server broadcasts this to ALL users (including admin) when:
            // (a) admin clicks End Call  →  emits 'end-meeting' explicitly
            // (b) admin closes the tab   →  server detects disconnect and fires it
            // Every user cleans up and goes back to /home
            socketRef.current.on('meeting-ended', () => {
                try { localVideoref.current?.srcObject?.getTracks().forEach(t => t.stop()); } catch (e) {}
                for (let id in connections) { connections[id].close(); }
                connections = {};
                window.location.href = "/home";
            });

            // ── New user joined — set up peer connection ──
            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach(socketListId => {
                    if (connections[socketListId]) return;

                    const pc = new RTCPeerConnection(peerConfigConnections);
                    connections[socketListId] = pc;

                    pc.onicecandidate = event => {
                        if (event.candidate) {
                            socketRef.current.emit('signal', socketListId,
                                JSON.stringify({ ice: event.candidate }));
                        }
                    };

                    pc.ontrack = event => {
                        setVideos(prev => {
                            const exists = prev.find(v => v.socketId === socketListId);
                            if (exists) return prev.map(v =>
                                v.socketId === socketListId ? { ...v, stream: event.streams[0] } : v);
                            return [...prev, { socketId: socketListId, stream: event.streams[0] }];
                        });
                    };

                    window.localStream?.getTracks().forEach(t => pc.addTrack(t, window.localStream));
                });

                // Send offer only to the newly joined user
                if (id !== socketIdRef.current && connections[id]) {
                    connections[id].createOffer()
                        .then(desc => connections[id].setLocalDescription(desc))
                        .then(() => socketRef.current.emit('signal', id,
                            JSON.stringify({ sdp: connections[id].localDescription })))
                        .catch(e => console.log(e));
                }
            });
        });
    };

    const gotMessageFromServer = (fromId, msg) => {
        const signal = JSON.parse(msg);
        if (fromId === socketIdRef.current) return;

        if (signal.sdp) {
            connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer()
                            .then(desc => connections[fromId].setLocalDescription(desc))
                            .then(() => socketRef.current.emit('signal', fromId,
                                JSON.stringify({ sdp: connections[fromId].localDescription })))
                            .catch(e => console.log(e));
                    }
                }).catch(e => console.log(e));
        }
        if (signal.ice) {
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice))
                .catch(e => console.log(e));
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // UI HANDLERS
    // ─────────────────────────────────────────────────────────────────────────

    const handleVideo  = () => setVideo(v => !v);
    const handleAudio  = () => setAudio(a => !a);
    const handleScreen = () => setScreen(s => !s);

    // Admin → emits 'end-meeting' so server sends 'meeting-ended' to everyone
    // Guest → just leaves, others stay in the room
    const handleEndCall = () => {
        try { localVideoref.current?.srcObject?.getTracks().forEach(t => t.stop()); } catch (e) {}
        for (let id in connections) { connections[id].close(); }
        connections = {};
        if (isAdmin) {
            // Server will broadcast 'meeting-ended' to all remaining users
            socketRef.current.emit('end-meeting');
        } else {
            window.location.href = "/home";
        }
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages(prev => [...prev, { sender, data }]);
        if (socketIdSender !== socketIdRef.current) setNewMessages(p => p + 1);
    };

    const sendMessage = () => {
        if (!message.trim()) return;
        // Add to local messages immediately so the sender sees it right away
        setMessages(prev => [...prev, { sender: username, data: message }]);
        // Emit to server so others receive it
        socketRef.current.emit('chat-message', message, username);
        setMessage("");
    };

    const getMedia = () => {
        try { window.localStream?.getTracks().forEach(t => t.stop()); } catch (e) {}
        navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable })
            .then(stream => { getUserMediaSuccess(stream); connectToSocketServer(); })
            .catch(e => { console.log(e); connectToSocketServer(); });
    };

    const connect = () => { setAskForUsername(false); getMedia(); };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div>
            {askForUsername ? (

                /* ════════════════════ LOBBY ════════════════════ */
                <div className={styles.lobbyRoot}>
                    <div className={styles.lobbyLeft}>
                        <div className={styles.lobbyVideoWrapper}>
                            <video ref={localVideoref} autoPlay muted className={styles.lobbyVideo} />
                            <div className={styles.lobbyVideoLabel}>
                                <span className={styles.lobbyVideoDot} />
                                Camera Preview
                            </div>
                        </div>
                    </div>

                    <div className={styles.lobbyRight}>
                        <div className={styles.lobbyLogoRow}>
                            <div className={styles.lobbyLogoIcon}>M</div>
                            <span className={styles.lobbyLogoText}>MeetNova</span>
                        </div>
                        <h2 className={styles.lobbyTitle}>Ready to join?</h2>
                        <p className={styles.lobbySub}>Enter your display name to join the meeting room.</p>

                        <div className={styles.lobbyField}>
                            <label className={styles.lobbyLabel}>Your Name</label>
                            <input
                                className={styles.lobbyInput}
                                type="text"
                                placeholder="e.g. Avishkar"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && username.trim() && connect()}
                                autoFocus
                            />
                        </div>

                        <button className={styles.lobbyBtn} onClick={connect} disabled={!username.trim()}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M15 10l5 5-5 5"/><path d="M4 4v7a4 4 0 004 4h12"/>
                            </svg>
                            Join Meeting
                        </button>

                        <p className={styles.lobbyHint}>
                            Room: <span>{window.location.pathname.replace('/', '')}</span>
                        </p>
                    </div>
                </div>

            ) : (

                /* ════════════════════ MEETING ROOM ════════════════════ */
                <div className={styles.meetVideoContainer}>

                    {/* Host badge — only visible to admin */}
                    {isAdmin && (
                        <div className={styles.adminBadge}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            Host
                        </div>
                    )}

                    {/* Chat panel */}
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1>Chat</h1>
                                <div className={styles.chattingDisplay}>
                                    {messages.length > 0
                                        ? messages.map((item, i) => (
                                            <div key={i}>
                                                <p>{item.sender}</p>
                                                <p>{item.data}</p>
                                            </div>
                                        ))
                                        : <p>No messages yet</p>
                                    }
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className={styles.chattingArea}>
                                    <input
                                        className={styles.chatInput}
                                        type="text"
                                        placeholder="Type a message..."
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && message.trim() && sendMessage()}
                                    />
                                    <button className={styles.chatSendBtn} onClick={sendMessage}>Send</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Control bar */}
                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: video ? "#fff" : "#FF7E5F" }}>
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton
                            onClick={handleEndCall}
                            style={{ color: "#FF7E5F" }}
                            title={isAdmin ? "End meeting for everyone" : "Leave meeting"}
                        >
                            <CallEndIcon />
                        </IconButton>

                        <IconButton onClick={handleAudio} style={{ color: audio ? "#fff" : "#FF7E5F" }}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable && (
                            <IconButton onClick={handleScreen} style={{ color: "#fff" }}>
                                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton>
                        )}

                        <Badge badgeContent={newMessages} max={999} color="error">
                            <IconButton
                                onClick={() => {
                                    setModal(m => !m);
                                    setNewMessages(0); // clear badge when opening chat
                                }}
                                style={{ color: "#fff" }}
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    {/* Local video with name tag */}
                    <div className={styles.localVideoWrapper}>
                        <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted />
                        <div className={styles.videoNameTag}>
                            <span className={styles.videoNameDot} />
                            {username || "You"}{isAdmin ? " ★" : " (You)"}
                        </div>
                    </div>

                    {/* Remote videos */}
                    <div className={styles.conferenceView}>
                        {videos.map(vid => (
                            <div key={vid.socketId} className={styles.videoTile}>
                                <video
                                    className={styles.frontPersonVideo}
                                    ref={ref => {
                                        if (ref && vid.stream && ref.srcObject !== vid.stream)
                                            ref.srcObject = vid.stream;
                                    }}
                                    autoPlay
                                    playsInline
                                />
                                <div className={styles.videoNameTag}>
                                    <span className={styles.videoNameDot} />
                                    {userNames[vid.socketId] || "Guest"}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            )}
        </div>
    );
}
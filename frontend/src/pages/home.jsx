import React, { useContext, useEffect, useRef, useState } from 'react'
import withAuth from '../utils/withAuth.jsx'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { IconButton } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext.jsx';

function HomeComponent() {

    const navigate = useNavigate();
    const { addToUserHistory, userData } = useContext(AuthContext);

    const [meetingCode,    setMeetingCode]    = useState("");
    const [error,          setError]          = useState("");
    const [mode,           setMode]           = useState(null);
    const [generatedCode,  setGeneratedCode]  = useState("");
    const [copied,         setCopied]         = useState(false);
    const [showProfile,    setShowProfile]    = useState(false);

    const profileRef = useRef();

    // Show full name if available, fall back to username, then sessionStorage
    const displayName = userData?.name
        || userData?.username
        || sessionStorage.getItem("name")
        || sessionStorage.getItem("username")
        || "User";

    // Initials from first letters of each word (e.g. "Avishkar Patil" → "AP")
    const initials = displayName
        .split(" ")
        .map(w => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfile(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNewMeeting = async () => {
        const code = Math.random().toString(36).substring(2, 9);
        setGeneratedCode(code);
        setMode('new');
        if (addToUserHistory) await addToUserHistory(code);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleJoin = async () => {
        const code = meetingCode.trim();
        if (!code) { setError("Please enter a meeting code."); return; }
        setError("");
        if (addToUserHistory) await addToUserHistory(code);
        navigate(`/${code}`);
    };

    const handleEnterGenerated = () => navigate(`/${generatedCode}`);

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("name");
        navigate("/auth");
    };

    return (
        <>
            {/* NAV */}
            <div className="navBar">
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div className="lp-logo-icon" style={{ width: 32, height: 32, fontSize: "0.95rem" }}>M</div>
                    <h2 style={{ fontSize: "1.2rem", fontFamily: "Sora, sans-serif", fontWeight: 700, color: "var(--text)" }}>
                        MeetNova
                    </h2>
                </div>

                {/* Right side */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <IconButton
                        onClick={() => navigate("/history")}
                        style={{ color: "var(--text-dim)" }}
                        title="Meeting History"
                    >
                        <RestoreIcon />
                    </IconButton>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>History</span>

                    {/* ── Profile Avatar with dropdown ── */}
                    <div className="profile-wrapper" ref={profileRef}>
                        <button
                            className="profile-avatar-btn"
                            onClick={() => setShowProfile(p => !p)}
                            title={displayName}
                        >
                            <div className="profile-avatar">{initials}</div>
                            <span className="profile-name">{displayName}</span>
                            <svg
                                width="14" height="14" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2.5"
                                style={{ transform: showProfile ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                            >
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </button>

                        {showProfile && (
                            <div className="profile-dropdown">
                                {/* User info block */}
                                <div className="profile-dropdown-header">
                                    <div className="profile-avatar-lg">{initials}</div>
                                    <div>
                                        <div className="profile-dropdown-name">{displayName}</div>
                                        <div className="profile-dropdown-role">Member</div>
                                    </div>
                                </div>

                                <div className="profile-dropdown-divider" />

                                <button
                                    className="profile-dropdown-item"
                                    onClick={() => { setShowProfile(false); navigate("/history"); }}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                                    </svg>
                                    Meeting History
                                </button>

                                <div className="profile-dropdown-divider" />

                                <button className="profile-dropdown-item danger" onClick={handleLogout}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN */}
            <div className="meetContainer">
                <div className="leftPanel">
                    <div className="home-left-content">
                        <h1 className="home-headline">
                            Video meetings<br /><span>made simple</span>
                        </h1>
                        <p className="home-sub">
                            Start a new meeting instantly or join one with a code.
                            Connect with anyone, anywhere.
                        </p>

                        <div className="home-options">
                            <div
                                className={`home-option-card accent${mode === 'new' ? ' active' : ''}`}
                                onClick={handleNewMeeting}
                            >
                                <div className="home-option-icon orange">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                                    </svg>
                                </div>
                                <div>
                                    <div className="home-option-title">New Meeting</div>
                                    <div className="home-option-desc">Create a room and share the code with others</div>
                                </div>
                            </div>

                            <div
                                className={`home-option-card${mode === 'join' ? ' active' : ''}`}
                                onClick={() => { setMode('join'); setGeneratedCode(''); setError(''); }}
                            >
                                <div className="home-option-icon brown">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                                        <polyline points="10 17 15 12 10 7"/>
                                        <line x1="15" y1="12" x2="3" y2="12"/>
                                    </svg>
                                </div>
                                <div>
                                    <div className="home-option-title">Join Meeting</div>
                                    <div className="home-option-desc">Enter a code to join an existing meeting</div>
                                </div>
                            </div>
                        </div>

                        {mode === 'new' && generatedCode && (
                            <div className="home-join-panel">
                                <div className="home-join-panel-title">Your meeting is ready</div>
                                <div className="home-join-panel-sub">Share this code with people you want to meet with</div>
                                <div className="home-code-box">
                                    <div>
                                        <div className="home-code-label">Meeting Code</div>
                                        <div className="home-code-value">{generatedCode}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <button className="home-code-copy" onClick={handleCopy}>
                                            {copied ? "✓ Copied" : "Copy"}
                                        </button>
                                        <button className="home-code-join" onClick={handleEnterGenerated}>
                                            Start
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode === 'join' && (
                            <div className="home-join-panel">
                                <div className="home-join-panel-title">Join a meeting</div>
                                <div className="home-join-panel-sub">Enter the meeting code shared with you</div>
                                <div className="home-join-row">
                                    <div className="home-input-wrapper">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                                            <path d="M7 11V7a5 5 0 0110 0v4"/>
                                        </svg>
                                        <input
                                            className="home-input"
                                            type="text"
                                            placeholder="e.g. abc1234"
                                            value={meetingCode}
                                            onChange={e => { setMeetingCode(e.target.value); setError(""); }}
                                            onKeyDown={e => e.key === 'Enter' && handleJoin()}
                                            autoFocus
                                        />
                                    </div>
                                    <button className="home-join-btn" onClick={handleJoin}>Join</button>
                                </div>
                                {error && <p className="home-error">{error}</p>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="rightPanel">
                    <img src="/logo3.png" alt="MeetNova illustration" />
                </div>
            </div>
        </>
    );
}

export default withAuth(HomeComponent);
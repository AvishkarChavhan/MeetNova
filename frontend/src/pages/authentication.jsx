import * as React from "react";
import { AuthContext } from "../contexts/AuthContext.jsx";
import { Snackbar } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

export default function Authentication() {
    const location = useLocation();
    const navigate = useNavigate();

    const [formState, setFormState] = React.useState(location.state?.formState ?? 0);
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    const handleAuth = async () => {
        setLoading(true);
        setError("");
        try {
            if (formState === 0) {
                await handleLogin(username, password);
            } else {
                let result = await handleRegister(name, username, password);
                setUsername("");
                setPassword("");
                setName("");
                setMessage(result);
                setOpen(true);
                setFormState(0);
            }
        } catch (err) {
            let msg = "An error occurred";
            if (err.response?.data?.message) msg = err.response.data.message;
            else if (err.message) msg = err.message;
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleAuth();
    };

    return (
        <div className="auth-root">
            {/* LEFT PANEL */}
            <div className="auth-left">
                <div className="auth-left-content">
                    <div className="auth-logo" onClick={() => navigate('/')}>
                        <div className="auth-logo-icon">M</div>
                        <span>MeetNova</span>
                    </div>

                    <div className="auth-left-text">
                        <h2>
                            {formState === 0
                                ? <>Welcome<br /><span>Back</span></>
                                : <>Join<br /><span>MeetNova</span></>
                            }
                        </h2>
                        <p>
                            {formState === 0
                                ? "Sign in to continue your conversations and connect with your team."
                                : "Create your account and start connecting with people around the world."
                            }
                        </p>
                    </div>

                    {/* Decorative floating cards */}
                    <div className="auth-deco-cards">
                        <div className="auth-deco-card c1">
                            <div className="auth-deco-avatar">JD</div>
                            <div>
                                <p className="auth-deco-name">John joined</p>
                                <p className="auth-deco-time">just now</p>
                            </div>
                            <div className="auth-deco-pulse" />
                        </div>
                        <div className="auth-deco-card c2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9839" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                            <span>HD Video Active</span>
                        </div>
                        <div className="auth-deco-card c3">
                            <span className="auth-deco-count">4</span>
                            <span>in meeting</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL — FORM */}
            <div className="auth-right">
                <div className="auth-form-box">
                    <h3 className="auth-form-title">
                        {formState === 0 ? "Sign In" : "Create Account"}
                    </h3>
                    <p className="auth-form-sub">
                        {formState === 0 ? "Don't have an account? " : "Already have an account? "}
                        <button
                            className="auth-switch-btn"
                            onClick={() => { setFormState(formState === 0 ? 1 : 0); setError(""); }}
                        >
                            {formState === 0 ? "Sign Up" : "Sign In"}
                        </button>
                    </p>

                    <div className="auth-fields">
                        {formState === 1 && (
                            <div className="auth-field">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="auth-input"
                                />
                            </div>
                        )}

                        <div className="auth-field">
                            <label>Username</label>
                            <input
                                type="text"
                                placeholder="johndoe"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="auth-input"
                            />
                        </div>

                        <div className="auth-field">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="auth-input"
                            />
                        </div>

                        {error && <p className="auth-error">{error}</p>}

                        <button
                            className="auth-submit"
                            onClick={handleAuth}
                            disabled={loading}
                        >
                            {loading
                                ? <span className="auth-spinner" />
                                : formState === 0 ? "Sign In" : "Create Account"
                            }
                        </button>
                    </div>

                    <div className="auth-divider"><span>or</span></div>

                    <button className="auth-guest-btn" onClick={() => navigate('/aljk23')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                        Continue as Guest
                    </button>
                </div>
            </div>

            <Snackbar open={open} autoHideDuration={4000} message={message} onClose={() => setOpen(false)} />
        </div>
    );
}
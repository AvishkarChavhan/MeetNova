import React, { useCallback, useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext.jsx'
import { useNavigate } from 'react-router-dom';
import "../App.css";

export default function History() {

    const { getHistoryOfUser, addToUserHistory } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Wrap in useCallback so it's stable and safe to use as a dependency
    const fetchHistory = useCallback(async () => {
        try {
            const history = await getHistoryOfUser();
            setMeetings(history || []);
        } catch {
            setMeetings([]);
        } finally {
            setLoading(false);
        }
    }, [getHistoryOfUser]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const handleRejoin = async (code) => {
        if (addToUserHistory) await addToUserHistory(code);
        navigate(`/${code}`);
    };

    return (
        <div className="history-root">
            {/* NAV */}
            <div className="history-nav">
                <button className="history-back-btn" onClick={() => navigate("/home")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 5l-7 7 7 7"/>
                    </svg>
                </button>
                <span className="history-nav-title">Meeting History</span>
            </div>

            <div className="history-content">
                <div className="history-header">
                    <h2>Past Meetings</h2>
                    <p>All meetings you have joined or created</p>
                </div>

                {loading ? (
                    <div className="history-empty">
                        <div className="history-empty-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                            </svg>
                        </div>
                        <h3>Loading history...</h3>
                    </div>
                ) : meetings.length === 0 ? (
                    <div className="history-empty">
                        <div className="history-empty-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                            </svg>
                        </div>
                        <h3>No meetings yet</h3>
                        <p>Your past meetings will show up here once you join or create one.</p>
                        <button
                            onClick={() => navigate('/home')}
                            style={{
                                background: 'var(--accent)', color: '#fff', border: 'none',
                                padding: '0.6rem 1.4rem', borderRadius: 'var(--radius-sm)',
                                fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600,
                                cursor: 'pointer', marginTop: '0.5rem'
                            }}
                        >
                            Start a Meeting
                        </button>
                    </div>
                ) : (
                    <div className="history-list">
                        {meetings.map((meeting, i) => (
                            <div className="history-card" key={i}>
                                <div className="history-card-left">
                                    <div className="history-card-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="history-card-code">{meeting.meetingCode}</div>
                                        <div className="history-card-date">{formatDate(meeting.date)}</div>
                                    </div>
                                </div>
                                <button
                                    className="history-rejoin-btn"
                                    onClick={() => handleRejoin(meeting.meetingCode)}
                                >
                                    Rejoin →
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
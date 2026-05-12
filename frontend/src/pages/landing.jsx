import React, { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import "../App.css"

export default function LandingPage() {
    const router = useNavigate();
    const canvasRef = useRef();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        // Each bubble has a base color, size, pulse phase, and glow
        const palette = [
            { r: 255, g: 126, b: 95  },  // coral  #FF7E5F
            { r: 167, g: 127, b: 96  },  // mocha  #A77F60
            { r: 255, g: 180, b: 140 },  // peach  #FFB48C
            { r: 220, g: 100, b: 70  },  // deep coral
        ];

        const bubbles = Array.from({ length: 55 }, () => {
            const col = palette[Math.floor(Math.random() * palette.length)];
            return {
                x:     Math.random() * window.innerWidth,
                y:     Math.random() * window.innerHeight,
                vx:    (Math.random() - 0.5) * 0.5,
                vy:    (Math.random() - 0.5) * 0.5,
                r:     Math.random() * 3 + 2,       // 2–5px radius (much bigger)
                phase: Math.random() * Math.PI * 2, // for pulsing
                speed: Math.random() * 0.02 + 0.01,
                col,
            };
        });

        let animId;
        let tick = 0;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            tick++;

            // Draw connection lines first (under dots)
            for (let i = 0; i < bubbles.length; i++) {
                for (let j = i + 1; j < bubbles.length; j++) {
                    const p = bubbles[i], q = bubbles[j];
                    const dist = Math.hypot(p.x - q.x, p.y - q.y);
                    if (dist < 130) {
                        const alpha = 0.35 * (1 - dist / 130);
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(167, 127, 96, ${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.stroke();
                    }
                }
            }

            // Draw each bubble with glow + solid fill
            bubbles.forEach(b => {
                const pulse = Math.sin(tick * b.speed + b.phase);
                const radius = b.r + pulse * 1.2;  // pulsing size
                const alpha  = 0.55 + pulse * 0.2; // pulsing opacity 0.35–0.75

                // Outer glow
                const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, radius * 3.5);
                grd.addColorStop(0,   `rgba(${b.col.r},${b.col.g},${b.col.b},${(alpha * 0.4).toFixed(2)})`);
                grd.addColorStop(1,   `rgba(${b.col.r},${b.col.g},${b.col.b},0)`);
                ctx.beginPath();
                ctx.arc(b.x, b.y, radius * 3.5, 0, Math.PI * 2);
                ctx.fillStyle = grd;
                ctx.fill();

                // Solid dot core
                ctx.beginPath();
                ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${b.col.r},${b.col.g},${b.col.b},${alpha.toFixed(2)})`;
                ctx.fill();

                // Move
                b.x += b.vx;
                b.y += b.vy;
                if (b.x < -10)               b.x = canvas.width  + 10;
                if (b.x > canvas.width  + 10) b.x = -10;
                if (b.y < -10)               b.y = canvas.height + 10;
                if (b.y > canvas.height + 10) b.y = -10;
            });

            animId = requestAnimationFrame(draw);
        };

        draw();
        window.addEventListener('resize', resize);
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div className="lp-root">
            <canvas ref={canvasRef} className="lp-canvas" />

            <nav className="lp-nav">
                <div className="lp-logo">
                    <div className="lp-logo-icon">M</div>
                    <span>MeetNova</span>
                </div>
                <div className="lp-nav-links">
                    <button className="lp-btn-ghost" onClick={() => router("/aljk23")}>Join as Guest</button>
                    <button className="lp-btn-ghost" onClick={() => router("/auth", { state: { formState: 1 } })}>Register</button>
                    <button className="lp-btn-primary" onClick={() => router("/auth", { state: { formState: 0 } })}>Login</button>
                </div>
            </nav>

            <div className="lp-hero">
                <div className="lp-hero-left">
                    <div className="lp-badge">
                        <span className="lp-badge-dot" />
                        HD Video · Real-time · Secure
                    </div>

                    <h1 className="lp-headline">
                        <span className="lp-headline-thin">Connect</span><br />
                        <span className="lp-headline-accent">Without</span><br />
                        <span className="lp-headline-thin">Limits</span>
                    </h1>

                    <p className="lp-sub">
                        Crystal-clear video calls, instant messaging, and seamless
                        screen sharing — all in one place. Bridge any distance with MeetNova.
                    </p>

                    <div className="lp-cta-row">
                        <Link to="/auth" className="lp-cta-main">
                            Get Started Free
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </Link>
                        <button className="lp-cta-ghost" onClick={() => router("/aljk23")}>Try as Guest</button>
                    </div>

                    <div className="lp-stats">
                        <div className="lp-stat">
                            <span className="lp-stat-num">10K+</span>
                            <span className="lp-stat-label">Active Users</span>
                        </div>
                        <div className="lp-stat-divider" />
                        <div className="lp-stat">
                            <span className="lp-stat-num">99.9%</span>
                            <span className="lp-stat-label">Uptime</span>
                        </div>
                        <div className="lp-stat-divider" />
                        <div className="lp-stat">
                            <span className="lp-stat-num">HD</span>
                            <span className="lp-stat-label">Video Quality</span>
                        </div>
                    </div>
                </div>

                <div className="lp-hero-right">
                    <div className="lp-card-glow" />
                    <div className="lp-mockup">
                        <div className="lp-mockup-header">
                            <div className="lp-mockup-dot red" />
                            <div className="lp-mockup-dot yellow" />
                            <div className="lp-mockup-dot green" />
                            <span className="lp-mockup-title">MeetNova — Live</span>
                        </div>
                        <div className="lp-mockup-body">
                            <div className="lp-video-grid">
                                <div className="lp-video-tile main">
                                    <div className="lp-avatar large">JD</div>
                                    <span className="lp-name-tag">John Dev</span>
                                    <div className="lp-speaking-ring" />
                                </div>
                                <div className="lp-video-tile">
                                    <div className="lp-avatar">SK</div>
                                    <span className="lp-name-tag">Sara K</span>
                                </div>
                                <div className="lp-video-tile">
                                    <div className="lp-avatar">AM</div>
                                    <span className="lp-name-tag">Alex M</span>
                                </div>
                                <div className="lp-video-tile">
                                    <div className="lp-avatar">+2</div>
                                    <span className="lp-name-tag">Others</span>
                                </div>
                            </div>
                            <div className="lp-mockup-controls">
                                <div className="lp-ctrl red">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" /></svg>
                                </div>
                                <div className="lp-ctrl">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 013 3v8a3 3 0 01-6 0V4a3 3 0 013-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" /></svg>
                                </div>
                                <div className="lp-ctrl">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
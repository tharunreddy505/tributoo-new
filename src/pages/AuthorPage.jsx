import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import Layout from '../components/layout/Layout';
import { useTributeContext } from '../context/TributeContext';
import { API_URL } from '../config';

/* ─── tiny helpers ──────────────────────────────────────────────────────── */
const fmt = (d) =>
    d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '??.??.????';

const initials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const roleBadge = {
    private: { label: 'Private', color: 'bg-blue-100 text-blue-700' },
    company: { label: 'Company', color: 'bg-amber-100 text-amber-700' },
    admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
};

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
const Avatar = ({ src, name, size = 24 }) => {
    const [err, setErr] = useState(false);
    const cls = `rounded-full object-cover border-4 border-white shadow-xl`;
    const style = { width: size * 4, height: size * 4 };
    if (src && !err) {
        return <img src={src} alt={name} onError={() => setErr(true)} className={cls} style={style} />;
    }
    return (
        <div
            className={`rounded-full border-4 border-white shadow-xl flex items-center justify-center bg-gradient-to-br from-[#D4AF37] to-[#b8962e] text-white font-bold`}
            style={{ ...style, fontSize: size * 1.5 }}
        >
            {initials(name)}
        </div>
    );
};

/* ─── Memorial Card ──────────────────────────────────────────────────────── */
const MemorialCard = ({ memorial }) => {
    const [imgErr, setImgErr] = useState(false);
    // cover_url = wide banner; photo_url = portrait thumbnail
    const coverImg = memorial.cover_url || memorial.photo_url;

    return (
        <Link
            to={`/memorial/${memorial.slug || memorial.id}`}
            className="group relative h-64 overflow-hidden rounded-2xl bg-gray-200 shadow-md transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 block"
        >
            {/* Background Image */}
            <div className="absolute inset-0">
                {coverImg && !imgErr ? (
                    <img
                        src={coverImg}
                        alt={memorial.name}
                        onError={() => setImgErr(true)}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <span className="text-white/20 text-6xl font-serif">{memorial.name?.[0]}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="h-14 w-14 rotate-45 border border-white/40 bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <span className="-rotate-45 text-white text-xs font-serif italic">View</span>
                </div>
            </div>

            {/* Info */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 text-white">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-white/50 bg-gray-400">
                    {coverImg && !imgErr ? (
                        <img src={memorial.photo_url || coverImg} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full bg-[#D4AF37]/60 flex items-center justify-center text-white font-bold text-xs">
                            {memorial.name?.[0]}
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-bold leading-tight truncate drop-shadow">{memorial.name}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-white/90 mt-0.5 font-medium">
                        <span>✳ {fmt(memorial.birth_date)}</span>
                        <span>✝ {fmt(memorial.passing_date)}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

/* ─── Main Page ──────────────────────────────────────────────────────────── */
const AuthorPage = () => {
    const { username } = useParams();
    const { showAlert } = useTributeContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [msgOpen, setMsgOpen] = useState(false);
    const [msg, setMsg] = useState('');
    const [msgSent, setMsgSent] = useState(false);
    const [sendingMsg, setSendingMsg] = useState(false);
    const qrRef = useRef(null);

    /* fetch author data */
    useEffect(() => {
        setLoading(true);
        fetch(`${API_URL}/api/author/${encodeURIComponent(username)}`)
            .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
            .then(d => { setData(d); setLoading(false); })
            .catch(() => { setNotFound(true); setLoading(false); });
    }, [username]);

    /* generate QR code */
    useEffect(() => {
        if (!data) return;
        const url = `${window.location.origin}/author/${username}`;
        QRCode.toDataURL(url, { width: 160, margin: 1, color: { dark: '#1a1a1a', light: '#ffffff' } })
            .then(setQrDataUrl)
            .catch(console.error);
    }, [data, username]);

    /* download QR */
    const downloadQr = () => {
        if (!qrDataUrl) return;
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = `${username}-qr.png`;
        a.click();
    };

    /* ── Loading ── */
    if (loading) return (
        <Layout>
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-gray-400 font-serif italic">Loading profile…</p>
                </div>
            </div>
        </Layout>
    );

    /* ── Not Found ── */
    if (notFound) return (
        <Layout>
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                    <div className="text-8xl">👤</div>
                    <h1 className="text-3xl font-serif text-gray-700">Author not found</h1>
                    <p className="text-gray-400">The user <strong>@{username}</strong> doesn't exist.</p>
                    <Link to="/memorials" className="inline-block mt-4 text-[#D4AF37] font-semibold hover:underline">
                        ← Browse all memorials
                    </Link>
                </div>
            </div>
        </Layout>
    );

    const { user, memorials, totalActive } = data;
    const badge = roleBadge[user.role] || roleBadge.private;
    const joinedDate = user.joined
        ? new Date(user.joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : '—';

    return (
        <Layout>
            <div className="min-h-screen bg-[#FAF9F6]">

                {/* ── HERO BANNER ────────────────────────────────────────── */}
                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-[#1a1208] h-52 md:h-60 overflow-hidden">
                    {/* decorative SVG pattern */}
                    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                    {/* gold accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60" />
                </div>

                {/* ── PROFILE CARD ───────────────────────────────────────── */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative -mt-20 mb-8">
                        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 border border-gray-100">
                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">

                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    <Avatar src={user.logo_url} name={user.displayName} size={24} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-1">
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                                            {user.displayName}
                                        </h1>
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-1">@{user.username}</p>
                                    {user.description && (
                                        <p className="text-gray-600 text-sm mb-3 max-w-lg leading-relaxed">{user.description}</p>
                                    )}

                                    {/* Meta pills */}
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>Joined: <strong className="text-gray-700">{joinedDate}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                            </svg>
                                            <span>Active listings: <strong className="text-gray-700">{totalActive}</strong></span>
                                        </div>
                                    </div>

                                    {/* Direct Message button */}
                                    <button
                                        onClick={() => { setMsgOpen(true); setMsgSent(false); setMsg(''); }}
                                        className="mt-4 inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c59d2a] text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-md transition-all active:scale-95"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        Direct Message
                                    </button>
                                </div>

                                {/* QR Code block */}
                                <div className="flex-shrink-0 flex flex-col items-center gap-3 ml-auto">
                                    {qrDataUrl ? (
                                        <>
                                            <div className="p-2 bg-white border-2 border-gray-100 rounded-xl shadow-md">
                                                <img src={qrDataUrl} alt="QR Code" className="w-32 h-32" ref={qrRef} />
                                            </div>
                                            <button
                                                onClick={downloadQr}
                                                className="w-full text-xs font-bold px-4 py-2 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white rounded-lg transition-all"
                                            >
                                                ↓ Download QR code
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-32 h-32 bg-gray-100 rounded-xl animate-pulse" />
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* ── MEMORIALS GRID ─────────────────────────────────── */}
                    <div className="pb-20">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                Memorial Pages
                                <span className="ml-2 text-sm font-normal text-gray-400">({totalActive} listing{totalActive !== 1 ? 's' : ''})</span>
                            </h2>
                            <Link to="/memorials" className="text-sm text-[#D4AF37] hover:underline font-medium">
                                Browse all →
                            </Link>
                        </div>

                        {memorials.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {memorials.map(m => <MemorialCard key={m.id} memorial={m} />)}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <div className="text-6xl mb-4">🕊️</div>
                                <p className="text-xl font-serif text-gray-400 italic">No active memorial pages yet</p>
                                <p className="text-sm text-gray-400 mt-2">Pages will appear here once published.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── DIRECT MESSAGE MODAL ───────────────────────────────── */}
                {msgOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setMsgOpen(false)}>
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setMsgOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>

                            {msgSent ? (
                                <div className="text-center py-6 space-y-3">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 text-3xl mx-auto">✓</div>
                                    <p className="font-bold text-gray-800 text-lg">Message sent!</p>
                                    <p className="text-gray-500 text-sm">Your message has been delivered to <strong>{user.displayName}</strong>.</p>
                                    <button onClick={() => setMsgOpen(false)} className="mt-4 text-sm text-[#D4AF37] font-semibold hover:underline">Close</button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-6">
                                        <Avatar src={user.logo_url} name={user.displayName} size={10} />
                                        <div>
                                            <p className="font-bold text-gray-800">{user.displayName}</p>
                                            <p className="text-xs text-gray-400">@{user.username}</p>
                                        </div>
                                    </div>

                                    <h2 className="text-lg font-bold text-gray-800 mb-1">Send a message</h2>
                                    <p className="text-sm text-gray-500 mb-5">Your message will be forwarded to this author.</p>

                                    <textarea
                                        value={msg}
                                        onChange={e => setMsg(e.target.value)}
                                        rows={5}
                                        placeholder="Write your message here…"
                                        className="w-full border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 outline-none focus:border-[#D4AF37] resize-none transition-colors"
                                    />

                                    <button
                                        onClick={async () => {
                                            if (!msg.trim()) return;
                                            setSendingMsg(true);
                                            try {
                                                const res = await fetch(`${API_URL}/api/author/${encodeURIComponent(username)}/message`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ message: msg.trim() })
                                                });
                                                if (res.ok) {
                                                    setMsgSent(true);
                                                } else {
                                                    showAlert('Failed to send message.', 'error');
                                                }
                                            } catch (err) {
                                                showAlert('Failed to connect to the server.', 'error');
                                            } finally {
                                                setSendingMsg(false);
                                            }
                                        }}
                                        disabled={!msg.trim() || sendingMsg}
                                        className="w-full mt-4 flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#c59d2a] disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all"
                                    >
                                        {sendingMsg ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : null}
                                        {sendingMsg ? 'Sending...' : 'Send Message'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
};

export default AuthorPage;

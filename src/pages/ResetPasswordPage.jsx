import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faLock, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import { API_URL } from '../config';

const ResetPasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const token = new URLSearchParams(location.search).get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showCf, setShowCf] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirm) { setError('Passwords do not match.'); return; }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(data.error || 'Something went wrong.');
            }
        } catch {
            setError('Server connection failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-20 px-4 flex items-center justify-center">
                <div className="w-full max-w-[460px] bg-white rounded-[40px] shadow-2xl overflow-hidden p-8 md:p-12 border border-gray-100">

                    {/* Icon header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mb-4">
                            <FontAwesomeIcon icon={faLock} className="text-[#D4AF37] text-2xl" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Set New Password</h1>
                        <p className="text-sm text-gray-500 mt-1 text-center">Enter your new password below.</p>
                    </div>

                    {/* Success state */}
                    {success && (
                        <div className="flex flex-col items-center py-6 gap-3 text-center">
                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-5xl" />
                            <p className="text-gray-700 font-semibold text-lg">Password Updated!</p>
                            <p className="text-gray-500 text-sm">Redirecting you to login...</p>
                        </div>
                    )}

                    {/* No token */}
                    {!token && !success && (
                        <div className="flex flex-col items-center py-6 gap-3 text-center">
                            <FontAwesomeIcon icon={faTimesCircle} className="text-red-400 text-5xl" />
                            <p className="text-gray-700 font-semibold">Invalid Reset Link</p>
                            <p className="text-gray-500 text-sm">This link is missing a token. Please request a new password reset.</p>
                        </div>
                    )}

                    {/* Form */}
                    {token && !success && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-3">
                                    <FontAwesomeIcon icon={faTimesCircle} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* New password */}
                            <div className="space-y-1 group">
                                <label className="text-sm font-medium text-gray-500 pl-1 transition-colors group-focus-within:text-[#D4AF37]">
                                    New Password
                                </label>
                                <div className="relative border-b border-gray-200 group-focus-within:border-[#D4AF37] transition-all">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="At least 6 characters"
                                        className="w-full py-3 pr-10 bg-transparent outline-none text-gray-800"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPw(!showPw)}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 px-2">
                                        <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                            </div>

                            {/* Confirm password */}
                            <div className="space-y-1 group">
                                <label className="text-sm font-medium text-gray-500 pl-1 transition-colors group-focus-within:text-[#D4AF37]">
                                    Confirm Password
                                </label>
                                <div className="relative border-b border-gray-200 group-focus-within:border-[#D4AF37] transition-all">
                                    <input
                                        type={showCf ? 'text' : 'password'}
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        placeholder="Repeat your new password"
                                        className="w-full py-3 pr-10 bg-transparent outline-none text-gray-800"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowCf(!showCf)}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 px-2">
                                        <FontAwesomeIcon icon={showCf ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#E3D190] hover:bg-[#D4AF37] text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-6 uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <FontAwesomeIcon icon={faLock} />
                                )}
                                {loading ? 'Saving...' : 'Update Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ResetPasswordPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faRocket, faCrown, faTimes, faEye, faEyeSlash, faUser } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useTributeContext } from '../../context/TributeContext';
import { useGoogleLogin } from '@react-oauth/google';
import { API_URL } from '../../config';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const PricingModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { products, showAlert } = useTributeContext();
    const navigate = useNavigate();

    const [step, setStep] = useState('plans'); // 'plans' | 'register'
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', termsAccepted: false });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [loginErrors, setLoginErrors] = useState({});
    const [loginLoading, setLoginLoading] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Hooks must be called before any early return
    const handleGoogleSuccess = async (tokenResponse) => {
        try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            const userInfo = await userInfoRes.json();
            const res = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ googleAccessToken: tokenResponse.access_token, email: userInfo.email, name: userInfo.name, googleId: userInfo.sub })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.dispatchEvent(new Event('storage'));
                onClose();
                navigate('/admin');
                window.location.reload();
            } else {
                showAlert(data.error || 'Google login failed', 'error');
            }
        } catch {
            showAlert('Google login failed', 'error');
        }
    };

    const _googleHook = useGoogleLogin({ onSuccess: handleGoogleSuccess, onError: () => showAlert('Google login failed', 'error') });
    const googleLogin = GOOGLE_CLIENT_ID ? _googleHook : () => showAlert('Google Client ID not configured', 'info');

    if (!isOpen) return null;

    const getProductForPlan = (key) => {
        if (!products || !Array.isArray(products)) return null;
        return products.find(p => {
            const cat = p.category?.toLowerCase() || '';
            return cat === key || cat.includes(key);
        });
    };

    const plans = [
        { key: 'free', icon: faRocket, color: 'from-blue-500 to-indigo-600', popular: false },
        { key: 'premium', icon: faCrown, color: 'from-amber-400 to-orange-500', popular: true },
    ];

    const getFeaturesList = (planKey, dbProduct) => {
        if (dbProduct && dbProduct.description) {
            return dbProduct.description.replace(/<[^>]+>/g, '').split('\n').map(f => f.trim()).filter(Boolean);
        }
        return t(`pricing.${planKey}.features`, { returnObjects: true }) || [];
    };

    const handleSelectPlan = (planKey) => {
        setSelectedPlan(planKey);
        setStep('register');
    };

    const handleInput = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.username) newErrors.username = 'Username is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (!formData.termsAccepted) newErrors.terms = 'Please accept the terms';
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: formData.username, email: formData.email, password: formData.password, role: 'private', termsAccepted: formData.termsAccepted })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.dispatchEvent(new Event('storage'));
                setSuccess(true);
                setTimeout(() => { onClose(); navigate('/admin'); window.location.reload(); }, 1500);
            } else {
                setErrors({ email: data.error || 'Registration failed' });
            }
        } catch {
            showAlert('Server connection failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!loginData.username) newErrors.username = 'Username is required';
        if (!loginData.password) newErrors.password = 'Password is required';
        if (Object.keys(newErrors).length > 0) { setLoginErrors(newErrors); return; }
        setLoginLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loginData.username, password: loginData.password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.dispatchEvent(new Event('storage'));
                onClose();
                navigate('/admin');
                window.location.reload();
            } else {
                setLoginErrors({ password: data.error || 'Invalid credentials' });
            }
        } catch {
            showAlert('Server connection failed', 'error');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleClose = () => { setStep('plans'); setSelectedPlan(null); setErrors({}); setSuccess(false); setLoginErrors({}); setLoginData({ username: '', password: '' }); onClose(); };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Close */}
                <button onClick={handleClose} className="absolute top-4 right-4 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10">
                    <FontAwesomeIcon icon={faTimes} className="text-gray-500 text-sm" />
                </button>

                {/* ── STEP 1: Plans ── */}
                {step === 'plans' && (
                    <>
                        <div className="text-center pt-10 pb-6 px-8">
                            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Choose Your Plan</h2>
                            <p className="text-gray-500 text-sm">Select a plan to publish your memorial page</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-8 pb-10">
                            {plans.map((plan) => {
                                const dbProduct = getProductForPlan(plan.key);
                                const features = getFeaturesList(plan.key, dbProduct);
                                const price = dbProduct ? parseFloat(dbProduct.price).toFixed(2) : t(`pricing.${plan.key}.price`);
                                const period = t(`pricing.${plan.key}.period`);
                                return (
                                    <div key={plan.key} className={`relative flex flex-col p-7 rounded-2xl border-2 transition-all ${plan.popular ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02]' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white'}`}>
                                        {plan.popular && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-1.5 rounded-full shadow whitespace-nowrap">Most Popular</div>
                                        )}
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white text-xl mb-5 shadow`}>
                                            <FontAwesomeIcon icon={plan.icon} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 font-serif mb-1">{t(`pricing.${plan.key}.title`)}</h3>
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <span className="text-3xl font-black text-gray-900">€ {price}</span>
                                            <span className="text-gray-400 text-xs font-medium">/ {period}</span>
                                        </div>
                                        <div className="h-px w-full bg-gray-100 mb-4" />
                                        <ul className="space-y-2.5 mb-6 flex-grow">
                                            {Array.isArray(features) && features.slice(0, 6).map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5">
                                                    <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-400'}`}>
                                                        <FontAwesomeIcon icon={faCheck} className="text-[9px]" />
                                                    </div>
                                                    <span className="text-gray-600 text-xs font-medium leading-relaxed">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => handleSelectPlan(plan.key)}
                                            className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${plan.popular ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90' : 'bg-white text-gray-800 border border-gray-200 hover:border-gray-800 hover:bg-gray-900 hover:text-white'}`}
                                        >
                                            {t(`pricing.${plan.key}.button`)}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ── STEP 2: Register ── */}
                {step === 'register' && (
                    <div className="px-8 pt-8 pb-10">
                        {/* Tabs */}
                        <div className="flex gap-6 mb-6">
                            <button className="text-primary font-bold text-lg border-b-2 border-primary pb-1">Register</button>
                            <button onClick={() => setStep('login')} className="text-gray-400 font-bold text-lg pb-1 hover:text-gray-600 transition-colors">Login</button>
                        </div>

                        {success ? (
                            <div className="text-center py-10">
                                <div className="text-5xl mb-4">🎉</div>
                                <p className="text-lg font-bold text-gray-800">Registration Successful!</p>
                                <p className="text-gray-500 text-sm mt-1">Redirecting to your dashboard...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-4">
                                {/* Google */}
                                <button type="button" onClick={googleLogin} className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
                                    Continue with Google
                                </button>

                                {/* Apple */}
                                <button type="button" className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    <svg width="16" height="18" viewBox="0 0 814 1000"><path fill="currentColor" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-120.7c-43.3-74.3-84.4-189.8-84.4-299.3 0-181.5 118.1-277.5 234.4-277.5 63.1 0 115.7 41.5 155.5 41.5 38.1 0 98.1-43.5 165.9-43.5 26.5 0 108.2 2.3 166.9 99.5zm-209.7-191.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>
                                    Continue with Apple
                                </button>

                                <div className="flex items-center gap-3 my-2">
                                    <div className="flex-1 h-px bg-gray-200" />
                                    <span className="text-xs text-gray-400 font-medium">or</span>
                                    <div className="flex-1 h-px bg-gray-200" />
                                </div>

                                {/* Role */}
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Choose role</p>
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => {}}>
                                        <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700">Private</span>
                                    </div>
                                </div>

                                {/* Username */}
                                <div className="border-b border-gray-200 pb-2">
                                    <input name="username" value={formData.username} onChange={handleInput} placeholder="Choose your username or company name" className="w-full text-sm text-gray-700 outline-none placeholder-gray-400 bg-transparent" />
                                    {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                                </div>

                                {/* Email */}
                                <div className="border-b border-gray-200 pb-2">
                                    <input name="email" type="email" value={formData.email} onChange={handleInput} placeholder="Enter your email address" className="w-full text-sm text-gray-700 outline-none placeholder-gray-400 bg-transparent" />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                {/* Password */}
                                <div className="border-b border-gray-200 pb-2 relative">
                                    <p className="text-xs font-semibold text-gray-600 mb-1">Password</p>
                                    <div className="flex items-center">
                                        <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleInput} placeholder="••••••••" className="w-full text-sm text-gray-700 outline-none placeholder-gray-400 bg-transparent" />
                                        <button type="button" onClick={() => setShowPassword(p => !p)} className="text-gray-400 ml-2">
                                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                </div>

                                {/* Terms */}
                                <div className="flex items-start gap-2">
                                    <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleInput} className="mt-0.5 accent-primary" />
                                    <span className="text-xs text-gray-600">I agree to your <a href="/terms" target="_blank" className="text-primary font-semibold">terms and conditions.</a></span>
                                </div>
                                {errors.terms && <p className="text-red-500 text-xs">{errors.terms}</p>}

                                <p className="text-[10px] text-gray-400 leading-relaxed">
                                    We use your personal information to provide you with the best possible experience on our website, to manage your account access, and for other purposes explained in our <a href="/privacy" target="_blank" className="text-primary">privacy policy.</a>
                                </p>

                                <button type="submit" disabled={loading} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-60">
                                    <FontAwesomeIcon icon={faUser} />
                                    {loading ? 'Registering...' : 'Register'}
                                </button>

                                <p className="text-center text-xs text-gray-400">Try it now – <span className="font-semibold text-gray-600">no credit card required</span></p>

                                <button type="button" onClick={() => setStep('plans')} className="w-full text-center text-xs text-primary font-semibold hover:underline mt-1">
                                    ← Back to plans
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* ── STEP 3: Login ── */}
                {step === 'login' && (
                    <div className="px-8 pt-8 pb-10">
                        {/* Tabs */}
                        <div className="flex gap-6 mb-6">
                            <button onClick={() => setStep('register')} className="text-gray-400 font-bold text-lg pb-1 hover:text-gray-600 transition-colors">Register</button>
                            <button className="text-primary font-bold text-lg border-b-2 border-primary pb-1">Login</button>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Google */}
                            <button type="button" onClick={googleLogin} className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
                                Continue with Google
                            </button>
                            <button type="button" className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                <svg width="16" height="18" viewBox="0 0 814 1000"><path fill="currentColor" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-120.7c-43.3-74.3-84.4-189.8-84.4-299.3 0-181.5 118.1-277.5 234.4-277.5 63.1 0 115.7 41.5 155.5 41.5 38.1 0 98.1-43.5 165.9-43.5 26.5 0 108.2 2.3 166.9 99.5zm-209.7-191.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>
                                Continue with Apple
                            </button>

                            <div className="flex items-center gap-3 my-2">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400 font-medium">or</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {/* Username */}
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-600">Username</p>
                                <div className="border-b border-gray-200 pb-2">
                                    <input value={loginData.username} onChange={e => { setLoginData(p => ({ ...p, username: e.target.value })); setLoginErrors(p => ({ ...p, username: null })); }} placeholder="Enter your username" className="w-full text-sm text-gray-700 outline-none placeholder-gray-400 bg-transparent" />
                                    {loginErrors.username && <p className="text-red-500 text-xs mt-1">{loginErrors.username}</p>}
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-600">Password</p>
                                <div className="border-b border-gray-200 pb-2 flex items-center">
                                    <input type={showLoginPassword ? 'text' : 'password'} value={loginData.password} onChange={e => { setLoginData(p => ({ ...p, password: e.target.value })); setLoginErrors(p => ({ ...p, password: null })); }} placeholder="Enter your password" className="flex-1 text-sm text-gray-700 outline-none placeholder-gray-400 bg-transparent" />
                                    <button type="button" onClick={() => setShowLoginPassword(p => !p)} className="text-gray-400 ml-2">
                                        <FontAwesomeIcon icon={showLoginPassword ? faEyeSlash : faEye} className="text-sm" />
                                    </button>
                                </div>
                                {loginErrors.password && <p className="text-red-500 text-xs mt-1">{loginErrors.password}</p>}
                            </div>

                            <button type="submit" disabled={loginLoading} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-60">
                                <FontAwesomeIcon icon={faUser} />
                                {loginLoading ? 'Logging in...' : 'Login'}
                            </button>

                            <p className="text-center text-xs text-gray-400">Try it now – <span className="font-semibold text-gray-600">no credit card required</span></p>

                            <button type="button" onClick={() => setStep('plans')} className="w-full text-center text-xs text-primary font-semibold hover:underline mt-1">
                                ← Back to plans
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PricingModal;

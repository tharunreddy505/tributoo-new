import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faSave, faEye, faEyeSlash, faUpload, faShieldAlt, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useTributeContext } from '../../context/TributeContext';
import { API_URL as BASE_API_URL } from '../../config';
import { compressImage } from '../../utils/imageOptimizer';

const AccountAdmin = () => {
    const API_URL = `${BASE_API_URL}/api`;
    const { showToast } = useTributeContext();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

    // Only true for role === 'company'
    const isCompany = user.role === 'company';

    // ── Shared state ────────────────────────────────────────────────────────────
    const [profileData, setProfileData] = useState({
        username: user.username || '',
        email: user.email || '',
        // Company-only fields
        companyName: user.companyName || user.company_name || '',
        description: user.description || '',
        visibleInCarousel: user.visible_in_carousel || user.visibleInCarousel || 'no',
        profilePicture: user.profilePicture || user.profile_picture || null,
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [previewImage, setPreviewImage] = useState(user.profilePicture || user.profile_picture || null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' }); // for non-company UI
    const fileInputRef = useRef(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const optimized = await compressImage(file, { maxWidth: 400, quality: 0.8 });
            setPreviewImage(optimized);
            setProfileData(prev => ({ ...prev, profilePicture: optimized }));
        } catch {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setPreviewImage(ev.target.result);
                setProfileData(prev => ({ ...prev, profilePicture: ev.target.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // ── Save handler (shared) ────────────────────────────────────────────────
    const handleSaveChanges = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword || passwordData.currentPassword) {
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                isCompany
                    ? showToast('New passwords do not match.', 'error')
                    : setStatus({ type: 'error', message: 'New passwords do not match' });
                return;
            }
            if (!passwordData.currentPassword) {
                isCompany
                    ? showToast('Please enter your current password.', 'error')
                    : setStatus({ type: 'error', message: 'Please enter your current password' });
                return;
            }
        }

        setLoading(true);
        try {
            const profileRes = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    username: isCompany ? (profileData.companyName || profileData.username) : profileData.username,
                    email: profileData.email,
                    ...(isCompany && {
                        companyName: profileData.companyName,
                        description: profileData.description,
                        visibleInCarousel: profileData.visibleInCarousel,
                        profilePicture: profileData.profilePicture,
                    })
                })
            });

            if (!profileRes.ok) {
                const err = await profileRes.json();
                isCompany
                    ? showToast(err.error || 'Failed to update profile.', 'error')
                    : setStatus({ type: 'error', message: err.error || 'Failed to update profile' });
                setLoading(false);
                return;
            }

            if (passwordData.currentPassword && passwordData.newPassword) {
                const passRes = await fetch(`${API_URL}/auth/change-password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({
                        currentPassword: passwordData.currentPassword,
                        newPassword: passwordData.newPassword
                    })
                });
                if (!passRes.ok) {
                    const err = await passRes.json();
                    isCompany
                        ? showToast(err.error || 'Failed to change password.', 'error')
                        : setStatus({ type: 'error', message: err.error || 'Failed to change password' });
                    setLoading(false);
                    return;
                }
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }

            const updatedUser = {
                ...user,
                username: isCompany ? (profileData.companyName || profileData.username) : profileData.username,
                email: profileData.email,
                ...(isCompany && {
                    companyName: profileData.companyName,
                    description: profileData.description,
                    visibleInCarousel: profileData.visibleInCarousel,
                    profilePicture: profileData.profilePicture,
                })
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            isCompany
                ? showToast('Changes saved successfully!', 'success')
                : setStatus({ type: 'success', message: 'Profile updated successfully!' });
        } catch {
            isCompany
                ? showToast('Server connection error.', 'error')
                : setStatus({ type: 'error', message: 'Server connection error' });
        } finally {
            setLoading(false);
        }
    };

    // ════════════════════════════════════════════════════════════════════════════
    // COMPANY UI  (role === 'company')
    // ════════════════════════════════════════════════════════════════════════════
    if (isCompany) {
        return (
            <div className="max-w-xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-8 py-5 border-b border-gray-100 text-center bg-gray-50">
                        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Account Details</h2>
                    </div>

                    <form onSubmit={handleSaveChanges} className="px-8 py-6 space-y-5">

                        {/* Company Name */}
                        <div>
                            <label className="block text-xs font-medium text-[#C9A84C] mb-1">Enter your company name</label>
                            <input
                                type="text"
                                value={profileData.companyName}
                                onChange={(e) => setProfileData(prev => ({ ...prev, companyName: e.target.value }))}
                                className="w-full border-0 border-b border-gray-300 focus:border-[#C9A84C] outline-none py-1.5 text-sm text-gray-700 bg-transparent transition-colors"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium text-[#C9A84C] mb-1">Enter your email address</label>
                            <input
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full border-0 border-b border-gray-300 focus:border-[#C9A84C] outline-none py-1.5 text-sm text-gray-700 bg-transparent transition-colors"
                            />
                        </div>

                        {/* Profile Picture Upload */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-3">Change profile picture</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center w-12 h-12 border border-gray-300 rounded-lg cursor-pointer hover:border-[#C9A84C] hover:bg-gray-50 transition-colors mx-auto mb-3"
                            >
                                <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-lg" />
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                                    {previewImage ? (
                                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <FontAwesomeIcon icon={faUser} className="text-white text-2xl" />
                                    )}
                                </div>
                                <p className="text-[10px] text-[#C9A84C]">Maximum file size: 2 GB.</p>
                            </div>
                        </div>

                        {/* Company Description */}
                        <div>
                            <label className="block text-xs font-medium text-[#C9A84C] mb-1">
                                Brief description of your company (you can also edit this later)
                            </label>
                            <input
                                type="text"
                                value={profileData.description}
                                onChange={(e) => setProfileData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full border-0 border-b border-gray-300 focus:border-[#C9A84C] outline-none py-1.5 text-sm text-gray-700 bg-transparent transition-colors"
                            />
                        </div>

                        {/* Change Password */}
                        <div className="pt-2">
                            <p className="text-xs font-bold text-gray-700 mb-4">Change password</p>

                            {['current', 'new', 'confirm'].map((key) => {
                                const labels = {
                                    current: 'Current password (leave blank to leave unchanged)',
                                    new: 'New password (leave blank to leave unchanged)',
                                    confirm: 'Confirm new password',
                                };
                                const fields = {
                                    current: 'currentPassword',
                                    new: 'newPassword',
                                    confirm: 'confirmPassword',
                                };
                                return (
                                    <div key={key} className="mb-4">
                                        <label className="block text-xs font-medium text-[#C9A84C] mb-1">{labels[key]}</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords[key] ? 'text' : 'password'}
                                                value={passwordData[fields[key]]}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, [fields[key]]: e.target.value }))}
                                                className="w-full border-0 border-b border-gray-300 focus:border-[#C9A84C] outline-none py-1.5 text-sm text-gray-700 bg-transparent pr-8 transition-colors"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <FontAwesomeIcon icon={showPasswords[key] ? faEye : faEyeSlash} className="text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Visible in Carousel */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2">Visible in Carousel</label>
                            <div className="relative">
                                <select
                                    value={profileData.visibleInCarousel}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, visibleInCarousel: e.target.value }))}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:border-[#C9A84C] outline-none appearance-none bg-white"
                                >
                                    <option value="no">No</option>
                                    <option value="yes">Yes</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Save button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#C9A84C] text-white py-2.5 rounded font-bold uppercase tracking-widest text-sm hover:bg-opacity-90 transition-all disabled:opacity-60"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════════
    // DEFAULT UI  (all other roles: free, premium, admin, etc.)
    // ════════════════════════════════════════════════════════════════════════════
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl">
                    <FontAwesomeIcon icon={faShieldAlt} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
                    <p className="text-sm text-gray-500">Manage your profile details and security</p>
                </div>
            </div>

            {status.message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    <FontAwesomeIcon icon={status.type === 'success' ? faCheckCircle : faShieldAlt} />
                    <span className="text-sm font-medium">{status.message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <FontAwesomeIcon icon={faUser} className="text-gray-400 text-sm" />
                            Personal Details
                        </h3>
                    </div>
                    <form onSubmit={handleSaveChanges} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Username</label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                <input
                                    type="text"
                                    value={profileData.username}
                                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                <input
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-secondary px-6 py-2.5 rounded-lg font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                            >
                                <FontAwesomeIcon icon={faSave} />
                                {loading ? 'Updating...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Password Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <FontAwesomeIcon icon={faLock} className="text-gray-400 text-sm" />
                            Security / Password
                        </h3>
                    </div>
                    <form onSubmit={handleSaveChanges} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Current Password</label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    required
                                />
                                <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <FontAwesomeIcon icon={showPasswords.current ? faEye : faEyeSlash} className="text-xs" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">New Password</label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    required minLength="6"
                                />
                                <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <FontAwesomeIcon icon={showPasswords.new ? faEye : faEyeSlash} className="text-xs" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Confirm New Password</label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    required minLength="6"
                                />
                                <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <FontAwesomeIcon icon={showPasswords.confirm ? faEye : faEyeSlash} className="text-xs" />
                                </button>
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-dark text-white px-6 py-2.5 rounded-lg font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                            >
                                <FontAwesomeIcon icon={faShieldAlt} />
                                {loading ? 'Updating...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AccountAdmin;

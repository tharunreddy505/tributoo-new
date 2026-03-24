import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import localforage from 'localforage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes, faUpload, faImage, faPlus, faTrash, faVideo, faLink, faSpinner, faArrowRight, faArrowLeft, faCircle, faFileAlt, faMapMarkerAlt, faLock, faCompass, faEye
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useTributeContext } from '../../context/TributeContext';
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import MemorialPreviewOverlay from './MemorialPreviewOverlay';

const MAPS_LIBRARIES = ['places'];

const CreateMemorialModal = ({ isOpen, onClose, selectedPackage }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { addTribute, uploadMediaFile, showToast, showAlert, products, addToCart } = useTributeContext();
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        name: '',
        birthDate: '',
        passingDate: '',
        bio: '',
        status: 'public',
        isAnniversaryReminder: 'no',
        reminderOptions: [],
        photo: null,
        cover: null,
        images: [],
        videos: [],
        videoUrls: [''],
        documents: [],
        graveAddress: '',
        graveLatitude: null,
        graveLongitude: null,
        showGraveLocation: true
    });

    const [showPreview, setShowPreview] = useState(false);
    const [manualCoords, setManualCoords] = useState(false);
    const [pinLocked, setPinLocked] = useState(false);
    const autocompleteRef = useRef(null);

    const { isLoaded: mapsLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: MAPS_LIBRARIES
    });

    const onPlaceChanged = () => {
        if (!autocompleteRef.current) return;
        const place = autocompleteRef.current.getPlace();
        if (!place.geometry) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setFormData(prev => ({
            ...prev,
            graveAddress: place.formatted_address || place.name || '',
            graveLatitude: lat,
            graveLongitude: lng
        }));
    };

    const onMarkerDragEnd = (e) => {
        if (pinLocked) return;
        setFormData(prev => ({
            ...prev,
            graveLatitude: e.latLng.lat(),
            graveLongitude: e.latLng.lng()
        }));
    };

    const [errors, setErrors] = useState({});

    const [previews, setPreviews] = useState({ 
        photo: null, 
        cover: null, 
        images: [],
        videos: []
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Full Name is required';
        if (!formData.birthDate) newErrors.birthDate = 'Date of Birth is required';
        if (!formData.passingDate) newErrors.passingDate = 'Passing Date is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileUpload = (e, target) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, [target]: file }));
            const url = URL.createObjectURL(file);
            setPreviews(prev => ({ ...prev, [target]: url }));
        }
    };

    const handleGalleryUpload = (e, type) => {
        const files = Array.from(e.target.files);
        const isFree = !selectedPackage || selectedPackage === 'free';
        
        if (isFree) {
            if (type === 'videos') {
                showAlert('Video uploads are restricted to Premium members. Update your plan to include moving memories.', 'info', 'Premium Feature');
                return;
            }
            if (type === 'images') {
                const currentCount = formData.images.length;
                if (currentCount >= 10) {
                    showAlert('Free memorials are limited to 10 gallery photos. You have already reached this limit.', 'warning', 'Limit Reached');
                    return;
                }
                const remaining = 10 - currentCount;
                if (files.length > remaining) {
                    showToast(`You can only add ${remaining} more photos to this free memorial.`, 'warning');
                    const allowedFiles = files.slice(0, remaining);
                    setFormData(prev => ({ ...prev, images: [...prev.images, ...allowedFiles] }));
                    const newPreviews = allowedFiles.map(file => URL.createObjectURL(file));
                    setPreviews(prev => ({ ...prev, images: [...prev.images, ...newPreviews] }));
                    return;
                }
            }
        }

        if (files.length > 0) {
            setFormData(prev => ({ ...prev, [type]: [...(prev[type] || []), ...files] }));
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews(prev => ({ ...prev, [type]: [...(prev[type] || []), ...newPreviews] }));
        }
    };

    const removeGalleryItem = (type, index) => {
        setFormData(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
        setPreviews(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
    };

    const handleAddVideoUrl = () => {
        const isFree = !selectedPackage || selectedPackage === 'free';
        if (isFree && formData.videoUrls.length >= 1) {
            showToast('Video links are restricted to Premium members.', 'error');
            return;
        }
        setFormData(prev => ({ ...prev, videoUrls: [...prev.videoUrls, ''] }));
    };

    const handleVideoUrlChange = (index, value) => {
        const newUrls = [...formData.videoUrls];
        newUrls[index] = value;
        setFormData(prev => ({ ...prev, videoUrls: newUrls }));
    };

    const handleAddDocument = () => {
        const isFree = !selectedPackage || selectedPackage === 'free';
        if (isFree) {
            showAlert('Document uploads are restricted to Premium members. Attach PDFs, DOCs and more to keep all records in one place.', 'info', 'Premium Feature');
            return;
        }
        setFormData(prev => ({ ...prev, documents: [...prev.documents, { file: null, title: '', description: '' }] }));
    };

    const handleDocumentFileChange = (idx, e) => {
        const file = e.target.files[0];
        if (!file) return;
        const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowed.includes(file.type)) {
            showToast('Only PDF and DOC/DOCX files are allowed.', 'error');
            e.target.value = '';
            return;
        }
        setFormData(prev => {
            const docs = [...prev.documents];
            docs[idx] = { ...docs[idx], file };
            return { ...prev, documents: docs };
        });
    };

    const handleDocumentFieldChange = (idx, field, value) => {
        setFormData(prev => {
            const docs = [...prev.documents];
            docs[idx] = { ...docs[idx], [field]: value };
            return { ...prev, documents: docs };
        });
    };

    const handleRemoveDocument = (idx) => {
        setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== idx) }));
    };

    const handleFinish = async () => {
        if (!formData.name) {
            showToast('Please enter a name for the memorial.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            
            // Format dates as "Mar 1, 2026 - Mar 19, 2026"
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            };
            
            const birthStr = formatDate(formData.birthDate);
            const passingStr = formatDate(formData.passingDate);
            const dates = (birthStr && passingStr) ? `${birthStr} - ${passingStr}` : birthStr;

            // Get user ID from local storage to associate memorial with user
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.id || user.user_id;

            const tributeData = {
                name: formData.name,
                birthDate: formData.birthDate,
                passingDate: formData.passingDate,
                dates,
                bio: formData.bio,
                status: formData.status,
                slug,
                userId,
                videoUrls: formData.videoUrls.filter(url => url.trim() !== ''),
                isAnniversaryReminder: formData.isAnniversaryReminder,
                reminderOptions: formData.isAnniversaryReminder === 'yes' ? formData.reminderOptions : [],
                graveAddress: formData.graveAddress || null,
                graveLatitude: formData.graveLatitude || null,
                graveLongitude: formData.graveLongitude || null,
                showGraveLocation: formData.showGraveLocation
            };

            // Handle Paid Plans (Premium/Corporate) - Redirect to cart
            if (selectedPackage && selectedPackage !== 'free') {
                const dbProduct = products?.find(p => {
                    const cat = p.category?.toLowerCase() || '';
                    const name = p.name?.toLowerCase() || '';
                    if (selectedPackage === 'premium') return cat.includes('premium') || cat.includes('lifetime') || name.includes('premium') || name.includes('lifetime');
                    if (selectedPackage === 'corporate') return cat.includes('corporate') || name.includes('corporate');
                    return false;
                });

                if (!dbProduct) {
                    showToast("Could not find selected plan in database.", "error");
                    setSubmitting(false);
                    return;
                }

                // Create a full draft with ALL media files (photo, cover, gallery)
                const fullDraft = { 
                    ...tributeData,
                    selectedPackage: selectedPackage, // PASS THIS TO DRAFT
                    photo: formData.photo,
                    cover: formData.cover,
                    images: formData.images,
                    videos: formData.videos,
                    documents: formData.documents
                };
                
                // Save to localforage (handles File objects correctly and has more space)
                try {
                    await localforage.setItem('pending_memorial_draft', fullDraft);
                    
                    // Simple JSON version for name/meta only for session storage (backup)
                    sessionStorage.setItem('pending_memorial_draft', JSON.stringify(tributeData));

                    addToCart(dbProduct, 1, { 
                        type: 'memorial_subscription', 
                        memorial_name: fullDraft.name,
                        listing: fullDraft.name
                    });

                    navigate('/cart');
                } catch (saveErr) {
                    console.error("Draft Save Failed:", saveErr);
                    showToast("Could not save memorial draft. Please refresh and try again.", "error");
                } finally {
                    setSubmitting(false);
                }
                return;
            }

            // Direct Creation for Free Plan
            const createdTribute = await addTribute(tributeData);

            if (createdTribute && createdTribute.id) {
                if (formData.photo) await uploadMediaFile(createdTribute.id, 'photo', formData.photo);
                if (formData.cover) await uploadMediaFile(createdTribute.id, 'cover', formData.cover);

                // Gallery uploads
                for (const img of formData.images) await uploadMediaFile(createdTribute.id, 'image', img);
                for (const vid of formData.videos) await uploadMediaFile(createdTribute.id, 'video', vid);
                for (const doc of formData.documents) if (doc.file) await uploadMediaFile(createdTribute.id, 'document', doc.file);

                showToast('Memorial created successfully!', 'success');
                onClose();
                navigate('/admin/memorials');
            }
        } catch (error) {
            console.error('Error creating memorial:', error);
            showToast('Failed to create memorial. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const Label = ({ children, required }) => (
        <label className="block text-[13px] font-bold text-[#1A1A1A] uppercase tracking-wide mb-2.5">
            {children} {required && <span className="text-primary ml-0.5 text-lg">*</span>}
        </label>
    );

    return (
        <>
        <div className="fixed inset-0 w-full h-full z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-[550px] shadow-2xl relative flex flex-col animate-scaleIn overflow-hidden max-h-[95vh]">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-8 text-gray-300 hover:text-dark transition-colors z-20 text-2xl"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <div className="p-8 md:p-12">
                        
                        {step === 1 ? (
                            <div className="space-y-8">
                                {/* Photos Section */}
                                <div className="flex flex-col items-center gap-6">
                                    <div className="flex justify-center gap-12 w-full">
                                        {/* Profile Photo */}
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Profile Photo</span>
                                            <div 
                                                onClick={() => document.getElementById('photo-upload').click()}
                                                className="w-32 h-32 rounded-full border border-[#F5F5F5] bg-[#FAFAFA] flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden relative shadow-sm"
                                            >
                                                {previews.photo ? (
                                                    <img src={previews.photo} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <FontAwesomeIcon icon={faUpload} className="text-[#C5C5C5] text-2xl" />
                                                )}
                                                <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} />
                                            </div>
                                        </div>

                                        {/* Cover Photo */}
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Cover Photo</span>
                                            <div 
                                                onClick={() => document.getElementById('cover-upload').click()}
                                                className="w-56 h-32 rounded-2xl border border-[#F5F5F5] bg-[#FAFAFA] flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden relative shadow-sm"
                                            >
                                                {previews.cover ? (
                                                    <img src={previews.cover} alt="Cover" className="w-full h-full object-cover" />
                                                ) : (
                                                    <FontAwesomeIcon icon={faImage} className="text-[#C5C5C5] text-2xl" />
                                                )}
                                                <input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-medium">Click icons to upload photos</p>
                                </div>

                                <div className="space-y-6">
                                    {/* Name */}
                                    <div className="space-y-1">
                                        <Label required>Full Name</Label>
                                        <input 
                                            name="name" value={formData.name} onChange={handleInputChange}
                                            className={`w-full px-5 py-4 rounded-xl border ${errors.name ? 'border-red-500 bg-red-50/10' : 'border-gray-100'} bg-white text-dark placeholder:text-[#ced4da] outline-none focus:border-primary transition-all text-base`}
                                            placeholder="Eleanor Rose Mitchell"
                                        />
                                        {errors.name ? (
                                            <p className="text-[11px] text-red-500 font-bold">{errors.name}</p>
                                        ) : (
                                            <p className="text-[11px] text-gray-300 font-medium tracking-tight">The name they were known by</p>
                                        )}
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-1">
                                            <Label required>Date of Birth</Label>
                                            <div className="relative">
                                                <input 
                                                    type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange}
                                                    className={`w-full px-5 py-4 rounded-xl border ${errors.birthDate ? 'border-red-500 bg-red-50/10' : 'border-gray-100'} bg-white text-dark outline-none focus:border-primary transition-all text-sm uppercase font-medium`}
                                                />
                                                {errors.birthDate && <p className="text-[11px] text-red-500 font-bold mt-1">{errors.birthDate}</p>}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label required>Passed Away</Label>
                                            <div className="relative">
                                                <input 
                                                    type="date" name="passingDate" value={formData.passingDate} onChange={handleInputChange}
                                                    className={`w-full px-5 py-4 rounded-xl border ${errors.passingDate ? 'border-red-500 bg-red-50/10' : 'border-gray-100'} bg-white text-dark outline-none focus:border-primary transition-all text-sm uppercase font-medium`}
                                                />
                                                {errors.passingDate && <p className="text-[11px] text-red-500 font-bold mt-1">{errors.passingDate}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Anniversary Table-like fields */}
                                    <div className="space-y-3">
                                        <Label>Anniversary of death <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
                                        <div className="border border-primary border-opacity-40 rounded-2xl overflow-hidden bg-white">
                                            <div 
                                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border-b border-primary border-opacity-10 last:border-0"
                                                onClick={() => setFormData(prev => ({ ...prev, isAnniversaryReminder: 'yes' }))}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formData.isAnniversaryReminder === 'yes' ? 'bg-white border-primary' : 'border-gray-300'}`}>
                                                        {formData.isAnniversaryReminder === 'yes' && <div className="w-2.5 h-2.5 bg-primary rounded-sm" />}
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-600">Yes</span>
                                                </div>
                                            </div>
                                            <div 
                                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                                                onClick={() => setFormData(prev => ({ ...prev, isAnniversaryReminder: 'no', reminderOptions: [] }))}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formData.isAnniversaryReminder === 'no' ? 'bg-white border-primary' : 'border-gray-300'}`}>
                                                        {formData.isAnniversaryReminder === 'no' && <div className="w-2.5 h-2.5 bg-primary rounded-sm" />}
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-600">No</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reminder Options (Conditional) */}
                                    {formData.isAnniversaryReminder === 'yes' && (
                                        <div className="space-y-3 animate-fadeIn">
                                            <h3 className="text-[13px] font-bold text-gray-800 tracking-tight">Reminder Options <span className="text-gray-400 normal-case font-normal">(optional)</span></h3>
                                            <div className="border border-primary border-opacity-40 rounded-2xl overflow-hidden bg-white">
                                                {[
                                                    { id: 'month', label: 'One month before' },
                                                    { id: 'week', label: 'One week before' },
                                                    { id: 'day', label: 'One day before' },
                                                    { id: 'anniversary', label: 'On anniversary day' }
                                                ].map((opt, idx, arr) => (
                                                    <div 
                                                        key={opt.id}
                                                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${idx !== arr.length - 1 ? 'border-b border-primary border-opacity-10' : ''}`}
                                                        onClick={() => {
                                                            const newReminders = formData.reminderOptions.includes(opt.id)
                                                                ? formData.reminderOptions.filter(r => r !== opt.id)
                                                                : [...formData.reminderOptions, opt.id];
                                                            setFormData(prev => ({ ...prev, reminderOptions: newReminders }));
                                                        }}
                                                    >
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formData.reminderOptions.includes(opt.id) ? 'bg-white border-primary' : 'border-gray-300'}`}>
                                                            {formData.reminderOptions.includes(opt.id) && <div className="w-2.5 h-2.5 bg-primary rounded-sm" />}
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-600">{opt.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Publication Status */}
                                    <div className="space-y-3 pt-2">
                                        <Label>Publication Status</Label>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setFormData(p => ({ ...p, status: 'public' }))}
                                                className={`flex-1 py-4 px-6 rounded-2xl border flex items-center justify-center gap-3 transition-all ${formData.status === 'public' ? 'border-primary bg-white ring-1 ring-primary ring-opacity-10' : 'border-gray-100 bg-gray-50'}`}
                                            >
                                                <FontAwesomeIcon icon={faCircle} className={`text-[8px] ${formData.status === 'public' ? 'text-primary' : 'text-gray-300'}`} />
                                                <span className={`font-bold text-sm ${formData.status === 'public' ? 'text-primary' : 'text-gray-400'}`}>Public</span>
                                            </button>
                                            <button 
                                                onClick={() => setFormData(p => ({ ...p, status: 'private' }))}
                                                className={`flex-1 py-4 px-6 rounded-2xl border flex items-center justify-center gap-3 transition-all ${formData.status === 'private' ? 'border-primary bg-white ring-1 ring-primary ring-opacity-10' : 'border-gray-100 bg-gray-50'}`}
                                            >
                                                <FontAwesomeIcon icon={faCircle} className={`text-[8px] ${formData.status === 'private' ? 'text-gray-300' : 'text-gray-300'}`} />
                                                <span className={`font-bold text-sm ${formData.status === 'private' ? 'text-primary' : 'text-gray-400'}`}>Private</span>
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-medium">Everyone can see this memorial.</p>
                                    </div>
                                </div>

                                {/* Footer Step 1 */}
                                <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                                    <button onClick={onClose} className="text-gray-400 font-bold hover:text-dark transition-colors px-2">
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => validateStep1() && setStep(2)}
                                        className="bg-primary text-white px-10 py-4 rounded-full font-bold flex items-center gap-3 shadow-lg hover:opacity-90 transition-all"
                                    >
                                        Continue <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-fadeIn">
                                {/* Life Story Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-gray-800 text-center">Life Story</h3>
                                    <div className="w-full min-h-[220px] rounded-[2rem] bg-[#F8F9FA] border border-[#F2F2F2] p-8 shadow-inner transition-all hover:border-gray-200">
                                        <textarea 
                                            name="bio" value={formData.bio} onChange={handleInputChange}
                                            placeholder="Take your time to tell what made them so special... their childhood, their passions, how they touched other people's lives..."
                                            className="w-full h-full min-h-[160px] bg-transparent border-none outline-none resize-none text-left text-gray-700 placeholder:text-gray-300 font-medium leading-[1.8]"
                                        />
                                    </div>
                                </div>

                                {/* Gallery Section */}
                                <div className="space-y-6">
                                    <h3 className="text-[16px] font-bold text-gray-800">Photos & Videos <span className="text-gray-400 font-normal">(Optional)</span></h3>
                                    
                                    <div className="space-y-4">
                                        {/* Photos box */}
                                        <div className="space-y-3">
                                            <input id="gallery-photos" type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleGalleryUpload(e, 'images')} />
                                            <div 
                                                onClick={() => document.getElementById('gallery-photos').click()}
                                                className="w-full py-10 rounded-2xl border border-gray-100 bg-white flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary transition-all"
                                            >
                                                <FontAwesomeIcon icon={faImage} className="text-[#C5C5C5] text-2xl" />
                                                <span className="text-sm font-semibold text-gray-700">Add Photos</span>
                                            </div>

                                            {/* Photos Previews */}
                                            {previews.images.length > 0 && (
                                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                                    {previews.images.map((url, idx) => (
                                                        <div key={idx} className="relative aspect-square group rounded-lg overflow-hidden border border-gray-100">
                                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); removeGalleryItem('images', idx); }}
                                                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 hover:scale-100 shadow-lg"
                                                            >
                                                                <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Videos box */}
                                        <div className="space-y-3">
                                            <input id="gallery-videos" type="file" multiple className="hidden" accept="video/*" onChange={(e) => handleGalleryUpload(e, 'videos')} />
                                            <div 
                                                onClick={() => {
                                                    if (!selectedPackage || selectedPackage === 'free') {
                                                        showAlert('Video uploads are restricted to Premium members. Update your plan to include moving memories.', 'info', 'Premium Feature');
                                                        return;
                                                    }
                                                    document.getElementById('gallery-videos').click();
                                                }}
                                                className={`w-full py-10 rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${(!selectedPackage || selectedPackage === 'free') ? 'bg-gray-50 opacity-80 cursor-not-allowed' : 'bg-white hover:border-primary'}`}
                                            >
                                                <FontAwesomeIcon icon={faVideo} className={`${(!selectedPackage || selectedPackage === 'free') ? 'text-primary/40' : 'text-[#C5C5C5]'} text-2xl`} />
                                                <div className="text-center">
                                                    <span className="text-sm font-semibold text-gray-700 block">Add Videos</span>
                                                    {(!selectedPackage || selectedPackage === 'free') && (
                                                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Premium Feature</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Videos Previews (only for non-free) */}
                                            {previews.videos.length > 0 && selectedPackage && selectedPackage !== 'free' && (
                                                <div className="grid grid-cols-4 gap-2">
                                                    {previews.videos.map((url, idx) => (
                                                        <div key={idx} className="relative aspect-square group rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                                                            <video src={url} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                                <FontAwesomeIcon icon={faVideo} className="text-white text-xs opacity-60" />
                                                            </div>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); removeGalleryItem('videos', idx); }}
                                                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 hover:scale-100 shadow-lg"
                                                            >
                                                                <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Video URLs */}
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Video URLs (YouTube, Vimeo, etc.)</h3>
                                    {(!selectedPackage || selectedPackage === 'free') ? (
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary/40 shadow-sm border border-gray-100">
                                                <FontAwesomeIcon icon={faLink} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-600">Video Links Restricted</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Available in Premium & Corporate</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {formData.videoUrls.map((url, idx) => (
                                                <div key={idx} className="relative group">
                                                    <FontAwesomeIcon icon={faLink} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                                                    <input 
                                                        value={url}
                                                        onChange={(e) => handleVideoUrlChange(idx, e.target.value)}
                                                        className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-100 bg-white text-dark placeholder:text-[#ced4da] outline-none focus:border-primary transition-all text-sm"
                                                        placeholder="https://www.youtube.com/watch?v=..."
                                                    />
                                                    {formData.videoUrls.length > 1 && (
                                                        <button 
                                                            onClick={() => setFormData(prev => ({ ...prev, videoUrls: prev.videoUrls.filter((_, i) => i !== idx) }))}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button 
                                                onClick={handleAddVideoUrl}
                                                className="flex items-center gap-2 text-[#D4AF37] text-[13px] font-bold hover:underline py-1"
                                            >
                                                <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> Add Another Video URL
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Documents */}
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <h3 className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">Upload Documents</h3>
                                    {(!selectedPackage || selectedPackage === 'free') ? (
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary/40 shadow-sm border border-gray-100">
                                                <FontAwesomeIcon icon={faFileAlt} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-600">Documents Restricted</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Upgrade to attach PDF & DOC files</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {formData.documents.map((doc, idx) => (
                                                <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                        onChange={(e) => handleDocumentFileChange(idx, e)}
                                                        className="text-sm text-gray-600"
                                                    />
                                                    <div className="border-b border-gray-100" />
                                                    <input
                                                        type="text"
                                                        placeholder="Title"
                                                        value={doc.title}
                                                        onChange={(e) => handleDocumentFieldChange(idx, 'title', e.target.value)}
                                                        className="w-full text-sm text-gray-700 outline-none border-b border-gray-100 pb-2 bg-transparent placeholder-gray-400"
                                                    />
                                                    <div className="border-b border-gray-100" />
                                                    <input
                                                        type="text"
                                                        placeholder="Description"
                                                        value={doc.description}
                                                        onChange={(e) => handleDocumentFieldChange(idx, 'description', e.target.value)}
                                                        className="w-full text-sm text-gray-700 outline-none border-b border-gray-100 pb-2 bg-transparent placeholder-gray-400"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveDocument(idx)}
                                                        className="bg-primary text-white text-xs font-bold px-4 py-2 rounded hover:bg-opacity-90 transition-all"
                                                    >
                                                        REMOVE
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={handleAddDocument}
                                                className="bg-primary text-white text-xs font-bold px-4 py-2 rounded hover:bg-opacity-90 shadow flex items-center gap-2 transition-all"
                                            >
                                                <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> ADD DOCUMENT
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Grave Location */}
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">Street and number <span className="text-gray-400 font-normal normal-case">(optional)</span></h3>
                                        <span className="text-[11px] text-gray-400">Location of the cemetery</span>
                                    </div>

                                    <div className="border border-primary/30 rounded-xl overflow-hidden">
                                        {/* Address input with autocomplete */}
                                        <div className="p-3 flex items-center gap-2 border-b border-gray-100">
                                            {mapsLoaded ? (
                                                <Autocomplete
                                                    onLoad={ref => (autocompleteRef.current = ref)}
                                                    onPlaceChanged={onPlaceChanged}
                                                    className="flex-1"
                                                >
                                                    <input
                                                        type="text"
                                                        placeholder="Search address..."
                                                        defaultValue={formData.graveAddress}
                                                        className="w-full text-sm text-gray-700 outline-none bg-transparent placeholder-gray-400"
                                                    />
                                                </Autocomplete>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Search address..."
                                                    value={formData.graveAddress}
                                                    onChange={e => setFormData(p => ({ ...p, graveAddress: e.target.value }))}
                                                    className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder-gray-400"
                                                />
                                            )}
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary text-sm flex-shrink-0" />
                                        </div>

                                        {/* Controls row */}
                                        <div className="px-3 py-2 flex items-center justify-between bg-white">
                                            <button
                                                type="button"
                                                onClick={() => setPinLocked(p => !p)}
                                                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${pinLocked ? 'text-primary' : 'text-gray-400'}`}
                                            >
                                                <FontAwesomeIcon icon={faLock} className="text-[10px]" />
                                                Lock Pin Location
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setManualCoords(p => !p)}
                                                className="text-xs text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
                                            >
                                                <FontAwesomeIcon icon={faCompass} className="text-[10px]" />
                                                Manual coordinates
                                            </button>
                                        </div>

                                        {/* Manual coordinate inputs */}
                                        {manualCoords && (
                                            <div className="px-3 pb-3 flex gap-3 border-t border-gray-100 pt-3">
                                                <div className="flex-1">
                                                    <label className="text-[10px] text-gray-400 font-bold uppercase">Latitude</label>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        placeholder="e.g. 48.8566"
                                                        value={formData.graveLatitude || ''}
                                                        onChange={e => setFormData(p => ({ ...p, graveLatitude: parseFloat(e.target.value) || null }))}
                                                        className="w-full text-sm text-gray-700 outline-none border-b border-gray-200 pb-1 bg-transparent mt-1 placeholder-gray-300"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[10px] text-gray-400 font-bold uppercase">Longitude</label>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        placeholder="e.g. 2.3522"
                                                        value={formData.graveLongitude || ''}
                                                        onChange={e => setFormData(p => ({ ...p, graveLongitude: parseFloat(e.target.value) || null }))}
                                                        className="w-full text-sm text-gray-700 outline-none border-b border-gray-200 pb-1 bg-transparent mt-1 placeholder-gray-300"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Map */}
                                        <div className="h-[200px] bg-gray-50">
                                            {mapsLoaded && formData.graveLatitude && formData.graveLongitude ? (
                                                <GoogleMap
                                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                                    center={{ lat: formData.graveLatitude, lng: formData.graveLongitude }}
                                                    zoom={15}
                                                    options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
                                                >
                                                    <Marker
                                                        position={{ lat: formData.graveLatitude, lng: formData.graveLongitude }}
                                                        draggable={!pinLocked}
                                                        onDragEnd={onMarkerDragEnd}
                                                    />
                                                </GoogleMap>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                                                    {mapsLoaded ? 'Search an address to see the map' : 'Loading map...'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Show on memorial toggle */}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.showGraveLocation}
                                            onChange={e => setFormData(p => ({ ...p, showGraveLocation: e.target.checked }))}
                                            className="accent-primary"
                                        />
                                        <span className="text-xs text-gray-600 font-medium">Show location on memorial page</span>
                                    </label>
                                </div>

                                {/* Footer Step 2 */}
                                <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-gray-400 font-bold hover:text-dark transition-colors px-2 flex items-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faArrowLeft} className="text-sm" /> Back
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowPreview(true)}
                                            className="border border-primary text-primary px-6 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-primary hover:text-white transition-all"
                                        >
                                            <FontAwesomeIcon icon={faEye} className="text-sm" /> Preview
                                        </button>
                                        <button
                                            onClick={handleFinish}
                                            disabled={submitting}
                                            className="bg-primary text-white px-10 py-4 rounded-full font-bold flex items-center gap-3 shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                                        >
                                            {submitting ? 'Creating...' : (selectedPackage && selectedPackage !== 'free' ? 'Add to Cart' : 'Finish')} <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        <MemorialPreviewOverlay
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            data={{
                name: formData.name,
                birthDate: formData.birthDate,
                passingDate: formData.passingDate,
                bio: formData.bio,
                photo: previews.photo,
                cover: previews.cover,
                images: previews.images,
                videos: formData.videos,
                videoUrls: formData.videoUrls,
                graveAddress: formData.graveAddress,
                graveLatitude: formData.graveLatitude,
                graveLongitude: formData.graveLongitude,
                showGraveLocation: formData.showGraveLocation
            }}
        />
        </>
    );
};

export default CreateMemorialModal;


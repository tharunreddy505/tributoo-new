import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faHeart, faBookOpen, faPlay, faPen, faShareNodes, faChevronLeft, faChevronRight, faQuoteLeft, faLink, faGlobe, faMapMarkerAlt, faCompass } from '@fortawesome/free-solid-svg-icons';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import TranslatedText from '../TranslatedText';
import PricingModal from '../ui/PricingModal';

const MemorialPreviewOverlay = ({ isOpen, onClose, data }) => {
    const [activeSection, setActiveSection] = useState('life-story');
    const [guestbookIndex, setGuestbookIndex] = useState(0);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: ['places']
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isOpen) return null;

    // Preparation functions (simplified from MemorialPage.jsx)
    const firstName = data.name ? data.name.split(' ')[0] : "Name";
    
    const allVideos = [
        ...(data.videos || []).map(v => ({ type: 'file', url: (v instanceof File ? URL.createObjectURL(v) : v) })),
        ...(data.videoUrls || []).filter(u => u && u.trim() !== '').map(url => ({ type: 'url', url }))
    ];

    const galleryImages = data.images && data.images.length > 0 ? data.images : [];

    return (
        <div className="fixed inset-0 z-[100] bg-[#FAF9F6] overflow-y-auto animate-fadeIn custom-scrollbar">
            {/* Style Tag for extra wow effects */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeInUp { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-scaleIn { animation: scaleIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .preview-banner {
                    background: linear-gradient(90deg, #D4AF37, #F1E9DA, #D4AF37);
                    background-size: 200% auto;
                    animation: shine 3s linear infinite;
                }
                @keyframes shine {
                    to { background-position: 200% center; }
                }
            `}} />

            {/* Preview Banner */}
            <div className="preview-banner sticky top-0 z-[110] py-2 px-4 text-[10px] tracking-[0.2em] text-dark/80 uppercase font-bold shadow-sm flex items-center justify-between gap-4">
                <span className="flex-1 text-center">PREVIEW MODE - This is how your page will look</span>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowPricingModal(true)}
                        className="bg-primary text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow"
                    >
                        🚀 Publish Page
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-dark text-white px-3 py-1 rounded-full text-[8px] hover:bg-black transition-colors"
                    >
                        EXIT PREVIEW
                    </button>
                </div>
            </div>

            <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />

            {/* Close Button Floating */}
            <button 
                onClick={onClose}
                className="fixed top-12 right-6 md:right-12 w-12 h-12 rounded-full bg-white shadow-2xl flex items-center justify-center text-dark hover:text-primary transition-all z-[120] hover:rotate-90"
            >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>

            {/* Cover Photo Banner */}
            {(data.cover || data.coverUrl) && (
                <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden">
                    <img
                        src={
                            data.cover instanceof File ? URL.createObjectURL(data.cover) :
                            data.cover || data.coverUrl
                        }
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#FAF9F6]"></div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 lg:py-10 relative">
                {/* Decorative Vertical Side Line */}
                <div className="absolute right-0 top-32 bottom-32 w-[1px] bg-gradient-to-b from-transparent via-primary/10 to-transparent hidden lg:block"></div>

                <div className="flex flex-col lg:flex-row items-center lg:items-start relative z-10 h-full">

                    {/* Left Sidebar */}
                    <aside className="w-full lg:w-[240px] lg:sticky lg:top-16 text-center flex flex-col items-center self-start py-4 animate-fadeInUp">
                        <div className="relative mb-6">
                            {/* Decorative Top Diamond Line */}
                            <div className="flex items-center justify-center gap-4 mb-8">
                                <div className="h-[1px] w-16 bg-primary/20"></div>
                                <div className="w-2 h-2 bg-primary rotate-45 shadow-[0_0_8px_rgba(212,175,55,0.3)]"></div>
                                <div className="h-[1px] w-16 bg-primary/20"></div>
                            </div>

                            {/* Circular Profile Image */}
                            <div className="relative inline-block mb-6 animate-scaleIn">
                                <div className="w-56 h-56 rounded-full border-[1px] border-primary/20 p-1.5 flex items-center justify-center">
                                    <div className="w-full h-full rounded-full border-[3px] border-white shadow-xl overflow-hidden relative z-10">
                                        <img
                                            src={data.photo ? (data.photo instanceof File ? URL.createObjectURL(data.photo) : data.photo) : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2576&auto=format&fit=crop"}
                                            alt={data.name}
                                            className="w-full h-full object-cover grayscale brightness-105"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Name and Basic Info */}
                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-5xl font-serif font-normal text-dark tracking-tight leading-[1.15]">
                                    {data.name || "Full Name"}
                                </h1>
                                <div className="flex items-center justify-center gap-4 py-6 w-full">
                                    <div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/80"></div>
                                    <p className="text-[9px] tracking-[0.2em] font-normal uppercase whitespace-nowrap text-[#D4AF37]">
                                        FOREVER IN MEMORY
                                    </p>
                                    <div className="h-[1px] w-8 bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/80"></div>
                                </div>
                                <div className="text-gray-400 font-sans italic text-sm pt-2">
                                    {data.birthDate ? new Date(data.birthDate).toLocaleDateString('de-DE', { month: 'long', day: 'numeric', year: 'numeric' }) : "????"} – {data.passingDate ? new Date(data.passingDate).toLocaleDateString('de-DE', { month: 'long', day: 'numeric', year: 'numeric' }) : "????"}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Vertical Column Divider */}
                    <div className="hidden lg:block w-[1px] self-stretch mx-12 2xl:mx-16 bg-[#D4AF37]/30"></div>
                    <div className="lg:hidden w-24 h-[1px] my-10 bg-[#D4AF37]/30"></div>

                    {/* Main Content Area */}
                    <main className="w-full flex-grow space-y-16 py-4 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>

                        {/* Life Story Section */}
                        <section className="text-center">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="w-14 h-14 rounded-full border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] bg-[#FDFCF8] shadow-sm relative mb-2">
                                    <FontAwesomeIcon icon={faBookOpen} className="text-lg" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-serif font-normal text-dark tracking-tight uppercase">
                                    BIOGRAPHY
                                </h2>
                                <div className="prose prose-stone max-w-none text-gray-500 leading-[1.8] font-description text-[16px] md:text-[17px] font-light px-4 md:px-0">
                                    <TranslatedText text={data.bio || "Your story will appear here once you've entered it. This section captures all the beautiful moments and milestones of a life lived to the fullest."} isHtml={true} />
                                </div>
                            </div>
                        </section>

                        {/* Photo Gallery - only shown when images uploaded */}
                        {galleryImages.length > 0 && (
                        <section className="text-center">
                            <div className="flex flex-col items-center space-y-6">
                                <div className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center text-primary/60 text-2xl bg-white shadow-sm">
                                    <span className="font-serif -mt-1">✧</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-serif font-normal text-dark tracking-tight">
                                    Memories
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl px-4 mt-8">
                                    {galleryImages.map((item, index) => {
                                        const src = (item instanceof File) ? URL.createObjectURL(item) : item;
                                        return (
                                            <div
                                                key={index}
                                                className="bg-white p-6 md:p-8 pb-10 shadow-xl relative group transition-all duration-500 hover:rotate-1 rounded-[2px]"
                                            >
                                                <div className="absolute top-0 left-0 w-10 h-10 border-t-[1.5px] border-l-[1.5px] border-[#D4AF37]/40"></div>
                                                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[1.5px] border-r-[1.5px] border-[#D4AF37]/40"></div>

                                                <div className="aspect-square bg-gray-50 overflow-hidden mb-4 shadow-inner">
                                                    <img
                                                        src={src}
                                                        alt=""
                                                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                                                    />
                                                </div>
                                                <p className="text-center text-[13px] text-gray-400 font-sans italic">Memory {index + 1}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                        )}

                        {/* Video Section */}
                        {allVideos.length > 0 && (
                            <section className="text-center">
                                <div className="flex flex-col items-center space-y-6">
                                    <div className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center text-primary/60 text-xl bg-white shadow-sm">
                                        <FontAwesomeIcon icon={faPlay} className="text-xs ml-0.5" />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-serif font-normal text-dark tracking-tight uppercase">
                                        Videos
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl px-4 mt-8">
                                        {allVideos.map((video, index) => (
                                            <div 
                                                key={index}
                                                className="bg-white p-6 pb-8 shadow-xl relative group transition-all duration-500 hover:translate-y-[-8px] rounded-[2px]"
                                            >
                                                <div className="aspect-video bg-gray-900 overflow-hidden relative shadow-inner mb-4 flex items-center justify-center">
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                                                        <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center text-[#D4AF37] shadow-xl group-hover:scale-110 transition-transform">
                                                            <FontAwesomeIcon icon={faPlay} className="ml-1 text-sm" />
                                                        </div>
                                                    </div>
                                                    {video.type === 'file' ? (
                                                        <video src={video.url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img 
                                                            src={`https://images.unsplash.com/photo-1516280440614-37939bbdd4f1?q=80&w=2670&auto=format&fit=crop`} 
                                                            className="w-full h-full object-cover opacity-60" 
                                                            alt="" 
                                                        />
                                                    )}
                                                </div>
                                                <p className="text-dark font-sans text-[14px] font-normal tracking-wide uppercase">
                                                    Video {index + 1}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Guestbook Preview */}
                        <section className="text-center pb-20">
                            <div className="flex flex-col items-center space-y-6">
                                <div className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center text-primary/60 text-xl bg-white shadow-sm">
                                    <FontAwesomeIcon icon={faPen} className="text-xs" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-serif font-normal text-dark tracking-tight">
                                    Words from the Heart
                                </h2>

                                <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
                                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M8 15s1.5-2 4-2 4 2 4 2"/>
                                        <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" strokeLinecap="round"/>
                                        <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    <p className="text-[13px] tracking-[0.1em] uppercase font-medium">No reviews added yet.</p>
                                    <p className="text-[11px] text-gray-400 max-w-xs text-center">Visitors will be able to leave messages after the page is published.</p>
                                </div>
                            </div>
                        </section>

                        {/* Grave Location Section */}
                        {data.graveLatitude && data.graveLongitude && data.showGraveLocation !== false && (
                            <section className="text-center animate-fadeInUp">
                                <div className="flex flex-col items-center space-y-6">
                                    <div className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center text-primary/60 text-xl bg-white shadow-sm">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-serif font-normal text-dark tracking-tight uppercase">
                                        Cemetery Location
                                    </h2>
                                    {data.graveAddress && (
                                        <p className="text-gray-500 italic max-w-xl mx-auto text-sm">{data.graveAddress}</p>
                                    )}
                                    
                                    <div className="w-full max-w-5xl h-[400px] rounded-[35px] overflow-hidden border border-gray-100 shadow-2xl mt-8 ring-8 ring-white">
                                        {isLoaded ? (
                                            <GoogleMap
                                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                                center={{ lat: data.graveLatitude, lng: data.graveLongitude }}
                                                zoom={15}
                                                options={{
                                                    disableDefaultUI: true,
                                                    zoomControl: true,
                                                    styles: [
                                                        {
                                                            "featureType": "all",
                                                            "elementType": "labels.text.fill",
                                                            "stylers": [{"color": "#7c93a3"}]
                                                        },
                                                        {
                                                            "featureType": "all",
                                                            "elementType": "labels.text.stroke",
                                                            "stylers": [{"color": "#f5f1e6"}]
                                                        }
                                                    ]
                                                }}
                                            >
                                                <Marker position={{ lat: data.graveLatitude, lng: data.graveLongitude }} />
                                            </GoogleMap>
                                        ) : (
                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                                                Loading Map...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Footer Quote */}
                        <section className="text-center border-t border-gray-100 pt-16 pb-24">
                            <div className="text-[#D4AF37] text-3xl font-serif mb-6">✧</div>
                            <h3 className="text-3xl font-serif italic text-dark max-w-2xl mx-auto leading-relaxed">
                                "In the heart's memory, those we love are never truly gone."
                            </h3>
                            <div className="flex gap-2 justify-center mt-12 text-[#D4AF37]/40">
                                <div className="w-2 h-2 bg-current rotate-45"></div>
                                <div className="w-3 h-3 bg-[#D4AF37]/60 rotate-45"></div>
                                <div className="w-2 h-2 bg-current rotate-45"></div>
                            </div>
                        </section>

                    </main>
                </div>
            </div>
        </div>
    );
};

export default MemorialPreviewOverlay;

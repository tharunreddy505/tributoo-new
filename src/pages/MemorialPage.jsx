import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faPlay, faPen, faShareNodes, faTimes, faChevronLeft, faChevronRight, faLockOpen, faUpload, faDownload, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { QRCodeCanvas } from 'qrcode.react';
import { useTributeContext } from '../context/TributeContext';
import { useTranslation } from 'react-i18next';
import TranslatedText from '../components/TranslatedText';
import Navbar from '../components/layout/Navbar';
import { API_URL } from '../config';

const MemorialPage = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const { tributes, incrementViewCount, addComment, isInitialized, showToast } = useTributeContext();
    const location = useLocation();
    const viewTracked = useRef(false);

    const [isCondolenceModalOpen, setIsCondolenceModalOpen] = useState(false);
    const [condolenceForm, setCondolenceForm] = useState({ name: '', email: '', comment: '', saveDetails: false });
    const [selectedImages, setSelectedImages] = useState([]);
    const [guestbookIndex, setGuestbookIndex] = useState(0);
    const [lightbox, setLightbox] = useState({ isOpen: false, index: 0 });
    const [videoModal, setVideoModal] = useState({ isOpen: false, url: '', type: 'url' });
    const [showAllPhotos, setShowAllPhotos] = useState(false);
    const [showAllVideos, setShowAllVideos] = useState(false);
    const fileInputRef = useRef(null);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [freshTribute, setFreshTribute] = useState(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch fresh tribute data directly from API so photos always show
    useEffect(() => {
        if (!id) return;
        fetch(`${API_URL}/api/tributes/by-slug/${encodeURIComponent(id)}`, { cache: 'no-store' })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setFreshTribute(data); })
            .catch(() => {});
    }, [id]);

    // Find tribute from context (handles persisted data)
    const tribute = freshTribute || tributes.find(t => String(t.id) === id || t.slug === id);

    console.log("Memory Page Debug - ID:", id, "Initialized:", isInitialized);
    console.log("Tribute Found:", !!tribute);
    if (tribute) {
        console.log("Images:", tribute.images?.length, "Videos:", tribute.videos?.length);
    }

    const { memorialData } = location.state || {}; // Fallback if navigated with state

    const rawData = tribute || memorialData;

    const data = {
        name: rawData?.name || "Eleanor Rose Mitchell",
        birthDate: rawData?.birthDate || "1945-05-03",
        passingDate: rawData?.passingDate || "2026-01-15",
        bio: rawData?.bio || rawData?.text || t('memorial_page.bio_fallback'),
        photo: rawData?.photo || rawData?.image || null,
        slug: rawData?.slug || "eleanor-rose-mitchell",
        images: (rawData?.images || []).filter(img => {
            const url = typeof img === 'object' ? img.url : img;
            const altText = typeof img === 'object' ? img.alt_text : null;
            if (altText === 'Profile Photo' || altText === 'Cover Image') return false;
            const photoUrl = rawData?.photo || rawData?.image;
            const coverUrl = rawData?.coverUrl;
            if (photoUrl && url && url.split('/').pop() === photoUrl.split('/').pop()) return false;
            if (coverUrl && url && url.split('/').pop() === coverUrl.split('/').pop()) return false;
            return true;
        }),
        videos: rawData?.videos || [],
        videoUrls: (rawData?.videoUrls || []).filter(url => url && url.trim() !== ''),
        documents: rawData?.documents || [],
        comments: rawData?.comments || [],
        coverUrl: rawData?.coverUrl || null,
        id: rawData?.id || 'demo'
    };

    const demoImages = [
        "https://images.unsplash.com/photo-1544299863-71a5c60205b3?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582239088698-c91726a97864?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2674&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=2832&auto=format&fit=crop",
    ];
    // For real tributes: only use actual uploaded images. Fallback only in demo mode.
    const galleryImages = data.images && data.images.length > 0 ? data.images : [];
    
    // Combine video URLs and uploaded files (Files first, then URLs)
    const allVideos = [
        ...(data.videos || []).map(v => ({ type: 'file', url: v.url, id: v.id, title: v.title })),
        ...(data.videoUrls || []).map(url => ({ type: 'url', url }))
    ];

    const openLightbox = (index) => setLightbox({ isOpen: true, index });
    const closeLightbox = () => setLightbox({ ...lightbox, isOpen: false });
    const nextImage = (e) => {
        if (e) e.stopPropagation();
        setLightbox(prev => ({ ...prev, index: (prev.index + 1) % galleryImages.length }));
    };
    const prevImage = (e) => {
        if (e) e.stopPropagation();
        setLightbox(prev => ({ ...prev, index: (prev.index - 1 + galleryImages.length) % galleryImages.length }));
    };

    const isDemo = !tribute && !memorialData;

    const getYouTubeThumbnail = (url) => {
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
        }
        return null;
    };

    const getEmbedUrl = (url) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const id = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
            return `https://www.youtube.com/embed/${id}?autoplay=1`;
        }
        if (url.includes('vimeo.com')) {
            const id = url.split('/').pop();
            return `https://player.vimeo.com/video/${id}?autoplay=1`;
        }
        return url;
    };

    const openVideo = (video) => {
        setVideoModal({
            isOpen: true,
            url: video.type === 'url' ? getEmbedUrl(video.url) : video.url,
            type: video.type
        });
    };

    // Reset view tracking when ID changes
    useEffect(() => {
        viewTracked.current = false;
        window.scrollTo(0, 0);
    }, [id]);

    // Increment view count once per session when tribute is available
    useEffect(() => {
        if (tribute && !viewTracked.current) {
            incrementViewCount(String(tribute.id));
            viewTracked.current = true;
            document.title = `${tribute.name} | Tributtoo`;
        }
    }, [tribute, id, incrementViewCount]);

    // Reset title on unmount or change
    useEffect(() => {
        return () => {
            document.title = 'Tributtoo';
        };
    }, []);

    // Show loading if context not initialized
    if (!isInitialized) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-sans lowercase italic">{t('memorial_page.loading')}</p>
                </div>
            </div>
        );
    }

    const copyToClipboard = () => {
        const url = `${window.location.origin}/memorial/${data.slug || data.id || id || 'demo'}`;
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        setSelectedImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (index) => {
        setSelectedImages(prev => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handleCondolenceSubmit = async (e) => {
        e.preventDefault();
        if (!condolenceForm.name || !condolenceForm.comment) return;

        let base64Image = null;
        if (selectedImages.length > 0) {
            try {
                base64Image = await fileToBase64(selectedImages[0].file);
            } catch (err) { console.error("Base64 conversion failed:", err); }
        }

        if (tribute) {
            // Use context function
            await addComment(tribute.id, {
                name: condolenceForm.name,
                text: condolenceForm.comment,
                email: condolenceForm.email,
                image: base64Image
            });

            if (showToast) showToast("Comment successfully submitted!", "success");

            // Re-fetch the fresh data natively so the comment appears immediately!
            fetch(`${API_URL}/api/tributes/by-slug/${encodeURIComponent(tribute.slug || tribute.id || id)}`, { cache: 'no-store' })
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (data) setFreshTribute(data); })
                .catch(() => {});

        } else {
            // Demo mode logic
            alert("This is a demo page. Your message would appear in the guestbook.");
        }

        setSelectedImages([]);
        setCondolenceForm({ name: '', email: '', comment: '', saveDetails: false });
        setIsCondolenceModalOpen(false);
    };

    // Safe name split for display
    const firstName = data?.name?.split(' ')[0] || "Eleanor";

    const demoComments = [
        { name: "Sarah Mitchell", date: "January 20, 2026", text: t('memorial_page.demo_comment_3_text', 'Mom, you were my guiding star, my safe harbor and my greatest teacher. Your love made me the person I am today. I miss you every single day.'), imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2574&auto=format&fit=crop" },
        { name: "Laura Collins", date: "January 20, 2026", text: t('memorial_page.demo_comment_4_text', 'Your kindness and warmth touched everyone around you. We will carry your memory in our hearts forever.'), imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=2576&auto=format&fit=crop" },
        { name: "Michael Chen", date: "January 18, 2026", text: t('memorial_page.demo_comment_1_text'), imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2670&auto=format&fit=crop" },
        { name: "Rebecca Thompson", date: "January 17, 2026", text: t('memorial_page.demo_comment_2_text'), imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2670&auto=format&fit=crop" }
    ];
    // For real tributes: only show actual comments. Demo fallback only in demo mode.
    const displayComments = data.comments && data.comments.length > 0
        ? data.comments
        : (isDemo ? demoComments : []);

    return (
        <div className="bg-[#FAF9F6] min-h-screen font-sans selection:bg-primary/30 text-dark">
            <Navbar />

            {/* Cover Photo Banner */}
            {(data.coverUrl || isDemo) && (
                <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden">
                    <img
                        src={data.coverUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2670&auto=format&fit=crop"}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#FAF9F6]"></div>
                </div>
            )}

            {/* Top Draft Banner */}
            {(tribute?.status === 'draft' || isDemo) && (
                <div className="bg-[#F1E9DA] py-3 text-center text-[10px] tracking-[0.15em] text-dark/60 uppercase font-medium border-b border-dark/5">
                    {t('memorial_page.draft_mode_banner')}
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 lg:py-10 relative">
                {/* Decorative Vertical Side Line (Matching screenshot) */}
                <div className="absolute right-0 top-32 bottom-32 w-[1px] bg-gradient-to-b from-transparent via-primary/10 to-transparent hidden lg:block"></div>

                <div className="flex flex-col lg:flex-row items-center lg:items-start relative z-10 h-full">

                    {/* Left Sidebar - Profile Information */}
                    <aside className="w-full lg:w-[240px] lg:sticky lg:top-6 text-center flex flex-col items-center self-start py-4">
                        <div className="relative mb-6">
                            {/* Decorative Top Diamond Line (Matching screenshot) */}
                            <div className="flex items-center justify-center gap-4 mb-8">
                                <div className="h-[1px] w-16 bg-primary/20"></div>
                                <div className="w-2 h-2 bg-primary rotate-45 shadow-[0_0_8px_rgba(212,175,55,0.3)]"></div>
                                <div className="h-[1px] w-16 bg-primary/20"></div>
                            </div>

                            {/* Circular Profile Image with Gold Ring (Pixel Perfect) */}
                            <div className="relative inline-block mb-6">
                                <div className="w-56 h-56 rounded-full border-[1px] border-primary/20 p-1.5 flex items-center justify-center">
                                    <div className="w-full h-full rounded-full border-[3px] border-white shadow-xl overflow-hidden relative z-10">
                                        <div className="absolute inset-0 border border-primary/20 rounded-full z-20 pointer-events-none"></div>
                                        <img
                                            src={data.photo || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2576&auto=format&fit=crop"}
                                            alt={data.name}
                                            className="w-full h-full object-cover grayscale brightness-105"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Name and Basic Info */}
                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-5xl font-serif font-normal text-dark tracking-tight leading-[1.15]">
                                    {data.name}
                                </h1>
                                <div className="flex items-center justify-center gap-4 py-6 w-full">
                                    <div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/80"></div>
                                    <p className="text-[9px] tracking-[0.2em] font-normal uppercase whitespace-nowrap text-[#D4AF37]">
                                        {t('memorial_page.forever_in_memory', 'FOREVER IN MEMORY')}
                                    </p>
                                    <div className="h-[1px] w-8 bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/80"></div>
                                </div>
                                <div className="text-gray-400 font-sans italic text-sm pt-2">
                                    {data.birthDate ? new Date(data.birthDate).toLocaleDateString(i18n.language, { month: 'long', day: 'numeric', year: 'numeric' }) : "????"} – {data.passingDate ? new Date(data.passingDate).toLocaleDateString(i18n.language, { month: 'long', day: 'numeric', year: 'numeric' }) : "????"}
                                </div>

                                <div className="flex flex-col items-center py-6">
                                    <div className="flex gap-3 mb-10">
                                        <div className="w-1.5 h-1.5 bg-primary/30 rotate-45"></div>
                                        <div className="w-2 h-2 bg-primary/60 rotate-45"></div>
                                        <div className="w-1.5 h-1.5 bg-primary/30 rotate-45"></div>
                                    </div>

                                    <div className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => document.getElementById('life-story').scrollIntoView({ behavior: 'smooth' })}>
                                        <span className="text-[8px] tracking-[0.5em] uppercase text-gray-300 font-normal mb-4 group-hover:text-primary transition-colors">Scroll</span>
                                        <div className="w-[1px] h-16 bg-gradient-to-b from-primary/20 to-transparent group-hover:from-primary/40 transition-all"></div>
                                    </div>
                                </div>

                                {/* Sidebar Navigation Menu */}
                                <nav className="hidden lg:flex flex-col gap-6 text-center w-full mb-12">
                                    <a href="#life-story" className="text-[10px] tracking-[0.2em] uppercase font-normal text-gray-400 hover:text-primary transition-all flex items-center justify-center gap-2">
                                        <span className="w-1 h-1 bg-primary/20 rounded-full"></span>
                                        {t('memorial_page.sidebar_life_story', 'Life Story')}
                                    </a>
                                    <a href="#photo-gallery" className="text-[10px] tracking-[0.2em] uppercase font-normal text-gray-400 hover:text-primary transition-all flex items-center justify-center gap-2">
                                        <span className="w-1 h-1 bg-primary/20 rounded-full"></span>
                                        {t('memorial_page.sidebar_memories', 'Memories')}
                                    </a>
                                    <a href="#video-section" className="text-[10px] tracking-[0.2em] uppercase font-normal text-gray-400 hover:text-primary transition-all flex items-center justify-center gap-2">
                                        <span className="w-1 h-1 bg-primary/20 rounded-full"></span>
                                        {t('memorial_page.sidebar_videos', 'Videos')}
                                    </a>
                                    <a href="#guestbook" className="text-[10px] tracking-[0.2em] uppercase font-normal text-gray-400 hover:text-primary transition-all flex items-center justify-center gap-2">
                                        <span className="w-1 h-1 bg-primary/20 rounded-full"></span>
                                        {t('memorial_page.sidebar_guestbook', 'Guestbook')}
                                    </a>
                                </nav>

                                <button
                                    onClick={() => setIsCondolenceModalOpen(true)}
                                    className="bg-[#D4AF37] hover:bg-[#C4A027] text-white px-10 py-4 rounded-full text-[10px] font-normal tracking-[0.2em] uppercase transition-all duration-300 shadow-xl shadow-primary/20"
                                >
                                    {t('memorial_page.leave_message_button')}
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Vertical Column Divider (Solid and constant as per request) */}
                    <div className="hidden lg:block w-[1px] self-stretch mx-12 2xl:mx-16 bg-[#D4AF37]/30"></div>
                    <div className="lg:hidden w-24 h-[1px] my-10 bg-[#D4AF37]/30"></div>

                    {/* Main Content Area */}
                    <main className="w-full flex-grow space-y-16 py-4">

                        {/* Life Story Section */}
                        <section id="life-story" className="text-center">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="w-14 h-14 rounded-full border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] bg-[#FDFCF8] shadow-sm relative mb-2">
                                    <div className="absolute inset-[-4px] rounded-full border border-[#D4AF37]/5"></div>
                                    <FontAwesomeIcon icon={faBookOpen} className="text-lg" />
                                </div>
                                <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent mb-6"></div>
                                <div className="space-y-6 max-w-2xl mx-auto">
                                    <h2 className="text-3xl md:text-4xl font-serif font-normal text-dark tracking-tight uppercase px-4">
                                        BIOGRAPHY
                                    </h2>
                                    <div className="prose prose-stone max-w-none text-gray-500 leading-[1.8] font-description text-[16px] md:text-[17px] font-light px-4 md:px-0">
                                        <TranslatedText text={data.bio} isHtml={true} className="bio-content" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Photo Gallery — hide for real memorials with no photos */}
                        {(isDemo || galleryImages.length > 0) && (
                        <section id="photo-gallery" className="text-center">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center text-primary/60 text-2xl bg-white shadow-sm">
                                    <span className="font-serif -mt-1">✧</span>
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl md:text-4xl font-serif font-normal text-dark tracking-tight">
                                        {t('memorial_page.memories_title')}
                                    </h2>
                                    <p className="text-[10px] text-gray-400 tracking-[0.25em] uppercase">
                                        {t('memorial_page.memories_subtitle')}
                                    </p>
                                </div>


                                {/* Photo Grid - Polaroid Style */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl px-4">
                                    {(isDemo && galleryImages.length === 0 ? demoImages : galleryImages).slice(0, showAllPhotos ? galleryImages.length : 4).map((item, index) => {
                                        const src = typeof item === 'object' ? item.url : item;
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => openLightbox(index)}
                                                className="bg-white p-6 md:p-8 pb-8 shadow-[0_20px_60px_rgba(0,0,0,0.02)] relative group transition-all duration-500 hover:translate-y-[-8px] rounded-[2px] ring-1 ring-black/[0.01] cursor-pointer"
                                            >
                                                {/* Gold Corner Accents - More defined */}
                                                <div className="absolute top-0 left-0 w-10 h-10 border-t-[1.5px] border-l-[1.5px] border-[#D4AF37]/40"></div>
                                                <div className="absolute top-0 right-0 w-10 h-10 border-t-[1.5px] border-r-[1.5px] border-[#D4AF37]/40"></div>
                                                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[1.5px] border-l-[1.5px] border-[#D4AF37]/40"></div>
                                                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[1.5px] border-r-[1.5px] border-[#D4AF37]/40"></div>

                                                <div className="aspect-square bg-gray-50 overflow-hidden mb-4 shadow-inner">
                                                    <img
                                                        src={src}
                                                        alt=""
                                                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                                                    />
                                                </div>

                                                <p className="text-center text-[13px] text-gray-500 font-sans tracking-[0.05em] font-medium">
                                                    {isDemo ? [
                                                        "Family Memories",
                                                        "Vintage Family Gathering",
                                                        "With Grandchildren",
                                                        "Garden she loved"
                                                    ][index] : `Memory ${index + 1}`}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {galleryImages.length > 4 && !showAllPhotos && (
                                    <button
                                        onClick={() => setShowAllPhotos(true)}
                                        className="flex items-center gap-4 text-[11px] tracking-[0.2em] text-[#D4AF37] font-normal uppercase hover:text-dark transition-colors pt-6"
                                    >
                                        <span>◄</span> {t('memorial_page.load_more', 'Load More Photos')} <span>►</span>
                                    </button>
                                )}

                                <div className="flex items-center justify-center gap-6 w-full py-4">
                                    <div className="h-[1px] flex-grow max-w-[120px] bg-gradient-to-r from-transparent to-[#D4AF37]/50"></div>
                                    <div className="flex gap-3 text-[#D4AF37]/60 text-lg">
                                        <span>♦</span><span>♦</span><span>♦</span><span>♦</span><span>♦</span>
                                    </div>
                                    <div className="h-[1px] flex-grow max-w-[120px] bg-gradient-to-l from-transparent to-[#D4AF37]/50"></div>
                                </div>
                            </div>
                        </section>
                        )}

                        {/* Video Section — hide entirely for real memorials with no videos */}
                        {(isDemo || allVideos.length > 0) && (
                        <section id="video-section" className="text-center">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center text-primary/60 text-xl bg-white shadow-sm">
                                    <FontAwesomeIcon icon={faPlay} className="text-xs ml-0.5" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl md:text-4xl font-serif font-normal text-dark tracking-tight uppercase">
                                        {t('memorial_page.videos_title')}
                                    </h2>
                                    <p className="text-[10px] text-gray-400 tracking-[0.25em] uppercase">
                                        {t('memorial_page.videos_subtitle')}
                                    </p>
                                </div>

                                {/* Video Grid - Consistent Sizing */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl px-4">
                                    {(allVideos.length > 0 ? allVideos : [
                                        { type: 'url', url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                                        { type: 'url', url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
                                    ]).slice(0, showAllVideos ? allVideos.length : 4).map((video, index) => {
                                        const thumb = video.type === 'url' ? getYouTubeThumbnail(video.url) : null;
                                        return (
                                            <div 
                                                key={index} 
                                                onClick={() => openVideo(video)}
                                                className="bg-white p-6 pb-8 shadow-[0_20px_60px_rgba(0,0,0,0.02)] relative group transition-all duration-500 hover:translate-y-[-8px] rounded-[2px] ring-1 ring-black/[0.01] cursor-pointer"
                                            >
                                                <div className="aspect-video bg-gray-50 overflow-hidden relative shadow-inner mb-4">
                                                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-10">
                                                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#D4AF37] shadow-xl group-hover:scale-110 transition-transform">
                                                            <FontAwesomeIcon icon={faPlay} className="ml-1 text-sm" />
                                                        </div>
                                                    </div>
                                                    {video.type === 'file' ? (
                                                        <video src={video.url} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" />
                                                    ) : (
                                                        <img
                                                            src={thumb || `https://images.unsplash.com/photo-1516280440614-37939bbdd4f1?q=80&w=2670&auto=format&fit=crop`}
                                                            alt=""
                                                            className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-center space-y-2">
                                                    <p className="text-dark font-sans text-[14px] font-normal tracking-wide uppercase">
                                                        {isDemo ? (index === 0 ? "Familienerinnerung" : "Einfach unvergesslich") : (video.title || `Video ${index + 1}`)}
                                                    </p>
                                                    <div className="w-2 h-2 bg-[#D4AF37]/40 rotate-45"></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {allVideos.length > 4 && !showAllVideos && (
                                    <button 
                                        onClick={() => setShowAllVideos(true)}
                                        className="flex items-center gap-4 text-[11px] tracking-[0.2em] text-[#D4AF37] font-normal uppercase hover:text-dark transition-colors pt-6"
                                    >
                                        <span>◄</span> {t('memorial_page.view_all_videos', 'View All Videos')} <span>►</span>
                                    </button>
                                )}
                            </div>
                        </section>
                        )}

                        {/* Guestbook Section */}
                        <section id="guestbook" className="text-center">
                            <div className="flex flex-col items-center space-y-6">
                                <div className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center text-primary/60 text-xl bg-white shadow-sm">
                                    <FontAwesomeIcon icon={faPen} className="text-xs" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl md:text-4xl font-serif font-normal text-dark tracking-tight">
                                        {t('memorial_page.tributes_title')}
                                    </h2>
                                    <p className="text-[10px] text-gray-400 tracking-[0.25em] uppercase text-center max-w-sm px-6 font-description">
                                        {t('memorial_page.tributes_subtitle')}
                                    </p>
                                </div>

                                {displayComments.length === 0 ? (
                                    /* No reviews yet */
                                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-3">
                                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="M8 15s1.5-2 4-2 4 2 4 2"/>
                                            <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                        <p className="text-[13px] tracking-[0.1em] uppercase font-medium">
                                            {t('memorial_page.no_reviews', 'No reviews added yet.')}
                                        </p>
                                    </div>
                                ) : (<>
                                {/* Carousel Navigation - Centered above cards, delicate and ivory */}
                                <div className="flex gap-4 justify-center py-4 mb-2">
                                    <button
                                        onClick={() => setGuestbookIndex(prev => Math.max(0, prev - 1))}
                                        disabled={guestbookIndex === 0}
                                        className="w-12 h-12 rounded-full bg-white border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all disabled:opacity-20 shadow-sm"
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} className="text-base" />
                                    </button>
                                    <button
                                        onClick={() => setGuestbookIndex(prev => Math.min(Math.max(0, displayComments.length - (isMobile ? 1 : 2)), prev + 1))}
                                        disabled={guestbookIndex >= displayComments.length - (isMobile ? 1 : 2)}
                                        className="w-12 h-12 rounded-full bg-white border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all disabled:opacity-20 shadow-sm"
                                    >
                                        <FontAwesomeIcon icon={faChevronRight} className="text-base" />
                                    </button>
                                </div>

                                {/* Sliding Carousel Container - Force horizontal rectangle look */}
                                <div className="w-full max-w-5xl px-4 overflow-hidden relative mx-auto">
                                    <div
                                        className="flex transition-all duration-700 ease-in-out gap-8"
                                        style={{ transform: `translateX(-${guestbookIndex * (isMobile ? 100 : 50)}%)` }}
                                    >
                                        {displayComments.map((comment, index) => (
                                            <div key={index} className="w-full md:w-[calc(50%-16px)] flex-shrink-0">
                                                <div className="bg-white rounded-[35px] shadow-[0_25px_60px_rgba(0,0,0,0.03)] relative mt-12 p-6 md:p-8 md:p-10 flex flex-col text-left h-auto min-h-[250px] overflow-visible border border-gray-100/50">
                                                    {/* Delicate Gold Frame - 4px stroke matching Sarah Mitchell reference */}
                                                    <div className="absolute top-0 left-0 w-[65%] h-32 border-t-[4px] border-l-[4px] border-[#D4AF37] rounded-tl-[35px] z-10 pointer-events-none"></div>
                                                    <div className="absolute top-0 right-0 w-[15%] h-[4px] bg-[#D4AF37] rounded-tr-[35px] z-10 pointer-events-none"></div>

                                                    {/* Premium Avatar Layout: Perfect notch cutout that masks the gold border */}
                                                    <div className="absolute -top-[30px] right-[10%] z-20">
                                                        <div className="relative">
                                                            {/* Background-matched Ivory halo - this creates the 'gap' in the gold bar */}
                                                            <div className="absolute inset-[-6px] bg-[#FAF9F6] rounded-full"></div>
                                                            {/* Gold Ring Avatar */}
                                                            <div className="relative w-20 h-20 rounded-full bg-white border-[4px] border-[#D4AF37] shadow-xl overflow-hidden p-[2px]">
                                                                <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center ring-[2px] ring-white ring-inset">
                                                                    <img
                                                                        src={comment.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.name)}&background=fdfcf8&color=d4af37&bold=true`}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card Header: Content positioning to match Sarah Mitchell */}
                                                    <div className="flex items-start gap-4 mb-5 relative z-10 mt-2">
                                                        <div className="w-10 h-10 flex-shrink-0 bg-[#FDFCF8] border border-[#D4AF37]/20 rounded flex items-center justify-center text-[#D4AF37] shadow-sm">
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                                        </div>
                                                        <div className="flex flex-col justify-center">
                                                            <h4 className="font-normal text-dark text-[18.5px] tracking-tight leading-none mb-1.5">{comment.name}</h4>
                                                            <p className="text-[10px] text-gray-400 font-sans tracking-[0.15em] uppercase font-medium">{comment.date || "January 20, 2026"}</p>
                                                        </div>
                                                    </div>

                                                    {/* Message Content: Compact & Airy with correct line height */}
                                                    <div className="flex-grow relative z-10 px-0">
                                                        <p className="text-gray-500 font-sans leading-[1.7] text-[15px] font-normal">
                                                            {comment.text}
                                                        </p>
                                                    </div>

                                                    {/* Footer: Bottom signature signature diamonds */}
                                                    <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end relative z-10">
                                                        <div className="flex gap-2 text-[#D4AF37]/40">
                                                            <div className="w-2 h-2 bg-current rotate-45"></div>
                                                            <div className="w-2.5 h-2.5 bg-[#D4AF37]/70 rotate-45"></div>
                                                            <div className="w-2 h-2 bg-current rotate-45"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                </>)}

                                {/* Bottom CTA Box */}
                                <div className="w-full max-w-3xl mx-auto bg-white/50 backdrop-blur-sm p-14 mt-10 text-center border border-[#D4AF37]/10 shadow-[0_30px_70px_rgba(0,0,0,0.03)] relative group rounded-[2px] ring-1 ring-[#D4AF37]/5">
                                    <h4 className="text-dark font-serif font-normal text-xl md:text-2xl mb-10 tracking-tight leading-relaxed">
                                        {t('memorial_page.leave_message_title', 'Share your memories and condolences')}
                                    </h4>
                                    <button
                                        onClick={() => setIsCondolenceModalOpen(true)}
                                        className="bg-[#D4AF37] hover:bg-[#C4A027] text-white px-12 py-5 rounded-sm text-[11px] font-normal tracking-[0.25em] uppercase transition-all duration-500 shadow-2xl shadow-[#D4AF37]/30 flex items-center gap-4 mx-auto hover:scale-[1.02]"
                                    >
                                        <FontAwesomeIcon icon={faPen} className="text-xs" />
                                        {t('memorial_page.leave_message_button', 'Leave a Message')}
                                    </button>
                                </div>

                                {/* Downloads Section */}
                                {data.documents && data.documents.length > 0 && (
                                    <div className="w-full max-w-3xl mx-auto mt-10">
                                        <div className="flex flex-col items-center gap-3 mb-8">
                                            <div className="w-14 h-14 rounded-full border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]/70 bg-white shadow-sm">
                                                <FontAwesomeIcon icon={faFileAlt} className="text-lg" />
                                            </div>
                                            <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 font-description">Downloads</p>
                                        </div>
                                        <div className="space-y-3">
                                            {data.documents.map((doc) => {
                                                const filename = (doc.url || '').split('/').pop() || '';
                                                const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
                                                const label = doc.title || doc.alt_text || filename.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, '') || 'Document';
                                                const desc = doc.caption || doc.description || '';
                                                return (
                                                    <div key={doc.id} className="flex items-center gap-5 bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                                                        <div className="flex-shrink-0 w-14 h-14 bg-[#D4AF37] rounded-lg flex items-center justify-center text-white text-[11px] font-bold tracking-wide">
                                                            {ext}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-800 text-sm truncate">{label}</p>
                                                            {desc && <p className="text-xs text-gray-400 mt-0.5 truncate">{desc}</p>}
                                                        </div>
                                                        <a
                                                            href={doc.url}
                                                            download
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-shrink-0 bg-[#D4AF37] hover:bg-[#C4A027] text-white text-xs font-medium px-5 py-2.5 rounded-md transition-colors"
                                                        >
                                                            Download
                                                        </a>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Share Section */}
                        <section className="text-center">
                            <div className="flex flex-col items-center space-y-12">
                                <div className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center text-primary/60 text-xl bg-white shadow-sm">
                                    <FontAwesomeIcon icon={faShareNodes} className="text-sm" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl md:text-4xl font-serif font-normal text-dark tracking-tight">
                                        {t('memorial_page.share_title')}
                                    </h2>
                                    <p className="text-[10px] text-gray-400 tracking-[0.25em] uppercase text-center max-w-sm px-6 font-description">
                                        {t('memorial_page.share_subtitle')}
                                    </p>
                                </div>

                                <div className="bg-white p-6 md:p-12 shadow-xl border border-black/[0.02] flex flex-col md:flex-row gap-10 md:gap-16 items-center w-full max-w-4xl ring-1 ring-black/[0.03]">
                                    <div className="flex-shrink-0 relative">
                                        <div className="w-44 h-44 bg-white p-3 border border-primary/10 shadow-inner">
                                            <QRCodeCanvas
                                                value={`${window.location.origin}/memorial/${data.slug || id}`}
                                                size={152}
                                                fgColor="#333333"
                                            />
                                        </div>
                                        <p className="text-[9px] text-gray-400 mt-5 text-center uppercase tracking-[0.2em] font-medium">{t('memorial_page.scan_qr')}</p>
                                    </div>

                                    <div className="flex-grow w-full space-y-10 text-left">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-normal text-dark/70 uppercase tracking-[0.2em]">Memorial Link</h4>
                                            <div className="flex flex-col sm:flex-row gap-2 p-1.5 bg-gray-50 border border-gray-100 rounded">
                                                <input
                                                    readOnly
                                                    value={`${window.location.origin}/memorial/${data.slug || id}`}
                                                    className="flex-grow bg-transparent text-gray-400 px-4 py-3 sm:py-2 text-[10px] font-mono select-all outline-none"
                                                />
                                                <button
                                                    onClick={copyToClipboard}
                                                    className="bg-[#D4AF37] text-white px-6 py-3 sm:py-2 rounded text-[10px] font-normal uppercase tracking-widest hover:bg-[#C4A027] transition-all"
                                                >
                                                    {t('memorial_page.copy_button', 'Copy')}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 py-6 px-8 bg-gray-50/50 border border-gray-100/50">
                                            <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center text-primary/40 bg-white">
                                                <FontAwesomeIcon icon={faLockOpen} className="text-xs" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-normal text-dark uppercase tracking-widest">{t('memorial_page.public_memorial')}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest leading-relaxed">{t('memorial_page.public_desc')}</p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-300 italic font-description leading-relaxed text-center md:text-left">
                                            {t('memorial_page.share_footer')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-6 w-full py-4">
                                    <div className="h-[1px] flex-grow max-w-[120px] bg-gradient-to-r from-transparent to-[#D4AF37]/50"></div>
                                    <div className="flex gap-3 text-[#D4AF37]/60 text-lg">
                                        <span>♦</span><span>♦</span><span>♦</span><span>♦</span><span>♦</span>
                                    </div>
                                    <div className="h-[1px] flex-grow max-w-[120px] bg-gradient-to-l from-transparent to-[#D4AF37]/50"></div>
                                </div>
                            </div>
                        </section>

                        {/* Final Quote & Closing */}
                        <section className="text-center space-y-10 pt-8 pb-20">
                            <div className="space-y-6">
                                <div className="text-[#D4AF37] text-3xl font-serif">✧</div>
                                <h3 className="text-3xl md:text-4xl font-serif text-dark leading-relaxed italic max-w-2xl mx-auto font-light">
                                    "{t('memorial_page.closing_quote')}"
                                </h3>
                                <div className="flex items-center justify-center gap-6 w-full py-8">
                                    <div className="h-[1px] flex-grow max-w-[80px] bg-gradient-to-r from-transparent to-[#D4AF37]/40"></div>
                                    <div className="flex gap-3 text-[#D4AF37]/50 text-base">
                                        <span>♦</span><span>♦</span><span>♦</span>
                                    </div>
                                    <div className="h-[1px] flex-grow max-w-[80px] bg-gradient-to-l from-transparent to-[#D4AF37]/40"></div>
                                </div>
                                <p className="text-gray-400 font-description leading-[1.8] text-lg font-light max-w-xl mx-auto italic px-6">
                                    {t('memorial_page.closing_tribute', { firstName })}
                                </p>
                            </div>


                        </section>

                    </main>
                </div>
            </div>

            {/* Condolence Book Modal (Updated to match request) */}
            {
                isCondolenceModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded shadow-2xl w-full max-w-xl relative animate-slideUp max-h-[90vh] flex flex-col">
                            <div className="absolute top-0 right-1 p-4 z-20">
                                <button
                                    onClick={() => setIsCondolenceModalOpen(false)}
                                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-dark transition-colors bg-white/80 backdrop-blur-sm rounded-full shadow-sm"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                                </button>
                            </div>

                            <div className="p-10 md:p-14 overflow-y-auto custom-scrollbar flex-grow">
                                <form onSubmit={handleCondolenceSubmit} className="space-y-8">
                                    {/* Upload Section */}
                                    <div className="space-y-4">
                                        <label className="text-[13px] font-medium text-gray-400">Upload images</label>

                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                        />

                                        <div
                                            onClick={() => fileInputRef.current.click()}
                                            className="w-full aspect-[2.5/1] border border-dashed border-gray-200 rounded flex flex-col items-center justify-center group cursor-pointer hover:border-primary/40 transition-colors bg-gray-50/30"
                                        >
                                            <div className="w-12 h-12 rounded-lg border-2 border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform bg-white shadow-sm">
                                                <FontAwesomeIcon icon={faUpload} className="text-xl" />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-3 font-medium tracking-wider uppercase">{t('memorial_page.click_to_upload', 'Click to Upload')}</p>
                                        </div>

                                        {/* Image Previews */}
                                        {selectedImages.length > 0 && (
                                            <div className="flex flex-wrap gap-3 pt-2">
                                                {selectedImages.map((img, idx) => (
                                                    <div key={idx} className="relative w-16 h-16 rounded overflow-hidden border border-gray-100 group">
                                                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(idx)}
                                                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Form Fields */}
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <label className="text-[13px] font-medium text-dark">Name</label>
                                            <input
                                                type="text"
                                                value={condolenceForm.name}
                                                onChange={(e) => setCondolenceForm(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full border-b border-gray-200 py-2 outline-none focus:border-primary transition-colors text-sm text-gray-600"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[13px] font-medium text-dark">Email</label>
                                            <input
                                                type="email"
                                                value={condolenceForm.email}
                                                onChange={(e) => setCondolenceForm(prev => ({ ...prev, email: e.target.value }))}
                                                className="w-full border-b border-gray-200 py-2 outline-none focus:border-primary transition-colors text-sm text-gray-600"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[13px] font-medium text-dark">Your comment</label>
                                            <textarea
                                                value={condolenceForm.comment}
                                                onChange={(e) => setCondolenceForm(prev => ({ ...prev, comment: e.target.value }))}
                                                placeholder="Enter memory"
                                                rows="4"
                                                className="w-full border-b border-gray-200 py-2 outline-none focus:border-primary transition-colors text-sm text-gray-600 resize-none placeholder:text-gray-300"
                                                required
                                            ></textarea>
                                        </div>
                                    </div>

                                    {/* Checkbox */}
                                    <div className="flex items-start gap-3">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                id="save-details"
                                                checked={condolenceForm.saveDetails}
                                                onChange={(e) => setCondolenceForm(prev => ({ ...prev, saveDetails: e.target.checked }))}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                                            />
                                        </div>
                                        <label htmlFor="save-details" className="text-[12px] text-gray-500 leading-tight">
                                            Save my name, email, and website in this browser for the next time I add a reminder
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-[#D4AF37] hover:bg-[#C4A027] text-white font-bold py-4 rounded text-[13px] uppercase tracking-widest transition-all duration-300 mt-4"
                                    >
                                        ADD COMMENT
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Image Lightbox Modal */}
            {lightbox.isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fadeIn"
                    onClick={closeLightbox}
                >
                    <button
                        className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors z-[110]"
                        onClick={closeLightbox}
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-3xl" />
                    </button>

                    {/* Navigation Buttons */}
                    <button
                        className="absolute left-4 md:left-8 w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all z-[110] border border-white/10"
                        onClick={prevImage}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="text-xl" />
                    </button>

                    <button
                        className="absolute right-4 md:right-8 w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all z-[110] border border-white/10"
                        onClick={nextImage}
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="text-xl" />
                    </button>

                    {/* Image Container */}
                    <div className="max-w-[85vw] max-h-[85vh] relative flex flex-col items-center">
                        <img
                            src={typeof galleryImages[lightbox.index] === 'object' ? galleryImages[lightbox.index].url : galleryImages[lightbox.index]}
                            alt=""
                            className="max-w-full max-h-[80vh] object-contain shadow-2xl animate-scaleIn rounded-sm"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="mt-8 text-center text-white/80 font-serif italic tracking-wide animate-slideUp">
                            {isDemo ? [
                                "Family Memories",
                                "Vintage Family Gathering",
                                "With Grandchildren",
                                "Garden she loved"
                            ][lightbox.index] : `Memory ${lightbox.index + 1}`}
                        </div>
                        <div className="mt-4 text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">
                            {lightbox.index + 1} / {galleryImages.length}
                        </div>
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {videoModal.isOpen && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fadeIn"
                    onClick={() => setVideoModal({ isOpen: false, url: '', type: 'url' })}
                >
                    <button 
                        className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors z-[110]"
                        onClick={() => setVideoModal({ isOpen: false, url: '', type: 'url' })}
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-3xl" />
                    </button>

                    <div className="w-full max-w-5xl aspect-video relative mx-4 animate-scaleIn" onClick={e => e.stopPropagation()}>
                        {videoModal.type === 'file' ? (
                            <video 
                                src={videoModal.url} 
                                controls 
                                autoPlay 
                                className="w-full h-full rounded shadow-2xl"
                            />
                        ) : (
                            <iframe
                                src={videoModal.url}
                                title="Video Player"
                                className="w-full h-full rounded shadow-2xl"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Styles for bio and prose */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .bio-content p { margin-bottom: 2rem; }
                .bio-content p:last-child { margin-bottom: 0; }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-slideUp {
                    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            ` }} />
        </div >
    );
};

export default MemorialPage;

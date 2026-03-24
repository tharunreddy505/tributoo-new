import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faRocket, faBuilding, faCrown } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useTributeContext } from '../../context/TributeContext';

const Pricing = ({ onOpenModal }) => {
    const { t } = useTranslation();
    const { products } = useTributeContext();

    // Get current user role to filter available plans
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = currentUser.role || 'guest'; // Roles: private, company, admin, guest

    // Helper to find actual product from DB based on plan key
    const getProductForPlan = (key) => {
        if (!products || products.length === 0) return null;
        
        const keyLower = key.toLowerCase();
        
        // 1. Try strict category match first
        const categoryMatch = products.find(p => {
            const cat = p.category?.toLowerCase();
            if (keyLower === 'free') return cat === 'free';
            if (keyLower === 'premium') return cat === 'lifetime subscription' || cat === 'premium' || cat === 'subscription-lifetime';
            if (keyLower === 'corporate') return cat === 'corporate';
            return false;
        });

        if (categoryMatch) return categoryMatch;

        // 2. Fallback to name search, but exclude overlaps
        return products.find(p => {
            const name = p.name?.toLowerCase() || '';
            if (keyLower === 'free') return name.includes('free');
            if (keyLower === 'premium') return name.includes('premium') || name.includes('lifetime');
            if (keyLower === 'corporate') return name.includes('corporate') || name.includes('business');
            return false;
        });
    };

    // Helper to parse product description into features list (split by lines/tags)
    const getFeaturesList = (planKey, dbProduct) => {
        if (dbProduct && dbProduct.description) {
            // Remove HTML tags and handle line breaks correctly
            const cleanContent = dbProduct.description
                .replace(/<\/p>/g, '\n') // Replace paragraph ends with newline
                .replace(/<br\s*\/?>/g, '\n') // Replace line breaks with newline
                .replace(/<[^>]*>/g, '') // Strip all other HTML tags
                .trim();

            const lines = cleanContent.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            if (lines.length > 0) return lines;
        }
        // Fallback to translation file if DB description is empty
        return t(`pricing.${planKey}.features`, { returnObjects: true });
    };

    const plans = [
        {
            key: 'free',
            icon: faRocket,
            color: 'from-blue-500 to-indigo-600',
            priceKey: 'free',
            popular: false
        },
        {
            key: 'premium',
            icon: faCrown,
            color: 'from-amber-400 to-orange-600',
            priceKey: 'premium',
            popular: true
        },
        {
            key: 'corporate',
            icon: faBuilding,
            color: 'from-gray-700 to-gray-900',
            priceKey: 'corporate',
            popular: false
        }
    ];

    return (
        <section className="py-24 bg-white relative overflow-hidden" id="pricing">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
                <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-primary rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-primary rounded-full blur-[120px]"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-dark mb-4">
                        {t('pricing.title_line1')} <br />
                        <span className="text-primary italic">{t('pricing.title_line2')}</span>
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg font-description">
                        {t('pricing.description')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan) => {
                        const dbProduct = getProductForPlan(plan.key);
                        const features = getFeaturesList(plan.key, dbProduct);

                        // Role-based restrictions:
                        // 'private' user can't access 'corporate'
                        // 'company' (corporate) user can't access 'premium'
                        const isDisabled = (userRole === 'private' && plan.key === 'corporate') ||
                                         (userRole === 'company' && plan.key === 'premium');
                        
                        return (
                            <div
                                key={plan.key}
                                className={`relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-500 ${!isDisabled ? 'hover:-translate-y-2' : ''} ${plan.popular
                                    ? 'bg-white shadow-[0_40px_100px_-15px_rgba(212,175,55,0.2)] border-2 border-primary scale-105 z-20'
                                    : 'bg-gray-50/50 border border-gray-100 hover:shadow-2xl hover:bg-white z-10'
                                    } ${isDisabled ? 'opacity-40 grayscale-[0.5]' : ''}`}
                            >
                                {isDisabled && (
                                    <div className="absolute inset-0 z-30 flex items-center justify-center p-6 text-center bg-white/10 backdrop-blur-[1px] rounded-[2.5rem]">
                                        <div className="bg-dark/80 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-2xl">
                                            Not available for your role
                                        </div>
                                    </div>
                                )}
                                {plan.popular && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg whitespace-nowrap">
                                        {t('pricing.premium.popular')}
                                    </div>
                                )}

                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white text-2xl mb-8 shadow-lg`}>
                                    <FontAwesomeIcon icon={plan.icon} />
                                </div>

                                <h3 className="text-2xl font-bold text-dark mb-2 font-serif">{t(`pricing.${plan.key}.title`)}</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-black text-dark tracking-tighter">
                                        € {dbProduct ? parseFloat(dbProduct.price).toFixed(2) : t(`pricing.${plan.key}.price`)}
                                    </span>
                                    <span className="text-gray-400 text-sm font-medium">/ {t(`pricing.${plan.key}.period`)}</span>
                                </div>

                                <div className="h-px w-full bg-gray-100 my-8"></div>

                                <ul className="space-y-4 mb-10 flex-grow">
                                    {Array.isArray(features) && features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 group">
                                            <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${plan.popular ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-400'} shrink-0 group-hover:scale-110 transition-transform`}>
                                                <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                                            </div>
                                            <span className="text-gray-600 text-sm font-medium leading-relaxed font-description">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={(e) => { e.preventDefault(); if (!isDisabled) onOpenModal(plan.key); }}
                                    disabled={isDisabled}
                                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${isDisabled
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : plan.popular
                                            ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:shadow-2xl hover:bg-primary/95'
                                            : 'bg-white text-dark border border-gray-200 hover:border-dark hover:bg-dark hover:text-white shadow-sm'
                                        }`}
                                >
                                    {isDisabled ? 'Locked' : t(`pricing.${plan.key}.button`)}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Pricing;

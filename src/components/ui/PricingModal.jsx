import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faRocket, faCrown, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useTributeContext } from '../../context/TributeContext';

const PricingModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { products } = useTributeContext();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const getProductForPlan = (key) => {
        if (!products || !Array.isArray(products)) return null;
        return products.find(p => {
            const cat = p.category?.toLowerCase() || '';
            return cat === key || cat.includes(key);
        });
    };

    const plans = [
        {
            key: 'free',
            icon: faRocket,
            color: 'from-blue-500 to-indigo-600',
            popular: false,
        },
        {
            key: 'premium',
            icon: faCrown,
            color: 'from-amber-400 to-orange-500',
            popular: true,
        },
    ];

    const getFeaturesList = (planKey, dbProduct) => {
        if (dbProduct && dbProduct.description) {
            return dbProduct.description
                .replace(/<[^>]+>/g, '')
                .split('\n')
                .map(f => f.trim())
                .filter(Boolean);
        }
        return t(`pricing.${planKey}.features`, { returnObjects: true }) || [];
    };

    const handleSelectPlan = (planKey) => {
        onClose();
        // Store selected plan so register page can pick it up
        localStorage.setItem('selectedPlan', planKey);
        navigate('/login?tab=register');
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
                >
                    <FontAwesomeIcon icon={faTimes} className="text-gray-500 text-sm" />
                </button>

                {/* Header */}
                <div className="text-center pt-10 pb-6 px-8">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
                        Choose Your Plan
                    </h2>
                    <p className="text-gray-500 text-sm">Select a plan to publish your memorial page</p>
                </div>

                {/* Plans */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-8 pb-10">
                    {plans.map((plan) => {
                        const dbProduct = getProductForPlan(plan.key);
                        const features = getFeaturesList(plan.key, dbProduct);
                        const price = dbProduct ? parseFloat(dbProduct.price).toFixed(2) : t(`pricing.${plan.key}.price`);
                        const period = t(`pricing.${plan.key}.period`);

                        return (
                            <div
                                key={plan.key}
                                className={`relative flex flex-col p-7 rounded-2xl border-2 transition-all ${
                                    plan.popular
                                        ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02]'
                                        : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-1.5 rounded-full shadow whitespace-nowrap">
                                        Most Popular
                                    </div>
                                )}

                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white text-xl mb-5 shadow`}>
                                    <FontAwesomeIcon icon={plan.icon} />
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 font-serif mb-1">
                                    {t(`pricing.${plan.key}.title`)}
                                </h3>
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
                                    className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${
                                        plan.popular
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90'
                                            : 'bg-white text-gray-800 border border-gray-200 hover:border-gray-800 hover:bg-gray-900 hover:text-white'
                                    }`}
                                >
                                    {t(`pricing.${plan.key}.button`)}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PricingModal;

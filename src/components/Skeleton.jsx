import React from 'react';

const Skeleton = ({ className = '', variant = 'rectangle' }) => {
    const baseStyles = 'bg-gray-200 dark:bg-gray-800 animate-pulse';

    const variants = {
        rectangle: 'rounded-md',
        circle: 'rounded-full',
        movieCard: 'rounded-xl aspect-[3/4]',
        hero: 'rounded-none h-[65vh] w-full',
        text: 'h-4 rounded-md w-3/4'
    };

    return (
        <div className={`${baseStyles} ${variants[variant] || variants.rectangle} ${className}`}>
            <div className="w-full h-full relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
        </div>
    );
};

// Add shimmer animation to head if not exists
if (typeof document !== 'undefined') {
    const styleId = 'skeleton-animations';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            @keyframes shimmer {
                100% {
                    transform: translateX(100%);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

export default Skeleton;

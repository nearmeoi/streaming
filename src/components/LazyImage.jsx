import React, { useState, useRef, useEffect } from 'react';
import Skeleton from './Skeleton';

// Session-level cache to prevent re-loading flicker for already seen images
const imageCache = new Set();

const LazyImage = ({
    src,
    alt,
    className = '',
    placeholderClassName = '',
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(imageCache.has(src));
    const [isInView, setIsInView] = useState(imageCache.has(src));
    const imgRef = useRef(null);

    useEffect(() => {
        if (imageCache.has(src)) {
            setIsInView(true);
            setIsLoaded(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '200px', // Preload earlier for smoother experience
                threshold: 0.01
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [src]);

    const handleLoad = () => {
        imageCache.add(src);
        setIsLoaded(true);
    };

    return (
        <div ref={imgRef} className={`relative overflow-hidden ${className}`} {...props}>
            {/* Skeleton Placeholder */}
            {!isLoaded && (
                <Skeleton
                    className={`absolute inset-0 ${placeholderClassName}`}
                    variant="rectangle"
                />
            )}

            {/* Actual Image */}
            {isInView && src && (
                <img
                    src={src}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    onLoad={handleLoad}
                    loading="lazy"
                />
            )}
        </div>
    );
};

export default LazyImage;

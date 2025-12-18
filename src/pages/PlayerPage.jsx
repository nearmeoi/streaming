import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, Play, Pause, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { apiService } from "../services/apiService";
import { historyService } from "../services/historyService";
import Skeleton from "../components/Skeleton";

// Simple HLS script loader
const loadHls = () => {
    return new Promise((resolve) => {
        if (window.Hls) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
};

const PlayerPage = () => {
    const { bookId } = useParams();
    const location = useLocation();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
    const [drama, setDrama] = useState(location.state?.drama || null);
    const [episodes, setEpisodes] = useState([]);
    const [videoUrl, setVideoUrl] = useState(null);
    const [loading, setLoading] = useState(!drama);
    const [videoLoading, setVideoLoading] = useState(false);
    const [showEpisodes, setShowEpisodes] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    // Fetch drama details and episodes list
    useEffect(() => {
        const fetchDrama = async () => {
            if (!bookId) return;

            setLoading(true);
            try {
                const data = await apiService.get(`/api/detail/${bookId}`);
                if (data) {
                    setDrama({
                        bookId: data.id || bookId,
                        bookName: data.title,
                        coverWap: data.poster,
                        introduction: data.description,
                        tags: data.genres || [],
                        totalEp: data.episodeCount || (data.episodes?.length || 0)
                    });
                    setEpisodes(data.episodes || []);
                }
            } catch (error) {
                console.error("Failed to fetch drama:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDrama();
    }, [bookId]);

    // Fetch video URL when episode changes
    useEffect(() => {
        const fetchVideo = async () => {
            if (!bookId || episodes.length === 0) return;

            const currentEp = episodes[currentEpisodeIndex];
            if (!currentEp) return;

            setVideoLoading(true);
            try {
                const data = await apiService.get(`/api/play/${bookId}/${currentEp.id}`);
                if (data && data.videoUrl) {
                    setVideoUrl(data.videoUrl);
                }
            } catch (error) {
                console.error("Failed to fetch video:", error);
            } finally {
                setVideoLoading(false);
            }
        };

        fetchVideo();
    }, [bookId, currentEpisodeIndex, episodes]);

    // Handle HLS and Video Source
    useEffect(() => {
        if (!videoUrl || !videoRef.current) return;

        const video = videoRef.current;

        // Clean up previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const initVideo = async () => {
            if (videoUrl.includes('.m3u8')) {
                const hlsSupported = await loadHls();
                if (hlsSupported && window.Hls.isSupported()) {
                    const hls = new window.Hls();
                    hls.loadSource(videoUrl);
                    hls.attachMedia(video);
                    hlsRef.current = hls;
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    // Native HLS (Safari/iOS)
                    video.src = videoUrl;
                }
            } else {
                // Normal MP4
                video.src = videoUrl;
            }
        };

        initVideo();

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [videoUrl]);

    // Save to history when drama loads
    useEffect(() => {
        if (drama && bookId) {
            historyService.addToHistory({
                bookId: bookId,
                title: drama.bookName || drama.title,
                cover: drama.coverWap || drama.cover,
                episode: currentEpisodeIndex + 1,
                progress: progress
            });
        }
    }, [drama, bookId]);

    // Update progress periodically
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPlaying && drama) {
                historyService.updateProgress(bookId, progress, currentEpisodeIndex + 1);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [isPlaying, progress, currentEpisodeIndex, bookId, drama]);

    // Auto-hide controls
    useEffect(() => {
        if (showControls && isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
        return () => clearTimeout(controlsTimeoutRef.current);
    }, [showControls, isPlaying]);

    const handleScreenTap = () => {
        setShowControls(true);
        if (!isPlaying) {
            togglePlay();
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(console.error);
            }
            setIsPlaying(!isPlaying);
        } else {
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
        setIsMuted(!isMuted);
    };

    const handleVideoProgress = (e) => {
        const video = e.target;
        if (video.duration) {
            const progressPercent = (video.currentTime / video.duration) * 100;
            setProgress(progressPercent);
            setCurrentTime(video.currentTime);
            setDuration(video.duration);
        }
    };

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newProgress = (clickX / rect.width) * 100;
        setProgress(newProgress);
        if (videoRef.current && duration) {
            videoRef.current.currentTime = (newProgress / 100) * duration;
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const changeEpisode = (index) => {
        setCurrentEpisodeIndex(index);
        setProgress(0);
        setCurrentTime(0);
        setVideoUrl(null);
        setShowEpisodes(false);
        setIsPlaying(false);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black text-white z-50 flex flex-col p-4">
                <Skeleton variant="rectangle" className="w-full aspect-video rounded-2xl mb-6 mt-12" />
                <div className="space-y-4">
                    <Skeleton className="w-3/4 h-8" />
                    <Skeleton className="w-1/4 h-6" />
                    <Skeleton className="w-full h-20" />
                    <div className="grid grid-cols-5 gap-2 pt-4">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black text-white z-50 overflow-hidden">
            {/* Video/Image Background */}
            <div className="absolute inset-0 bg-gray-900" onClick={handleScreenTap}>
                {videoUrl ? (
                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain bg-black"
                        onTimeUpdate={handleVideoProgress}
                        onLoadedMetadata={(e) => setDuration(e.target.duration)}
                        onEnded={() => setIsPlaying(false)}
                        playsInline
                        muted={isMuted}
                    />
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={drama?.coverWap || drama?.cover || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop"}
                            alt={drama?.bookName || "Video Background"}
                            className="w-full h-full object-cover opacity-60"
                        />
                        {videoLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                            </div>
                        )}
                    </div>
                )}

                {/* Play/Pause Overlay */}
                {!isPlaying && showControls && !videoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/40 rounded-full p-6">
                            <Play size={48} className="text-white fill-white ml-1" />
                        </div>
                    </div>
                )}
            </div>

            {/* Top Navigation - Only show when controls visible */}
            {showControls && (
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-10">
                    <Link to="/" className="p-2 rounded-full active:bg-white/20 transition-colors">
                        <ChevronLeft size={28} />
                    </Link>
                    <h2 className="font-bold text-shadow-md">DramaBox</h2>
                    <button onClick={toggleMute} className="p-2 rounded-full active:bg-white/20 transition-colors">
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                </div>
            )}

            {/* Bottom Info Area - Only show when controls visible */}
            {showControls && (
                <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10">
                    {/* Drama Info */}
                    <div className="mb-4">
                        <h3 className="text-xl font-bold mb-2 text-shadow-md line-clamp-1">
                            {drama?.bookName || "Loading..."}
                        </h3>

                        {/* Episode Button */}
                        <button
                            onClick={() => setShowEpisodes(!showEpisodes)}
                            className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 mb-3"
                        >
                            Episode {currentEpisodeIndex + 1}
                            <ChevronDown size={16} className={`transform transition-transform ${showEpisodes ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Description */}
                        <p className="text-sm opacity-80 line-clamp-2 leading-relaxed">
                            {drama?.introduction || "Memuat deskripsi..."}
                        </p>
                    </div>

                    {/* Episode Selector */}
                    {showEpisodes && (
                        <div className="mb-4 bg-black/70 backdrop-blur-sm rounded-xl p-3 max-h-40 overflow-y-auto">
                            <div className="grid grid-cols-5 gap-2">
                                {episodes.map((ep, index) => (
                                    <button
                                        key={ep.id}
                                        onClick={() => changeEpisode(index)}
                                        className={`py-2.5 rounded-lg text-sm font-bold transition-colors ${index === currentEpisodeIndex
                                            ? 'bg-primary text-white'
                                            : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {ep.number || index + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono opacity-70 min-w-[40px]">
                            {formatTime(currentTime)}
                        </span>
                        <div
                            className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer group"
                            onClick={handleSeek}
                        >
                            <div
                                className="h-full bg-primary rounded-full transition-all group-hover:h-2"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs font-mono opacity-70 min-w-[40px] text-right">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerPage;

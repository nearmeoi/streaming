import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, Play, Pause, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { apiService } from "../services/apiService";
import { historyService } from "../services/historyService";

const PlayerPage = () => {
    const { bookId } = useParams();
    const location = useLocation();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentEpisode, setCurrentEpisode] = useState(1);
    const [drama, setDrama] = useState(location.state?.drama || null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [loading, setLoading] = useState(!drama);
    const [showEpisodes, setShowEpisodes] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const videoRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    // If drama data wasn't passed via state, try to fetch it
    useEffect(() => {
        const fetchDrama = async () => {
            if (drama) {
                setLoading(false);
                return;
            }

            if (!bookId) return;

            setLoading(true);
            try {
                const data = await apiService.get(`/api/dramabox/detail/${bookId}`);
                if (data) {
                    setDrama(data);
                }
            } catch (error) {
                console.error("Failed to fetch drama:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDrama();
    }, [bookId, drama]);

    // Fetch video URL when episode changes
    useEffect(() => {
        const fetchVideo = async () => {
            if (!bookId) return;

            try {
                const data = await apiService.get(`/api/dramabox/play/${bookId}/${currentEpisode}`);
                if (data && data.playUrl) {
                    setVideoUrl(data.playUrl);
                }
            } catch (error) {
                console.error("Failed to fetch video:", error);
            }
        };

        fetchVideo();
    }, [bookId, currentEpisode]);

    // Save to history when drama loads
    useEffect(() => {
        if (drama && bookId) {
            historyService.addToHistory({
                bookId: bookId,
                title: drama.bookName || drama.title,
                cover: drama.coverWap || drama.cover,
                episode: currentEpisode,
                progress: progress
            });
        }
    }, [drama, bookId]);

    // Update progress periodically
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPlaying && drama) {
                historyService.updateProgress(bookId, progress, currentEpisode);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [isPlaying, progress, currentEpisode, bookId, drama]);

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

    const changeEpisode = (ep) => {
        setCurrentEpisode(ep);
        setProgress(0);
        setCurrentTime(0);
        setShowEpisodes(false);
        setIsPlaying(false);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black text-white z-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
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
                        src={videoUrl}
                        className="w-full h-full object-contain bg-black"
                        onTimeUpdate={handleVideoProgress}
                        onLoadedMetadata={(e) => setDuration(e.target.duration)}
                        onEnded={() => setIsPlaying(false)}
                        playsInline
                        muted={isMuted}
                    />
                ) : (
                    <img
                        src={drama?.coverWap || drama?.cover || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop"}
                        alt={drama?.bookName || "Video Background"}
                        className="w-full h-full object-cover opacity-60"
                    />
                )}

                {/* Play/Pause Overlay */}
                {!isPlaying && showControls && (
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
                            Episode {currentEpisode}
                            <ChevronDown size={16} className={`transform transition-transform ${showEpisodes ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Description */}
                        <p className="text-sm opacity-80 line-clamp-2 leading-relaxed">
                            {drama?.introduction || "Loading description..."}
                        </p>
                    </div>

                    {/* Episode Selector */}
                    {showEpisodes && (
                        <div className="mb-4 bg-black/70 backdrop-blur-sm rounded-xl p-3 max-h-40 overflow-y-auto">
                            <div className="grid grid-cols-5 gap-2">
                                {Array.from({ length: drama?.totalEp || 50 }, (_, i) => i + 1).map((ep) => (
                                    <button
                                        key={ep}
                                        onClick={() => changeEpisode(ep)}
                                        className={`py-2.5 rounded-lg text-sm font-bold transition-colors ${ep === currentEpisode
                                                ? 'bg-primary text-white'
                                                : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {ep}
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

import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Play, Pause, ChevronDown, Volume2, VolumeX, AlertTriangle, RotateCcw } from "lucide-react";
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
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
};

const PlayerPage = () => {
    const { bookId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
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
    const [videoError, setVideoError] = useState(null);
    const [showEpisodes, setShowEpisodes] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    const [retryCounter, setRetryCounter] = useState(0);

    // Sync isPlaying with DOM events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onWaiting = () => setVideoLoading(true);
        const onPlaying = () => setVideoLoading(false);

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('playing', onPlaying);

        return () => {
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('playing', onPlaying);
        };
    }, [videoUrl]); // Re-attach when source changes

    // Fetch drama details
    useEffect(() => {
        const fetchDrama = async () => {
            if (!bookId) return;
            setLoading(true);
            setVideoError(null);
            try {
                const data = await apiService.getDetail(bookId);
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
                setVideoError("Gagal memuat detail drama");
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
            if (!currentEp) {
                console.error('[Player] No episode found at index:', currentEpisodeIndex);
                return;
            }

            const episodeIndex = currentEpisodeIndex;
            console.log(`[Player] Fetching video for episode index ${episodeIndex}`);
            setVideoLoading(true);
            setVideoError(null);

            try {
                // Pass episode INDEX (0-based)
                const data = await apiService.getVideoUrl(bookId, episodeIndex);
                console.log('[Player] API Response:', data);
                if (data && data.videoUrl) {
                    console.log(`[Player] Got video URL for episode ${currentEpisodeIndex + 1}`);
                    setVideoUrl(data.videoUrl);
                } else {
                    setVideoError("Video tidak ditemukan untuk episode ini");
                }
            } catch (error) {
                console.error("[Player] Failed to fetch video:", error);
                setVideoError(error.message || "Gagal mengambil URL video");
            } finally {
                setVideoLoading(false);
            }
        };

        fetchVideo();
    }, [bookId, currentEpisodeIndex, episodes, retryCounter]);

    // Handle HLS and Video Source
    useEffect(() => {
        if (!videoUrl || !videoRef.current) return;

        const video = videoRef.current;
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const initVideo = async () => {
            if (videoUrl.includes('.m3u8')) {
                const hlsSupported = await loadHls();
                if (hlsSupported && window.Hls.isSupported()) {
                    const hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                    hls.loadSource(videoUrl);
                    hls.attachMedia(video);
                    hlsRef.current = hls;

                    hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                        video.play().catch(e => {
                            if (e.name !== 'AbortError') console.log("Autoplay blocked:", e);
                        });
                    });

                    hls.on(window.Hls.Events.ERROR, (event, data) => {
                        if (data.fatal) {
                            switch (data.type) {
                                case window.Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
                                case window.Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
                                default:
                                    setVideoError("HLS playback failed");
                                    hls.destroy();
                                    break;
                            }
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = videoUrl;
                    video.play().catch(() => { });
                } else {
                    setVideoError("HLS not supported in this browser");
                }
            } else {
                video.src = videoUrl;
                video.load();
                video.play().catch(() => { });
            }
        };

        initVideo();

        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, [videoUrl]);

    // Auto-hide controls
    useEffect(() => {
        if (showControls && isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
        return () => clearTimeout(controlsTimeoutRef.current);
    }, [showControls, isPlaying]);

    // History and progress
    useEffect(() => {
        if (drama && bookId) {
            historyService.addToHistory({
                bookId,
                title: drama.bookName,
                cover: drama.coverWap,
                episode: currentEpisodeIndex + 1,
                progress
            });
        }
    }, [drama, currentEpisodeIndex]);

    const togglePlay = (e) => {
        if (e) e.stopPropagation();
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(err => {
                    if (err.name !== 'AbortError') console.error("Play error:", err);
                });
            } else {
                videoRef.current.pause();
            }
        }
    };

    const toggleMute = (e) => {
        if (e) e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleSeek = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newProgress = (clickX / rect.width) * 100;
        if (videoRef.current && duration) {
            videoRef.current.currentTime = (newProgress / 100) * duration;
        }
    };

    const changeEpisode = (index) => {
        if (index === currentEpisodeIndex) return;
        setCurrentEpisodeIndex(index);
        setProgress(0);
        setCurrentTime(0);
        setVideoUrl(null);
        setShowEpisodes(false);
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black text-white z-50 flex flex-col p-4">
                <Skeleton variant="rectangle" className="w-full aspect-video rounded-2xl mb-6 mt-12" />
                <div className="space-y-4 px-2">
                    <Skeleton className="w-3/4 h-8" />
                    <Skeleton className="w-1/4 h-6" />
                    <Skeleton className="w-full h-20" />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black text-white z-50 overflow-hidden select-none font-sans">
            {/* Main Video Area */}
            <div className="absolute inset-0 bg-gray-900" onClick={() => setShowControls(true)}>
                {videoUrl && !videoError ? (
                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain bg-black"
                        onTimeUpdate={(e) => {
                            const v = e.target;
                            setProgress((v.currentTime / v.duration) * 100 || 0);
                            setCurrentTime(v.currentTime);
                            setDuration(v.duration);
                        }}
                        onEnded={() => {
                            if (currentEpisodeIndex < episodes.length - 1) {
                                changeEpisode(currentEpisodeIndex + 1);
                            }
                        }}
                        playsInline
                        muted={isMuted}
                    />
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={drama?.coverWap}
                            className="w-full h-full object-cover opacity-40 blur-sm"
                            alt=""
                        />
                        {videoLoading && !videoError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-4 text-xs font-bold tracking-widest text-primary animate-pulse">MEMUAT VIDEO...</p>
                            </div>
                        )}
                        {videoError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-8 text-center">
                                <AlertTriangle size={48} className="text-red-500 mb-4" />
                                <h3 className="text-lg font-bold mb-2">Gagal Memutar</h3>
                                <p className="text-sm opacity-60 mb-6">{videoError}</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setRetryCounter(c => c + 1); }}
                                    className="bg-primary px-8 py-3 rounded-full font-bold flex items-center gap-2"
                                >
                                    <RotateCcw size={18} /> Coba Lagi
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Big Play Button Overlay */}
                {!isPlaying && videoUrl && !videoLoading && !videoError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={togglePlay}
                            className="bg-primary w-20 h-20 rounded-full flex items-center justify-center shadow-2xl scale-110 active:scale-95 transition-transform"
                        >
                            <Play size={36} fill="white" className="ml-1" />
                        </button>
                    </div>
                )}
            </div>

            {/* Tap areas for play/pause when in middle */}
            {isPlaying && (
                <div
                    className="absolute inset-[30%] z-0"
                    onClick={togglePlay}
                ></div>
            )}

            {/* Top Bar */}
            <div className={`absolute top-0 left-0 right-0 p-4 pt-8 bg-gradient-to-b from-black/80 to-transparent z-10 transition-transform duration-500 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="flex justify-between items-center">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h2 className="text-xs font-black tracking-widest opacity-40 uppercase">Dramabox</h2>
                        <p className="text-sm font-bold truncate max-w-[200px]">{drama?.bookName}</p>
                    </div>
                    <button onClick={toggleMute} className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                        {isMuted ? <VolumeX size={20} className="text-red-500" /> : <Volume2 size={20} />}
                    </button>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className={`absolute bottom-0 left-0 right-0 p-6 pb-12 bg-gradient-to-t from-black to-transparent z-10 transition-transform duration-500 ${showControls ? 'translate-y-0' : 'translate-y-full'}`}>
                {/* Info & Episode Button */}
                <div className="flex items-end justify-between mb-4">
                    <div className="flex-1 mr-4">
                        <h3 className="text-lg font-black italic line-clamp-1">{drama?.bookName}</h3>
                        <div className="flex gap-2 mt-1">
                            {drama?.tags?.slice(0, 2).map((t, i) => (
                                <span key={`${t}-${i}`} className="text-[9px] font-bold opacity-40 border border-white/20 px-1.5 py-0.5 rounded uppercase">{t}</span>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowEpisodes(!showEpisodes); }}
                        className="bg-primary px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg"
                    >
                        EPS {currentEpisodeIndex + 1}
                        <ChevronDown size={14} className={`transition-transform ${showEpisodes ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-mono opacity-40 w-10">{formatTime(currentTime)}</span>
                    <div className="flex-1 h-1 bg-white/20 rounded-full relative cursor-pointer" onClick={handleSeek}>
                        <div className="absolute top-1/2 -translate-y-1/2 w-full h-4 -mt-2"></div> {/* Larger hit area */}
                        <div className="h-full bg-primary rounded-full relative" style={{ width: `${progress}%` }}>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full scale-0 hover:scale-100 transition-transform"></div>
                        </div>
                    </div>
                    <span className="text-[10px] font-mono opacity-40 w-10 text-right">{formatTime(duration)}</span>
                </div>

                {/* Episode Grid Overlay */}
                {showEpisodes && (
                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 max-h-48 overflow-y-auto grid grid-cols-5 gap-2 scrollbar-hide">
                        {episodes.map((ep, idx) => (
                            <button
                                key={ep.id || idx}
                                onClick={(e) => { e.stopPropagation(); changeEpisode(idx); }}
                                className={`py-3 rounded-xl text-xs font-black transition-all ${idx === currentEpisodeIndex ? 'bg-white text-black' : 'bg-white/10'}`}
                            >
                                {ep.number || idx + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerPage;

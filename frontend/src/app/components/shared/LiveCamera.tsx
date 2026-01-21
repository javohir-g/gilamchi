import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Circle } from 'lucide-react';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'motion/react';

interface LiveCameraProps {
    onCapture: (imageData: string) => void;
    onClose: () => void;
    title?: string;
}

export function LiveCamera({ onCapture, onClose, title = "Rasmga olish" }: LiveCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [error, setError] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    const startCamera = useCallback(async () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Kameraga ruxsat berilmadi yoki kamera topilmadi.");
        }
    }, [facingMode]);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]);

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            setIsCapturing(true);
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                // Match canvas size to video aspect ratio
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Draw video frame to canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Convert to base64
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                onCapture(imageData);

                // Brief delay for animation feel
                setTimeout(() => {
                    setIsCapturing(false);
                    onClose();
                }, 300);
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent absolute top-0 left-0 right-0 z-10">
                <h3 className="text-white font-medium">{title}</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white hover:bg-white/20 rounded-full"
                >
                    <X className="h-6 w-6" />
                </Button>
            </div>

            {/* Video Preview */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {error ? (
                    <div className="p-6 text-center text-white space-y-4">
                        <p>{error}</p>
                        <Button onClick={onClose} variant="outline" className="border-white text-white">
                            Yopish
                        </Button>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                )}

                {/* Flash effect */}
                <AnimatePresence>
                    {isCapturing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white z-20"
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Controls */}
            <div className="p-8 pb-12 bg-gradient-to-t from-black/70 to-transparent absolute bottom-0 left-0 right-0 flex items-center justify-around z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCamera}
                    className="text-white hover:bg-white/20 rounded-full h-12 w-12"
                    disabled={!!error}
                >
                    <RefreshCw className="h-6 w-6" />
                </Button>

                <button
                    onClick={capturePhoto}
                    disabled={!!error || !stream}
                    className="relative group transition-transform active:scale-90"
                >
                    <div className="h-20 w-20 rounded-full border-4 border-white flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-white group-hover:bg-gray-200 transition-colors" />
                    </div>
                </button>

                <div className="w-12 h-12" /> {/* Spacer to balance layout */}
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </motion.div>
    );
}

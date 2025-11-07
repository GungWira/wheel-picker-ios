import { useState, useEffect, useRef } from "react";
import "./App.css";
import items from "./data/data.json";

const IOSWheelPicker = () => {
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [winner, setWinner] = useState("");
  const animationRef = useRef<number | null>(null);
  const idleAnimationRef = useRef<number | null>(null);
  const pauseTimeoutRef = useRef<number | null>(null);
  const containerSpinnerRef = useRef<HTMLDivElement | null>(null);

  // Animasi idle
  useEffect(() => {
    if (!isAnimating && !isPaused) {
      const startTime = Date.now();
      const startOffset = offset;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newOffset = startOffset + elapsed * 0.003;
        setOffset(newOffset);
        idleAnimationRef.current = requestAnimationFrame(animate);
      };

      idleAnimationRef.current = requestAnimationFrame(animate);

      return () => {
        if (idleAnimationRef.current) {
          cancelAnimationFrame(idleAnimationRef.current);
        }
      };
    }
  }, [isAnimating, isPaused, offset]);

  const pickRandom = async () => {
    if (isAnimating) return;

    // Hentikan animasi idle
    if (idleAnimationRef.current) {
      cancelAnimationFrame(idleAnimationRef.current);
    }

    // Hapus semua pause yang diset
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }

    setIsAnimating(true);
    setIsPaused(false);
    setShowWinner(false);

    const container = containerSpinnerRef.current;
    if (!container) return;

    container.classList.replace("max-w-xl", "max-w-4xl");

    await new Promise<void>((resolve) => {
      const onTransitionEnd = (e: TransitionEvent) => {
        if (e.target === container) {
          container.removeEventListener("transitionend", onTransitionEnd);
          resolve();
        }
      };
      container.addEventListener("transitionend", onTransitionEnd);
    });

    const randomIndex = Math.floor(Math.random() * items.length);
    const currentNormalizedOffset = offset % (items.length * 60);
    const extraSpins = 5 + Math.floor(Math.random() * 3);

    const targetOffset = randomIndex * 60 + 32;
    const totalDistance =
      extraSpins * items.length * 60 + (targetOffset - currentNormalizedOffset);

    const duration = 10000 + Math.random() * 5000; // 10-15 detik
    const startTime = Date.now();
    const startOffset = offset;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);

      const newOffset = startOffset + totalDistance * easeOut;
      setOffset(newOffset);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        const finalPosition = startOffset + totalDistance;
        setOffset(finalPosition);
        setIsAnimating(false);
        setIsPaused(true);
        setWinner(items[randomIndex]);
        setShowWinner(true);

        const pauseDuration = 10;
        pauseTimeoutRef.current = setTimeout(() => {
          setIsPaused(false);
        }, pauseDuration);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const stopShowWinner = () => {
    setShowWinner(false);
    setIsPaused(false);

    const container = containerSpinnerRef.current;
    if (!container) return;

    setTimeout(() => {
      container.classList.replace("max-w-4xl", "max-w-xl");
    }, 200);
  };

  const getItemStyle = (index: number) => {
    const itemHeight = 60;
    const totalHeight = items.length * itemHeight;

    const displayOffset = isPaused
      ? Math.round(offset / itemHeight) * itemHeight + 32
      : offset;

    let position = (index * itemHeight - displayOffset) % totalHeight;
    if (position < -totalHeight / 2) position += totalHeight;
    if (position > totalHeight / 2) position -= totalHeight;

    const centerDistance = Math.abs(position);
    const maxDistance = 150;

    const opacity = Math.max(0.2, 1 - centerDistance / maxDistance);

    const scale = Math.max(0.7, 1 - centerDistance / 300);

    return {
      transform: `translateY(${position}px) scale(${scale})`,
      opacity: opacity,
      transition: isAnimating ? "none" : "all 0.1s ease-out",
    };
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div
        className="w-full max-w-xl p-8 transition-all duration-500 ease-in-out"
        ref={containerSpinnerRef}
      >
        <div className="bg-white rounded-3xl p-8">
          <h1 className="text-2xl font-semibold text-center mb-2 text-gray-800">
            Roda Undian
          </h1>
          <p className="text-base text-gray-800/80 text-center mb-8">
            Tekan tombol untuk mencari pemenang beruntung hari ini!
          </p>

          <div className="relative h-80 overflow-hidden mb-8 bg-gray-50 rounded-2xl">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-16 bg-blue-500/10 border-t-2 border-b-2 border-blue-500 pointer-events-none z-10" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="absolute left-0 right-0 h-16 flex items-center justify-center text-xl font-medium text-gray-800"
                    style={getItemStyle(index)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-b from-gray-50 to-transparent pointer-events-none z-20" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-gray-50 to-transparent pointer-events-none z-20" />
          </div>

          <button
            onClick={pickRandom}
            disabled={isAnimating}
            className="w-full py-4 bg-blue-500 text-white font-semibold rounded-2xl  hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnimating ? "Mengacak..." : "Pilih Acak"}
          </button>
        </div>

        {showWinner && (
          <div className="fixed inset-0 bg-black/90 bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-xl w-full transform animate-scaleIn">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  SELAMAT KEPADA
                </h2>
                <p className="text-base text-gray-800/80 mb-4">
                  Kami ucapkan selamat kepada peserta beruntung hari ini!
                </p>
                <div className="text-4xl font-semibold text-blue-500 mb-8">
                  {winner}
                </div>
                <button
                  onClick={stopShowWinner}
                  className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 active:scale-95 transition-all"
                >
                  Lanjutkan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IOSWheelPicker;

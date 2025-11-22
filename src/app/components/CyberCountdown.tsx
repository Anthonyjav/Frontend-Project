"use client";
import { useEffect, useState } from "react";

export default function CyberCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    const endDate = new Date("2025-11-30T23:59:59").getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate - now;

      if (distance <= 0) {
        clearInterval(timer);
        setTimeLeft({ hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      const hours = Math.floor((distance / 1000 / 60 / 60) % 24);
      const minutes = Math.floor((distance / 1000 / 60) % 60);
      const seconds = Math.floor((distance / 1000) % 60);

      setTimeLeft({
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full text-center py-10 bg-[#050815] border-y border-[#1ac8ff] shadow-[0_0_20px_#1ac8ff]">
      <h2 className="text-[#1ac8ff] text-3xl font-extrabold tracking-wide drop-shadow-[0_0_10px_#1ac8ff]">
        TERMINA EN
      </h2>

      <div className="flex justify-center gap-6 mt-6 text-white text-5xl font-mono">
        <div className="px-4 py-3 bg-[#0b132b] rounded-lg shadow-[0_0_15px_#1ac8ff]">
          {timeLeft.hours}
          <span className="text-[#1ac8ff] text-sm block">Horas</span>
        </div>
        <div className="px-4 py-3 bg-[#0b132b] rounded-lg shadow-[0_0_15px_#1ac8ff]">
          {timeLeft.minutes}
          <span className="text-[#1ac8ff] text-sm block">Min</span>
        </div>
        <div className="px-4 py-3 bg-[#0b132b] rounded-lg shadow-[0_0_15px_#1ac8ff]">
          {timeLeft.seconds}
          <span className="text-[#1ac8ff] text-sm block">Seg</span>
        </div>
      </div>
    </div>
  );
}

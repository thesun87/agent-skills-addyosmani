"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface OrderSoundAlertProps {
  orders: Array<{ id: string; status: string }>;
}

export function OrderSoundAlert({ orders }: OrderSoundAlertProps) {
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("tuanlinh_admin_sound_enabled") === "true";
    } catch {
      return false;
    }
  });
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playChime = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/new-order.mp3");
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Fallback: Web Audio API synthesized ding-dong bell
        try {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (!AudioContextClass) return;
          const ctx = new AudioContextClass();
          const now = ctx.currentTime;

          // Ding (880Hz)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(880, now);
          gain1.gain.setValueAtTime(0.3, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.5);

          // Dong (1320Hz)
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(1320, now + 0.15);
          gain2.gain.setValueAtTime(0.3, now + 0.15);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.15);
          osc2.stop(now + 0.7);
        } catch {
          // Audio blocked or not supported
        }
      });
    } catch {
      // Audio error ignored
    }
  }, []);

  const toggleSound = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    try {
      localStorage.setItem("tuanlinh_admin_sound_enabled", String(next));
    } catch {
      // Ignore storage errors
    }

    if (next) {
      // Test play chime immediately when user turns on sound (also satisfies browser autoplay policy)
      playChime();
    }
  };

  // Detect incoming new PENDING orders
  useEffect(() => {
    if (orders.length === 0) return;

    if (isFirstLoadRef.current) {
      // Populate initial set of known orders on first load so we don't alert old orders
      orders.forEach((o) => seenOrderIdsRef.current.add(o.id));
      isFirstLoadRef.current = false;
      return;
    }

    let hasNewPending = false;
    for (const order of orders) {
      if (!seenOrderIdsRef.current.has(order.id)) {
        seenOrderIdsRef.current.add(order.id);
        if (order.status === "PENDING") {
          hasNewPending = true;
        }
      }
    }

    if (hasNewPending && isEnabled) {
      playChime();
    }
  }, [orders, isEnabled, playChime]);

  return (
    <button
      type="button"
      className={`sound-toggle-btn inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
        isEnabled
          ? "sound-on bg-emerald-50 border-emerald-400 text-emerald-800"
          : "bg-surface border-border text-text hover:bg-[#f2e6d6]"
      }`}
      id="btn-sound-toggle"
      onClick={toggleSound}
      title="Bật âm báo đơn mới để nghe chuông khi khách đặt"
    >
      <span id="sound-icon">{isEnabled ? "🔔" : "🔇"}</span>
      <span id="sound-label">{isEnabled ? "Đang bật âm báo" : "Bật âm báo"}</span>
    </button>
  );
}

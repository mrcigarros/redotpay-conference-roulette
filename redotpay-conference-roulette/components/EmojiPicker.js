"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const Picker = dynamic(() => import("emoji-picker-react").then(mod => mod.default), { ssr: false });

export default function EmojiPicker({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={popupRef}>
      <button onClick={() => setOpen(!open)} style={{
        fontSize: "1.6rem", width: 52, height: 52, borderRadius: 14,
        border: open ? "2px solid rgba(212,32,53,0.5)" : "2px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.06)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}>
        {selected || "😀"}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 8, zIndex: 9999,
          borderRadius: 12, overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        }}>
          <Picker
            onEmojiClick={(emojiData) => {
              onSelect(emojiData.emoji);
              setOpen(false);
            }}
            theme="dark"
            width={320}
            height={400}
            searchPlaceHolder="Search emojis..."
            previewConfig={{ showPreview: false }}
            skinTonesDisabled={false}
            lazyLoadEmojis={true}
          />
        </div>
      )}
    </div>
  );
}

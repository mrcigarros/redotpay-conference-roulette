"use client";
import { useState, useRef, useEffect } from "react";

// ============ COMPLETE EMOJI DATABASE BY CATEGORY ============
const CATEGORIES = [
  { id: "recent", icon: "🕐", label: "Recent" },
  { id: "smileys", icon: "😀", label: "Smileys & People" },
  { id: "animals", icon: "🐻", label: "Animals & Nature" },
  { id: "food", icon: "🍔", label: "Food & Drink" },
  { id: "travel", icon: "✈️", label: "Travel & Places" },
  { id: "activities", icon: "⚽", label: "Activities" },
  { id: "objects", icon: "💡", label: "Objects" },
  { id: "symbols", icon: "❤️", label: "Symbols" },
  { id: "flags", icon: "🏁", label: "Flags" },
];

const EMOJIS = {
  smileys: [
    "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙",
    "🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒",
    "🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳",
    "🥸","😎","🤓","🧐","😕","🫤","😟","🙁","☹️","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥",
    "😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡",
    "👹","👺","👻","👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾","🙈","🙉","🙊",
    "👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉",
    "👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏",
  ],
  animals: [
    "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊",
    "🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋",
    "🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞",
    "🦀","🪼","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🪸","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏",
    "🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐈",
    "🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔",
    "🌵","🎄","🌲","🌳","🌴","🪵","🌱","🌿","☘️","🍀","🎍","🪴","🎋","🍃","🍂","🍁","🌾","🪻","🌺",
    "🌻","🌹","🥀","🌷","🪷","🌼","🌸","💐","🍄","🌰","🐚","🪨","🌎","🌍","🌏","🌕","🌑","⭐","🌟","💫",
  ],
  food: [
    "🍇","🍈","🍉","🍊","🍋","🍌","🍍","🥭","🍎","🍏","🍐","🍑","🍒","🍓","🫐","🥝","🍅","🫒","🥥",
    "🥑","🍆","🥔","🥕","🌽","🌶️","🫑","🥒","🥬","🥦","🧄","🧅","🥜","🫘","🌰","🍞","🥐","🥖","🫓",
    "🥨","🥯","🥞","🧇","🧀","🍖","🍗","🥩","🥓","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🫔","🥙","🧆",
    "🥚","🍳","🥘","🍲","🫕","🥣","🥗","🍿","🧈","🧂","🥫","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠",
    "🍢","🍣","🍤","🍥","🥮","🍡","🥟","🥠","🥡","🦀","🦞","🦐","🦑","🦪","🍦","🍧","🍨","🍩","🍪",
    "🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🫖","🍵","🍶","🍾","🍷","🍸","🍹",
    "🍺","🍻","🥂","🥃","🫗","🥤","🧋","🧃","🧉","🧊",
  ],
  travel: [
    "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🛵","🏍️","🛺","🚲","🛴",
    "🚏","🛣️","🛤️","⛽","🛞","🚨","🚥","🚦","🛑","🚧","⚓","🛟","⛵","🚤","🛳️","⛴️","🚢","✈️","🛩️",
    "🛫","🛬","🪂","💺","🚁","🚟","🚠","🚡","🛰️","🚀","🛸","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨",
    "🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽","⛪","🕌","🛕","🕍","⛩️","🕋","⛲","⛺","🌁",
    "🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏞️","🗾","🌅","🌄","🌠","🎆","🎇","🏙️","🌃","🌆","🌇","🌉",
  ],
  activities: [
    "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅",
    "⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂","🪂","🏋️","🤸",
    "🤺","⛹️","🤾","🏌️","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖️",
    "🏵️","🎗️","🎪","🤹","🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🪗","🎸","🪕",
    "🎻","🎲","♟️","🎯","🎳","🎮","🕹️","🎰",
  ],
  objects: [
    "⌚","📱","📲","💻","⌨️","🖥️","🖨️","🖱️","🖲️","🕹️","🗜️","💽","💾","💿","📀","📼","📷","📸","📹",
    "🎥","📽️","🎞️","📞","☎️","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏲️","⏰","🕰️","⌛","⏳",
    "📡","🔋","🪫","🔌","💡","🔦","🕯️","🪔","🧯","🛢️","💸","💵","💴","💶","💷","🪙","💰","💳","💎",
    "⚖️","🪜","🧰","🪛","🔧","🔨","⚒️","🛠️","⛏️","🪚","🔩","⚙️","🪤","🧲","🔫","💣","🧨","🪓","🔪",
    "🗡️","⚔️","🛡️","🚬","⚰️","🪦","⚱️","🏺","🔮","📿","🧿","🪬","💈","⚗️","🔭","🔬","🕳️","🩹","🩺",
    "🩻","🩼","💊","💉","🩸","🧬","🦠","🧫","🧪","🌡️","🧹","🪠","🧺","🧻","🚽","🚰","🚿","🛁","🛀",
    "🪥","🪒","🧴","🧷","🧹","🧺","🧻","🧼","🫧","🪥","🪒","🧴","🧷","🧹",
    "🎁","🎀","🪄","🪅","🪆","🪩","🎈","🎉","🎊","🎋","🎍","🎎","🎏","🎐","🧧","🎑","🎃","🎄","🎆","🎇",
    "🧨","✨","🎠","🎡","🎢","🎪",
    "📦","📫","📬","📭","📮","📯","📜","📃","📄","📑","🧾","📊","📈","📉","🗒️","🗓️","📆","📅","🗑️",
    "📇","🗃️","🗳️","🗄️","📋","📁","📂","🗂️","🗞️","📰","📓","📔","📒","📕","📗","📘","📙","📚","📖",
    "🔖","🧷","🔗","📎","🖇️","📐","📏","🧮","📌","📍","✂️","🖊️","🖋️","✒️","🖌️","🖍️","📝","✏️","🔍",
    "🔎","🔏","🔐","🔒","🔓",
  ],
  symbols: [
    "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝",
    "💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎",
    "♏","♐","♑","♒","♓","🆔","⚛️","🉑","☢️","☣️","📴","📳","🈶","🈚","🈸","🈺","🈷️","✴️","🆚",
    "💮","🉐","㊙️","㊗️","🈴","🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⭕","🛑","⛔","📛",
    "🚫","💯","💢","♨️","🚷","🚯","🚳","🚱","🔞","📵","🚭","❗","❕","❓","❔","‼️","⁉️","🔅","🔆",
    "〽️","⚠️","🚸","🔱","⚜️","🔰","♻️","✅","🈯","💹","❇️","✳️","❎","🌐","💠","Ⓜ️","🌀","💤","🏧",
    "🚾","♿","🅿️","🛗","🈳","🈂️","🛂","🛃","🛄","🛅","🚹","🚺","🚼","⚧️","🚻","🚮","🎦","📶","🈁",
    "🔣","ℹ️","🔤","🔡","🔠","🆖","🆗","🆙","🆒","🆕","🆓","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟",
    "🔢","#️⃣","*️⃣","⏏️","▶️","⏸️","⏯️","⏹️","⏺️","⏭️","⏮️","⏩","⏪","⏫","⏬","◀️","🔼","🔽",
    "➡️","⬅️","⬆️","⬇️","↗️","↘️","↙️","↖️","↕️","↔️","↪️","↩️","⤴️","⤵️","🔀","🔁","🔂","🔄","🔃",
    "➕","➖","➗","✖️","♾️","💲","💱","™️","©️","®️","〰️","➰","➿","🔚","🔙","🔛","🔝","🔜",
    "✔️","☑️","🔘","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤","🔺","🔻","🔸","🔹","🔶","🔷",
    "🔳","🔲","▪️","▫️","◾","◽","◼️","◻️","🟥","🟧","🟨","🟩","🟦","🟪","⬛","⬜","🟫","🔈","🔇","🔉","🔊",
    "🔔","🔕","📣","📢","🏴","🏳️","🏳️‍🌈","🏳️‍⚧️","🏴‍☠️",
  ],
  flags: [
    "🇦🇫","🇦🇱","🇩🇿","🇦🇸","🇦🇩","🇦🇴","🇦🇮","🇦🇬","🇦🇷","🇦🇲","🇦🇼","🇦🇺","🇦🇹","🇦🇿","🇧🇸","🇧🇭","🇧🇩","🇧🇧","🇧🇾","🇧🇪",
    "🇧🇿","🇧🇯","🇧🇲","🇧🇹","🇧🇴","🇧🇦","🇧🇼","🇧🇷","🇧🇳","🇧🇬","🇧🇫","🇧🇮","🇰🇭","🇨🇲","🇨🇦","🇨🇻","🇨🇫","🇹🇩","🇨🇱","🇨🇳",
    "🇨🇴","🇰🇲","🇨🇬","🇨🇩","🇨🇷","🇭🇷","🇨🇺","🇨🇼","🇨🇾","🇨🇿","🇩🇰","🇩🇯","🇩🇲","🇩🇴","🇪🇨","🇪🇬","🇸🇻","🇬🇶","🇪🇷","🇪🇪",
    "🇪🇹","🇫🇯","🇫🇮","🇫🇷","🇬🇦","🇬🇲","🇬🇪","🇩🇪","🇬🇭","🇬🇷","🇬🇩","🇬🇹","🇬🇳","🇬🇼","🇬🇾","🇭🇹","🇭🇳","🇭🇰","🇭🇺","🇮🇸",
    "🇮🇳","🇮🇩","🇮🇷","🇮🇶","🇮🇪","🇮🇱","🇮🇹","🇯🇲","🇯🇵","🇯🇴","🇰🇿","🇰🇪","🇰🇮","🇽🇰","🇰🇼","🇰🇬","🇱🇦","🇱🇻","🇱🇧","🇱🇸",
    "🇱🇷","🇱🇾","🇱🇮","🇱🇹","🇱🇺","🇲🇴","🇲🇬","🇲🇼","🇲🇾","🇲🇻","🇲🇱","🇲🇹","🇲🇭","🇲🇷","🇲🇺","🇲🇽","🇫🇲","🇲🇩","🇲🇨","🇲🇳",
    "🇲🇪","🇲🇦","🇲🇿","🇲🇲","🇳🇦","🇳🇷","🇳🇵","🇳🇱","🇳🇿","🇳🇮","🇳🇪","🇳🇬","🇰🇵","🇲🇰","🇳🇴","🇴🇲","🇵🇰","🇵🇼","🇵🇸","🇵🇦",
    "🇵🇬","🇵🇾","🇵🇪","🇵🇭","🇵🇱","🇵🇹","🇵🇷","🇶🇦","🇷🇴","🇷🇺","🇷🇼","🇼🇸","🇸🇲","🇸🇦","🇸🇳","🇷🇸","🇸🇨","🇸🇱","🇸🇬","🇸🇰",
    "🇸🇮","🇸🇧","🇸🇴","🇿🇦","🇰🇷","🇸🇸","🇪🇸","🇱🇰","🇸🇩","🇸🇷","🇸🇪","🇨🇭","🇸🇾","🇹🇼","🇹🇯","🇹🇿","🇹🇭","🇹🇱","🇹🇬","🇹🇴",
    "🇹🇹","🇹🇳","🇹🇷","🇹🇲","🇹🇻","🇺🇬","🇺🇦","🇦🇪","🇬🇧","🇺🇸","🇺🇾","🇺🇿","🇻🇺","🇻🇪","🇻🇳","🇾🇪","🇿🇲","🇿🇼",
  ],
};

const RECENT_KEY = "rdp-emoji-recent";

function getRecent() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}

function addRecent(emoji) {
  if (typeof window === "undefined") return;
  const arr = getRecent().filter(e => e !== emoji);
  arr.unshift(emoji);
  localStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(0, 32)));
}

export default function EmojiPicker({ selected, onSelect, trigger }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("smileys");
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState([]);
  const popupRef = useRef(null);

  useEffect(() => { if (open) setRecent(getRecent()); }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (popupRef.current && !popupRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const pick = (emoji) => {
    onSelect(emoji);
    addRecent(emoji);
    setRecent(prev => [emoji, ...prev.filter(e => e !== emoji)].slice(0, 32));
    setOpen(false);
  };

  // Search across all categories
  const allEmojis = Object.values(EMOJIS).flat();
  const searchResults = search.trim()
    ? allEmojis.filter(e => e.includes(search.trim()))
    : null;

  const currentEmojis = searchResults || (cat === "recent" ? recent : EMOJIS[cat] || []);

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={popupRef}>
      {/* Trigger button */}
      {trigger ? (
        <div onClick={() => setOpen(!open)}>{trigger}</div>
      ) : (
        <button onClick={() => setOpen(!open)} style={{
          fontSize: "1.6rem", width: 52, height: 52, borderRadius: 14,
          border: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "border-color 0.2s",
        }}>{selected || "😀"}</button>
      )}

      {/* Popup */}
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 8, zIndex: 9999,
          background: "#1a1a24", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16,
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)", width: 320, overflow: "hidden",
        }}>
          {/* Category tabs */}
          <div style={{
            display: "flex", gap: 2, padding: "8px 8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
            overflowX: "auto", scrollbarWidth: "none",
          }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => { setCat(c.id); setSearch(""); }} title={c.label} style={{
                fontSize: "1.1rem", width: 32, height: 32, borderRadius: 8, border: "none",
                background: cat === c.id ? "rgba(212,32,53,0.2)" : "transparent",
                cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                opacity: cat === c.id ? 1 : 0.5,
              }}>{c.icon}</button>
            ))}
          </div>

          {/* Search */}
          <div style={{ padding: "8px 10px" }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search emojis..."
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.06)", color: "#f2f2f4", fontSize: "0.8rem", outline: "none",
                fontFamily: "'DM Sans',sans-serif",
              }}
            />
          </div>

          {/* Category label */}
          <div style={{ padding: "2px 12px 6px", fontSize: "0.65rem", fontWeight: 700, color: "#6e7082", letterSpacing: 1, textTransform: "uppercase" }}>
            {search.trim() ? "Search Results" : CATEGORIES.find(c => c.id === cat)?.label || ""}
          </div>

          {/* Emoji grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2,
            padding: "0 8px 10px", maxHeight: 240, overflowY: "auto",
          }}>
            {currentEmojis.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "20px 0", color: "#6e7082", fontSize: "0.78rem" }}>
                {cat === "recent" ? "No recent emojis" : "No results"}
              </div>
            )}
            {currentEmojis.map((emoji, i) => (
              <button key={emoji + i} onClick={() => pick(emoji)} style={{
                fontSize: "1.3rem", width: 36, height: 36, borderRadius: 8, border: "none",
                background: selected === emoji ? "rgba(212,32,53,0.25)" : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.1s",
              }} onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                 onMouseOut={e => e.currentTarget.style.background = selected === emoji ? "rgba(212,32,53,0.25)" : "transparent"}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, getPlays, checkUidPlayed, recordPlay, updateEvent } from "@/lib/supabase";
import { useI18n, LanguageSelector } from "@/lib/i18n";

const LOGO = "/logo.png";

const btnStyle = (bg, outline) => ({
  fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "0.85rem", fontWeight: 700,
  letterSpacing: 1, textTransform: "uppercase", color: "#fff",
  background: outline ? "transparent" : bg, border: outline ? "1px solid rgba(255,255,255,0.15)" : "none",
  padding: "14px 32px", borderRadius: 100, cursor: "pointer",
});

function Modal({ show, onClose, children }) {
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",backdropFilter:"blur(14px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn 0.3s ease" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(160deg,#161622,#0e0e14)",border:"1px solid rgba(212,32,53,0.25)",borderRadius:28,padding:"40px 32px",maxWidth:440,width:"100%",maxHeight:"90vh",overflowY:"auto",animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>{children}</div>
    </div>
  );
}

function Numpad({ value, onChange }) {
  const press = (v) => { if(v==="del")onChange(value.slice(0,-1));else if(v==="clear")onChange("");else if(value.length<30)onChange(value+v); };
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,width:"100%"}}>
      {["1","2","3","4","5","6","7","8","9","del","0","clear"].map(k=>(
        <button key={k} onClick={()=>press(k==="del"||k==="clear"?k:k)} style={{
          fontFamily:"'Plus Jakarta Sans'",fontSize:k==="del"||k==="clear"?"1.1rem":"1.4rem",fontWeight:700,
          color:k==="del"||k==="clear"?"#6e7082":"#fff",background:"rgba(255,255,255,0.06)",
          border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"18px 0",cursor:"pointer",touchAction:"manipulation",
        }}>{k==="del"?"⌫":k==="clear"?"C":k}</button>
      ))}
    </div>
  );
}

function adjustColor(hex, amt) {
  let c = (hex||"#c41a2e").replace("#","");
  if(c.length===3) c=c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  const num=parseInt(c,16);
  const r=Math.max(0,Math.min(255,(num>>16)+amt));
  const g=Math.max(0,Math.min(255,((num>>8)&0xff)+amt));
  const b=Math.max(0,Math.min(255,(num&0xff)+amt));
  return `rgb(${r},${g},${b})`;
}

// ============ LED RING COMPONENT ============
const NEON_COLORS = [
  { bg: "#ff3348", glow: "0 0 6px #ff3348, 0 0 14px rgba(255,51,72,0.5)" },    // neon pink/red
  { bg: "#39ff14", glow: "0 0 6px #39ff14, 0 0 14px rgba(57,255,20,0.5)" },     // neon green
  { bg: "#bf5fff", glow: "0 0 6px #bf5fff, 0 0 14px rgba(191,95,255,0.5)" },    // neon purple
  { bg: "#fff01f", glow: "0 0 6px #fff01f, 0 0 14px rgba(255,240,31,0.5)" },    // neon yellow
  { bg: "#ff69b4", glow: "0 0 6px #ff69b4, 0 0 14px rgba(255,105,180,0.5)" },   // hot pink
];

function LEDRing({ spinning: isSpinning }) {
  const ringRef = useRef(null);
  const rafRef = useRef(null);

  const count = 40;
  const dots = [];
  for(let i=0;i<count;i++){
    const a = (i/count)*2*Math.PI - Math.PI/2;
    const colorIdx = i % NEON_COLORS.length;
    dots.push({
      left: `${50 + Math.cos(a) * 47}%`,
      top: `${50 + Math.sin(a) * 47}%`,
      colorIdx,
    });
  }

  useEffect(() => {
    if (!ringRef.current) return;
    const dotEls = ringRef.current.querySelectorAll('.led');
    if (!dotEls.length) return;
    let off = 0;
    function tick() {
      off += isSpinning ? 0.015 : 0;
      dotEls.forEach((d,i) => {
        const phase = (i/dotEls.length + off) % 1;
        const ci = parseInt(d.dataset.ci);
        const nc = NEON_COLORS[ci];
        if (isSpinning) {
          const lit = phase < 0.35;
          d.style.opacity = lit ? '1' : '0.08';
          d.style.boxShadow = lit ? nc.glow : 'none';
          d.style.background = nc.bg;
        }
      });
      if (isSpinning) rafRef.current = requestAnimationFrame(tick);
    }
    if(isSpinning) { cancelAnimationFrame(rafRef.current); tick(); }
    else {
      cancelAnimationFrame(rafRef.current);
      dotEls.forEach((d,i) => {
        const ci = parseInt(d.dataset.ci);
        const nc = NEON_COLORS[ci];
        d.style.background = nc.bg;
        d.style.opacity = (i % 3 === 0) ? '0.45' : '0.12';
        d.style.boxShadow = (i % 3 === 0) ? nc.glow.replace('0.5','0.15') : 'none';
      });
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isSpinning]);

  return (
    <div ref={ringRef} style={{position:"absolute",inset:-11,borderRadius:"50%",zIndex:4,pointerEvents:"none"}}>
      {dots.map((d,i)=>(
        <div key={i} className="led" data-ci={d.colorIdx} style={{
          position:"absolute", width:8, height:8, borderRadius:"50%",
          background: NEON_COLORS[d.colorIdx].bg,
          left: d.left, top: d.top, transform:"translate(-50%,-50%)",
          opacity: 0.12, transition:"opacity 0.08s",
        }}/>
      ))}
    </div>
  );
}

// ============ MAIN EVENT PAGE ============
export default function EventPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useI18n();

  const [event, setEvent] = useState(null);
  const [plays, setPlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [showUid, setShowUid] = useState(false);
  const [showResult, setShowResult] = useState(null);
  const [showAlready, setShowAlready] = useState(null);
  const [uid, setUid] = useState("");
  const [uidError, setUidError] = useState("");
  const [wheelReady, setWheelReady] = useState(false);
  const currentUidRef = useRef("");
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const sizeRef = useRef(0);
  const stageRef = useRef(null);

  // Load event + plays
  const loadData = useCallback(async () => {
    try {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).single();
      if (ev) {
        setEvent(ev);
        const p = await getPlays(id);
        setPlays(p);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time subscription for plays
  useEffect(() => {
    const channel = supabase.channel(`plays-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "plays", filter: `event_id=eq.${id}` },
        (payload) => { setPlays(prev => [...prev, payload.new]); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const prizes = event?.prizes || [];
  const N = prizes.length;
  const SLICE = N > 0 ? (2 * Math.PI) / N : 0;

  // ============ DRAW WHEEL ============
  const drawWheel = useCallback((rotation) => {
    const canvas = canvasRef.current;
    if (!canvas || N === 0 || !sizeRef.current) return;
    const ctx = canvas.getContext("2d");
    const W = sizeRef.current;
    const R = W / 2, hubR = R * 0.16;

    ctx.clearRect(0, 0, W, W);
    ctx.save();
    ctx.translate(R, R);
    ctx.rotate(rotation);

    for (let i = 0; i < N; i++) {
      const p = prizes[i];
      const startA = i * SLICE, endA = startA + SLICE, midA = startA + SLICE / 2;

      // Slice
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R - 4, startA, endA); ctx.closePath();
      const gx = Math.cos(midA), gy = Math.sin(midA);
      const grd = ctx.createLinearGradient(gx * hubR, gy * hubR, gx * (R - 4), gy * (R - 4));
      grd.addColorStop(0, adjustColor(p.color, 30));
      grd.addColorStop(1, p.color || "#c41a2e");
      ctx.fillStyle = grd;
      ctx.fill();

      // Dark separator
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(startA) * (R - 4), Math.sin(startA) * (R - 4));
      ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2; ctx.stroke();

      // Light edge
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(endA) * (R - 4), Math.sin(endA) * (R - 4));
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1; ctx.stroke();

      // Outer arc highlight
      ctx.beginPath(); ctx.arc(0, 0, R - 5, startA + 0.02, endA - 0.02);
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1.5; ctx.stroke();

      // Text
      ctx.save();
      ctx.rotate(midA);
      const isLight = (p.color||"").toLowerCase().startsWith("#e") || (p.color||"").toLowerCase().startsWith("#f") || (p.color||"").toLowerCase().startsWith("#d") && parseInt((p.color||"").slice(1,3),16)>200;
      const textColor = isLight ? "#1a1a2e" : "#fff";
      ctx.fillStyle = textColor;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      // Icon
      const iconR = R * 0.76;
      const iconSize = Math.min(R * 0.14, 2 * iconR * Math.sin(SLICE / 2) * 0.5);
      ctx.font = `${Math.round(iconSize)}px serif`;
      ctx.fillText(p.icon || "🎁", iconR, 0);

      // Label
      const labelR = R * 0.50;
      const maxLabelW = 2 * labelR * Math.sin(SLICE / 2) * 0.78;
      let labelSize = Math.round(R * 0.095);
      ctx.font = `800 ${labelSize}px 'Plus Jakarta Sans',sans-serif`;
      const labelText = p.label || p.name;
      while (ctx.measureText(labelText).width > maxLabelW && labelSize > 8) {
        labelSize--;
        ctx.font = `800 ${labelSize}px 'Plus Jakarta Sans',sans-serif`;
      }
      ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 4;
      ctx.fillText(labelText, labelR, 0);
      ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Hub cover
    ctx.beginPath(); ctx.arc(0, 0, hubR, 0, 2 * Math.PI);
    const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, hubR);
    hg.addColorStop(0, "#1a1a28"); hg.addColorStop(1, "#0a0a12");
    ctx.fillStyle = hg; ctx.fill();
    ctx.strokeStyle = "rgba(212,32,53,0.5)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }, [prizes, N, SLICE]);

  // Init canvas when event loads
  useEffect(() => {
    if (!event || N === 0) return;
    // Small delay to ensure DOM is rendered
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      const stage = stageRef.current;
      if (!canvas || !stage) return;
      const W = stage.offsetWidth;
      if (!W) return;
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = W;
      canvas.width = W * DPR; canvas.height = W * DPR;
      canvas.style.width = W + "px"; canvas.style.height = W + "px";
      canvas.getContext("2d").setTransform(DPR, 0, 0, DPR, 0, 0);
      drawWheel(angleRef.current);
      setWheelReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [event, N, drawWheel]);

  // ============ SPIN ============
  const spin = useCallback(() => {
    if (spinning || N === 0 || !sizeRef.current) return;
    setSpinning(true);
    const chances = prizes.map(p => (p.chance || 0) / 100);
    const r = Math.random(); let cum = 0, winIdx = N - 1;
    for (let i = 0; i < N; i++) { cum += chances[i]; if (r <= cum) { winIdx = i; break; } }

    const startAngle = angleRef.current;
    const sliceStart = winIdx * SLICE;
    const pad = SLICE * 0.15;
    const targetInSlice = sliceStart + pad + Math.random() * (SLICE - 2 * pad);
    const spins = 8 + Math.floor(Math.random() * 3);
    const targetRotation = -(Math.PI / 2 + targetInSlice) + spins * 2 * Math.PI;
    let delta = targetRotation - startAngle;
    while (delta < 6 * Math.PI) delta += 2 * Math.PI;

    const dur = 7000 + Math.random() * 500;
    const t0 = performance.now();
    let lastS = -1;
    let audioCtx;
    try { audioCtx = new AudioContext(); } catch (e) {}
    const tick = (f, v) => {
      if (!audioCtx) return;
      try {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.frequency.value = f; o.type = "triangle";
        g.gain.setValueAtTime(v, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        o.start(); o.stop(audioCtx.currentTime + 0.05);
      } catch (e) {}
    };

    // Direct canvas draw during animation (bypass React re-renders)
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = sizeRef.current;

    function drawDirect(rotation) {
      const R = W / 2, hubR = R * 0.16;
      ctx.clearRect(0, 0, W, W);
      ctx.save(); ctx.translate(R, R); ctx.rotate(rotation);
      for (let i = 0; i < N; i++) {
        const p = prizes[i];
        const sA = i * SLICE, eA = sA + SLICE, mA = sA + SLICE / 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R - 4, sA, eA); ctx.closePath();
        const gx = Math.cos(mA), gy = Math.sin(mA);
        const grd = ctx.createLinearGradient(gx * hubR, gy * hubR, gx * (R - 4), gy * (R - 4));
        grd.addColorStop(0, adjustColor(p.color, 30));
        grd.addColorStop(1, p.color || "#c41a2e");
        ctx.fillStyle = grd; ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sA) * (R - 4), Math.sin(sA) * (R - 4));
        ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, R - 5, sA + 0.02, eA - 0.02);
        ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.save(); ctx.rotate(mA);
        const isLt = (p.color||"").toLowerCase().startsWith("#e") || (p.color||"").toLowerCase().startsWith("#f");
        ctx.fillStyle = isLt ? "#1a1a2e" : "#fff"; ctx.textBaseline = "middle"; ctx.textAlign = "center";
        const iconR = R * 0.76;
        ctx.font = `${Math.round(Math.min(R * 0.14, 2 * iconR * Math.sin(SLICE / 2) * 0.5))}px serif`;
        ctx.fillText(p.icon || "🎁", iconR, 0);
        const labelR = R * 0.50;
        const maxLW = 2 * labelR * Math.sin(SLICE / 2) * 0.78;
        let ls = Math.round(R * 0.095);
        ctx.font = `800 ${ls}px 'Plus Jakarta Sans',sans-serif`;
        const lt = p.label || p.name;
        while (ctx.measureText(lt).width > maxLW && ls > 8) { ls--; ctx.font = `800 ${ls}px 'Plus Jakarta Sans',sans-serif`; }
        ctx.shadowColor = isLt ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.5)"; ctx.shadowBlur = 4;
        ctx.fillText(lt, labelR, 0);
        ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
        ctx.restore();
      }
      ctx.beginPath(); ctx.arc(0, 0, R * 0.16, 0, 2 * Math.PI);
      const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.16);
      hg.addColorStop(0, "#1a1a28"); hg.addColorStop(1, "#0a0a12");
      ctx.fillStyle = hg; ctx.fill();
      ctx.strokeStyle = "rgba(212,32,53,0.5)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }

    const frame = (now) => {
      const elapsed = now - t0;
      const p = Math.min(elapsed / dur, 1);
      const ease = 1 - Math.pow(1 - p, 2 + p * 3);
      const a = startAngle + delta * ease;
      drawDirect(a);

      // Tick detection
      const pointerAngle = -Math.PI / 2;
      const wheelAngle = ((pointerAngle - a) % (2 * Math.PI) + 4 * Math.PI) % (2 * Math.PI);
      const s = Math.floor(wheelAngle / SLICE) % N;
      if (s !== lastS) {
        lastS = s;
        const speed = 1 - p;
        tick(600 + speed * 400 + Math.random() * 200, 0.015 + speed * 0.04);
      }

      if (p < 1) requestAnimationFrame(frame);
      else {
        angleRef.current = a;
        // Win sound
        [0, 100, 200, 350, 500].forEach((d, i) => setTimeout(() => tick(500 + i * 150, 0.06), d));
        setTimeout(async () => {
          setSpinning(false);
          const prize = prizes[winIdx];
          const play = await recordPlay(id, currentUidRef.current, prize.name, prize.icon, winIdx);
          if (play) setShowResult({ uid: currentUidRef.current, prize: prize.name, icon: prize.icon });
        }, 400);
      }
    };
    requestAnimationFrame(frame);
  }, [spinning, prizes, N, SLICE, drawWheel, id]);

  const handleSpin = () => {
    if (spinning || event?.status === "finished") return;
    setUid(""); setUidError(""); setShowUid(true);
  };

  const submitUid = async () => {
    const trimmed = uid.trim();
    if (!trimmed) { setUidError(t("uidRequired")); return; }
    if (trimmed.length < 3) { setUidError(t("uidMin")); return; }
    const existing = await checkUidPlayed(id, trimmed);
    if (existing) { setShowUid(false); setShowAlready(existing); return; }
    currentUidRef.current = trimmed;
    setShowUid(false);
    spin();
  };

  const maskUID = (u) => u && u.length > 6 ? u.slice(0, 3) + "•••" + u.slice(-2) : u ? u.slice(0, 2) + "***" + u.slice(-1) : "???";

  const downloadCSV = () => {
    if (!plays.length) return;
    const csv = "UID,Prize,Timestamp\n" + plays.map(p => `"${p.uid}","${p.prize_name}","${p.played_at || ""}"`).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url;
    a.download = `${event?.name?.replace(/\s+/g, "-") || "event"}-results.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const finishEvent = async () => {
    downloadCSV();
    await updateEvent(id, { status: "finished" });
    await loadData();
  };

  const last10 = [...plays].reverse().slice(0, 10);

  if (loading) return <div style={{minHeight:"100vh",background:"#06060a",display:"flex",alignItems:"center",justifyContent:"center",color:"#6e7082"}}>Loading...</div>;
  if (!event) return <div style={{minHeight:"100vh",background:"#06060a",display:"flex",alignItems:"center",justifyContent:"center",color:"#6e7082"}}>Event not found. <button onClick={()=>router.push("/")} style={{color:"#d42035",background:"none",border:"none",cursor:"pointer",marginLeft:8}}>Go back</button></div>;

  return (
    <div style={{minHeight:"100vh",background:"#06060a",color:"#f2f2f4",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { transform: scale(0.7); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes ambientPulse { from { opacity: 0.4; transform: scale(0.95) } to { opacity: 1; transform: scale(1.05) } }
        @keyframes livePulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>

      <div style={{display:"flex",maxWidth:920,margin:"0 auto",padding:"20px 16px",gap:20,alignItems:"flex-start",flexWrap:"wrap",justifyContent:"center"}}>
        {/* Main column */}
        <div style={{flex:1,minWidth:320,maxWidth:520,display:"flex",flexDirection:"column",alignItems:"center",gap:24}}>
          {/* Header with logo */}
          <div style={{display:"flex",width:"100%",alignItems:"center",gap:12}}>
            <button onClick={()=>router.push("/")} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"10px 16px",color:"#fff",cursor:"pointer",fontSize:"0.85rem",fontWeight:600}}>←</button>
            <img src={LOGO} alt="RedotPay" style={{height:28,width:"auto",filter:"drop-shadow(0 2px 8px rgba(212,32,53,0.2))"}} />
            <div style={{flex:1,marginLeft:4}}>
              <div style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.1rem",fontWeight:800}}>{event.emoji} {event.name}</div>
              <div style={{fontSize:"0.72rem",color:"#6e7082"}}>{event.location}</div>
            </div>
            <LanguageSelector />
          </div>

          {/* ============ WHEEL STAGE ============ */}
          <div ref={stageRef} style={{position:"relative",width:"clamp(320px,80vw,420px)",height:"clamp(320px,80vw,420px)"}}>
            {/* Ambient glow */}
            <div style={{position:"absolute",inset:-40,borderRadius:"50%",background:"radial-gradient(circle,rgba(212,32,53,0.1) 0%,transparent 65%)",animation:"ambientPulse 4s ease-in-out infinite alternate",pointerEvents:"none"}} />

            {/* LED Ring */}
            <LEDRing spinning={spinning} />

            {/* Outer metal ring */}
            <div style={{position:"absolute",inset:-4,borderRadius:"50%",background:"linear-gradient(135deg,#2a2a2a,#1a1a1a,#2a2a2a)",zIndex:2,boxShadow:"0 0 0 2px rgba(255,255,255,0.08), inset 0 0 0 2px rgba(255,255,255,0.03)"}}>
              <div style={{position:"absolute",inset:5,borderRadius:"50%",background:"#06060a"}} />
            </div>

            {/* Canvas */}
            <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",borderRadius:"50%",zIndex:3}} />

            {/* Hub */}
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:62,height:62,borderRadius:"50%",background:"radial-gradient(circle at 38% 32%,#1e1e2a,#0a0a12)",border:"3px solid #d42035",boxShadow:"0 0 28px rgba(212,32,53,0.4), 0 0 60px rgba(212,32,53,0.1), inset 0 2px 8px rgba(0,0,0,0.6)",zIndex:6,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:"radial-gradient(circle at 38% 32%,#ff3348,#d42035)",boxShadow:"inset 0 1px 4px rgba(255,255,255,0.3)"}} />
            </div>

            {/* Pointer */}
            <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",zIndex:10,filter:"drop-shadow(0 4px 12px rgba(212,32,53,0.6))"}}>
              <svg viewBox="0 0 38 50" fill="none" style={{width:38,height:50}}>
                <path d="M19 50 L3 14 Q19 -2 35 14 Z" fill="url(#pg)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
                <defs><linearGradient id="pg" x1="19" y1="0" x2="19" y2="50"><stop offset="0%" stopColor="#fff"/><stop offset="40%" stopColor="#e8e8e8"/><stop offset="100%" stopColor="#999"/></linearGradient></defs>
              </svg>
            </div>
          </div>

          {/* SPIN Button */}
          <button onClick={handleSpin} disabled={spinning||event.status==="finished"} style={{
            fontFamily:"'Plus Jakarta Sans'",fontSize:"1rem",fontWeight:800,letterSpacing:2.5,textTransform:"uppercase",
            color:"#fff",background:event.status==="finished"?"#333":"linear-gradient(160deg,#d42035,#ff3348,#d42035)",
            border:"none",padding:"18px 64px",borderRadius:100,cursor:event.status==="finished"?"not-allowed":"pointer",
            opacity:spinning?0.35:1,boxShadow:event.status==="finished"?"none":"0 4px 24px rgba(212,32,53,0.3), 0 0 0 1px rgba(212,32,53,0.2)",
            transition:"all 0.25s",
          }}>{event.status==="finished"?t("finished"):t("spin")}</button>

          {/* Prize cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,width:"100%"}}>
            {prizes.map(p=>(
              <div key={p.id} style={{background:"#0e0e14",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"14px 8px 12px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:p.color||"#c41a2e",boxShadow:`0 0 8px ${(p.color||"#c41a2e")}55`}} />
                <div style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"0.75rem",fontWeight:700}}>{p.icon} {p.name}</div>
              </div>
            ))}
          </div>

          {/* Event actions */}
          <div style={{display:"flex",gap:8,width:"100%"}}>
            <button onClick={downloadCSV} style={{...btnStyle("transparent",true),flex:1,padding:"12px 0",fontSize:"0.78rem"}}>{t("exportCsv")}</button>
            {event.status==="active"&&<button onClick={finishEvent} style={{...btnStyle("transparent",true),flex:1,padding:"12px 0",fontSize:"0.78rem",color:"#ff3348",borderColor:"rgba(212,32,53,0.3)"}}>{t("finishEvent")}</button>}
          </div>
        </div>

        {/* ============ SIDEBAR ============ */}
        <div style={{width:220,flexShrink:0}}>
          <div style={{background:"#0e0e14",border:"1px solid rgba(255,255,255,0.06)",borderRadius:20,padding:"20px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,paddingBottom:12,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#d42035",boxShadow:"0 0 8px #d42035",animation:"livePulse 2s ease-in-out infinite"}}/>
              <span style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"0.8rem",fontWeight:700}}>{t("liveFeed")}</span>
              <span style={{marginLeft:"auto",fontSize:"0.65rem",color:"#6e7082",fontWeight:600,background:"rgba(255,255,255,0.05)",padding:"3px 8px",borderRadius:20}}>{plays.length}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:420,overflowY:"auto"}}>
              {last10.length===0&&<div style={{textAlign:"center",color:"#6e7082",fontSize:"0.78rem",padding:"24px 0"}}>{t("waiting")}</div>}
              {last10.map((play,i)=>(
                <div key={play.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:12}}>
                  <span style={{fontSize:"1.2rem"}}>{play.prize_icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"0.72rem",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{maskUID(play.uid)}</div>
                    <div style={{fontSize:"0.65rem",color:"#6e7082"}}>{play.prize_name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============ MODALS ============ */}
      <Modal show={showUid} onClose={()=>setShowUid(false)}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"2.8rem",marginBottom:12}}>💳</div>
          <h2 style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.3rem",fontWeight:800,marginBottom:6}}>{t("enterUid")}</h2>
          <p style={{fontSize:"0.85rem",color:"#6e7082",marginBottom:24}}>{t("uidOnce")}</p>
          <div style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.4rem",fontWeight:700,letterSpacing:3,background:"rgba(255,255,255,0.06)",border:"2px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"14px 18px",marginBottom:8,minHeight:56,display:"flex",alignItems:"center",justifyContent:"center",color:"#f2f2f4"}}>
            {uid||<span style={{color:"#6e7082",fontSize:"0.85rem",letterSpacing:0,fontWeight:400}}>{t("tapNumbers")}</span>}
          </div>
          <div style={{fontSize:"0.78rem",color:"#ff3348",minHeight:22,marginBottom:8}}>{uidError}</div>
          <Numpad value={uid} onChange={v=>{setUid(v);setUidError("");}}/>
          <button onClick={submitUid} style={{...btnStyle("#d42035"),width:"100%",padding:"16px 0",marginTop:8}}>{t("confirm")}</button>
        </div>
      </Modal>

      <Modal show={!!showResult} onClose={()=>setShowResult(null)}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"4rem",marginBottom:12}}>{showResult?.icon}</div>
          <div style={{fontSize:"0.7rem",letterSpacing:2.5,textTransform:"uppercase",color:"#6e7082",fontWeight:700,marginBottom:8}}>{t("youWon")}</div>
          <div style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.6rem",fontWeight:800,marginBottom:6}}>{showResult?.prize}</div>
          <div style={{fontSize:"0.75rem",color:"#6e7082",marginBottom:24}}>UID: {showResult?.uid}</div>
          <button onClick={()=>setShowResult(null)} style={{...btnStyle("rgba(212,32,53,0.15)",false),border:"1px solid rgba(212,32,53,0.3)",padding:"14px 40px",color:"#fff"}}>{t("close")}</button>
        </div>
      </Modal>

      <Modal show={!!showAlready} onClose={()=>setShowAlready(null)}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"2.8rem",marginBottom:12}}>🔒</div>
          <h2 style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.2rem",fontWeight:800,marginBottom:6}}>{t("alreadyPlayed")}</h2>
          <p style={{fontSize:"0.85rem",color:"#6e7082",marginBottom:20}}>{t("alreadyWon")}</p>
          <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:20,marginBottom:24}}>
            <div style={{fontSize:"2.4rem",marginBottom:8}}>{showAlready?.prize_icon}</div>
            <div style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.4rem",fontWeight:800}}>{showAlready?.prize_name}</div>
          </div>
          <button onClick={()=>setShowAlready(null)} style={{...btnStyle("rgba(212,32,53,0.15)",false),border:"1px solid rgba(212,32,53,0.3)",padding:"14px 40px",color:"#fff"}}>{t("close")}</button>
        </div>
      </Modal>
    </div>
  );
}

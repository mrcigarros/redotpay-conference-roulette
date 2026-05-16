"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, getPlays, checkUidPlayed, recordPlay, updateEvent, getEvents } from "@/lib/supabase";
import { useI18n, LanguageSelector } from "@/lib/i18n";

const btnStyle = (bg, outline) => ({
  fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "0.85rem", fontWeight: 700,
  letterSpacing: 1, textTransform: "uppercase", color: "#fff",
  background: outline ? "transparent" : bg, border: outline ? "1px solid rgba(255,255,255,0.15)" : "none",
  padding: "14px 32px", borderRadius: 100, cursor: "pointer",
});
const inputStyle = {
  fontFamily: "'DM Sans',sans-serif", fontSize: "1rem", fontWeight: 500, color: "#f2f2f4",
  background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.1)",
  borderRadius: 14, padding: "14px 18px", outline: "none", width: "100%",
};

function Modal({ show, onClose, children }) {
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",backdropFilter:"blur(14px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(160deg,#161622,#0e0e14)",border:"1px solid rgba(212,32,53,0.25)",borderRadius:28,padding:"40px 32px",maxWidth:440,width:"100%",maxHeight:"90vh",overflowY:"auto" }}>{children}</div>
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

function lighten(hex, amt) {
  const num = parseInt(hex.replace("#",""),16);
  const r=Math.min(255,(num>>16)+amt), g=Math.min(255,((num>>8)&0xff)+amt), b=Math.min(255,(num&0xff)+amt);
  return `rgb(${r},${g},${b})`;
}

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
  const currentUidRef = useRef("");
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const sizeRef = useRef(0);

  // Load event + plays
  const loadData = useCallback(async () => {
    try {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).single();
      if (ev) { setEvent(ev); const p = await getPlays(id); setPlays(p); }
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

  // Draw wheel
  const drawWheel = useCallback((rotation) => {
    const canvas = canvasRef.current;
    if (!canvas || N === 0) return;
    const ctx = canvas.getContext("2d");
    const W = sizeRef.current;
    const R = W / 2, hubR = R * 0.16;
    ctx.clearRect(0, 0, W, W);
    ctx.save(); ctx.translate(R, R); ctx.rotate(rotation);
    for (let i = 0; i < N; i++) {
      const p = prizes[i], startA = i * SLICE, endA = startA + SLICE, midA = startA + SLICE / 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R - 4, startA, endA); ctx.closePath();
      const gx = Math.cos(midA), gy = Math.sin(midA);
      const grd = ctx.createLinearGradient(gx * hubR, gy * hubR, gx * (R - 4), gy * (R - 4));
      grd.addColorStop(0, lighten(p.color || "#c41a2e", 30)); grd.addColorStop(1, p.color || "#c41a2e");
      ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(startA) * (R - 4), Math.sin(startA) * (R - 4));
      ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.rotate(midA); ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; ctx.textAlign = "center";
      ctx.font = `${Math.round(R * 0.12)}px serif`; ctx.fillText(p.icon || "🎁", R * 0.76, 0);
      let ls = Math.round(R * 0.09);
      ctx.font = `800 ${ls}px 'Plus Jakarta Sans',sans-serif`;
      const maxW = 2 * R * 0.5 * Math.sin(SLICE / 2) * 0.78;
      while (ctx.measureText(p.label || p.name).width > maxW && ls > 8) { ls--; ctx.font = `800 ${ls}px 'Plus Jakarta Sans',sans-serif`; }
      ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 4;
      ctx.fillText(p.label || p.name, R * 0.5, 0);
      ctx.shadowColor = "transparent"; ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, hubR, 0, 2 * Math.PI);
    const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, hubR);
    hg.addColorStop(0, "#1a1a28"); hg.addColorStop(1, "#0a0a12");
    ctx.fillStyle = hg; ctx.fill(); ctx.strokeStyle = "rgba(212,32,53,0.5)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }, [prizes, N, SLICE]);

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const W = canvas.parentElement.offsetWidth;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    sizeRef.current = W;
    canvas.width = W * DPR; canvas.height = W * DPR;
    canvas.style.width = W + "px"; canvas.style.height = W + "px";
    canvas.getContext("2d").setTransform(DPR, 0, 0, DPR, 0, 0);
    drawWheel(angleRef.current);
  }, [drawWheel, event]);

  // Spin
  const spin = useCallback(() => {
    if (spinning || N === 0) return;
    setSpinning(true);
    const chances = prizes.map(p => (p.chance || 0) / 100);
    const r = Math.random(); let cum = 0, winIdx = N - 1;
    for (let i = 0; i < N; i++) { cum += chances[i]; if (r <= cum) { winIdx = i; break; } }

    const sliceStart = winIdx * SLICE, pad = SLICE * 0.15;
    const target = sliceStart + pad + Math.random() * (SLICE - 2 * pad);
    const spins = 8 + Math.floor(Math.random() * 3);
    const targetRot = -(Math.PI / 2 + target) + spins * 2 * Math.PI;
    let delta = targetRot - angleRef.current;
    while (delta < 6 * Math.PI) delta += 2 * Math.PI;

    const dur = 7200, t0 = performance.now();
    let lastS = -1, audioCtx;
    try { audioCtx = new AudioContext(); } catch(e) {}
    const tick = (f, v) => { if(!audioCtx)return; try{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.frequency.value=f;o.type="triangle";g.gain.setValueAtTime(v,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.05);o.start();o.stop(audioCtx.currentTime+0.05);}catch(e){} };

    const frame = (now) => {
      const elapsed = now - t0, p = Math.min(elapsed / dur, 1);
      const ease = 1 - Math.pow(1 - p, 2 + p * 3);
      const a = angleRef.current + delta * ease;
      drawWheel(a);
      const wAngle = (((-Math.PI / 2) - a) % (2 * Math.PI) + 4 * Math.PI) % (2 * Math.PI);
      const s = Math.floor(wAngle / SLICE) % N;
      if (s !== lastS) { lastS = s; tick(600 + (1 - p) * 400, 0.015 + (1 - p) * 0.04); }
      if (p < 1) requestAnimationFrame(frame);
      else {
        angleRef.current = a;
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

  const maskUID = (u) => u.length <= 6 ? u.slice(0, 2) + "***" + u.slice(-1) : u.slice(0, 3) + "•••" + u.slice(-2);

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
      <div style={{display:"flex",maxWidth:900,margin:"0 auto",padding:"20px 16px",gap:20,alignItems:"flex-start",flexWrap:"wrap",justifyContent:"center"}}>
        {/* Main column */}
        <div style={{flex:1,minWidth:320,maxWidth:520,display:"flex",flexDirection:"column",alignItems:"center",gap:24}}>
          <div style={{display:"flex",width:"100%",alignItems:"center",gap:12}}>
            <button onClick={()=>router.push("/")} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"10px 16px",color:"#fff",cursor:"pointer",fontSize:"0.85rem",fontWeight:600}}>← Back</button>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.2rem",fontWeight:800}}>{event.emoji} {event.name}</div>
              <div style={{fontSize:"0.75rem",color:"#6e7082"}}>{event.location}</div>
            </div>
            <LanguageSelector />
          </div>

          {/* Wheel */}
          <div style={{position:"relative",width:"clamp(300px,80vw,400px)",aspectRatio:"1"}}>
            <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",zIndex:10}}>
              <svg viewBox="0 0 38 50" fill="none" style={{width:36,height:48,filter:"drop-shadow(0 4px 12px rgba(212,32,53,0.6))"}}>
                <path d="M19 50 L3 14 Q19 -2 35 14 Z" fill="url(#pg)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
                <defs><linearGradient id="pg" x1="19" y1="0" x2="19" y2="50"><stop offset="0%" stopColor="#fff"/><stop offset="40%" stopColor="#e8e8e8"/><stop offset="100%" stopColor="#999"/></linearGradient></defs>
              </svg>
            </div>
            <canvas ref={canvasRef} style={{width:"100%",height:"100%",borderRadius:"50%"}}/>
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:56,height:56,borderRadius:"50%",background:"radial-gradient(circle at 38% 32%,#1e1e2a,#0a0a12)",border:"3px solid #d42035",boxShadow:"0 0 24px rgba(212,32,53,0.35)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"radial-gradient(circle at 38% 32%,#ff3348,#d42035)"}}/>
            </div>
          </div>

          <button onClick={handleSpin} disabled={spinning||event.status==="finished"} style={{
            fontFamily:"'Plus Jakarta Sans'",fontSize:"1rem",fontWeight:800,letterSpacing:2.5,textTransform:"uppercase",
            color:"#fff",background:event.status==="finished"?"#333":"linear-gradient(160deg,#d42035,#ff3348,#d42035)",
            border:"none",padding:"18px 64px",borderRadius:100,cursor:event.status==="finished"?"not-allowed":"pointer",
            opacity:spinning?0.35:1,boxShadow:event.status==="finished"?"none":"0 4px 24px rgba(212,32,53,0.3)",
          }}>{event.status==="finished"?t("finished"):t("spin")}</button>

          {/* Prize cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,width:"100%"}}>
            {prizes.map(p=>(
              <div key={p.id} style={{background:"#0e0e14",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"14px 8px 12px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:p.color||"#c41a2e"}}/>
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

        {/* Sidebar */}
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

      {/* UID Modal */}
      <Modal show={showUid} onClose={()=>setShowUid(false)}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"2.8rem",marginBottom:12}}>💳</div>
          <h2 style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.3rem",fontWeight:800,marginBottom:6}}>{t("enterUid")}</h2>
          <p style={{fontSize:"0.85rem",color:"#6e7082",marginBottom:24}}>{t("uidOnce")}</p>
          <div style={{...inputStyle,fontSize:"1.4rem",fontWeight:700,letterSpacing:3,marginBottom:8,minHeight:56,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {uid||<span style={{color:"#6e7082",fontSize:"0.85rem",letterSpacing:0,fontWeight:400}}>{t("tapNumbers")}</span>}
          </div>
          <div style={{fontSize:"0.78rem",color:"#ff3348",minHeight:22,marginBottom:8}}>{uidError}</div>
          <Numpad value={uid} onChange={v=>{setUid(v);setUidError("");}}/>
          <button onClick={submitUid} style={{...btnStyle("#d42035"),width:"100%",padding:"16px 0",marginTop:8}}>{t("confirm")}</button>
        </div>
      </Modal>

      {/* Result */}
      <Modal show={!!showResult} onClose={()=>setShowResult(null)}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"4rem",marginBottom:12}}>{showResult?.icon}</div>
          <div style={{fontSize:"0.7rem",letterSpacing:2.5,textTransform:"uppercase",color:"#6e7082",fontWeight:700,marginBottom:8}}>{t("youWon")}</div>
          <div style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.6rem",fontWeight:800,marginBottom:6}}>{showResult?.prize}</div>
          <div style={{fontSize:"0.75rem",color:"#6e7082",marginBottom:24}}>UID: {showResult?.uid}</div>
          <button onClick={()=>setShowResult(null)} style={{...btnStyle("transparent",true),padding:"14px 40px"}}>{t("close")}</button>
        </div>
      </Modal>

      {/* Already Played */}
      <Modal show={!!showAlready} onClose={()=>setShowAlready(null)}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"2.8rem",marginBottom:12}}>🔒</div>
          <h2 style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.2rem",fontWeight:800,marginBottom:6}}>{t("alreadyPlayed")}</h2>
          <p style={{fontSize:"0.85rem",color:"#6e7082",marginBottom:20}}>{t("alreadyWon")}</p>
          <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:20,marginBottom:24}}>
            <div style={{fontSize:"2.4rem",marginBottom:8}}>{showAlready?.prize_icon}</div>
            <div style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.4rem",fontWeight:800}}>{showAlready?.prize_name}</div>
          </div>
          <button onClick={()=>setShowAlready(null)} style={{...btnStyle("transparent",true),padding:"14px 40px"}}>{t("close")}</button>
        </div>
      </Modal>
    </div>
  );
}

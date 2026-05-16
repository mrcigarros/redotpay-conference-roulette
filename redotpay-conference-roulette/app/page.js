"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { getEvents, createEvent as dbCreateEvent, deleteEvent as dbDeleteEvent, getConfig, setConfig, getAllPlays } from "@/lib/supabase";
import { useI18n, LanguageSelector } from "@/lib/i18n";
import { useRouter } from "next/navigation";

const LOGO = "/logo.png";

const btnStyle = (bg, outline) => ({
  fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "0.85rem", fontWeight: 700,
  letterSpacing: 1, textTransform: "uppercase", color: "#fff",
  background: outline ? "transparent" : bg, border: outline ? "1px solid rgba(255,255,255,0.15)" : "none",
  padding: "14px 32px", borderRadius: 100, cursor: "pointer", transition: "all 0.2s",
});

const chipStyle = {
  fontSize: "0.65rem", fontWeight: 600, color: "#6e7082",
  background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: 20,
};

const inputStyle = {
  fontFamily: "'DM Sans',sans-serif", fontSize: "1rem", fontWeight: 500, color: "#f2f2f4",
  background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.1)",
  borderRadius: 14, padding: "14px 18px", outline: "none", width: "100%",
};

// ============ FLAG PICKER (Step 1 - Events) ============
const FLAGS = [
  // Americas
  "🇧🇷","🇺🇸","🇨🇦","🇲🇽","🇦🇷","🇨🇴","🇨🇱","🇵🇪","🇪🇨","🇻🇪","🇺🇾","🇵🇾","🇧🇴","🇨🇷","🇵🇦","🇬🇹","🇭🇳","🇸🇻","🇳🇮","🇨🇺","🇩🇴","🇵🇷","🇯🇲","🇹🇹","🇭🇹","🇧🇸","🇧🇧","🇬🇾","🇸🇷",
  // Europe
  "🇬🇧","🇩🇪","🇫🇷","🇪🇸","🇮🇹","🇵🇹","🇳🇱","🇧🇪","🇦🇹","🇨🇭","🇸🇪","🇳🇴","🇩🇰","🇫🇮","🇮🇪","🇵🇱","🇨🇿","🇷🇴","🇭🇺","🇬🇷","🇧🇬","🇭🇷","🇸🇰","🇸🇮","🇱🇹","🇱🇻","🇪🇪","🇺🇦","🇷🇺","🇧🇾","🇲🇩","🇷🇸","🇧🇦","🇲🇪","🇲🇰","🇦🇱","🇽🇰","🇮🇸","🇱🇺","🇲🇹","🇨🇾","🇲🇨","🇱🇮","🇦🇩","🇸🇲",
  // Asia
  "🇨🇳","🇯🇵","🇰🇷","🇮🇳","🇮🇩","🇹🇭","🇻🇳","🇵🇭","🇲🇾","🇸🇬","🇭🇰","🇹🇼","🇲🇴","🇧🇩","🇵🇰","🇱🇰","🇳🇵","🇲🇲","🇰🇭","🇱🇦","🇲🇳","🇰🇿","🇺🇿","🇹🇯","🇰🇬","🇹🇲","🇦🇿","🇬🇪","🇦🇲","🇦🇫","🇮🇷","🇮🇶","🇸🇾","🇯🇴","🇱🇧","🇮🇱","🇵🇸","🇰🇵","🇧🇳","🇹🇱",
  // Middle East
  "🇦🇪","🇸🇦","🇶🇦","🇰🇼","🇧🇭","🇴🇲","🇾🇪","🇹🇷",
  // Africa
  "🇳🇬","🇿🇦","🇰🇪","🇪🇬","🇲🇦","🇬🇭","🇪🇹","🇹🇿","🇺🇬","🇨🇲","🇸🇳","🇨🇩","🇦🇴","🇲🇿","🇿🇼","🇧🇼","🇳🇦","🇷🇼","🇹🇳","🇩🇿","🇱🇾","🇸🇩","🇸🇸","🇲🇺","🇲🇬","🇨🇮",
  // Oceania
  "🇦🇺","🇳🇿","🇫🇯","🇵🇬","🇼🇸","🇹🇴","🇻🇺","🇸🇧","🇰🇮","🇹🇻","🇳🇷","🇵🇼","🇲🇭","🇫🇲",
  // Global / Other
  "🌎","🌍","🌏","🌐","🎰","🎲","🚀","⚡","💎","🔗","🏆","🪙","🔥","⭐",
];

function FlagPicker({ selected, onSelect }) {
  return (
    <div style={{display:"flex",gap:4,flexWrap:"wrap",maxHeight:180,overflowY:"auto",padding:"2px 0"}}>
      {FLAGS.map((f,i)=>(
        <button key={f+i} onClick={()=>onSelect(f)} style={{
          fontSize:"1.3rem",width:36,height:36,borderRadius:10,border:"none",cursor:"pointer",
          background:selected===f?"rgba(212,32,53,0.25)":"rgba(255,255,255,0.04)",
          outline:selected===f?"2px solid #d42035":"none",display:"flex",alignItems:"center",justifyContent:"center",
        }}>{f}</button>
      ))}
    </div>
  );
}

// ============ PRIZE TEMPLATES (Step 2 - Prizes) ============
const PRIZE_TEMPLATES = [
  { icon:"👕", name:"Exclusive T-Shirt", label:"T-Shirt" },
  { icon:"🕶️", name:"RedotPay Sunglass", label:"Sunglass" },
  { icon:"✨", name:"RedotPay Stickers", label:"Stickers" },
  { icon:"🪪", name:"RedotPay Virtual Card", label:"V-Card" },
  { icon:"💳", name:"RedotPay Physical Card", label:"Card" },
  { icon:"📱", name:"RedotPay Phone Case", label:"Case" },
  { icon:"🎫", name:"RedotPay Side Event Ticket", label:"Ticket" },
  { icon:"🧢", name:"RedotPay Cap", label:"Cap" },
  { icon:"🧶", name:"RedotPay Hat", label:"Hat" },
  { icon:"🧦", name:"RedotPay Socks", label:"Socks" },
  { icon:"🖊️", name:"RedotPay Pen", label:"Pen" },
  { icon:"📓", name:"RedotPay Notepad", label:"Notepad" },
  { icon:"👛", name:"RedotPay Wallet", label:"Wallet" },
  { icon:"🎒", name:"RedotPay Backpack", label:"Backpack" },
  { icon:"🎧", name:"RedotPay Headphones", label:"Headphones" },
  { icon:"🛋️", name:"RedotPay Pillow", label:"Pillow" },
  { icon:"🪪", name:"RedotPay Card Case", label:"Card Case" },
  { icon:"💰", name:"Cash Prize", label:"Cash" },
];

function Modal({ show, onClose, children }) {
  if (!show) return null;
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",backdropFilter:"blur(14px)",
      zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn 0.3s ease",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"linear-gradient(160deg,#161622,#0e0e14)",border:"1px solid rgba(212,32,53,0.25)",
        borderRadius:28,padding:"40px 32px",maxWidth:480,width:"100%",animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        maxHeight:"90vh",overflowY:"auto",
      }}>{children}</div>
    </div>
  );
}

function Numpad({ value, onChange }) {
  const press = (v) => {
    if (v==="del") onChange(value.slice(0,-1));
    else if (v==="clear") onChange("");
    else if (value.length<30) onChange(value+v);
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,width:"100%"}}>
      {["1","2","3","4","5","6","7","8","9","del","0","clear"].map(k=>(
        <button key={k} onClick={()=>press(k==="del"||k==="clear"?k:k)} style={{
          fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:k==="del"||k==="clear"?"1.1rem":"1.4rem",
          fontWeight:700,color:k==="del"||k==="clear"?"#6e7082":"#fff",
          background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:14,padding:"18px 0",cursor:"pointer",touchAction:"manipulation",userSelect:"none",
        }}>{k==="del"?"⌫":k==="clear"?"C":k}</button>
      ))}
    </div>
  );
}

// ============ CREATE EVENT ============
function CreateEventModal({ show, onClose, onSave }) {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [emoji, setEmoji] = useState("🎰");
  const [prizes, setPrizes] = useState([]);
  const [errors, setErrors] = useState("");
  const totalChance = prizes.reduce((s,p)=>s+(p.chance||0),0);

  const updatePrize = (idx,field,value) => {
    const u=[...prizes];
    if(field==="chance") {
      u[idx]={...u[idx],chance:Math.round(parseFloat(value)||0)};
    } else {
      u[idx]={...u[idx],[field]:value};
      if(field==="name"){const w=value.trim().split(" ");u[idx].label=w.length>1?w.slice(-1)[0]:value.trim();}
    }
    setPrizes(u);setErrors("");
  };
  const SLICE_COLORS = ["#c41a2e","#1a1a30","#e8e8ec"];
  const addPrize = () => setPrizes([...prizes,{id:"p"+Date.now(),name:"",label:"",icon:"",chance:0,color:SLICE_COLORS[prizes.length%3]}]);
  const removePrize = (idx) => {setPrizes(prizes.filter((_,i)=>i!==idx));};
  const distributeEvenly = () => {
    if(prizes.length===0) return;
    const base=Math.floor(100/prizes.length);
    const remainder=100-base*prizes.length;
    setPrizes(prizes.map((p,i)=>({...p,chance:base+(i<remainder?1:0)})));
  };

  const validateAndSave = () => {
    // Auto-filter out prizes with 0% chance or empty names
    const validPrizes = prizes.filter(p => p.chance > 0 && p.name.trim() && p.icon.trim());
    if(validPrizes.length<2){setErrors("Need at least 2 prizes with chance > 0%");return;}
    const total = validPrizes.reduce((s,p)=>s+p.chance,0);
    if(total!==100){setErrors(`Chances must sum to 100% (currently ${total}%)`);return;}
    // Reassign colors by position so no adjacent slices share a color (including wrap-around)
    const palette = ["#c41a2e","#1a1a30","#e8e8ec"];
    const n = validPrizes.length;
    const finalPrizes = validPrizes.map((p,i) => {
      let colorIdx = i % palette.length;
      // If only 2 prizes, use red and dark (skip white to avoid wrap conflict)
      if (n === 2) colorIdx = i;
      // For 3+ prizes, check wrap-around: last slice can't match first
      if (n > 2 && i === n - 1 && palette[colorIdx] === palette[0 % palette.length]) {
        colorIdx = (colorIdx + 1) % palette.length;
      }
      return { ...p, color: palette[colorIdx], label: p.label.trim() || p.name.trim().split(" ").pop() };
    });
    onSave({name:name.trim(),location:location.trim(),emoji,prizes:finalPrizes,status:"active"});
    setName("");setLocation("");setEmoji("🎰");setStep(1);setErrors("");
    setPrizes([]);
  };

  return (
    <Modal show={show} onClose={()=>{onClose();setStep(1);setErrors("");}}>
      {step===1&&(
        <div>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:"2.5rem",marginBottom:8}}>{emoji}</div>
            <h2 style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.3rem",fontWeight:800}}>{t("newEvent")}</h2>
            <div style={{fontSize:"0.75rem",color:"#6e7082",marginTop:4}}>{t("step1")}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
            <div>
              <div style={{fontSize:"0.75rem",color:"#6e7082",marginBottom:6,fontWeight:600}}>{t("eventName")} *</div>
              <input value={name} onChange={e=>{setName(e.target.value);setErrors("");}} placeholder="e.g. RedotPay Amsterdam" style={inputStyle}/>
            </div>
            <div>
              <div style={{fontSize:"0.75rem",color:"#6e7082",marginBottom:6,fontWeight:600}}>{t("location")}</div>
              <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Netherlands" style={inputStyle}/>
            </div>
            <div>
              <div style={{fontSize:"0.75rem",color:"#6e7082",marginBottom:8,fontWeight:600}}>Event Flag / Icon</div>
              <FlagPicker selected={emoji} onSelect={setEmoji}/>
            </div>
          </div>
          {errors&&<div style={{fontSize:"0.78rem",color:"#ff3348",textAlign:"center",marginBottom:12}}>⚠️ {errors}</div>}
          <button onClick={()=>{if(!name.trim()){setErrors(t("nameRequired"));return;}setErrors("");setStep(2);}} style={{...btnStyle("#d42035"),width:"100%",padding:"16px 0"}}>{t("next")}</button>
        </div>
      )}
      {step===2&&(
        <div>
          <div style={{textAlign:"center",marginBottom:16}}>
            <h2 style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.2rem",fontWeight:800}}>🎯 {t("setPrizes")}</h2>
            <div style={{fontSize:"0.72rem",color:"#6e7082",marginTop:4}}>Tap items below to add prizes, then set the chance %</div>
          </div>

          {/* Quick-add prize templates */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:"0.68rem",color:"#6e7082",fontWeight:600,marginBottom:8,letterSpacing:0.5}}>TAP TO ADD ↓</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {PRIZE_TEMPLATES.map(tpl=>{
                const alreadyAdded = prizes.some(p=>p.icon===tpl.icon && p.name===tpl.name);
                return (
                  <button key={tpl.icon+tpl.name} disabled={alreadyAdded} onClick={()=>{
                    setPrizes([...prizes,{id:"p"+Date.now(),name:tpl.name,label:tpl.label,icon:tpl.icon,chance:0,color:["#c41a2e","#1a1a30","#e8e8ec"][prizes.length%3]}]);
                    setErrors("");
                  }} style={{
                    display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderRadius:10,
                    background:alreadyAdded?"rgba(34,197,94,0.1)":"rgba(255,255,255,0.04)",
                    border:`1px solid ${alreadyAdded?"rgba(34,197,94,0.2)":"rgba(255,255,255,0.08)"}`,
                    color:alreadyAdded?"#22c55e":"#f2f2f4",cursor:alreadyAdded?"default":"pointer",
                    fontSize:"0.78rem",fontWeight:600,opacity:alreadyAdded?0.6:1,transition:"all 0.15s",
                  }}>
                    <span style={{fontSize:"1rem"}}>{tpl.icon}</span>
                    {tpl.name}
                    {alreadyAdded&&<span style={{fontSize:"0.65rem"}}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chance bar */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderRadius:12,marginBottom:12,background:totalChance===100?"rgba(34,197,94,0.1)":"rgba(255,51,72,0.1)",border:`1px solid ${totalChance===100?"rgba(34,197,94,0.25)":"rgba(255,51,72,0.25)"}`}}>
            <span style={{fontSize:"0.8rem",fontWeight:700,color:totalChance===100?"#22c55e":"#ff3348"}}>Total: {totalChance}%</span>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={distributeEvenly} style={{fontSize:"0.68rem",fontWeight:700,color:"#6e7082",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"4px 10px",cursor:"pointer"}}>{t("splitEvenly")}</button>
              <span style={{fontSize:"0.75rem",color:totalChance===100?"#22c55e":"#ff3348"}}>{totalChance===100?`✅`:`${100-totalChance}% left`}</span>
            </div>
          </div>

          {/* Prize list */}
          {prizes.length===0&&(
            <div style={{textAlign:"center",padding:"28px 0",color:"#6e7082",fontSize:"0.82rem",border:"1px dashed rgba(255,255,255,0.08)",borderRadius:14,marginBottom:12}}>
              👆 Tap items above to add prizes
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16,maxHeight:280,overflowY:"auto"}}>
            {prizes.map((p,i)=>(
              <div key={p.id} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:"1.2rem",width:28,textAlign:"center"}}>{p.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <input value={p.name} onChange={e=>updatePrize(i,"name",e.target.value)} style={{...inputStyle,padding:"4px 8px",fontSize:"0.78rem",background:"transparent",border:"none",fontWeight:700,width:"100%"}} />
                  </div>
                  <span style={{fontSize:"0.82rem",fontWeight:800,color:p.chance>0?"#fff":"#6e7082",minWidth:36,textAlign:"right"}}>{p.chance}%</span>
                  <button onClick={()=>removePrize(i)} style={{background:"none",border:"none",color:"#ff3348",cursor:"pointer",fontSize:"0.9rem",padding:"2px 4px",opacity:0.5}}>✕</button>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,paddingLeft:36}}>
                  <input type="range" min="0" max="100" step="1" value={p.chance} onChange={e=>updatePrize(i,"chance",e.target.value)}
                    style={{flex:1,height:6,appearance:"none",WebkitAppearance:"none",background:`linear-gradient(to right, #d42035 ${p.chance}%, rgba(255,255,255,0.08) ${p.chance}%)`,borderRadius:3,outline:"none",cursor:"pointer"}} />
                </div>
              </div>
            ))}
          </div>

          {errors&&<div style={{fontSize:"0.78rem",color:"#ff3348",textAlign:"center",marginBottom:12}}>⚠️ {errors}</div>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setStep(1);setErrors("");}} style={{...btnStyle("transparent",true),flex:1,padding:"14px 0"}}>{t("back")}</button>
            <button onClick={validateAndSave} style={{...btnStyle(totalChance===100?"#d42035":"#333"),flex:2,padding:"14px 0",opacity:totalChance===100?1:0.5}}>{t("createEvent")} 🎰</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ============ ADMIN PANEL ============
function AdminPanel({ show, events, onClose, onRefresh }) {
  const { t } = useI18n();
  const [pin, setPin] = useState("");
  const [role, setRole] = useState(null);
  const [pinError, setPinError] = useState("");
  const [ownerPin, setOwnerPin] = useState("0707");
  const [empPin, setEmpPin] = useState("1234");
  const [newOwnerPin, setNewOwnerPin] = useState("");
  const [newEmpPin, setNewEmpPin] = useState("");

  useEffect(() => {
    if (show) {
      getConfig("ownerPin").then(v => { if (v) setOwnerPin(v); });
      getConfig("employeePin").then(v => { if (v) setEmpPin(v); });
    }
  }, [show]);

  if (!show) return null;

  const tryLogin = () => {
    if (pin === ownerPin) { setRole("owner"); setPinError(""); }
    else if (pin === empPin) { setRole("employee"); setPinError(""); }
    else { setPin(""); setPinError(t("invalidPin")); }
  };
  const handleClose = () => { onClose(); setRole(null); setPin(""); setPinError(""); };

  if (!role) {
    return (
      <Modal show={true} onClose={handleClose}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"2.5rem",marginBottom:12}}>🔐</div>
          <h2 style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.2rem",fontWeight:800,marginBottom:6}}>{t("accessAdmin")}</h2>
          <p style={{fontSize:"0.78rem",color:"#6e7082",marginBottom:20}}>{t("enterPin")}</p>
          <Numpad value={pin} onChange={v=>{setPin(v);setPinError("");}}/>
          {pinError&&<div style={{fontSize:"0.78rem",color:"#ff3348",marginTop:8}}>⚠️ {pinError}</div>}
          <button onClick={tryLogin} style={{...btnStyle("#d42035"),width:"100%",padding:"16px 0",marginTop:12}}>{t("enter")}</button>
          <div style={{marginTop:16,fontSize:"0.68rem",color:"#6e7082",lineHeight:1.6}}>🔴 {t("ownerTip")}<br/>⚪ {t("empTip")}</div>
        </div>
      </Modal>
    );
  }

  const isOwner = role === "owner";
  const allPlays = events.reduce((s,ev)=>s+(ev.play_count||0),0);
  const activeCount = events.filter(e=>e.status==="active").length;

  const exportAllCSV = async () => {
    const plays = await getAllPlays();
    if(!plays.length) return;
    const csv="Event,Location,UID,Prize,Timestamp\n"+plays.map(p=>`"${p.events?.name||""}","${p.events?.location||""}","${p.uid}","${p.prize_name}","${p.played_at||""}"`).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;
    a.download="redotpay-all-events.csv";document.body.appendChild(a);a.click();document.body.removeChild(a);
  };

  const resetAll = async () => {
    for(const ev of events) { await dbDeleteEvent(ev.id); }
    onRefresh(); handleClose();
  };

  return (
    <Modal show={true} onClose={handleClose}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <h2 style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.3rem",fontWeight:800,flex:1}}>⚙️ {isOwner?t("ownerPanel"):t("empPanel")}</h2>
          <span style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:1,textTransform:"uppercase",padding:"4px 12px",borderRadius:20,background:isOwner?"rgba(212,32,53,0.15)":"rgba(255,255,255,0.06)",color:isOwner?"#ff3348":"#6e7082",border:`1px solid ${isOwner?"rgba(212,32,53,0.3)":"rgba(255,255,255,0.1)"}`}}>
            {isOwner?`🔴 ${t("owner")}`:`⚪ ${t("employee")}`}
          </span>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          <div style={{...chipStyle,padding:"10px 16px"}}>{t("events")}: <strong style={{color:"#fff"}}>{events.length}</strong></div>
          <div style={{...chipStyle,padding:"10px 16px"}}>{t("active")}: <strong style={{color:"#22c55e"}}>{activeCount}</strong></div>
        </div>
        <button onClick={exportAllCSV} style={{...btnStyle("transparent",true),width:"100%",padding:"14px 0",marginBottom:16,fontSize:"0.85rem"}}>{t("exportAll")}</button>

        {isOwner && (
          <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:16,display:"flex",flexDirection:"column",gap:16}}>
            <div style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#ff3348"}}>🔴 {t("ownerSettings")}</div>
            <div>
              <div style={{fontSize:"0.75rem",color:"#6e7082",marginBottom:6}}>{t("changeOwnerPin")}</div>
              <div style={{display:"flex",gap:8}}>
                <input value={newOwnerPin} onChange={e=>setNewOwnerPin(e.target.value)} placeholder="New PIN (min 4)" type="password" style={{...inputStyle,flex:1,padding:"10px 14px",fontSize:"0.9rem"}}/>
                <button onClick={async()=>{if(newOwnerPin.length>=4){await setConfig("ownerPin",newOwnerPin);setOwnerPin(newOwnerPin);setNewOwnerPin("");}}} style={{...btnStyle("#d42035"),padding:"10px 20px",fontSize:"0.8rem"}}>{t("save")}</button>
              </div>
            </div>
            <div>
              <div style={{fontSize:"0.75rem",color:"#6e7082",marginBottom:6}}>{t("changeEmpPin")}</div>
              <div style={{display:"flex",gap:8}}>
                <input value={newEmpPin} onChange={e=>setNewEmpPin(e.target.value)} placeholder="New PIN (min 4)" type="password" style={{...inputStyle,flex:1,padding:"10px 14px",fontSize:"0.9rem"}}/>
                <button onClick={async()=>{if(newEmpPin.length>=4){await setConfig("employeePin",newEmpPin);setEmpPin(newEmpPin);setNewEmpPin("");}}} style={{...btnStyle("#d42035"),padding:"10px 20px",fontSize:"0.8rem"}}>{t("save")}</button>
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"12px 16px"}}>
              <div style={{fontSize:"0.7rem",color:"#6e7082",marginBottom:6}}>{t("pins")}</div>
              <div style={{display:"flex",gap:16}}>
                <span style={{fontSize:"0.78rem"}}>🔴 Owner: <strong>{ownerPin}</strong></span>
                <span style={{fontSize:"0.78rem"}}>⚪ Employee: <strong>{empPin}</strong></span>
              </div>
            </div>
            <button onClick={resetAll} style={{background:"rgba(212,32,53,0.1)",border:"1px dashed rgba(212,32,53,0.3)",borderRadius:100,padding:"12px 0",width:"100%",color:"#ff3348",cursor:"pointer",fontWeight:700,fontSize:"0.8rem"}}>{t("resetAll")}</button>
          </div>
        )}
        {!isOwner && (
          <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:12,textAlign:"center"}}>
            <p style={{fontSize:"0.75rem",color:"#6e7082"}}>{t("contactAdmin")}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ============ MAIN PAGE ============
export default function Home() {
  const { t } = useI18n();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      const evts = await getEvents();
      setEvents(evts);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleCreateEvent = async (eventData) => {
    const id = "ev_" + Date.now();
    await dbCreateEvent({ id, ...eventData });
    await loadEvents();
    setShowCreate(false);
  };

  const activeEvents = events.filter(e => e.status === "active");
  const finishedEvents = events.filter(e => e.status === "finished");

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#06060a",display:"flex",alignItems:"center",justifyContent:"center",color:"#6e7082"}}>Loading...</div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#06060a",color:"#f2f2f4",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{maxWidth:960,margin:"0 auto",padding:"48px 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32}}>
          <div style={{width:80}}/>
          <img src={LOGO} alt="RedotPay" style={{width:"clamp(140px,30vw,200px)",height:"auto",filter:"drop-shadow(0 2px 12px rgba(212,32,53,0.2))"}}/>
          <div style={{width:80,display:"flex",justifyContent:"flex-end"}}><LanguageSelector/></div>
        </div>
        <div style={{textAlign:"center",marginBottom:48}}>
          <h1 style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"clamp(2rem,5vw,3rem)",fontWeight:800,letterSpacing:-1,marginBottom:12}}>🎰 {t("platform")}</h1>
          <p style={{color:"#6e7082",fontSize:"0.95rem",maxWidth:480,margin:"0 auto"}}>{t("selectEvent")}</p>
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:40,flexWrap:"wrap"}}>
          <button onClick={()=>setShowCreate(true)} style={btnStyle("#d42035")}>+ {t("newEvent")}</button>
          <button onClick={()=>setShowAdmin(true)} style={btnStyle("transparent",true)}>⚙️ {t("admin")}</button>
        </div>

        {activeEvents.length>0&&(
          <>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 8px #22c55e"}}/>
              <h2 style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.1rem",fontWeight:700}}>{t("activeEvents")}</h2>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16,marginBottom:40}}>
              {activeEvents.map(ev=>(
                <div key={ev.id} onClick={()=>router.push(`/event/${ev.id}`)} style={{
                  background:"#0e0e14",border:"1px solid rgba(255,255,255,0.06)",borderRadius:20,padding:28,cursor:"pointer",transition:"all 0.2s",display:"flex",flexDirection:"column",gap:12,
                }} onMouseOver={e=>e.currentTarget.style.borderColor="rgba(212,32,53,0.3)"} onMouseOut={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.06)"}>
                  <div style={{fontSize:"2rem"}}>{ev.emoji||"🎰"}</div>
                  <div>
                    <div style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.2rem",fontWeight:800,marginBottom:4}}>{ev.name}</div>
                    <div style={{fontSize:"0.78rem",color:"#6e7082"}}>{ev.location}</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <span style={chipStyle}>{ev.prizes?.length||0} {t("prizes")}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {finishedEvents.length>0&&(
          <>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#6e7082"}}/>
              <h2 style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.1rem",fontWeight:700}}>{t("finishedEvents")}</h2>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
              {finishedEvents.map(ev=>(
                <div key={ev.id} onClick={()=>router.push(`/event/${ev.id}`)} style={{
                  background:"#0a0a10",border:"1px solid rgba(255,255,255,0.04)",borderRadius:20,padding:28,cursor:"pointer",opacity:0.6,transition:"all 0.2s",display:"flex",flexDirection:"column",gap:12,
                }}>
                  <div style={{fontSize:"2rem"}}>{ev.emoji||"🏁"}</div>
                  <div>
                    <div style={{fontFamily:"'Plus Jakarta Sans'",fontSize:"1.1rem",fontWeight:800,marginBottom:4}}>{ev.name}</div>
                    <div style={{fontSize:"0.78rem",color:"#6e7082"}}>{ev.location} — Finished</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {events.length===0&&(
          <div style={{textAlign:"center",padding:"60px 0",color:"#6e7082"}}>
            <div style={{fontSize:"3rem",marginBottom:16}}>🎲</div>
            <p>{t("noEvents")}</p>
          </div>
        )}
      </div>
      <CreateEventModal show={showCreate} onClose={()=>setShowCreate(false)} onSave={handleCreateEvent}/>
      <AdminPanel show={showAdmin} events={events} onClose={()=>setShowAdmin(false)} onRefresh={loadEvents}/>
    </div>
  );
}

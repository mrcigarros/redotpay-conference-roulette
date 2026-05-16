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
  "🇧🇷","🇺🇸","🇬🇧","🇨🇳","🇯🇵","🇰🇷","🇮🇳","🇩🇪","🇫🇷","🇪🇸","🇮🇹","🇵🇹","🇳🇱","🇦🇺","🇨🇦","🇲🇽","🇦🇷","🇨🇴",
  "🇹🇷","🇦🇪","🇸🇬","🇭🇰","🇹🇼","🇹🇭","🇻🇳","🇵🇭","🇮🇩","🇲🇾","🇳🇬","🇿🇦","🇰🇪","🇪🇬","🇸🇦","🇶🇦","🇵🇰","🇧🇩",
  "🇵🇱","🇸🇪","🇳🇴","🇩🇰","🇫🇮","🇨🇿","🇷🇴","🇭🇺","🇦🇹","🇨🇭","🇧🇪","🇮🇪","🇮🇱","🇺🇦","🇷🇺","🇵🇪","🇨🇱","🇪🇨",
  "🌎","🌍","🌏","🎰","🎲","🚀","⚡","💎","🔗","🏆",
];

function FlagPicker({ selected, onSelect }) {
  return (
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
      {FLAGS.map(f=>(
        <button key={f} onClick={()=>onSelect(f)} style={{
          fontSize:"1.3rem",width:38,height:38,borderRadius:10,border:"none",cursor:"pointer",
          background:selected===f?"rgba(212,32,53,0.25)":"rgba(255,255,255,0.04)",
          outline:selected===f?"2px solid #d42035":"none",display:"flex",alignItems:"center",justifyContent:"center",
        }}>{f}</button>
      ))}
    </div>
  );
}

// ============ PRIZE TEMPLATES (Step 2 - Prizes) ============
const PRIZE_TEMPLATES = [
  { icon:"👕", name:"T-Shirt", label:"T-Shirt" },
  { icon:"🕶️", name:"Sunglasses", label:"Shades" },
  { icon:"✨", name:"Stickers", label:"Stickers" },
  { icon:"💳", name:"RedotPay Card", label:"Card" },
  { icon:"🪪", name:"Virtual Card", label:"V-Card" },
  { icon:"📱", name:"Phone Case", label:"Case" },
  { icon:"🎫", name:"Event Ticket", label:"Ticket" },
  { icon:"🧢", name:"Cap", label:"Cap" },
  { icon:"🧶", name:"Beanie", label:"Beanie" },
  { icon:"👟", name:"Shoes", label:"Shoes" },
  { icon:"🖊️", name:"Pen", label:"Pen" },
  { icon:"📓", name:"Notepad", label:"Notepad" },
  { icon:"👛", name:"Wallet", label:"Wallet" },
  { icon:"🎒", name:"Backpack", label:"Backpack" },
  { icon:"🎧", name:"Headphones", label:"Headphones" },
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
    u[idx]={...u[idx],[field]:field==="chance"?(parseFloat(value)||0):value};
    if(field==="name"){const w=value.trim().split(" ");u[idx].label=w.length>1?w.slice(-1)[0]:value.trim();}
    setPrizes(u);setErrors("");
  };
  const addPrize = () => setPrizes([...prizes,{id:"p"+Date.now(),name:"",label:"",icon:"",chance:0,color:prizes.length%2===0?"#c41a2e":"#1a1a30"}]);
  const removePrize = (idx) => {setPrizes(prizes.filter((_,i)=>i!==idx));};
  const distributeEvenly = () => {
    const each=Math.floor((100/prizes.length)*10)/10;
    setPrizes(prizes.map((p,i)=>({...p,chance:i===prizes.length-1?Math.round((100-each*(prizes.length-1))*10)/10:each})));
  };

  const validateAndSave = () => {
    if(prizes.length<2){setErrors(t("minPrizes"));return;}
    for(let i=0;i<prizes.length;i++){
      if(!prizes[i].name.trim()){setErrors(`#${i+1} ${t("needsName")}`);return;}
      if(!prizes[i].icon.trim()){setErrors(`#${i+1} ${t("needsEmoji")}`);return;}
      if(prizes[i].chance<=0){setErrors(`#${i+1} ${t("needsChance")}`);return;}
    }
    if(Math.round(totalChance*10)/10!==100){setErrors(t("mustSum"));return;}
    const finalPrizes=prizes.map(p=>({...p,label:p.label.trim()||p.name.trim().split(" ").pop()}));
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
                    setPrizes([...prizes,{id:"p"+Date.now(),name:tpl.name,label:tpl.label,icon:tpl.icon,chance:0,color:prizes.length%2===0?"#c41a2e":"#1a1a30"}]);
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
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderRadius:12,marginBottom:12,background:Math.round(totalChance*10)/10===100?"rgba(34,197,94,0.1)":"rgba(255,51,72,0.1)",border:`1px solid ${Math.round(totalChance*10)/10===100?"rgba(34,197,94,0.25)":"rgba(255,51,72,0.25)"}`}}>
            <span style={{fontSize:"0.8rem",fontWeight:700,color:Math.round(totalChance*10)/10===100?"#22c55e":"#ff3348"}}>Total: {totalChance.toFixed(1)}%</span>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={distributeEvenly} style={{fontSize:"0.68rem",fontWeight:700,color:"#6e7082",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"4px 10px",cursor:"pointer"}}>{t("splitEvenly")}</button>
              <span style={{fontSize:"0.75rem",color:Math.round(totalChance*10)/10===100?"#22c55e":"#ff3348"}}>{Math.round(totalChance*10)/10===100?`✅`:`${(100-totalChance).toFixed(1)}% left`}</span>
            </div>
          </div>

          {/* Prize list */}
          {prizes.length===0&&(
            <div style={{textAlign:"center",padding:"28px 0",color:"#6e7082",fontSize:"0.82rem",border:"1px dashed rgba(255,255,255,0.08)",borderRadius:14,marginBottom:12}}>
              👆 Tap items above to add prizes
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16,maxHeight:240,overflowY:"auto"}}>
            {prizes.map((p,i)=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 12px"}}>
                <span style={{fontSize:"1.3rem",width:32,textAlign:"center"}}>{p.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <input value={p.name} onChange={e=>updatePrize(i,"name",e.target.value)} style={{...inputStyle,padding:"6px 10px",fontSize:"0.82rem",background:"transparent",border:"none",fontWeight:700}} />
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                  <input type="number" min="0" max="100" step="0.1" value={p.chance||""} onChange={e=>updatePrize(i,"chance",e.target.value)} style={{...inputStyle,width:56,padding:"6px 4px",fontSize:"0.82rem",textAlign:"center"}}/>
                  <span style={{fontSize:"0.75rem",color:"#6e7082"}}>%</span>
                </div>
                <button onClick={()=>removePrize(i)} style={{background:"none",border:"none",color:"#ff3348",cursor:"pointer",fontSize:"1rem",padding:"4px",opacity:0.6}}>✕</button>
              </div>
            ))}
          </div>

          {errors&&<div style={{fontSize:"0.78rem",color:"#ff3348",textAlign:"center",marginBottom:12}}>⚠️ {errors}</div>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setStep(1);setErrors("");}} style={{...btnStyle("transparent",true),flex:1,padding:"14px 0"}}>{t("back")}</button>
            <button onClick={validateAndSave} style={{...btnStyle(Math.round(totalChance*10)/10===100?"#d42035":"#333"),flex:2,padding:"14px 0",opacity:Math.round(totalChance*10)/10===100?1:0.5}}>{t("createEvent")} 🎰</button>
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

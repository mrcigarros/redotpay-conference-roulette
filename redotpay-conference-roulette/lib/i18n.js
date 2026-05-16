"use client";
import { createContext, useContext, useState } from "react";

export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
];

const T = {
  en: {
    platform: "Roulette Platform", selectEvent: "Select an active event to play, or create a new one for your region.",
    newEvent: "New Event", admin: "Admin Panel", activeEvents: "Active Events", finishedEvents: "Finished Events",
    noEvents: "No events yet. Create your first event to get started!", plays: "plays", prizes: "prizes",
    step1: "Step 1 of 2 — Event Info", step2: "Step 2 of 2 — Each prize needs a name, emoji, and chance %",
    eventName: "Event Name", location: "Location", eventEmoji: "Event Emoji", next: "Next → Set Prizes",
    setPrizes: "Set Prizes", ready: "Ready!", remaining: "remaining", addPrize: "+ Add Prize", splitEvenly: "⚖️ Split Evenly",
    back: "← Back", createEvent: "Create Event", untitled: "Untitled prize", minPrizes: "Minimum 2 prizes",
    prizeName: "Prize Name", chance: "Chance", searchEmoji: "🔍 Search emoji...", noResults: "No results",
    enterUid: "Enter your RedotPay UID", uidOnce: "Each UID can only play once per event.", tapNumbers: "Tap numbers below",
    confirm: "CONFIRM & SPIN", spin: "SPIN", finished: "EVENT FINISHED", youWon: "You won", close: "Close",
    alreadyPlayed: "Already played!", alreadyWon: "This UID already won:", prizeWon: "Prize won",
    liveFeed: "Live Feed", waiting: "Waiting...", settings: "Settings", history: "History",
    exportCsv: "⬇ Export CSV", finishEvent: "🏁 Finish Event", finishConfirm: "⚠️ Confirm — Finish & Download",
    finishDesc: "Finishing downloads CSV and locks the roulette.", accessAdmin: "Admin Access", enterPin: "Enter your PIN",
    ownerTip: "Owner PIN → Full control", empTip: "Employee PIN → View & export",
    enter: "Enter", owner: "OWNER", employee: "EMPLOYEE", ownerPanel: "Owner Panel", empPanel: "Employee Panel",
    events: "Events", active: "Active", exportAll: "⬇ Export ALL CSV", overview: "Events Overview",
    ownerSettings: "Owner Settings", changeOwnerPin: "Change Owner PIN", changeEmpPin: "Change Employee PIN",
    pins: "Current PINs", resetAll: "🗑 Reset ALL", invalidPin: "Invalid PIN",
    contactAdmin: "Contact your admin for Owner access.", save: "Save", noPlays: "No plays yet",
    nameRequired: "Event name is required", needsName: "needs a name", needsEmoji: "needs an emoji",
    needsChance: "needs chance > 0%", mustSum: "Must sum to 100%", uidRequired: "Please enter your UID",
    uidMin: "UID must be at least 3 characters", deleteEvent: "🗑 Delete Event", deleteConfirm: "⚠️ Confirm Delete",
  },
  zh: {
    platform: "轮盘平台", selectEvent: "选择活动或为您的区域创建新活动。",
    newEvent: "新活动", admin: "管理面板", activeEvents: "进行中", finishedEvents: "已结束",
    noEvents: "还没有活动。创建第一个吧！", plays: "次", prizes: "奖品",
    step1: "第1步 — 活动信息", step2: "第2步 — 设置奖品",
    eventName: "活动名称", location: "地点", eventEmoji: "表情", next: "下一步 →",
    setPrizes: "设置奖品", ready: "就绪！", remaining: "剩余", addPrize: "+ 添加", splitEvenly: "⚖️ 平均",
    back: "← 返回", createEvent: "创建活动", untitled: "未命名", minPrizes: "至少2个奖品",
    prizeName: "奖品名称", chance: "概率", searchEmoji: "🔍 搜索...", noResults: "无结果",
    enterUid: "输入UID", uidOnce: "每个UID只能玩一次。", tapNumbers: "点击数字",
    confirm: "确认旋转", spin: "旋转", finished: "已结束", youWon: "您赢得了", close: "关闭",
    alreadyPlayed: "已经玩过！", alreadyWon: "此UID已获得：", prizeWon: "获奖",
    liveFeed: "实时", waiting: "等待...", settings: "设置", history: "历史",
    exportCsv: "⬇ 导出", finishEvent: "🏁 结束", finishConfirm: "⚠️ 确认结束",
    finishDesc: "结束将下载CSV并锁定轮盘。", accessAdmin: "管理访问", enterPin: "输入PIN",
    ownerTip: "所有者 → 完全控制", empTip: "员工 → 查看导出",
    enter: "进入", owner: "所有者", employee: "员工", ownerPanel: "所有者面板", empPanel: "员工面板",
    events: "活动", active: "进行中", exportAll: "⬇ 导出全部", overview: "概览",
    ownerSettings: "设置", changeOwnerPin: "更改所有者PIN", changeEmpPin: "更改员工PIN",
    pins: "当前PIN", resetAll: "🗑 重置", invalidPin: "PIN无效",
    contactAdmin: "联系管理员。", save: "保存", noPlays: "暂无",
    nameRequired: "名称必填", needsName: "需要名称", needsEmoji: "需要表情",
    needsChance: "需要概率>0%", mustSum: "须为100%", uidRequired: "请输入UID",
    uidMin: "至少3字符", deleteEvent: "🗑 删除", deleteConfirm: "⚠️ 确认删除",
  },
  pt: {
    platform: "Plataforma de Roleta", selectEvent: "Selecione um evento ou crie um novo para sua região.",
    newEvent: "Novo Evento", admin: "Painel Admin", activeEvents: "Eventos Ativos", finishedEvents: "Encerrados",
    noEvents: "Nenhum evento. Crie o primeiro!", plays: "jogadas", prizes: "prêmios",
    step1: "Passo 1 — Info do Evento", step2: "Passo 2 — Defina os prêmios",
    eventName: "Nome do Evento", location: "Localização", eventEmoji: "Emoji", next: "Próximo →",
    setPrizes: "Prêmios", ready: "Pronto!", remaining: "restante", addPrize: "+ Adicionar", splitEvenly: "⚖️ Dividir",
    back: "← Voltar", createEvent: "Criar Evento", untitled: "Sem nome", minPrizes: "Mínimo 2 prêmios",
    prizeName: "Nome do Prêmio", chance: "Chance", searchEmoji: "🔍 Buscar...", noResults: "Sem resultados",
    enterUid: "Insira seu UID RedotPay", uidOnce: "Cada UID joga uma vez.", tapNumbers: "Toque nos números",
    confirm: "CONFIRMAR E GIRAR", spin: "GIRAR", finished: "ENCERRADO", youWon: "Você ganhou", close: "Fechar",
    alreadyPlayed: "Já jogou!", alreadyWon: "Este UID já ganhou:", prizeWon: "Prêmio",
    liveFeed: "Últimas Jogadas", waiting: "Aguardando...", settings: "Config", history: "Histórico",
    exportCsv: "⬇ Exportar CSV", finishEvent: "🏁 Encerrar", finishConfirm: "⚠️ Confirmar Encerrar",
    finishDesc: "Encerrar baixa o CSV e trava a roleta.", accessAdmin: "Acesso Admin", enterPin: "Digite seu PIN",
    ownerTip: "Owner → Controle total", empTip: "Employee → Ver e exportar",
    enter: "Entrar", owner: "OWNER", employee: "EMPLOYEE", ownerPanel: "Painel Owner", empPanel: "Painel Employee",
    events: "Eventos", active: "Ativos", exportAll: "⬇ Exportar Todos", overview: "Visão Geral",
    ownerSettings: "Config Owner", changeOwnerPin: "Alterar PIN Owner", changeEmpPin: "Alterar PIN Employee",
    pins: "PINs Atuais", resetAll: "🗑 Resetar Tudo", invalidPin: "PIN inválido",
    contactAdmin: "Contate seu admin.", save: "Salvar", noPlays: "Nenhuma jogada",
    nameRequired: "Nome obrigatório", needsName: "precisa de nome", needsEmoji: "precisa de emoji",
    needsChance: "precisa chance>0%", mustSum: "Deve somar 100%", uidRequired: "Insira seu UID",
    uidMin: "Mínimo 3 caracteres", deleteEvent: "🗑 Excluir", deleteConfirm: "⚠️ Confirmar Exclusão",
  },
  es: {
    platform: "Plataforma de Ruleta", selectEvent: "Selecciona un evento o crea uno nuevo.",
    newEvent: "Nuevo Evento", admin: "Panel Admin", activeEvents: "Eventos Activos", finishedEvents: "Finalizados",
    noEvents: "No hay eventos. ¡Crea el primero!", plays: "jugadas", prizes: "premios",
    step1: "Paso 1 — Info del Evento", step2: "Paso 2 — Define los premios",
    eventName: "Nombre", location: "Ubicación", eventEmoji: "Emoji", next: "Siguiente →",
    setPrizes: "Premios", ready: "¡Listo!", remaining: "restante", addPrize: "+ Agregar", splitEvenly: "⚖️ Dividir",
    back: "← Atrás", createEvent: "Crear Evento", untitled: "Sin nombre", minPrizes: "Mínimo 2 premios",
    prizeName: "Nombre del Premio", chance: "Probabilidad", searchEmoji: "🔍 Buscar...", noResults: "Sin resultados",
    enterUid: "Ingresa tu UID", uidOnce: "Cada UID juega una vez.", tapNumbers: "Toca los números",
    confirm: "CONFIRMAR Y GIRAR", spin: "GIRAR", finished: "FINALIZADO", youWon: "Ganaste", close: "Cerrar",
    alreadyPlayed: "¡Ya jugaste!", alreadyWon: "Este UID ya ganó:", prizeWon: "Premio",
    liveFeed: "En Vivo", waiting: "Esperando...", settings: "Config", history: "Historial",
    exportCsv: "⬇ Exportar", finishEvent: "🏁 Finalizar", finishConfirm: "⚠️ Confirmar",
    finishDesc: "Finalizar descarga CSV y bloquea la ruleta.", accessAdmin: "Acceso Admin", enterPin: "Ingresa tu PIN",
    ownerTip: "Owner → Control total", empTip: "Employee → Ver y exportar",
    enter: "Entrar", owner: "OWNER", employee: "EMPLOYEE", ownerPanel: "Panel Owner", empPanel: "Panel Employee",
    events: "Eventos", active: "Activos", exportAll: "⬇ Exportar Todo", overview: "Resumen",
    ownerSettings: "Config Owner", changeOwnerPin: "Cambiar PIN Owner", changeEmpPin: "Cambiar PIN Employee",
    pins: "PINs Actuales", resetAll: "🗑 Resetear Todo", invalidPin: "PIN inválido",
    contactAdmin: "Contacta a tu admin.", save: "Guardar", noPlays: "Sin jugadas",
    nameRequired: "Nombre requerido", needsName: "necesita nombre", needsEmoji: "necesita emoji",
    needsChance: "necesita probabilidad>0%", mustSum: "Debe sumar 100%", uidRequired: "Ingresa tu UID",
    uidMin: "Mínimo 3 caracteres", deleteEvent: "🗑 Eliminar", deleteConfirm: "⚠️ Confirmar Eliminar",
  },
  de: {
    platform: "Roulette-Plattform", selectEvent: "Wähle ein Event oder erstelle ein neues.",
    newEvent: "Neues Event", admin: "Admin", activeEvents: "Aktive Events", finishedEvents: "Beendet",
    noEvents: "Noch keine Events!", plays: "Spiele", prizes: "Preise",
    step1: "Schritt 1 — Event-Info", step2: "Schritt 2 — Preise festlegen",
    eventName: "Name", location: "Ort", eventEmoji: "Emoji", next: "Weiter →",
    setPrizes: "Preise", ready: "Bereit!", remaining: "übrig", addPrize: "+ Hinzufügen", splitEvenly: "⚖️ Gleich",
    back: "← Zurück", createEvent: "Event erstellen", untitled: "Unbenannt", minPrizes: "Min. 2 Preise",
    prizeName: "Preisname", chance: "Chance", searchEmoji: "🔍 Suchen...", noResults: "Keine Ergebnisse",
    enterUid: "UID eingeben", uidOnce: "Jede UID nur einmal.", tapNumbers: "Zahlen tippen",
    confirm: "BESTÄTIGEN", spin: "DREHEN", finished: "BEENDET", youWon: "Gewonnen", close: "Schließen",
    alreadyPlayed: "Bereits gespielt!", alreadyWon: "Diese UID hat gewonnen:", prizeWon: "Preis",
    liveFeed: "Live", waiting: "Warten...", settings: "Einstellungen", history: "Verlauf",
    exportCsv: "⬇ Export", finishEvent: "🏁 Beenden", finishConfirm: "⚠️ Bestätigen",
    finishDesc: "Beenden lädt CSV herunter.", accessAdmin: "Admin-Zugang", enterPin: "PIN eingeben",
    ownerTip: "Owner → Volle Kontrolle", empTip: "Mitarbeiter → Ansicht & Export",
    enter: "Eintreten", owner: "OWNER", employee: "MITARBEITER", ownerPanel: "Owner", empPanel: "Mitarbeiter",
    events: "Events", active: "Aktiv", exportAll: "⬇ Alle exportieren", overview: "Übersicht",
    ownerSettings: "Owner-Einstellungen", changeOwnerPin: "Owner-PIN ändern", changeEmpPin: "Mitarbeiter-PIN ändern",
    pins: "PINs", resetAll: "🗑 Alles zurücksetzen", invalidPin: "Ungültig",
    contactAdmin: "Admin kontaktieren.", save: "Speichern", noPlays: "Keine Spiele",
    nameRequired: "Name erforderlich", needsName: "braucht Name", needsEmoji: "braucht Emoji",
    needsChance: "braucht Chance>0%", mustSum: "Muss 100% ergeben", uidRequired: "UID eingeben",
    uidMin: "Min. 3 Zeichen", deleteEvent: "🗑 Löschen", deleteConfirm: "⚠️ Löschen bestätigen",
  },
  fr: {
    platform: "Plateforme Roulette", selectEvent: "Sélectionnez un événement ou créez-en un nouveau.",
    newEvent: "Nouveau", admin: "Admin", activeEvents: "Actifs", finishedEvents: "Terminés",
    noEvents: "Aucun événement. Créez le premier !", plays: "parties", prizes: "prix",
    step1: "Étape 1 — Info", step2: "Étape 2 — Prix",
    eventName: "Nom", location: "Lieu", eventEmoji: "Emoji", next: "Suivant →",
    setPrizes: "Prix", ready: "Prêt !", remaining: "restant", addPrize: "+ Ajouter", splitEvenly: "⚖️ Répartir",
    back: "← Retour", createEvent: "Créer", untitled: "Sans nom", minPrizes: "Min. 2 prix",
    prizeName: "Nom du Prix", chance: "Chance", searchEmoji: "🔍 Chercher...", noResults: "Aucun résultat",
    enterUid: "Entrez votre UID", uidOnce: "Une seule fois par événement.", tapNumbers: "Appuyez",
    confirm: "CONFIRMER", spin: "TOURNER", finished: "TERMINÉ", youWon: "Gagné", close: "Fermer",
    alreadyPlayed: "Déjà joué !", alreadyWon: "Cet UID a gagné :", prizeWon: "Prix",
    liveFeed: "En Direct", waiting: "Attente...", settings: "Paramètres", history: "Historique",
    exportCsv: "⬇ Exporter", finishEvent: "🏁 Terminer", finishConfirm: "⚠️ Confirmer",
    finishDesc: "Terminer télécharge le CSV.", accessAdmin: "Accès Admin", enterPin: "Entrez PIN",
    ownerTip: "Propriétaire → Contrôle total", empTip: "Employé → Voir & exporter",
    enter: "Entrer", owner: "PROPRIÉTAIRE", employee: "EMPLOYÉ", ownerPanel: "Propriétaire", empPanel: "Employé",
    events: "Événements", active: "Actifs", exportAll: "⬇ Tout exporter", overview: "Aperçu",
    ownerSettings: "Paramètres", changeOwnerPin: "Changer PIN proprio", changeEmpPin: "Changer PIN employé",
    pins: "PINs", resetAll: "🗑 Tout réinitialiser", invalidPin: "PIN invalide",
    contactAdmin: "Contactez l'admin.", save: "Enregistrer", noPlays: "Aucune partie",
    nameRequired: "Nom requis", needsName: "besoin d'un nom", needsEmoji: "besoin d'un emoji",
    needsChance: "besoin chance>0%", mustSum: "Doit totaliser 100%", uidRequired: "Entrez UID",
    uidMin: "Min. 3 caractères", deleteEvent: "🗑 Supprimer", deleteConfirm: "⚠️ Confirmer suppression",
  },
  nl: {
    platform: "Roulette Platform", selectEvent: "Selecteer een evenement of maak een nieuw aan.",
    newEvent: "Nieuw", admin: "Admin", activeEvents: "Actief", finishedEvents: "Afgelopen",
    noEvents: "Nog geen evenementen!", plays: "rondes", prizes: "prijzen",
    step1: "Stap 1 — Info", step2: "Stap 2 — Prijzen",
    eventName: "Naam", location: "Locatie", eventEmoji: "Emoji", next: "Volgende →",
    setPrizes: "Prijzen", ready: "Klaar!", remaining: "resterend", addPrize: "+ Toevoegen", splitEvenly: "⚖️ Verdelen",
    back: "← Terug", createEvent: "Aanmaken", untitled: "Naamloos", minPrizes: "Min. 2 prijzen",
    prizeName: "Prijsnaam", chance: "Kans", searchEmoji: "🔍 Zoeken...", noResults: "Geen resultaten",
    enterUid: "Voer UID in", uidOnce: "Eén keer per evenement.", tapNumbers: "Tik nummers",
    confirm: "BEVESTIGEN", spin: "DRAAIEN", finished: "AFGELOPEN", youWon: "Gewonnen", close: "Sluiten",
    alreadyPlayed: "Al gespeeld!", alreadyWon: "Deze UID heeft gewonnen:", prizeWon: "Prijs",
    liveFeed: "Live", waiting: "Wachten...", settings: "Instellingen", history: "Geschiedenis",
    exportCsv: "⬇ Exporteren", finishEvent: "🏁 Beëindigen", finishConfirm: "⚠️ Bevestigen",
    finishDesc: "Beëindigen downloadt CSV.", accessAdmin: "Admin Toegang", enterPin: "PIN invoeren",
    ownerTip: "Eigenaar → Volledige controle", empTip: "Medewerker → Bekijken & exporteren",
    enter: "Inloggen", owner: "EIGENAAR", employee: "MEDEWERKER", ownerPanel: "Eigenaar", empPanel: "Medewerker",
    events: "Evenementen", active: "Actief", exportAll: "⬇ Alles exporteren", overview: "Overzicht",
    ownerSettings: "Eigenaar Instellingen", changeOwnerPin: "Eigenaar PIN", changeEmpPin: "Medewerker PIN",
    pins: "PINs", resetAll: "🗑 Alles resetten", invalidPin: "Ongeldig",
    contactAdmin: "Neem contact op met admin.", save: "Opslaan", noPlays: "Geen rondes",
    nameRequired: "Naam vereist", needsName: "naam nodig", needsEmoji: "emoji nodig",
    needsChance: "kans>0% nodig", mustSum: "Moet 100% zijn", uidRequired: "Voer UID in",
    uidMin: "Min. 3 tekens", deleteEvent: "🗑 Verwijderen", deleteConfirm: "⚠️ Bevestig verwijdering",
  },
};

const I18nContext = createContext({ t: (k) => k, lang: "en", setLang: () => {} });

export function I18nProvider({ children }) {
  const [lang, setLang] = useState("en");
  const t = (key) => T[lang]?.[key] || T.en[key] || key;
  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageSelector() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
          color: "#f2f2f4", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
        }}
      >
        <span>{current?.flag}</span>
        <span style={{ fontSize: "0.75rem" }}>{current?.code.toUpperCase()}</span>
        <span style={{ fontSize: "0.6rem", color: "#6e7082" }}>▼</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute", top: "100%", right: 0, marginTop: 6, zIndex: 999,
            background: "#12121a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
            padding: 6, minWidth: 170, boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px",
                background: lang === l.code ? "rgba(212,32,53,0.15)" : "transparent",
                border: "none", borderRadius: 10, color: "#f2f2f4", cursor: "pointer", fontSize: "0.82rem",
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>{l.flag}</span>
              <span style={{ fontWeight: lang === l.code ? 700 : 400 }}>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

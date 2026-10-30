"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { Heart, Search, Radio, Menu, X, Play, Tv, Globe2, RefreshCw, ExternalLink, Volume2, VolumeX, Minimize2, Maximize2, Monitor, Smartphone, Pause } from "lucide-react";
import PWAInstallButton from "./PWAInstallButton";
import TVPairingPanel from "./TVPairingPanel";

type Channel = { name: string; url: string; logo?: string; group?: string; country?: string };
type Special = { name: string; url: string; note: string };

const SPECIALS: Special[] = [
  { name: "Al Hadath", url: process.env.NEXT_PUBLIC_AL_HADATH_STREAM || process.env.NEXT_PUBLIC_AL_HADATH_EMBED || "https://www.elahmad.ru/tv/alarabiya_alhadath.php", note: "News · Live TV" },
  { name: "MTV Lebanon", url: process.env.NEXT_PUBLIC_MTV_LEBANON_STREAM || process.env.NEXT_PUBLIC_MTV_LEBANON_EMBED || "https://www.elahmad.ru/tv/mtvlebanon.htm", note: "Lebanese TV" },
  { name: "LBC Lebanon", url: process.env.NEXT_PUBLIC_LBC_LEBANON_STREAM || process.env.NEXT_PUBLIC_LBC_LEBANON_EMBED || "https://www.elahmad.ru/tv/lbc.php", note: "Lebanese TV" },
  { name: "Al Jadeed Lebanon", url: process.env.NEXT_PUBLIC_JADEED_LEBANON_STREAM || process.env.NEXT_PUBLIC_JADEED_LEBANON_EMBED || "https://www.elahmad.ru/tv/newtv.php", note: "Lebanese TV" },
];

const isDirectMedia = (url: string) => /\.(m3u8|mp4|webm|mpd)(\?|#|$)/i.test(url);
// The curated in-site entries take precedence over similarly named playlist entries.
// This keeps each requested channel to one result even when IPTV-org lists multiple qualities.
const canonicalSpecial = (name: string) => {
  const n = name.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  if (/\b(al )?hadath\b|alarabiya.*hadath/.test(n)) return "al hadath";
  if (/\bmtv\b/.test(n) && /\blebanon\b|\blebanese\b/.test(n)) return "mtv lebanon";
  if (/\blbc\b/.test(n)) return "lbc lebanon";
  if (/\b(al )?jadeed\b/.test(n)) return "al jadeed lebanon";
  return null;
};
const COPY = {
  en: {
    discover: "DISCOVER", all: "All channels", favorites: "My favorites", history: "Recently watched", lebanese: "LEBANESE CHANNELS",
    categories: "COUNTRIES", live: "LIVE TV", tagline: "YOUR WORLD. LIVE.", free: "Channel directory",
    eyebrow: "LIVE STREAMING", titleA: "Find your", titleB: "channel.", intro: "Your favorite live TV, all in one place.",
    listed: "channels listed", now: "NOW PLAYING", liveBadge: "LIVE", source: "Open source",
    sourceTitle: "Source player", sourceHelp: "Why doesn't it fit?", hideInfo: "Hide info",
    sourceWarning: "This provider page may block embedding or show its own banners and controls. KHALAF TV cannot remove content inside a third-party page. For a clean native player, configure an authorized direct stream URL or official embeddable player.",
    sourceFallback: "Open provider page", returnToDirectory: "Choose another channel", blockedTitle: "This provider does not allow its webpage to be embedded in KHALAF TV.", blockedHelp: "Open the provider in a new tab to watch. KHALAF TV will stay open in this tab, so you can return here and choose another channel.", returnHint: "When you are finished, switch back to the KHALAF TV tab in your browser or use this button to choose another channel.", choose: "Choose a channel to start watching", chooseHint: "Select a channel from the list below.",
    external: "Lebanese TV · External source", addFavorite: "Add favorite", saved: "Saved",
    explore: "Explore channels", loading: "Loading the public playlist…", toExplore: "channels to explore",
    search: "Search channels, countries…", stream: "Live streams", refresh: "Refresh", noResults: "No channels found",
    noResultsHint: "Try another search or category.", retry: "Try again", directory: "Stream directory",
    directoryNote: "External streams · availability varies", footer: "Channel links are provided by third parties. Availability and rights vary by stream.",
    english: "English", arabic: "العربية", language: "Language", sourceNote: "Live channel · KHALAF TV",
  },
  ar: {
    discover: "استكشف", all: "كل القنوات", favorites: "المفضلة", history: "شوهدت مؤخراً", lebanese: "القنوات اللبنانية",
    categories: "البلدان", live: "بث تلفزيوني مباشر", tagline: "عالمك. مباشرةً.", free: "دليل القنوات",
    eyebrow: "بث مباشر", titleA: "اعثر على", titleB: "قناتك.", intro: "قنواتك المباشرة المفضلة في مكان واحد.",
    listed: "قناة", now: "يُعرض الآن", liveBadge: "مباشر", source: "فتح المصدر",
    sourceTitle: "مشغل المصدر", sourceHelp: "لماذا لا يظهر بشكل مناسب؟", hideInfo: "إخفاء المعلومات",
    sourceWarning: "قد يمنع مزوّد البث تضمين صفحته أو يعرض إعلانات وعناصر تحكم خاصة به. لا يستطيع KHALAF TV إزالة المحتوى داخل صفحة خارجية. للحصول على مشغل مباشر نظيف، أضف رابط بث مباشر مصرحاً به أو مشغلاً رسمياً قابلاً للتضمين.",
    sourceFallback: "فتح صفحة المزوّد", returnToDirectory: "اختر قناة أخرى", blockedTitle: "لا يسمح هذا المزوّد بتضمين صفحة الويب داخل KHALAF TV.", blockedHelp: "افتح المزوّد في علامة تبويب جديدة للمشاهدة. سيبقى KHALAF TV مفتوحاً في علامة التبويب الحالية لتتمكن من العودة واختيار قناة أخرى.", returnHint: "عند الانتهاء، ارجع إلى علامة تبويب KHALAF TV في المتصفح أو استخدم هذا الزر لاختيار قناة أخرى.", choose: "اختر قناة لبدء المشاهدة", chooseHint: "اختر قناة من القائمة أدناه.",
    external: "تلفزيون لبناني · مصدر خارجي", addFavorite: "أضف للمفضلة", saved: "تم الحفظ",
    explore: "استكشف القنوات", loading: "جارٍ تحميل قائمة القنوات…", toExplore: "قناة للاستكشاف",
    search: "ابحث عن قناة أو بلد…", stream: "بث مباشر", refresh: "تحديث", noResults: "لم يتم العثور على قنوات",
    noResultsHint: "جرّب بحثاً أو تصنيفاً آخر.", retry: "إعادة المحاولة", directory: "دليل البث",
    directoryNote: "مصادر خارجية · يختلف التوفر", footer: "روابط القنوات من جهات خارجية. يختلف التوفر وحقوق البث حسب المصدر.",
    english: "English", arabic: "العربية", language: "اللغة", sourceNote: "قناة مباشرة · KHALAF TV",
  },
  fr: {
    discover: "DÉCOUVRIR", all: "Toutes les chaînes", favorites: "Mes favoris", history: "Récemment regardées", lebanese: "CHAÎNES LIBANAISES",
    categories: "PAYS", live: "TV EN DIRECT", tagline: "VOTRE MONDE. EN DIRECT.", free: "Guide des chaînes",
    eyebrow: "TÉLÉVISION EN DIRECT", titleA: "Trouvez votre", titleB: "chaîne.", intro: "Vos chaînes préférées, réunies au même endroit.",
    listed: "chaînes disponibles", now: "EN COURS", liveBadge: "DIRECT", source: "Ouvrir la source",
    sourceTitle: "Lecteur externe", sourceHelp: "Pourquoi cet affichage ?", hideInfo: "Masquer les infos",
    sourceWarning: "Le fournisseur peut bloquer l’intégration ou afficher ses propres publicités et commandes. KHALAF TV ne peut pas retirer le contenu d’une page tierce. Pour un lecteur intégré propre, configurez un flux direct autorisé ou un lecteur officiel.",
    sourceFallback: "Ouvrir la page du fournisseur", returnToDirectory: "Choisir une autre chaîne", blockedTitle: "Ce fournisseur n’autorise pas l’intégration de sa page dans KHALAF TV.", blockedHelp: "Ouvrez le fournisseur dans un nouvel onglet pour regarder la chaîne. KHALAF TV restera ouvert dans cet onglet pour vous permettre de revenir et de choisir une autre chaîne.", returnHint: "Lorsque vous avez terminé, revenez à l’onglet KHALAF TV de votre navigateur ou utilisez ce bouton pour choisir une autre chaîne.", choose: "Choisissez une chaîne", chooseHint: "Sélectionnez une chaîne ci-dessous pour commencer.",
    external: "Télévision libanaise · Source externe", addFavorite: "Ajouter aux favoris", saved: "Enregistré",
    explore: "Explorer les chaînes", loading: "Chargement de la playlist publique…", toExplore: "chaînes à découvrir",
    search: "Rechercher une chaîne, un pays…", stream: "Flux en direct", refresh: "Actualiser", noResults: "Aucune chaîne trouvée",
    noResultsHint: "Essayez un autre terme ou pays.", retry: "Réessayer", directory: "Répertoire des flux",
    directoryNote: "Sources externes · disponibilité variable", footer: "Les chaînes proviennent de services tiers. Disponibilité et droits varient selon la source.",
    english: "English", arabic: "العربية", language: "Langue", sourceNote: "Chaîne en direct · KHALAF TV",
  }
};

declare global {
  interface Window {
    khalafDesktop?: {
      isDesktop: true;
      openProvider: (url: string) => Promise<{ ok: boolean; message?: string }>;
      closeProvider: () => Promise<{ ok: boolean; message?: string }>;
    };
  }
}

export default function KhalafTV() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All countries");
  const [fullScreenPlayer, setFullScreenPlayer] = useState(false);
  const [selected, setSelected] = useState<Channel | Special | null>(null);
  const selectedRef = useRef<Channel | Special | null>(null);
  selectedRef.current = selected;
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showSpecialNotice, setShowSpecialNotice] = useState(false);
  const [language, setLanguage] = useState<"en" | "fr" | "ar">("en");
  const [tvMode, setTvMode] = useState(false);
  const [showPairing, setShowPairing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [onlyHistory, setOnlyHistory] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const providerWindowRef = useRef<Window | null>(null);
  const [providerTabReady, setProviderTabReady] = useState(false);
  const [providerTabMessage, setProviderTabMessage] = useState("");
  const [providerTabUrl, setProviderTabUrl] = useState("");
  const desktopBridge = typeof window !== "undefined" ? window.khalafDesktop : undefined;

  function enableRemoteProviderTab() {
    // Must be called by a physical click on the TV browser; browsers block
    // popup creation when the request originates only from a remote device.
    if (desktopBridge?.isDesktop) {
      setProviderTabReady(true);
      setProviderTabMessage("Windows remote channel control is ready.");
      return;
    }
    const popup = window.open("about:blank", "khalaf-tv-provider", "popup=yes,width=1280,height=800");
    if (!popup) {
      setProviderTabReady(false);
      setProviderTabMessage("Popup blocked. Allow pop-ups for this KHALAF TV site, then click Enable again.");
      return;
    }
    providerWindowRef.current = popup;
    setProviderTabReady(true);
    setProviderTabMessage("Remote channel tab enabled. You can now switch channels from your phone.");
    try {
      popup.document.title = "KHALAF TV · Provider";
      popup.document.body.innerHTML = "<div style='font:16px Arial;padding:32px;background:#080b12;color:#fff'>KHALAF TV remote channel window is ready. Select a channel from your phone.</div>";
    } catch {}
  }

  async function openRemoteProvider(url: string) {
    if (desktopBridge?.isDesktop) {
      const result = await desktopBridge.openProvider(url);
      return result.ok;
    }
    const popup = providerWindowRef.current;
    if (!popup || popup.closed) {
      setProviderTabReady(false);
      setProviderTabMessage("Enable the provider tab on the TV first.");
      return false;
    }
    try { popup.location.href = url; setProviderTabUrl(url); return true; }
    catch { setProviderTabMessage("Could not navigate the provider tab."); return false; }
  }

  async function closeRemoteProvider() {
    if (desktopBridge?.isDesktop) {
      const result = await desktopBridge.closeProvider();
      return result.ok;
    }

    // In a normal browser we cannot hide/minimize another window from a
    // remote command. Navigate the already-authorized popup to a dark standby
    // page (rather than leaving the white about:blank page visible) and reuse
    // it for the next provider.
    const popup = providerWindowRef.current;
    if (popup && !popup.closed) {
      try {
        popup.addEventListener("load", () => {
          try {
            popup.document.open();
            popup.document.write(
              "<!doctype html><html><head><meta charset='utf-8'><title>KHALAF TV · Standby</title>" +
              "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
              "<style>html,body{margin:0;width:100%;height:100%;background:#080b12;color:#e8eaf2;font:16px Arial,sans-serif}" +
              "main{box-sizing:border-box;min-height:100%;display:grid;place-content:center;text-align:center;padding:32px}" +
              "p{color:#aab1c5}</style></head><body><main><h2>KHALAF TV</h2>" +
              "<p>Provider closed · Choose another channel using your remote.</p></main></body></html>"
            );
            popup.document.close();
          } catch {}
        }, { once: true });
        popup.location.replace("about:blank");
      } catch {}
      setProviderTabUrl("");
      setProviderTabReady(!popup.closed);
      setProviderTabMessage("Provider closed. The authorized window is ready for the next channel.");
      return !popup.closed;
    }

    providerWindowRef.current = null;
    setProviderTabUrl("");
    setProviderTabReady(false);
    setProviderTabMessage("Provider window is no longer available. Click Enable once on the TV to reconnect.");
    return false;
  }

  function rememberChannel(name: string) {
    setHistory(prev => { const next = [name, ...prev.filter(item => item !== name)].slice(0, 30); try { localStorage.setItem("khalaf-history", JSON.stringify(next)); } catch {} return next; });
  }

  const isSpecial = selected ? "note" in selected : false;
  const isNativeSpecial = isSpecial && isDirectMedia(selected?.url || "");
  const t = COPY[language];
  const selectedName = selected?.name || "Choose a channel";
  const selectedUrl = selected?.url || "";
  const selectedLogo = selected && "logo" in selected ? selected.logo : undefined;

  return (
    <main className={`app-shell ${tvMode ? "tv-mode" : ""}`} lang={language} dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X/> : <Menu/>}</button>
        <a className="brand" href="#" aria-label="KHALAF TV home"><span className="brand-mark"><Tv size={22}/></span><span>KHALAF <b>TV</b><small>{t.tagline}</small></span></a>
        <div className="topbar-right"><button className="tv-mode-toggle" onClick={() => setTvMode(v => !v)} title="Optimize for a Smart TV screen"><Monitor size={15}/><span>{tvMode ? "Exit TV mode" : "TV display"}</span></button><button className="tv-mode-toggle pairing-trigger" onClick={() => setShowPairing(true)} title="Pair a phone remote"><Smartphone size={15}/><span>Phone remote</span></button><a className="windows-download-button" href="/api/download/windows" type="application/octet-stream" title="Download KHALAF TV for Windows"><span aria-hidden="true">↓</span> <span>Download for Windows</span></a><PWAInstallButton /><button className="language-toggle" onClick={() => setLanguage(language === "en" ? "fr" : language === "fr" ? "ar" : "en")} aria-label={t.language}>{language === "en" ? "FR" : language === "fr" ? "العربية" : "EN"}</button><span className="live-indicator"><i/> {t.live}</span><span className="topbar-caption">{t.free}</span></div>
      </header>

      <div className="layout">
        <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
          <div className="sidebar-heading">{t.discover}</div>
          <button className={`nav-item ${!onlyFavorites && !onlyHistory ? "active" : ""}`} onClick={() => {setOnlyFavorites(false); setOnlyHistory(false); setMobileMenu(false);}}><Globe2 size={18}/> {t.all} <span>{channels.length || "—"}</span></button>
          <button className={`nav-item ${onlyFavorites ? "active" : ""}`} onClick={() => {setOnlyFavorites(true); setOnlyHistory(false); setMobileMenu(false);}}><Heart size={18}/> {t.favorites}</button>
          <button className={`nav-item ${onlyHistory ? "active" : ""}`} onClick={() => {setOnlyHistory(true); setOnlyFavorites(false); setCategory("All countries"); setMobileMenu(false);}}><Tv size={18}/> {t.history} <span>{history.length || ""}</span></button>
          <div className="sidebar-heading">{t.categories}</div>
          <div className="category-list">{countries.map(country => <button key={country} className={`category-item ${category === country ? "chosen" : ""}`} onClick={() => {setCategory(country); setOnlyFavorites(false); setMobileMenu(false);}}>{country}</button>)}</div>
          <div className="sidebar-footer"><span className="status-dot"/> {t.directory} <small>{t.directoryNote}</small></div>
        </aside>

        <section className="main-content">
          <div className="welcome-row"><div><div className="eyebrow"><Radio size={14}/> {t.eyebrow}</div><h1>{t.titleA} <span>{t.titleB}</span></h1><p>{t.intro}</p>
              <div className="provider-remote-tools">
                <button type="button" className="primary-button" onClick={enableRemoteProviderTab}>
                  Enable remote channel tab
                </button>
                <button type="button" className="secondary-button" onClick={() => { void openRemoteProvider(selectedUrl); }}>
                  Open provider page
                </button>
                <button type="button" className="secondary-button" onClick={() => { void closeRemoteProvider(); }}>
                  Close provider tab
                </button>
                {providerTabMessage && <small role="status">{providerTabMessage}</small>}
              </div></div><div className="channel-count"><strong>{channels.length.toLocaleString()}</strong><span>{t.listed}</span></div></div>
          <div className={`player-card ${fullScreenPlayer ? "player-card-fullscreen" : ""}`}>
            <div className="player-topline"><span><i className="red-dot"/> NOW PLAYING</span><div className="player-topline-actions"><span className="quality-tag">LIVE</span>{fullScreenPlayer && <button className="fullscreen-close" onClick={() => setFullScreenPlayer(false)} aria-label="Exit full screen"><Minimize2 size={17}/> Exit full screen</button>}</div></div>
            {isSpecial && !isNativeSpecial ? (
              <div className="special-player">
                <div className="special-player-heading">
                  <div className="special-glow"><Tv size={34}/></div>
                  <div className="special-heading-copy">
                    <div className="special-title">{selectedName}</div>
                    <p>{t.sourceNote}</p>
                  </div>
                  <a className="secondary-button" href={selectedUrl} target="_blank" rel="noopener"><ExternalLink size={15}/> {t.source}</a>
                </div>
                <div className="provider-fallback" role="status" aria-live="polite">
                  <div className="provider-fallback-icon"><ExternalLink size={26}/></div>
                  <h3>{t.blockedTitle}</h3>
                  <p>{t.blockedHelp}</p>
                  <div className="provider-fallback-actions">
                    <button className="provider-open-button" type="button" onClick={enableRemoteProviderTab}>
                      <ExternalLink size={16}/> Enable remote channel tab
                    </button>
                    <button className="provider-return-button" type="button" onClick={() => { void openRemoteProvider(selectedUrl); }}>
                      <ExternalLink size={16}/> Open in remote tab
                    </button>
                    <button className="provider-return-button" type="button" onClick={() => { void closeRemoteProvider(); }}>
                      <Tv size={16}/> Close provider tab
                    </button>
                    <a className="provider-open-button" href={selectedUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={16}/>{t.sourceFallback}
                    </a>
                    <button className="provider-return-button" onClick={() => {
                      setFullScreenPlayer(false);
                      setSelected(null);
                      setShowSpecialNotice(false);
                      setMobileMenu(false);
                      window.setTimeout(() => document.getElementById("channels-directory")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                    }}>
                      <Tv size={16}/>{t.returnToDirectory}
                    </button>
                  </div>
                  <small>{t.returnHint}</small>
                </div>
              </div>
            ) : (
              <div className="video-wrap">
                <video ref={videoRef} controls playsInline autoPlay poster="" />
                <div className="watermark">KHALAF <b>TV</b></div>
                {!selected && <div className="video-empty"><Tv size={44}/><strong>{t.choose}</strong><span>{t.chooseHint}</span></div>}
                <div className="video-caption"><span className="video-live"><i/> LIVE</span><span>{selectedName}</span></div>
              </div>
            )}
            <div className="player-meta"><div className="now-channel">{selectedLogo ? <img src={selectedLogo} alt="" onError={e => (e.currentTarget.style.display = "none")}/> : <span className="channel-placeholder"><Tv size={20}/></span>}<div><strong>{selectedName}</strong><small>{isSpecial ? t.external : (selected && "group" in selected ? selected.group : t.live)}</small></div></div>{selected && <button className={`favorite-button ${favorites.includes(selected.name) ? "favorited" : ""}`} onClick={() => toggleFavorite(selected.name)} aria-label="Toggle favorite"><Heart size={17} fill={favorites.includes(selected.name) ? "currentColor" : "none"}/>{favorites.includes(selected.name) ? t.saved : t.addFavorite}</button>}</div>
          </div>

          <div className="channels-section" id="channels-directory">
            <div className="section-title-row"><div><h2>{onlyFavorites ? t.favorites : onlyHistory ? t.history : category === "All countries" ? t.explore : category}</h2><p>{loading ? t.loading : `${filtered.length.toLocaleString()} ${t.toExplore}`}</p></div><button className="refresh-button" onClick={loadChannels} title="Refresh channel list"><RefreshCw size={16}/><span>{t.refresh}</span></button></div>
            <div className="search-row"><div className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search}/>{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={16}/></button>}</div><div className="filter-pill"><Volume2 size={15}/><span>{t.stream}</span></div></div>
            {error && <div className="error-box">{error}<button onClick={loadChannels}>{t.retry}</button></div>}
            {loading ? <div className="loading-grid">{Array.from({length:8},(_,i)=><div className="skeleton" key={i}/>)}</div> : filtered.length === 0 ? <div className="empty-state"><Search size={28}/><strong>{t.noResults}</strong><span>{t.noResultsHint}</span></div> :
              <div className="channel-grid">{filtered.slice(0, 180).map((c,i) => { const special = "note" in c; return <article className={`channel-card ${selected?.name === c.name ? "playing" : ""}`} key={`${c.name}-${c.url}-${i}`}><button className="channel-main" onClick={() => {setSelected(c); rememberChannel(c.name); setShowSpecialNotice(special); setMobileMenu(false); setFullScreenPlayer(true);}}><span className="channel-logo">{"logo" in c && c.logo ? <img src={c.logo} alt="" loading="lazy" onError={e => {e.currentTarget.style.display="none";}}/> : <Tv size={24}/>}</span><span className="channel-info"><strong>{c.name}</strong><small>{special ? c.note : ("group" in c ? c.group || c.country || "Live TV" : "Live TV")}</small></span><span className="play-icon"><Play size={14} fill="currentColor"/></span></button><button className={`card-heart ${favorites.includes(c.name) ? "favorited" : ""}`} aria-label={`Favorite ${c.name}`} onClick={() => toggleFavorite(c.name)}><Heart size={15} fill={favorites.includes(c.name) ? "currentColor" : "none"}/></button></article>})}</div>}
            {!loading && filtered.length > 180 && <p className="list-note">Showing the first 180 matches. Search to narrow down the list.</p>}
          </div>
          <footer className="footer"><span>© {new Date().getFullYear()} KHALAF TV</span><span>{t.footer}</span></footer>
        </section>
      </div>
      {showPairing && <TVPairingPanel onCommand={handleRemoteCommand} onClose={() => setShowPairing(false)} />}
    </main>
  );
}
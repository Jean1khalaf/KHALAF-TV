"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { Heart, Search, Radio, Menu, X, Play, Tv, Globe2, RefreshCw, ExternalLink, Volume2, Minimize2, Monitor } from "lucide-react";
import PWAInstallButton from "./PWAInstallButton";

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
  if (/\bmtv\b/.test(n) && (n.includes("lebanon") || /\bmtv\b/.test(n))) return "mtv lebanon";
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
    sourceFallback: "Open provider page", choose: "Choose a channel to start watching", chooseHint: "Select a channel from the list below.",
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
    sourceFallback: "فتح صفحة المزوّد", choose: "اختر قناة لبدء المشاهدة", chooseHint: "اختر قناة من القائمة أدناه.",
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
    sourceFallback: "Ouvrir la page du fournisseur", choose: "Choisissez une chaîne", chooseHint: "Sélectionnez une chaîne ci-dessous pour commencer.",
    external: "Télévision libanaise · Source externe", addFavorite: "Ajouter aux favoris", saved: "Enregistré",
    explore: "Explorer les chaînes", loading: "Chargement de la playlist publique…", toExplore: "chaînes à découvrir",
    search: "Rechercher une chaîne, un pays…", stream: "Flux en direct", refresh: "Actualiser", noResults: "Aucune chaîne trouvée",
    noResultsHint: "Essayez un autre terme ou pays.", retry: "Réessayer", directory: "Répertoire des flux",
    directoryNote: "Sources externes · disponibilité variable", footer: "Les chaînes proviennent de services tiers. Disponibilité et droits varient selon la source.",
    english: "English", arabic: "العربية", language: "Langue", sourceNote: "Chaîne en direct · KHALAF TV",
  }
};

export default function KhalafTV() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All countries");
  const [fullScreenPlayer, setFullScreenPlayer] = useState(false);
  const [selected, setSelected] = useState<Channel | Special | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showSpecialNotice, setShowSpecialNotice] = useState(false);
  const [language, setLanguage] = useState<"en" | "fr" | "ar">("en");
  const [tvMode, setTvMode] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [onlyHistory, setOnlyHistory] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  async function loadChannels() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/channels");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load channels");
      const list: Channel[] = data.channels || [];
      setChannels(list);
      if (!selected && list.length) setSelected(list[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load channels");
    } finally { setLoading(false); }
  }

  // Enable TV layout from ?tv=1 so Android TV users can bookmark a direct TV-mode URL.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setTvMode(params.get("tv") === "1");
    } catch {}
  }, []);

  // Android TV remotes often emit arrow/OK keys. Keep focus visible and allow
  // directional movement through interactive controls when TV mode is active.
  useEffect(() => {
    if (!tvMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key)) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const items = Array.from(document.querySelectorAll<HTMLElement>(
        '.tv-mode button:not(:disabled), .tv-mode a[href], .tv-mode input:not(:disabled)'
      )).filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);
      if (!items.length) return;
      const current = items.indexOf(document.activeElement as HTMLElement);
      const delta = (event.key === "ArrowDown" || event.key === "ArrowRight") ? 1 : -1;
      const next = current < 0 ? 0 : (current + delta + items.length) % items.length;
      event.preventDefault();
      items[next]?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [tvMode]);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem("khalaf-history") || "[]")); } catch {}
    loadChannels();
    fetch("/api/favorites").then(r => r.json()).then(d => {
      if (d.enabled && Array.isArray(d.favorites)) setFavorites(d.favorites);
      else {
        try { setFavorites(JSON.parse(localStorage.getItem("khalaf-favorites") || "[]")); } catch {}
      }
    }).catch(() => {
      try { setFavorites(JSON.parse(localStorage.getItem("khalaf-favorites") || "[]")); } catch {}
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selected) return;
    const url = selected.url;
    if ("note" in selected && !isDirectMedia(url)) return;
    let hls: Hls | null = null;
    video.pause(); video.removeAttribute("src"); video.load();
    if (url.toLowerCase().includes(".m3u8") && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(url); hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    } else {
      video.src = url;
    }
    return () => { hls?.destroy(); };
  }, [selected]);

  const countryName = (value?: string, channelName = "") => {
    const raw = (value || "").split(/[;,]/)[0].trim();
    const codeMap: Record<string, string> = { CN: "China", CHN: "China", LB: "Lebanon", LBN: "Lebanon", FR: "France", FRA: "France", US: "United States", USA: "United States", GB: "United Kingdom", GBR: "United Kingdom", CA: "Canada", CAN: "Canada", AE: "United Arab Emirates", UAE: "United Arab Emirates", SA: "Saudi Arabia", KSA: "Saudi Arabia", EG: "Egypt", EGY: "Egypt", IQ: "Iraq", IR: "Iran", SY: "Syria", JO: "Jordan", TR: "Turkey", DE: "Germany", IT: "Italy", ES: "Spain", RU: "Russia", IN: "India", PK: "Pakistan", JP: "Japan", KR: "South Korea", AU: "Australia", BR: "Brazil", MX: "Mexico" };
    if (raw) return codeMap[raw.toUpperCase()] || raw;
    const n = `${channelName} ${value || ""}`.toLowerCase();
    const hints: [RegExp, string][] = [[/china|chinese|cctv/, "China"], [/lebanon|lebanese|mtv lebanon|al jadeed|lbc/, "Lebanon"], [/france|french|fr\s*24/, "France"], [/united kingdom|british|bbc|uk\b/, "United Kingdom"], [/united states|american|usa\b|\bus\b/, "United States"], [/canada|canadian|cbc/, "Canada"], [/turkey|turkish|turkiye/, "Turkey"], [/egypt|egyptian/, "Egypt"], [/iraq|iraqi/, "Iraq"], [/syria|syrian/, "Syria"], [/saudi|ksa/, "Saudi Arabia"], [/india|indian/, "India"], [/pakistan|pakistani/, "Pakistan"], [/japan|japanese/, "Japan"], [/south korea|korean/, "South Korea"], [/russia|russian/, "Russia"], [/germany|german/, "Germany"], [/italy|italian/, "Italy"], [/spain|spanish/, "Spain"], [/australia|australian/, "Australia"]];
    return hints.find(([re]) => re.test(n))?.[1] || "Other / Unknown";
  };
  const countries = useMemo(() => ["All countries", ...Array.from(new Set([...channels.map(c => countryName(c.country, c.name)), "Lebanon", "Saudi Arabia"])).sort()], [channels]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const regular = channels.filter(c => {
      // Hide playlist duplicates for channels represented by the curated special cards.
      if (canonicalSpecial(c.name)) return false;
      const matchesQuery = `${c.name} ${c.group || ""} ${c.country || ""}`.toLowerCase().includes(q);
      const matchesGroup = category === "All countries" || countryName(c.country, c.name) === category;
      const matchesFav = !onlyFavorites || favorites.includes(c.name);
      const matchesHistory = !onlyHistory || history.includes(c.name);
      return matchesQuery && matchesGroup && matchesFav && matchesHistory;
    });
    const special = SPECIALS.filter(c => {
      const matchesQuery = `${c.name} ${c.note} Lebanon`.toLowerCase().includes(q);
      const specialCountry = c.name === "Al Hadath" ? "Saudi Arabia" : "Lebanon";
      const matchesGroup = category === "All countries" || specialCountry === category;
      const matchesFav = !onlyFavorites || favorites.includes(c.name);
      const matchesHistory = !onlyHistory || history.includes(c.name);
      return matchesQuery && matchesGroup && matchesFav && matchesHistory;
    });
    const combined = [...special, ...regular];
    return onlyHistory ? combined.sort((a, b) => history.indexOf(a.name) - history.indexOf(b.name)) : combined;
  }, [channels, query, category, onlyFavorites, onlyHistory, favorites, history]);

  async function toggleFavorite(name: string) {
    const removing = favorites.includes(name);
    const next = removing ? favorites.filter(x => x !== name) : [...favorites, name];
    setFavorites(next);
    try { localStorage.setItem("khalaf-favorites", JSON.stringify(next)); } catch {}
    try {
      await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, remove: removing }) });
    } catch {}
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
        <div className="topbar-right"><button className="tv-mode-toggle" onClick={() => setTvMode(v => !v)} title="Optimize for a Smart TV screen"><Monitor size={15}/><span>{tvMode ? "Exit TV mode" : "TV display"}</span></button><a className="windows-download-button" href="/api/download/windows" type="application/octet-stream" title="Download KHALAF TV for Windows"><span aria-hidden="true">↓</span> <span>Download for Windows</span></a><PWAInstallButton /><button className="language-toggle" onClick={() => setLanguage(language === "en" ? "fr" : language === "fr" ? "ar" : "en")} aria-label={t.language}>{language === "en" ? "FR" : language === "fr" ? "العربية" : "EN"}</button><span className="live-indicator"><i/> {t.live}</span><span className="topbar-caption">{t.free}</span></div>
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
          <div className="welcome-row"><div><div className="eyebrow"><Radio size={14}/> {t.eyebrow}</div><h1>{t.titleA} <span>{t.titleB}</span></h1><p>{t.intro}</p></div><div className="channel-count"><strong>{channels.length.toLocaleString()}</strong><span>{t.listed}</span></div></div>
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
                {showSpecialNotice && <div className="embed-notice">{t.sourceWarning}</div>}
                <div className="source-frame-wrap">
                  <iframe className="source-frame" src={selectedUrl} title={selectedName} referrerPolicy="unsafe-url" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" />
                  <div className="source-watermark">KHALAF <b>TV</b></div>
                </div>
                <div className="special-player-bottom">
                  <span><i className="red-dot"/> {t.sourceTitle.toUpperCase()}</span>
                  <button className="source-help" onClick={() => setShowSpecialNotice(!showSpecialNotice)}>{showSpecialNotice ? t.hideInfo : t.sourceHelp}</button>
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

          <div className="channels-section">
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
    </main>
  );
}
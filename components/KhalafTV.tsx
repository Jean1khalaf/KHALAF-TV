"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { Heart, Search, Radio, Menu, X, Play, Tv, Globe2, RefreshCw, ExternalLink, Volume2 } from "lucide-react";

type Channel = { name: string; url: string; logo?: string; group?: string; country?: string };
type Special = { name: string; url: string; note: string };

const SPECIALS: Special[] = [
  { name: "MTV Lebanon", url: process.env.NEXT_PUBLIC_MTV_LEBANON_STREAM || process.env.NEXT_PUBLIC_MTV_LEBANON_EMBED || "https://www.elahmad.ru/tv/mtvlebanon.htm", note: "Lebanese TV" },
  { name: "LBC Lebanon", url: process.env.NEXT_PUBLIC_LBC_LEBANON_STREAM || process.env.NEXT_PUBLIC_LBC_LEBANON_EMBED || "https://www.elahmad.ru/tv/lbc.php", note: "Lebanese TV" },
  { name: "Al Jadeed Lebanon", url: process.env.NEXT_PUBLIC_JADEED_LEBANON_STREAM || process.env.NEXT_PUBLIC_JADEED_LEBANON_EMBED || "https://www.elahmad.ru/tv/newtv.php", note: "Lebanese TV" },
];

const isDirectMedia = (url: string) => /\.(m3u8|mp4|webm|mpd)(\?|#|$)/i.test(url);
const COPY = {
  en: {
    discover: "DISCOVER", all: "All channels", favorites: "My favorites", lebanese: "LEBANESE CHANNELS",
    categories: "CATEGORIES", live: "LIVE TV", tagline: "YOUR WORLD. LIVE.", free: "Channel directory",
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
    discover: "استكشف", all: "كل القنوات", favorites: "المفضلة", lebanese: "القنوات اللبنانية",
    categories: "التصنيفات", live: "بث تلفزيوني مباشر", tagline: "عالمك. مباشرةً.", free: "دليل القنوات",
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
  }
};

export default function KhalafTV() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All channels");
  const [selected, setSelected] = useState<Channel | Special | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showSpecialNotice, setShowSpecialNotice] = useState(false);
  const [language, setLanguage] = useState<"en" | "ar">("en");
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

  useEffect(() => {
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

  const groups = useMemo(() => ["All channels", ...Array.from(new Set(channels.map(c => c.group || "Other"))).sort()], [channels]);
  const filtered = useMemo(() => channels.filter(c => {
    const matchesQuery = `${c.name} ${c.group || ""} ${c.country || ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesGroup = category === "All channels" || (c.group || "Other") === category;
    const matchesFav = !onlyFavorites || favorites.includes(c.name);
    return matchesQuery && matchesGroup && matchesFav;
  }), [channels, query, category, onlyFavorites, favorites]);

  async function toggleFavorite(name: string) {
    const removing = favorites.includes(name);
    const next = removing ? favorites.filter(x => x !== name) : [...favorites, name];
    setFavorites(next);
    try { localStorage.setItem("khalaf-favorites", JSON.stringify(next)); } catch {}
    try {
      await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, remove: removing }) });
    } catch {}
  }

  const isSpecial = selected ? "note" in selected : false;
  const isNativeSpecial = isSpecial && isDirectMedia(selected?.url || "");
  const t = COPY[language];
  const selectedName = selected?.name || "Choose a channel";
  const selectedUrl = selected?.url || "";
  const selectedLogo = selected && "logo" in selected ? selected.logo : undefined;

  return (
    <main className="app-shell" lang={language} dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X/> : <Menu/>}</button>
        <a className="brand" href="#" aria-label="KHALAF TV home"><span className="brand-mark"><Tv size={22}/></span><span>KHALAF <b>TV</b><small>{t.tagline}</small></span></a>
        <div className="topbar-right"><button className="language-toggle" onClick={() => setLanguage(language === "en" ? "ar" : "en")} aria-label={t.language}>{language === "en" ? "العربية" : "English"}</button><span className="live-indicator"><i/> {t.live}</span><span className="topbar-caption">{t.free}</span></div>
      </header>

      <div className="layout">
        <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
          <div className="sidebar-heading">{t.discover}</div>
          <button className={`nav-item ${!onlyFavorites ? "active" : ""}`} onClick={() => {setOnlyFavorites(false); setMobileMenu(false);}}><Globe2 size={18}/> {t.all} <span>{channels.length || "—"}</span></button>
          <button className={`nav-item ${onlyFavorites ? "active" : ""}`} onClick={() => {setOnlyFavorites(true); setMobileMenu(false);}}><Heart size={18}/> {t.favorites}</button>
          <div className="sidebar-heading channel-heading">{t.lebanese}</div>
          {SPECIALS.map(s => <button key={s.name} className={`special-nav ${selected?.name === s.name ? "selected" : ""}`} onClick={() => {setSelected(s); setShowSpecialNotice(true); setMobileMenu(false);}}><span className="channel-dot">{s.name.startsWith("MTV") ? "M" : s.name.startsWith("LBC") ? "L" : "J"}</span><span>{s.name}<small>Lebanon</small></span><Play size={14}/></button>)}
          <div className="sidebar-heading">{t.categories}</div>
          <div className="category-list">{groups.slice(1, 13).map(g => <button key={g} className={`category-item ${category === g ? "chosen" : ""}`} onClick={() => {setCategory(category === g ? "All channels" : g); setOnlyFavorites(false); setMobileMenu(false);}}>{g}</button>)}</div>
          <div className="sidebar-footer"><span className="status-dot"/> {t.directory} <small>{t.directoryNote}</small></div>
        </aside>

        <section className="main-content">
          <div className="welcome-row"><div><div className="eyebrow"><Radio size={14}/> {t.eyebrow}</div><h1>{t.titleA} <span>{t.titleB}</span></h1><p>{t.intro}</p></div><div className="channel-count"><strong>{channels.length.toLocaleString()}</strong><span>{t.listed}</span></div></div>
          <section className="lebanese-featured" aria-label={t.lebanese}>
            <div className="section-title-row featured-title"><div><h2>{t.lebanese}</h2><p>{language === "ar" ? "اختر قناة لبنانية للمشاهدة" : "Quick access to your favorite Lebanese channels"}</p></div></div>
            <div className="featured-channel-grid">
              {SPECIALS.map((s, index) => <button key={s.name} className={`featured-channel ${selected?.name === s.name ? "active" : ""}`} onClick={() => { setSelected(s); setShowSpecialNotice(true); }}>
                <span className={`featured-logo featured-logo-${index}`}>{index === 0 ? "M" : index === 1 ? "L" : "J"}</span>
                <span><strong>{s.name}</strong><small>{language === "ar" ? "لبنان · بث مباشر" : "Lebanon · Live TV"}</small></span>
                <Play size={16} className="featured-play"/>
              </button>)}
            </div>
          </section>
          <div className="player-card">
            <div className="player-topline"><span><i className="red-dot"/> NOW PLAYING</span><span className="quality-tag">LIVE</span></div>
            {isSpecial && !isNativeSpecial ? (
              <div className="special-player">
                <div className="special-player-heading">
                  <div className="special-glow"><Tv size={34}/></div>
                  <div className="special-heading-copy">
                    <div className="special-title">{selectedName}</div>
                    <p>{t.sourceNote}</p>
                  </div>
                  <a className="secondary-button" href={selectedUrl} target="_blank" rel="noreferrer"><ExternalLink size={15}/> {t.source}</a>
                </div>
                {showSpecialNotice && <div className="embed-notice">{t.sourceWarning}</div>}
                <div className="source-frame-wrap">
                  <iframe className="source-frame" src={selectedUrl} title={selectedName} referrerPolicy="no-referrer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" />
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
            <div className="section-title-row"><div><h2>{onlyFavorites ? t.favorites : category === "All channels" ? t.explore : category}</h2><p>{loading ? t.loading : `${filtered.length.toLocaleString()} ${t.toExplore}`}</p></div><button className="refresh-button" onClick={loadChannels} title="Refresh channel list"><RefreshCw size={16}/><span>{t.refresh}</span></button></div>
            <div className="search-row"><div className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search}/>{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={16}/></button>}</div><div className="filter-pill"><Volume2 size={15}/><span>{t.stream}</span></div></div>
            {error && <div className="error-box">{error}<button onClick={loadChannels}>{t.retry}</button></div>}
            {loading ? <div className="loading-grid">{Array.from({length:8},(_,i)=><div className="skeleton" key={i}/>)}</div> : filtered.length === 0 ? <div className="empty-state"><Search size={28}/><strong>{t.noResults}</strong><span>{t.noResultsHint}</span></div> :
              <div className="channel-grid">{filtered.slice(0, 180).map((c,i) => <article className={`channel-card ${selected?.name === c.name ? "playing" : ""}`} key={`${c.name}-${c.url}-${i}`}><button className="channel-main" onClick={() => {setSelected(c); setShowSpecialNotice(false);}}><span className="channel-logo">{c.logo ? <img src={c.logo} alt="" loading="lazy" onError={e => {e.currentTarget.style.display="none";}}/> : <Tv size={24}/>}</span><span className="channel-info"><strong>{c.name}</strong><small>{c.group || c.country || "Live TV"}</small></span><span className="play-icon"><Play size={14} fill="currentColor"/></span></button><button className={`card-heart ${favorites.includes(c.name) ? "favorited" : ""}`} aria-label={`Favorite ${c.name}`} onClick={() => toggleFavorite(c.name)}><Heart size={15} fill={favorites.includes(c.name) ? "currentColor" : "none"}/></button></article>)}</div>}
            {!loading && filtered.length > 180 && <p className="list-note">Showing the first 180 matches. Search to narrow down the list.</p>}
          </div>
          <footer className="footer"><span>© {new Date().getFullYear()} KHALAF TV</span><span>{t.footer}</span></footer>
        </section>
      </div>
    </main>
  );
}
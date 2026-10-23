"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { Heart, Search, Radio, Menu, X, Play, Tv, Globe2, RefreshCw, ExternalLink, Volume2 } from "lucide-react";

type Channel = { name: string; url: string; logo?: string; group?: string; country?: string };
type Special = { name: string; url: string; note: string };

const SPECIALS: Special[] = [
  { name: "MTV Lebanon", url: "https://www.elahmad.ru/tv/mtvlebanon.htm", note: "External player page — embedding depends on source permissions" },
  { name: "LBC Lebanon", url: "https://www.elahmad.ru/tv/lbc.php", note: "External player page — embedding depends on source permissions" },
  { name: "Jadeed Lebanon", url: "https://www.elahmad.ru/tv/newtv.php", note: "External player page — embedding depends on source permissions" },
];

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
    if (!video || !selected || "note" in selected) return;
    const url = selected.url;
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
  const selectedName = selected?.name || "Choose a channel";
  const selectedUrl = selected?.url || "";
  const selectedLogo = selected && "logo" in selected ? selected.logo : undefined;

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X/> : <Menu/>}</button>
        <a className="brand" href="#" aria-label="KHALAF TV home"><span className="brand-mark"><Tv size={22}/></span><span>KHALAF <b>TV</b><small>YOUR WORLD. LIVE.</small></span></a>
        <div className="topbar-right"><span className="live-indicator"><i/> LIVE TV</span><span className="topbar-caption">Free-to-access streams</span></div>
      </header>

      <div className="layout">
        <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
          <div className="sidebar-heading">DISCOVER</div>
          <button className={`nav-item ${!onlyFavorites ? "active" : ""}`} onClick={() => {setOnlyFavorites(false); setMobileMenu(false);}}><Globe2 size={18}/> All channels <span>{channels.length || "—"}</span></button>
          <button className={`nav-item ${onlyFavorites ? "active" : ""}`} onClick={() => {setOnlyFavorites(true); setMobileMenu(false);}}><Heart size={18}/> My favorites</button>
          <div className="sidebar-heading channel-heading">LEBANESE CHANNELS</div>
          {SPECIALS.map(s => <button key={s.name} className={`special-nav ${selected?.name === s.name ? "selected" : ""}`} onClick={() => {setSelected(s); setShowSpecialNotice(true); setMobileMenu(false);}}><span className="channel-dot">{s.name.startsWith("MTV") ? "M" : s.name.startsWith("LBC") ? "L" : "J"}</span><span>{s.name}<small>Lebanon</small></span><Play size={14}/></button>)}
          <div className="sidebar-heading">CATEGORIES</div>
          <div className="category-list">{groups.slice(1, 13).map(g => <button key={g} className={`category-item ${category === g ? "chosen" : ""}`} onClick={() => {setCategory(category === g ? "All channels" : g); setOnlyFavorites(false); setMobileMenu(false);}}>{g}</button>)}</div>
          <div className="sidebar-footer"><span className="status-dot"/> Stream directory <small>External streams · availability varies</small></div>
        </aside>

        <section className="main-content">
          <div className="welcome-row"><div><div className="eyebrow"><Radio size={14}/> LIVE STREAMING</div><h1>Find your <span>channel.</span></h1><p>Your favorite live TV, all in one place.</p></div><div className="channel-count"><strong>{channels.length.toLocaleString()}</strong><span>channels listed</span></div></div>
          <div className="player-card">
            <div className="player-topline"><span><i className="red-dot"/> NOW PLAYING</span><span className="quality-tag">LIVE</span></div>
            {isSpecial ? (
              <div className="special-player">
                <div className="special-glow"><Tv size={46}/></div>
                <div className="special-title">{selectedName}</div>
                <p>This source is a third-party viewing page. KHALAF TV will keep you on this site, but the source may block in-page embedding.</p>
                <div className="special-actions">
                  <button className="primary-button" onClick={() => setShowSpecialNotice(!showSpecialNotice)}><Play size={16}/> Try in player</button>
                  <a className="secondary-button" href={selectedUrl} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Open source page</a>
                </div>
                {showSpecialNotice && <div className="embed-notice">The page below is loaded inside the player area. If it stays blank, the source likely blocks framing; use an authorized direct stream URL to enable native playback.</div>}
                <iframe className="source-frame" src={selectedUrl} title={selectedName} referrerPolicy="no-referrer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" />
              </div>
            ) : (
              <div className="video-wrap">
                <video ref={videoRef} controls playsInline autoPlay poster="" />
                <div className="watermark">KHALAF <b>TV</b></div>
                {!selected && <div className="video-empty"><Tv size={44}/><strong>Choose a channel to start watching</strong><span>Select a channel from the list below.</span></div>}
                <div className="video-caption"><span className="video-live"><i/> LIVE</span><span>{selectedName}</span></div>
              </div>
            )}
            <div className="player-meta"><div className="now-channel">{selectedLogo ? <img src={selectedLogo} alt="" onError={e => (e.currentTarget.style.display = "none")}/> : <span className="channel-placeholder"><Tv size={20}/></span>}<div><strong>{selectedName}</strong><small>{isSpecial ? "Lebanese TV · External source" : (selected && "group" in selected ? selected.group : "Live channel")}</small></div></div>{selected && <button className={`favorite-button ${favorites.includes(selected.name) ? "favorited" : ""}`} onClick={() => toggleFavorite(selected.name)} aria-label="Toggle favorite"><Heart size={17} fill={favorites.includes(selected.name) ? "currentColor" : "none"}/>{favorites.includes(selected.name) ? "Saved" : "Add favorite"}</button>}</div>
          </div>

          <div className="channels-section">
            <div className="section-title-row"><div><h2>{onlyFavorites ? "My favorites" : category === "All channels" ? "Explore channels" : category}</h2><p>{loading ? "Loading the public playlist…" : `${filtered.length.toLocaleString()} channels to explore`}</p></div><button className="refresh-button" onClick={loadChannels} title="Refresh channel list"><RefreshCw size={16}/><span>Refresh</span></button></div>
            <div className="search-row"><div className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search channels, countries…" aria-label="Search channels"/>{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={16}/></button>}</div><div className="filter-pill"><Volume2 size={15}/><span>Live streams</span></div></div>
            {error && <div className="error-box">{error}<button onClick={loadChannels}>Try again</button></div>}
            {loading ? <div className="loading-grid">{Array.from({length:8},(_,i)=><div className="skeleton" key={i}/>)}</div> : filtered.length === 0 ? <div className="empty-state"><Search size={28}/><strong>No channels found</strong><span>Try another search or category.</span></div> :
              <div className="channel-grid">{filtered.slice(0, 180).map((c,i) => <article className={`channel-card ${selected?.name === c.name ? "playing" : ""}`} key={`${c.name}-${c.url}-${i}`}><button className="channel-main" onClick={() => {setSelected(c); setShowSpecialNotice(false);}}><span className="channel-logo">{c.logo ? <img src={c.logo} alt="" loading="lazy" onError={e => {e.currentTarget.style.display="none";}}/> : <Tv size={24}/>}</span><span className="channel-info"><strong>{c.name}</strong><small>{c.group || c.country || "Live TV"}</small></span><span className="play-icon"><Play size={14} fill="currentColor"/></span></button><button className={`card-heart ${favorites.includes(c.name) ? "favorited" : ""}`} aria-label={`Favorite ${c.name}`} onClick={() => toggleFavorite(c.name)}><Heart size={15} fill={favorites.includes(c.name) ? "currentColor" : "none"}/></button></article>)}</div>}
            {!loading && filtered.length > 180 && <p className="list-note">Showing the first 180 matches. Search to narrow down the list.</p>}
          </div>
          <footer className="footer"><span>© {new Date().getFullYear()} KHALAF TV</span><span>Channel links are provided by third parties. Availability and rights vary by stream.</span></footer>
        </section>
      </div>
    </main>
  );
}
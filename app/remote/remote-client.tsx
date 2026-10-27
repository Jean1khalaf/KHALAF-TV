"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Ably from "ably";
import { Pause, Play, Volume2, Tv, Power, ChevronLeft, ChevronRight, Smartphone } from "lucide-react";
type Channel = { name: string; url: string; logo?: string; group?: string; country?: string };
type Joined = { sessionId: string; channel: string; phoneSecret: string };
const SPECIAL_CHANNELS: Channel[] = [
  { name: "MTV Lebanon", url: process.env.NEXT_PUBLIC_MTV_LEBANON_STREAM || process.env.NEXT_PUBLIC_MTV_LEBANON_EMBED || "https://www.elahmad.ru/tv/mtvlebanon.htm", country: "Lebanon", group: "Lebanese TV" },
  { name: "LBC Lebanon", url: process.env.NEXT_PUBLIC_LBC_LEBANON_STREAM || process.env.NEXT_PUBLIC_LBC_LEBANON_EMBED || "https://www.elahmad.ru/tv/lbc.php", country: "Lebanon", group: "Lebanese TV" },
  { name: "Al Jadeed Lebanon", url: process.env.NEXT_PUBLIC_JADEED_LEBANON_STREAM || process.env.NEXT_PUBLIC_JADEED_LEBANON_EMBED || "https://www.elahmad.ru/tv/newtv.php", country: "Lebanon", group: "Lebanese TV" },
  { name: "Al Hadath", url: process.env.NEXT_PUBLIC_AL_HADATH_STREAM || process.env.NEXT_PUBLIC_AL_HADATH_EMBED || "https://www.elahmad.ru/tv/alarabiya_alhadath.php", country: "Saudi Arabia", group: "News · Live TV" },
];
const canonicalSpecial = (name: string) => {
  const n = name.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  if (/\b(al )?hadath\b|alarabiya.*hadath/.test(n)) return "al hadath";
  if (/\bmtv\b/.test(n)) return "mtv lebanon";
  if (/\blbc\b/.test(n)) return "lbc lebanon";
  if (/\b(al )?jadeed\b/.test(n)) return "al jadeed lebanon";
  return null;
};
export default function RemoteClient() {
  const [code, setCode] = useState(""); const [joined, setJoined] = useState<Joined | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]); const [selected, setSelected] = useState("");
  const [status, setStatus] = useState("Enter the code shown on your TV."); const [error, setError] = useState("");
  const clientRef = useRef<Ably.Realtime | null>(null); const channelRef = useRef<Ably.RealtimeChannel | null>(null); const commandSeq = useRef(0);
  const [volume, setVolume] = useState(80); const [playing, setPlaying] = useState(true); const [muted, setMuted] = useState(false); const [remoteFullscreen, setRemoteFullscreen] = useState(false); const [query, setQuery] = useState("");
  useEffect(() => { const c = new URLSearchParams(location.search).get("code"); if (c) setCode(c); fetch("/api/channels").then(r=>r.json()).then(d=>{
    const playlist = Array.isArray(d.channels) ? d.channels as Channel[] : [];
    const regular = playlist.filter(c => !canonicalSpecial(c.name));
    setChannels([...SPECIAL_CHANNELS, ...regular]);
  }).catch(()=>setChannels(SPECIAL_CHANNELS)); }, []);
  useEffect(() => {
    if (!joined) return;
    const client = new Ably.Realtime({ authUrl: "/api/pairing/token", authMethod: "POST", authParams: { sessionId: joined.sessionId, role: "phone", secret: joined.phoneSecret }, autoConnect: true });
    const channel = client.channels.get(joined.channel);
    clientRef.current = client; channelRef.current = channel;
    channel.subscribe("status", (message) => { const data = message.data as { type?: string; channelName?: string; playing?: boolean; volume?: number; commandId?: number }; if (data.type === "tv-status") { setSelected(data.channelName || ""); if (typeof data.playing === "boolean") setPlaying(data.playing); if (typeof data.volume === "number") setVolume(data.volume); } else if (data.type === "command-ack") { setStatus("Connected · TV received command"); } });
    client.connection.on("connected", async () => {
      setStatus("Connected · waiting for TV");
      try {
        // Ensure the phone's channel is attached before sending the handshake.
        await channel.attach();
        await channel.publish("remote", { type: "phone-connected" });
        setStatus("Connected · remote ready");
      } catch {
        setError("Connected to messaging, but the remote channel could not attach or send. Check Ably permissions and pair again.");
      }
    });
    client.connection.on("failed", () => setError("Realtime connection failed. Try pairing again."));
    return () => { clientRef.current = null; channelRef.current = null; channel.unsubscribe(); client.close(); };
  }, [joined]);
  const visibleChannels = useMemo(() => channels.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0,100), [channels,query]);
  async function pair(e: React.FormEvent) { e.preventDefault(); setError(""); try { const r=await fetch("/api/pairing/join",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:code.replace(/\s/g,"")})}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Could not pair."); setJoined(d); setStatus("Connecting to TV…"); } catch(e) { setError(e instanceof Error?e.message:"Could not pair."); } }
  async function send(command: Record<string, unknown>) { if (!joined) return; try { const client = clientRef.current; const channel = channelRef.current; if (!client || !channel) throw new Error("Remote connection is not ready."); if (client.connection.state !== "connected") await new Promise<void>((resolve,reject)=>{ client.connection.once("connected",()=>resolve()); client.connection.once("failed",()=>reject(new Error("Connection failed"))); }); await channel.attach(); const commandId = ++commandSeq.current; await channel.publish("remote", { type:"remote-command", commandId, command }); setError(""); setStatus("Connected · command sent, waiting for TV"); } catch { setError("Command could not be sent. Reconnect the phone remote and try again."); } }
  function changeVolume(v:number) { setVolume(v); void send({action:"volume", value:v}); }
  return <main className="remote-page"><header className="remote-header"><div className="remote-brand"><span><Tv/></span><div><b>KHALAF TV</b><small>PHONE REMOTE</small></div></div><span className={`remote-status ${joined?"is-connected":""}`}><i/>{joined?status:"Not connected"}</span></header>
    {!joined ? <form className="remote-pair-card" onSubmit={pair}><div className="remote-icon"><Smartphone size={28}/></div><h1>Connect to your TV</h1><p>Enter the 8-digit pairing code displayed on your KHALAF TV screen.</p><label htmlFor="pair-code">Pairing code</label><input id="pair-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,8))} placeholder="12345678" required/><button className="remote-primary" disabled={code.length!==8}>Connect remote</button>{error&&<p className="remote-error">{error}</p>}<small>Codes expire after 10 minutes. Keep the code private.</small></form> : <div className="remote-controls"><div className="remote-connected-card"><span className="connected-mark"><Tv size={23}/></span><div><strong>TV connected</strong><small>{selected || "Choose a channel below"}</small></div><button title="Disconnect remote" onClick={()=>{void send({action:"disconnect"});setJoined(null);setStatus("Disconnected");}}><Power size={18}/></button></div>
      <section className="remote-control-card"><h2>Playback</h2><div className="remote-main-controls"><button aria-label="Previous channel" onClick={()=>{const i=channels.findIndex(c=>c.name===selected);const c=channels[(i-1+channels.length)%channels.length];if(c){setSelected(c.name);void send({action:"select",channel:c});}}}><ChevronLeft/></button><button className="remote-play" aria-label={playing?"Pause":"Play"} onClick={()=>{const next=!playing;setPlaying(next);void send({action:next?"play":"pause"});}}>{playing?<Pause size={28}/>:<Play size={28}/>}</button><button aria-label="Next channel" onClick={()=>{const i=channels.findIndex(c=>c.name===selected);const c=channels[(i+1+channels.length)%channels.length];if(c){setSelected(c.name);void send({action:"select",channel:c});}}}><ChevronRight/></button></div><div className="remote-volume"><Volume2 size={20}/><input aria-label="Volume" type="range" min="0" max="100" value={volume} onChange={e=>changeVolume(Number(e.target.value))}/><span>{volume}%</span></div><div className="remote-small-actions"><button aria-pressed={muted} onClick={()=>{setMuted(v=>!v);void send({action:"mute"});}}>{muted?"Unmute":"Mute"}</button><button aria-pressed={remoteFullscreen} onClick={()=>{setRemoteFullscreen(v=>!v);void send({action:"fullscreen"});}}>{remoteFullscreen?"Exit fullscreen":"Fullscreen"}</button></div></section>
      <section className="remote-control-card"><h2>Channels</h2><input className="remote-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search channels…"/><div className="remote-channel-list">{visibleChannels.map(c=><button className={selected===c.name?"active":""} key={`${c.name}-${c.url}`} onClick={()=>{setSelected(c.name);void send({action:"select",channel:c});}}><span><Tv size={17}/></span><b>{c.name}</b><Play size={15}/></button>)}</div></section>{error&&<p className="remote-error">{error}</p>}<p className="remote-note">Volume and playback controls work with streams played in KHALAF TV’s native player. Third-party embedded player pages may not allow external control.</p>
    </div>}
  </main>;
}

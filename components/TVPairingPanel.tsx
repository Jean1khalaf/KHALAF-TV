"use client";
import { useEffect, useState } from "react";
import * as Ably from "ably";
import { QRCodeSVG } from "qrcode.react";
import { Link2, Smartphone, X, RefreshCw } from "lucide-react";

type PairingSession = { sessionId: string; code: string; tvSecret: string; channel: string; expiresIn: number };
type CommandResult = { ok: boolean; action: string; message?: string };
type Props = { onCommand: (command: Record<string, unknown>) => CommandResult | Promise<CommandResult>; onClose: () => void };
async function publishStatus(channel: Ably.RealtimeChannel) {
  const video = document.querySelector("video");
  const title = document.querySelector(".player-meta .now-channel strong, .video-caption span:last-child, .special-title")?.textContent || "";
  const channelName = title.trim().slice(0, 80);
  await channel.publish("status", { type: "tv-status", channelName, playing: video ? !video.paused : undefined, volume: video ? Math.round(video.volume * 100) : undefined, muted: video?.muted, currentTime: video && Number.isFinite(video.currentTime) ? video.currentTime : undefined, duration: video && Number.isFinite(video.duration) ? video.duration : undefined, fullscreen: Boolean(document.fullscreenElement) });
}

export default function TVPairingPanel({ onCommand, onClose }: Props) {
  const [session, setSession] = useState<PairingSession | null>(null);
  const [status, setStatus] = useState("Creating a secure pairing code…");
  const [error, setError] = useState("");
  async function createSession() {
    setError(""); setStatus("Creating a secure pairing code…"); setSession(null);
    try {
      const response = await fetch("/api/pairing/session", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create pairing session.");
      setSession(data); setStatus("Waiting for your phone to connect");
    } catch (e) { setError(e instanceof Error ? e.message : "Pairing unavailable."); setStatus(""); }
  }
  useEffect(() => { void createSession(); }, []);
  useEffect(() => {
    if (!session) return;
    const client = new Ably.Realtime({ authUrl: "/api/pairing/token", authMethod: "POST", authParams: { sessionId: session.sessionId, role: "tv", secret: session.tvSecret }, autoConnect: true });
    const channel = client.channels.get(session.channel);
    const onConnected = () => setStatus("Waiting for your phone to connect");
    const onMessage = (message: Ably.Message) => {
      const data = message.data as Record<string, unknown>;
      if (data?.type === "phone-connected") { setStatus("Phone connected · remote is ready"); void publishStatus(channel); }
      else if (data?.type === "remote-command") {
        try {
          const command = data.command as Record<string, unknown>;
          void Promise.resolve(onCommand(command)).then(result => {
            void channel.publish("status", { type: "command-ack", commandId: data.commandId, receivedAt: Date.now(), ...result });
            setStatus(result.ok ? "Phone connected · command confirmed" : `Command unavailable · ${result.message || result.action}`);
            void publishStatus(channel);
            if (command.action === "disconnect") void closeSession();
          }).catch(() => {
            void channel.publish("status", { type: "command-ack", commandId: data.commandId, receivedAt: Date.now(), ok: false, action: typeof command.action === "string" ? command.action : "unknown", message: "The TV could not apply this command." });
            setError("The TV received a command but could not apply it.");
          });
        } catch {
          setError("The TV received a command but could not apply it.");
        }
      }
      else if (data?.type === "phone-disconnected") setStatus("Phone disconnected");
    };
    // Subscribe only to command/handshake messages, then explicitly attach before
    // telling the phone the TV is ready. This avoids a connected phone publishing
    // before the TV has finished attaching its channel subscription.
    channel.subscribe("remote", onMessage);
    client.connection.on("connected", onConnected);
    client.connection.on("failed", () => setError("Ably connection failed. Check your API key and network."));
    let cancelled = false;
    const statusTimer = setInterval(() => { if (client.connection.state === "connected") void publishStatus(channel); }, 2500);
    void channel.attach().then(() => {
      if (!cancelled) { setStatus("Waiting for your phone to connect"); void publishStatus(channel); }
    }).catch(() => {
      if (!cancelled) setError("TV could not subscribe to remote commands. Check Ably channel permissions and network.");
    });
    return () => { cancelled = true; clearInterval(statusTimer); channel.unsubscribe(); client.close(); };
  }, [session, onCommand]);
  async function closeSession() {
    if (session) {
      try { await fetch("/api/pairing/close", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.sessionId, secret: session.tvSecret, role: "tv" }) }); } catch {}
    }
    onClose();
  }
  const remoteUrl = typeof window !== "undefined" ? `${window.location.origin}/remote` : "/remote";
  const qrValue = `${remoteUrl}?code=${session?.code || ""}`;
  return <div className="pairing-overlay" role="dialog" aria-modal="true" aria-label="Pair phone remote">
    <section className="pairing-dialog">
      <button className="pairing-close" onClick={() => void closeSession()} aria-label="Close pairing"><X size={20}/></button>
      <div className="pairing-kicker"><Smartphone size={17}/> PHONE REMOTE</div>
      <h2>Pair your phone with KHALAF TV</h2>
      <p className="pairing-description">Scan the QR code or open the remote page on your phone and enter this code. The code expires in 10 minutes.</p>
      {error && <div className="pairing-error">{error}</div>}
      {session ? <div className="pairing-methods">
        <div className="pairing-qr"><QRCodeSVG value={qrValue} size={176} bgColor="#ffffff" fgColor="#101827" level="M" includeMargin/></div>
        <div className="pairing-code-block"><span>PAIRING CODE</span><strong>{session.code.match(/.{1,4}/g)?.join(" ")}</strong><small>{status}</small><button className="pairing-refresh" onClick={createSession}><RefreshCw size={15}/> Generate new code</button></div>
      </div> : <div className="pairing-loading">{status}</div>}
      <a className="pairing-link" href={remoteUrl} target="_blank" rel="noreferrer"><Link2 size={15}/> Open remote page</a>
      <p className="pairing-security">Only devices with this temporary pairing session can access its private realtime channel.</p>
    </section>
  </div>;
}

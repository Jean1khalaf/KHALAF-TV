"use client";

import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X, MoreVertical, PlusSquare } from "lucide-react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> };

export default function PWAInstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [android, setAndroid] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIos(isIOS);
    setAndroid(/Android/i.test(ua));
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)));
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const handleInstalled = () => { setPromptEvent(null); setStandalone(true); setOpen(false); };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      if (result.outcome === "accepted") setPromptEvent(null);
      setOpen(false);
      return;
    }
    setOpen(true);
  }

  if (standalone) return <span className="pwa-installed" title="KHALAF TV is installed"><Smartphone size={15} /> App installed</span>;

  return <>
    <button className="pwa-install-button" onClick={install} aria-haspopup="dialog" aria-expanded={open}>
      <Download size={15} /> <span>Install app</span>
    </button>
    {open && <div className="pwa-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="pwa-modal" role="dialog" aria-modal="true" aria-labelledby="pwa-title">
        <button className="pwa-modal-close" onClick={() => setOpen(false)} aria-label="Close installation instructions"><X size={19}/></button>
        <div className="pwa-modal-icon"><Smartphone size={28}/></div>
        <h2 id="pwa-title">Install KHALAF TV</h2>
        {ios ? <>
          <p className="pwa-modal-intro">On iPhone or iPad, add KHALAF TV to your Home Screen using the Share menu.</p>
          <ol className="pwa-steps">
            <li><span className="pwa-step-icon"><Share size={20}/></span><span><strong>1. Tap Share</strong><small>Open this website in Safari, then tap the Share icon.</small></span></li>
            <li><span className="pwa-step-icon"><PlusSquare size={20}/></span><span><strong>2. Choose “Add to Home Screen”</strong><small>Scroll down in the share sheet if needed.</small></span></li>
            <li><span className="pwa-step-icon"><Smartphone size={20}/></span><span><strong>3. Tap Add</strong><small>If offered, keep “Open as Web App” enabled.</small></span></li>
          </ol>
          <p className="pwa-note">If you opened this page inside another app, open it in Safari first.</p>
        </> : <>
          <p className="pwa-modal-intro">{android ? "Install the app on your Android device for quick access from your Home Screen." : "Add KHALAF TV to your device for a dedicated app-like experience."}</p>
          {android ? <ol className="pwa-steps">
            <li><span className="pwa-step-icon"><MoreVertical size={20}/></span><span><strong>1. Open the browser menu</strong><small>In Chrome, tap the three dots in the top corner.</small></span></li>
            <li><span className="pwa-step-icon"><Download size={20}/></span><span><strong>2. Tap “Install app” or “Add to Home screen”</strong><small>The wording depends on your browser and device.</small></span></li>
            <li><span className="pwa-step-icon"><Smartphone size={20}/></span><span><strong>3. Confirm</strong><small>Follow the on-screen confirmation to finish.</small></span></li>
          </ol> : <ol className="pwa-steps">
            <li><span className="pwa-step-icon"><MoreVertical size={20}/></span><span><strong>1. Open your browser menu</strong><small>Look for Install app, Add to Home Screen, or a similar option.</small></span></li>
            <li><span className="pwa-step-icon"><Smartphone size={20}/></span><span><strong>2. Confirm adding it</strong><small>Your browser will show the options available for this device.</small></span></li>
          </ol>}
          <p className="pwa-note">If an install prompt is supported by your browser, this button opens it directly. Otherwise, use the browser menu.</p>
        </>}
        <button className="pwa-modal-done" onClick={() => setOpen(false)}>Got it</button>
      </section>
    </div>}
  </>;
}

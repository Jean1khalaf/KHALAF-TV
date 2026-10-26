import type { Metadata } from "next";
import RemoteClient from "./remote-client";
export const metadata: Metadata = { title: "KHALAF TV Remote", description: "Pair your phone with KHALAF TV." };
export default function RemotePage() { return <RemoteClient />; }

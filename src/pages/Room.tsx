import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import Controls from "../components/Controls";
import { motion } from "framer-motion";
import socket from "../socket";

export default function Room() {
  const { id: roomId } = useParams<{ id: string }>();
  const [remoteStreams, setRemoteStreams] = useState<{ id: string; stream: MediaStream }[]>([]);
  const peersRef = useRef<{ [id: string]: RTCPeerConnection }>({});
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);   // camera stream
  const screenStreamRef = useRef<MediaStream | null>(null);  // active screen stream (when sharing)
  const userName = localStorage.getItem("userName") || "User";

  useEffect(() => {
    const init = async () => {
      // 1) Get camera/mic
      const cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      (window as any).localStream = cam; // for mic/cam toggles already in your app
      localStreamRef.current = cam;
      if (localVideoRef.current) localVideoRef.current.srcObject = cam;

      // 2) Expose helpers for Controls.tsx
      (window as any).applyScreenStream = async (screenStream: MediaStream) => {
        screenStreamRef.current = screenStream;

        const newVideoTrack = screenStream.getVideoTracks()[0];
        if (!newVideoTrack) return;

        // Replace outgoing video track to every peer
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(newVideoTrack);
        });

        // Update local preview
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      };

      (window as any).restoreCamera = async () => {
        const camStream = localStreamRef.current;
        if (!camStream) return;

        const newVideoTrack = camStream.getVideoTracks()[0];
        if (!newVideoTrack) return;

        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(newVideoTrack);
        });

        // Update local preview back to camera
        if (localVideoRef.current) localVideoRef.current.srcObject = camStream;

        // stop screen tracks if still running
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
          screenStreamRef.current = null;
        }
      };

      // 3) Join the room once
      socket.emit("join-room", roomId, userName);

      // 4) Signaling handlers
      const onUserConnected = async ({ id: userId }: { id: string }) => {
        const pc = createPeerConnection(userId);
        peersRef.current[userId] = pc;
        cam.getTracks().forEach((t) => pc.addTrack(t, cam));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { offer, from: socket.id });
      };

      const onOffer = async ({ offer, from }: { offer: RTCSessionDescriptionInit; from: string }) => {
        const pc = createPeerConnection(from);
        peersRef.current[from] = pc;
        (screenStreamRef.current ?? cam).getTracks().forEach((t) => pc.addTrack(t, screenStreamRef.current ?? cam));
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { answer, from: socket.id });
      };

      const onAnswer = async ({ answer, from }: { answer: RTCSessionDescriptionInit; from: string }) => {
        const pc = peersRef.current[from];
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      };

      const onIce = async ({ candidate, from }: { candidate: RTCIceCandidateInit; from: string }) => {
        const pc = peersRef.current[from];
        if (pc && candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("ICE add failed:", e);
          }
        }
      };

      const onUserDisconnected = (userId: string) => {
        const pc = peersRef.current[userId];
        if (pc) pc.close();
        delete peersRef.current[userId];
        setRemoteStreams((prev) => prev.filter((s) => s.id !== userId));
      };

      socket.off("user-connected").on("user-connected", onUserConnected);
      socket.off("offer").on("offer", onOffer);
      socket.off("answer").on("answer", onAnswer);
      socket.off("ice-candidate").on("ice-candidate", onIce);
      socket.off("user-disconnected").on("user-disconnected", onUserDisconnected);
    };

    init();

    return () => {
      // stop all tracks on unmount
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, userName]);

  const createPeerConnection = (userId: string) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit("ice-candidate", { candidate: e.candidate, from: socket.id });
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams[0];
      setRemoteStreams((prev) => (prev.find((s) => s.id === userId) ? prev : [...prev, { id: userId, stream }]));
    };

    return pc;
    };

  return (
    <motion.div className="flex h-screen bg-blackBase text-lightText overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Sidebar />
      <div className="flex flex-col flex-1">
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 bg-darkGray grid grid-cols-2 gap-4 p-4 border-r border-[#2a2a2a]">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full rounded-lg object-cover border border-[#2a2a2a]" />
            {remoteStreams.map((peer) => (
              <video
                key={peer.id}
                autoPlay
                playsInline
                ref={(el) => {
                  if (el) el.srcObject = peer.stream;
                }}
                className="w-full h-full rounded-lg object-cover border border-[#2a2a2a]"
              />
            ))}
          </div>
          <Chat />
        </div>
        <Controls />
      </div>
    </motion.div>
  );
}

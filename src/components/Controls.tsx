import { useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp } from "lucide-react";

export default function Controls() {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);

  const toggleMic = () => {
    const stream = (window as any).localStream as MediaStream | undefined;
    if (stream) stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMicOn((m) => !m);
  };

  const toggleCam = () => {
    const stream = (window as any).localStream as MediaStream | undefined;
    if (stream) stream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCamOn((c) => !c);
  };

  const toggleScreenShare = async () => {
    try {
      if (!sharing) {
        // Start screen share
        const display = await (navigator.mediaDevices as any).getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        const apply = (window as any).applyScreenStream as (s: MediaStream) => Promise<void>;
        if (apply) await apply(display);
        setSharing(true);

        // When user presses "Stop sharing" in browser UI, restore camera
        const track = display.getVideoTracks()[0];
        if (track) {
          track.onended = async () => {
            const restore = (window as any).restoreCamera as () => Promise<void>;
            if (restore) await restore();
            setSharing(false);
          };
        }
      } else {
        // Stop & restore camera
        const restore = (window as any).restoreCamera as () => Promise<void>;
        if (restore) await restore();
        setSharing(false);
      }
    } catch (e) {
      console.error("Screen share error:", e);
      // Ensure we don't get stuck in "sharing" state
      setSharing(false);
    }
  };

  const endCall = () => {
    const cam = (window as any).localStream as MediaStream | undefined;
    if (cam) cam.getTracks().forEach((t) => t.stop());
    window.location.href = "/";
  };

  return (
    <div className="flex justify-center items-center gap-4 py-3 border-t border-gray-700 bg-[#0a0a0a]">
      {/* Mic */}
      <button onClick={toggleMic} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700">
        {micOn ? <Mic size={20} /> : <MicOff size={20} color="red" />}
      </button>

      {/* Camera */}
      <button onClick={toggleCam} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700">
        {camOn ? <Video size={20} /> : <VideoOff size={20} color="red" />}
      </button>

      {/* Screen Share */}
      <button onClick={toggleScreenShare} className={`p-2 rounded-full ${sharing ? "bg-green-700" : "bg-gray-800 hover:bg-gray-700"}`}>
        <MonitorUp size={20} />
      </button>

      {/* End Call */}
      <button onClick={endCall} className="p-2 rounded-full bg-red-700 hover:bg-red-600">
        <PhoneOff size={20} />
      </button>
    </div>
  );
}

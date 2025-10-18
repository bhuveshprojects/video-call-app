import { useEffect, useState } from "react";
import socket from "../socket";

type Message = { id: string; user: string; text: string };

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState<boolean>(socket.connected);

  const myId = String(socket.id || "");
  const userName = localStorage.getItem("userName") || "User";

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // receive messages from others only (server already excludes sender)
    const onReceive = ({ message, userName, id }: { message: string; userName: string; id: string }) => {
      setMessages((prev) => [...prev, { id, user: userName, text: message }]);
    };

    socket.off("receive-message").on("receive-message", onReceive);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receive-message", onReceive);
    };
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg) return;

    // show locally once
    setMessages((prev) => [...prev, { id: String(socket.id || "local"), user: userName, text: msg }]);

    // tell server (server relays only to others)
    socket.emit("send-message", { message: msg });
    setInput("");
  };

  return (
    <div className="w-[300px] bg-[#111] border-l border-gray-700 flex flex-col">
      <div className="p-3 border-b border-gray-700 font-semibold text-center">Chat</div>

      <div className={`text-center text-sm py-1 ${connected ? "text-green-400" : "text-red-500"}`}>
        {connected ? "Connected" : "Disconnected"}
      </div>

      <div className="flex-1 overflow-y-auto p-3 text-sm space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="flex flex-col">
            <span className={`text-xs ${m.id === myId ? "text-blue-400" : "text-gray-400"}`}>{m.user}:</span>
            <span className="text-gray-200 break-words">{m.text}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex border-t border-gray-700">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-sm px-3 py-2 outline-none"
        />
        <button type="submit" className="px-3 text-blue-400 hover:text-blue-500">➤</button>
      </form>
    </div>
  );
}

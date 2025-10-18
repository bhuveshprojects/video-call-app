import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();

  const handleCreate = () => {
    const newRoomId = uuidv4();
    navigate(`/room/${newRoomId}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("roomId") as HTMLInputElement;
    const enteredId = input.value.trim();
    if (enteredId) navigate(`/room/${enteredId}`);
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-screen bg-blackBase text-lightText font-sans"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-gradient-to-b from-darkGray to-blackBase rounded-2xl shadow-soft p-10 w-[90%] max-w-md text-center border border-[#2a2a2a]">
        <h1 className="text-3xl font-semibold mb-3 text-redAccent">
          Video Calling Web Application
        </h1>
        <p className="text-dimText mb-8 text-sm tracking-wide">
          Connect, communicate, and collaborate instantly.
        </p>

        <div className="flex flex-col space-y-4">
          <button
            onClick={handleCreate}
            className="bg-redAccent text-white font-medium py-3 rounded-lg hover:bg-redSoft transition-all duration-200"
          >
            Create Meeting
          </button>

          <form
            onSubmit={handleJoin}
            className="flex items-center justify-between bg-blackBase rounded-lg overflow-hidden border border-[#2a2a2a]"
          >
            <input
              name="roomId"
              placeholder="Enter Room ID"
              className="flex-1 bg-transparent px-3 py-3 text-dimText outline-none placeholder-dimText text-sm"
            />
            <button
              type="submit"
              className="bg-redAccent text-white px-5 py-3 hover:bg-redSoft transition-all duration-200"
            >
              Join
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

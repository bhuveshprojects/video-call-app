import { Users } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="w-20 bg-discordDark flex flex-col items-center py-4 space-y-6">
      <div className="text-discordAccent text-2xl font-bold">VC</div>
      <div className="flex flex-col items-center space-y-6 mt-10">
        <Users className="w-6 h-6 text-gray-300 hover:text-white transition" />
        <div className="w-8 h-[1px] bg-gray-600" />
      </div>
    </div>
  );
}

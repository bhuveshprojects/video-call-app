export default function VideoGrid() {
  // Placeholder video tiles
  return (
    <div className="grid grid-cols-2 gap-4 p-6 w-full h-full">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-gray-700 rounded-lg flex items-center justify-center text-gray-300 text-lg"
        >
          Participant {i}
        </div>
      ))}
    </div>
  );
}

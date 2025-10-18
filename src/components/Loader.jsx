import { Loader2 } from 'lucide-react';
export default function Loader({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/90 rounded-xl shadow-lg">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      <p className="mt-4 text-gray-700 font-medium">{message}</p>
    </div>
  );
}

import { Edit, LogOut, Download } from 'lucide-react';
import Card from './Card';

export function PitchCard({ pitch, navigate, deletePitch }) {
  return (
    <Card className="flex flex-col justify-between h-full hover:shadow-xl transition duration-300">
      <div>
        <h3 className="text-xl font-semibold mb-2">{pitch.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-3">{pitch.content}</p>
      </div>
      <div className="flex space-x-2 mt-4">
        <button onClick={() => navigate(`/export/${pitch.id}`)} className="flex-1 flex items-center justify-center border rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          <Download className="w-4 h-4 mr-1" /> PDF
        </button>
        <button onClick={() => navigate(`/create-pitch?editId=${pitch.id}`)} className="flex-1 flex items-center justify-center border bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
          <Edit className="w-4 h-4 mr-1" /> Edit
        </button>
        <button onClick={() => deletePitch(pitch.id)} className="border rounded-lg text-red-500 hover:bg-red-50 p-2">
          <LogOut className="w-4 h-4 transform rotate-180" />
        </button>
      </div>
    </Card>
  );
}

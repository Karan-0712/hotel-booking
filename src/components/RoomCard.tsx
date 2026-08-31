import React from 'react';
import { Room } from '../types.ts';
import {
  Users,
  Bed,
  Maximize,
  Star,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowRight,
} from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onSelect: (room: Room) => void;
  onQuickBook: (room: Room) => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  Standard: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  Deluxe: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
  Executive: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  Suite: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
};

export const RoomCard: React.FC<RoomCardProps> = ({ room, onSelect, onQuickBook }) => {
  let images: string[] = [];
  try {
    images = typeof room.images === 'string' ? JSON.parse(room.images) : room.images;
  } catch {
    images = [];
  }

  const roomImage = (images && images.length > 0 && images[0]) 
    ? images[0] 
    : (CATEGORY_IMAGES[room.category] || CATEGORY_IMAGES.Standard);

  let amenities: string[] = [];
  try {
    amenities = typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities;
  } catch {
    amenities = ['Fiber Wi-Fi', 'Heritage View', 'In-room Dining'];
  }

  const isAvailable = room.status === 'available' && room.isAvailableForDates !== false;

  return (
    <div
      id={`room-card-${room.id}`}
      className="group bg-white border border-[#ECE5D8] rounded-2xl overflow-hidden hover:border-[#947139]/40 hover:shadow-xl transition-all duration-300 flex flex-col shadow-[0_2px_12px_rgba(28,25,22,0.03)]"
    >
      {/* Image Header with smooth zoom */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#FAF8F5]">
        <img
          src={roomImage}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="bg-white/95 backdrop-blur-xs text-[#1C1916] border border-[#ECE5D8] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
            {room.category}
          </span>
          {room.featured && (
            <span className="bg-[#1C1916] text-[#FAF8F5] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs border border-[#947139]/50">
              <Sparkles className="w-3 h-3 text-[#E6CA85]" />
              Featured
            </span>
          )}
        </div>

        {/* Status / Availability Badge */}
        <div className="absolute top-3 right-3 z-10">
          {isAvailable ? (
            <span className="bg-emerald-900/90 backdrop-blur-xs text-emerald-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Available
            </span>
          ) : (
            <span className="bg-[#5C1A1E]/90 backdrop-blur-xs text-rose-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs border border-rose-500/30">
              <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
              Reserved
            </span>
          )}
        </div>

        {/* Room Number & View Banner at bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white z-10">
          <span className="font-mono bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs text-[11px] text-[#FAF8F5] border border-white/10">
            Room #{room.roomNumber} • Floor {room.floor}
          </span>
          <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs text-[#E6CA85] text-[11px] font-medium border border-white/10">
            {room.viewType}
          </span>
        </div>
      </div>

      {/* Room Details Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => onSelect(room)}
              className="text-lg font-bold text-[#1C1916] group-hover:text-[#947139] transition-colors font-serif cursor-pointer tracking-tight"
            >
              {room.name}
            </h3>
            <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#ECE5D8] px-2 py-0.5 rounded-md shrink-0">
              <Star className="w-3.5 h-3.5 text-[#947139] fill-[#947139]" />
              <span className="text-xs font-bold text-[#1C1916]">{room.rating}</span>
              <span className="text-[10px] text-[#948A7D]">({room.reviewCount})</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-[#665E55] line-clamp-2 mt-2 leading-relaxed font-light">
            {room.description}
          </p>

          {/* Key Specs */}
          <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-[#F3ECE1] text-xs text-[#665E55]">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#947139]" />
              <span>Up to {room.capacity}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5 text-[#947139]" />
              <span className="truncate">{room.bedType}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize className="w-3.5 h-3.5 text-[#947139]" />
              <span>{room.sizeSqFt} sq ft</span>
            </div>
          </div>

          {/* Amenities Chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {amenities.slice(0, 3).map((item, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-[#FAF8F5] text-[#665E55] px-2 py-0.5 rounded-md border border-[#ECE5D8]"
              >
                {item}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="text-[10px] font-semibold bg-[#F6F1E7] text-[#7B5C28] border border-[#ECE5D8] px-2 py-0.5 rounded-md">
                +{amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Pricing in Indian Rupee (₹) & CTA */}
        <div className="pt-3.5 border-t border-[#F3ECE1] flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-[#1C1916] font-serif tracking-tight">
                ₹{room.pricePerNight.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-[#948A7D] font-normal">/ night</span>
            </div>
            <p className="text-[10px] text-[#948A7D]">Includes royal breakfast • +12% GST</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id={`view-room-btn-${room.id}`}
              onClick={() => onSelect(room)}
              className="p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3ECE1] text-[#665E55] border border-[#ECE5D8] transition-colors cursor-pointer"
              title="View Specifications & Reviews"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              id={`book-room-btn-${room.id}`}
              disabled={!isAvailable}
              onClick={() => onQuickBook(room)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs border ${
                isAvailable
                  ? 'bg-[#1C1916] hover:bg-[#2C2723] text-[#FAF8F5] border-[#947139]/40 active:scale-95 cursor-pointer'
                  : 'bg-[#ECE5D8] text-[#948A7D] border-transparent cursor-not-allowed'
              }`}
            >
              <span>{isAvailable ? 'Reserve' : 'Reserved'}</span>
              {isAvailable && <ArrowRight className="w-3.5 h-3.5 text-[#E6CA85]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

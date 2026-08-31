import React, { useState } from 'react';
import { Room } from '../types.ts';
import { RoomCard } from '../components/RoomCard.tsx';
import { BookingBar } from '../components/BookingBar.tsx';
import {
  UtensilsCrossed,
  Flower2,
  Award,
  Crown,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  ChevronRight,
  Star,
  MapPin,
  Car,
  Compass,
  Sparkles,
  Wifi,
  Coffee,
  Heart,
  Calendar,
  Clock,
  Waves,
} from 'lucide-react';

interface HomeViewProps {
  rooms: Room[];
  onSelectRoom: (room: Room) => void;
  onQuickBookRoom: (room: Room, checkIn: string, checkOut: string, guests: number) => void;
  onNavigateToBooking: (filters?: {
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    category?: string;
  }) => void;
  onNavigateToServices: () => void;
  checkInDate: string;
  setCheckInDate: (date: string) => void;
  checkOutDate: string;
  setCheckOutDate: (date: string) => void;
  guestsCount: number;
  setGuestsCount: (guests: number) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  rooms,
  onSelectRoom,
  onQuickBookRoom,
  onNavigateToBooking,
  onNavigateToServices,
  checkInDate,
  setCheckInDate,
  checkOutDate,
  setCheckOutDate,
  guestsCount,
  setGuestsCount,
  selectedCategory,
  setSelectedCategory,
}) => {
  // Filter tab for the featured section
  const [activeFeatureTab, setActiveFeatureTab] = useState<'all' | 'suite' | 'deluxe' | 'executive'>('all');

  // Filtered display rooms
  const displayRooms = rooms.filter((r) => {
    if (activeFeatureTab === 'all') return true;
    if (activeFeatureTab === 'suite') return r.category === 'Suite';
    if (activeFeatureTab === 'deluxe') return r.category === 'Deluxe';
    if (activeFeatureTab === 'executive') return r.category === 'Executive';
    return true;
  }).slice(0, 4);

  const totalRoomsCount = rooms.length;

  return (
    <div className="space-y-20 sm:space-y-28 pb-28">
      {/* 1. HERO SECTION WITH CINEMATIC HERITAGE FRAMING & SPACIOUS FLOATING BOOKING BAR */}
      <section className="relative">
        {/* Main Hero Visual Card */}
        <div className="relative rounded-3xl overflow-hidden bg-[#161412] text-white min-h-[520px] sm:min-h-[580px] flex flex-col justify-between p-8 sm:p-14 lg:p-18 border border-[#ECE5D8]/20 shadow-xl">
          {/* Heritage Photography Backdrop with warm twilight overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85"
              alt="The Grand Imperial Palace Mumbai Waterfront"
              className="w-full h-full object-cover object-center scale-102 opacity-70 filter brightness-90 contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161412] via-[#161412]/45 to-[#161412]/20" />
            <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#161412]/30 to-[#161412]/85" />
          </div>

          {/* Hero Header Content */}
          <div className="relative z-10 max-w-3xl space-y-6 pt-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-1.5 rounded-full text-[#FAF8F5] text-xs font-medium tracking-wider shadow-sm">
              <span className="uppercase text-[10px] sm:text-[11px] tracking-[0.25em] font-medium text-[#FAF8F5]/90">
                Colaba Waterfront, Mumbai • Est. 1903
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-normal font-serif tracking-tight text-[#FAF8F5] leading-[1.12]">
                The Grand Imperial
                <span className="block text-2xl sm:text-4xl lg:text-5xl text-[#E8D6B8] italic font-serif mt-2 font-light">
                  Palace & Luxury Suites
                </span>
              </h1>
              <p className="text-[#E0D8CE] text-sm sm:text-base lg:text-lg max-w-2xl font-light leading-relaxed">
                Aristocratic splendor overlooking the Arabian Sea. {totalRoomsCount} handcrafted chambers, royal gastronomy, and timeless personalized hospitality.
              </p>
            </div>

            {/* Quick Guarantees Pill Strip */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[#EAE4D9]">
              <span className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E6CA85]" />
                {totalRoomsCount} Exclusive Chambers
              </span>
              <span className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E6CA85]" />
                Royal Indian Breakfast Included
              </span>
              <span className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E6CA85]" />
                Direct Best Rates in ₹ INR
              </span>
              <span className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E6CA85]" />
                Free Cancellation
              </span>
            </div>
          </div>
        </div>

        {/* Floating Refined Luxury Booking Bar with interactive Calendar */}
        <div className="relative -mt-12 sm:-mt-14 max-w-6xl mx-auto px-2 sm:px-4 z-30">
          <BookingBar
            checkInDate={checkInDate}
            setCheckInDate={setCheckInDate}
            checkOutDate={checkOutDate}
            setCheckOutDate={setCheckOutDate}
            guestsCount={guestsCount}
            setGuestsCount={setGuestsCount}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onSearch={(filters) => onNavigateToBooking(filters)}
            variant="floating"
          />
        </div>
      </section>

      {/* 2. STATS & PALACE HIGHLIGHTS - CLEAN, AIRY RIBBON */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5DAC6] shadow-[0_4px_24px_rgba(28,25,22,0.03)]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[#F3ECE1]">
          <div className="flex flex-col items-center text-center p-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D8] flex items-center justify-center text-[#947139] mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-normal font-serif text-[#1C1916]">{totalRoomsCount} Chambers</div>
            <div className="text-xs text-[#786E64] mt-1 font-light tracking-wide">Across 5 Royal Floors</div>
          </div>

          <div className="flex flex-col items-center text-center p-2 pt-6 sm:pt-2 sm:pl-6">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D8] flex items-center justify-center text-[#947139] mb-3">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-normal font-serif text-[#1C1916]">4 Royal Kitchens</div>
            <div className="text-xs text-[#786E64] mt-1 font-light tracking-wide">Authentic Indian Gastronomy</div>
          </div>

          <div className="flex flex-col items-center text-center p-2 pt-6 sm:pt-2 sm:pl-6">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D8] flex items-center justify-center text-[#947139] mb-3">
              <Flower2 className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-normal font-serif text-[#1C1916]">12,000 sq ft</div>
            <div className="text-xs text-[#786E64] mt-1 font-light tracking-wide">Jiva Ayurvedic Spa & Pool</div>
          </div>

          <div className="flex flex-col items-center text-center p-2 pt-6 sm:pt-2 sm:pl-6">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D8] flex items-center justify-center text-[#947139] mb-3">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-normal font-serif text-[#1C1916]">4.9 / 5.0</div>
            <div className="text-xs text-[#786E64] mt-1 font-light tracking-wide">1,200+ Verified Patron Reviews</div>
          </div>
        </div>
      </section>

      {/* 3. ABOUT OUR HOTEL & HERITAGE STORY */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 lg:p-14 border border-[#E5DAC6] shadow-[0_6px_30px_rgba(28,25,22,0.04)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Story Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#947139] uppercase">
                The Heritage Story
              </span>
              <h2 className="text-2xl sm:text-4xl font-normal font-serif text-[#1C1916] tracking-tight leading-tight">
                A Century of Aristocratic Indian Splendor Overlooking the Arabian Sea
              </h2>
            </div>

            <p className="text-[#665E55] text-sm sm:text-base leading-relaxed font-light">
              Standing tall along Mumbai’s historic Colaba shoreline since 1903, <strong className="text-[#1C1916] font-semibold">The Grand Imperial</strong> combines Edwardian-Indian architectural grace with world-class personalized concierge care. Hand-carved Burma teak pillars, Belgian crystal chandeliers, and vaulted marble hallways tell stories of royal banquets and historic state visits.
            </p>

            <p className="text-[#665E55] text-sm leading-relaxed font-light">
              Each chamber is a peaceful sanctuary featuring custom pillow menus, marble bath suites, high-speed fiber connectivity, and dedicated 24/7 butler service.
            </p>

            {/* Core Values / Service Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D8]">
                <div className="w-8 h-8 rounded-xl bg-white text-[#947139] border border-[#ECE5D8] flex items-center justify-center shrink-0 font-serif font-bold text-xs shadow-xs">
                  01
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C1916]">Atithi Devo Bhava</h4>
                  <p className="text-[11px] text-[#665E55] mt-0.5">Traditional greeting with fresh jasmine garland and royal sandalwood tikka.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D8]">
                <div className="w-8 h-8 rounded-xl bg-white text-[#947139] border border-[#ECE5D8] flex items-center justify-center shrink-0 font-serif font-bold text-xs shadow-xs">
                  02
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C1916]">Bespoke 24/7 Butler Care</h4>
                  <p className="text-[11px] text-[#665E55] mt-0.5">Luggage unpacking, suite dining service, and private city excursions.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D8]">
                <div className="w-8 h-8 rounded-xl bg-white text-[#947139] border border-[#ECE5D8] flex items-center justify-center shrink-0 font-serif font-bold text-xs shadow-xs">
                  03
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C1916]">Direct Arabian Sea Vistas</h4>
                  <p className="text-[11px] text-[#665E55] mt-0.5">Unobstructed views of the Mumbai harbour and Gateway of India.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D8]">
                <div className="w-8 h-8 rounded-xl bg-white text-[#947139] border border-[#ECE5D8] flex items-center justify-center shrink-0 font-serif font-bold text-xs shadow-xs">
                  04
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C1916]">Guaranteed Direct Tariffs</h4>
                  <p className="text-[11px] text-[#665E55] mt-0.5">Real-time room availability in ₹ INR with zero hidden reservation surcharges.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigateToBooking()}
                className="px-6 py-3.5 rounded-xl bg-[#1C1916] hover:bg-[#2C2723] text-[#FAF8F5] font-bold text-xs transition-all flex items-center gap-2 cursor-pointer uppercase tracking-[0.16em] shadow-md hover:shadow-lg border border-[#947139]/40"
              >
                <span>Explore All 34 Chambers</span>
                <ArrowRight className="w-4 h-4 text-[#E6CA85]" />
              </button>
              <button
                onClick={onNavigateToServices}
                className="px-6 py-3.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3ECE1] text-[#1C1916] font-bold text-xs transition-all flex items-center gap-2 border border-[#ECE5D8] cursor-pointer uppercase tracking-[0.16em]"
              >
                <span>Palace Experiences</span>
                <ChevronRight className="w-4 h-4 text-[#947139]" />
              </button>
            </div>
          </div>

          {/* Right Imagery Collage */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <img
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
                alt="Palace facade"
                className="w-full h-48 sm:h-60 object-cover rounded-2xl shadow-sm border border-[#ECE5D8]"
              />
              <img
                src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
                alt="Ayurvedic Spa therapy"
                className="w-full h-40 sm:h-48 object-cover rounded-2xl shadow-sm border border-[#ECE5D8]"
              />
            </div>
            <div className="space-y-4 pt-6">
              <img
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
                alt="Luxury Suite interior"
                className="w-full h-40 sm:h-48 object-cover rounded-2xl shadow-sm border border-[#ECE5D8]"
              />
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
                alt="Royal Dining Hall"
                className="w-full h-48 sm:h-60 object-cover rounded-2xl shadow-sm border border-[#ECE5D8]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. CURATED ACCOMMODATIONS (FEATURED ROOMS WITH TABS) */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#947139] uppercase">
              Curated Accommodations
            </span>
            <h2 className="text-2xl sm:text-3xl font-normal font-serif text-[#1C1916] tracking-tight mt-1">
              Featured Rooms & Heritage Suites
            </h2>
            <p className="text-xs sm:text-sm text-[#665E55] mt-1 font-light">
              Select your sanctuary from our 34 available rooms. Real-time availability synchronized with Cloud SQL.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#ECE5D8] overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveFeatureTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                activeFeatureTab === 'all'
                  ? 'bg-white text-[#1C1916] shadow-xs border border-[#ECE5D8]'
                  : 'text-[#665E55] hover:text-[#1C1916]'
              }`}
            >
              All Suites
            </button>
            <button
              onClick={() => setActiveFeatureTab('suite')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                activeFeatureTab === 'suite'
                  ? 'bg-white text-[#1C1916] shadow-xs border border-[#ECE5D8]'
                  : 'text-[#665E55] hover:text-[#1C1916]'
              }`}
            >
              Maharaja Suite
            </button>
            <button
              onClick={() => setActiveFeatureTab('executive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                activeFeatureTab === 'executive'
                  ? 'bg-white text-[#1C1916] shadow-xs border border-[#ECE5D8]'
                  : 'text-[#665E55] hover:text-[#1C1916]'
              }`}
            >
              Executive Club
            </button>
            <button
              onClick={() => setActiveFeatureTab('deluxe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                activeFeatureTab === 'deluxe'
                  ? 'bg-white text-[#1C1916] shadow-xs border border-[#ECE5D8]'
                  : 'text-[#665E55] hover:text-[#1C1916]'
              }`}
            >
              Deluxe Heritage
            </button>
          </div>
        </div>

        {/* Room cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onSelect={onSelectRoom}
              onQuickBook={(r) => onQuickBookRoom(r, checkInDate, checkOutDate, guestsCount)}
            />
          ))}
        </div>

        <div className="text-center pt-4">
          <button
            onClick={() => onNavigateToBooking()}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#1C1916] hover:bg-[#2C2723] text-[#FAF8F5] font-bold text-xs uppercase tracking-[0.16em] shadow-md cursor-pointer border border-[#947139]/40"
          >
            <span>View All 34 Chambers & Real-Time Availability</span>
            <ArrowRight className="w-4 h-4 text-[#E6CA85]" />
          </button>
        </div>
      </section>

      {/* 5. BESPOKE PALACE OFFERINGS & GASTRONOMY */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#947139] uppercase">
              Bespoke Palace Offerings
            </span>
            <h2 className="text-2xl sm:text-3xl font-normal font-serif text-[#1C1916] tracking-tight mt-1">
              Exceptional Services for Royalty & Discerning Patrons
            </h2>
            <p className="text-xs sm:text-sm text-[#665E55] mt-1 max-w-xl font-light">
              From Michelin-caliber Indian gastronomy to centuries-old Ayurvedic therapies and chauffeur excursions.
            </p>
          </div>

          <button
            onClick={onNavigateToServices}
            className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3ECE1] text-[#1C1916] font-bold text-xs transition-all flex items-center gap-2 border border-[#ECE5D8] cursor-pointer shrink-0 uppercase tracking-[0.14em]"
          >
            <span>All Palace Inquiries</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#947139]" />
          </button>
        </div>

        {/* 3 Large Grid Cards for Experiences */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Service 1: Royal Dining */}
          <div className="group bg-white rounded-3xl border border-[#E5DAC6] overflow-hidden hover:border-[#947139] hover:shadow-xl transition-all duration-300 flex flex-col justify-between shadow-[0_4px_20px_rgba(28,25,22,0.03)]">
            <div className="relative aspect-[16/10] overflow-hidden bg-[#FAF8F5]">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
                alt="Royal Dining Hall"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-3 left-3 bg-white/95 text-[#1C1916] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs border border-[#ECE5D8]">
                Fine Gastronomy
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-serif font-bold text-[#1C1916] text-lg group-hover:text-[#947139] transition-colors">
                  The Maharaja Royal Dining Hall
                </h3>
                <p className="text-xs text-[#665E55] mt-1.5 leading-relaxed font-light">
                  Royal recipes passed down through generations, served in silver thalis accompanied by live sitar melodies.
                </p>
              </div>
              <div className="pt-3 border-t border-[#F3ECE1] flex items-center justify-between text-xs">
                <span className="text-[#947139] font-semibold text-[11px]">Open 07:00 – 23:30</span>
                <button
                  onClick={onNavigateToServices}
                  className="text-[#1C1916] font-bold hover:text-[#947139] flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore Menu</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#947139]" />
                </button>
              </div>
            </div>
          </div>

          {/* Service 2: Ayurvedic Spa */}
          <div className="group bg-white rounded-3xl border border-[#E5DAC6] overflow-hidden hover:border-[#947139] hover:shadow-xl transition-all duration-300 flex flex-col justify-between shadow-[0_4px_20px_rgba(28,25,22,0.03)]">
            <div className="relative aspect-[16/10] overflow-hidden bg-[#FAF8F5]">
              <img
                src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
                alt="Ayurvedic Spa"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-3 left-3 bg-white/95 text-[#1C1916] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs border border-[#ECE5D8]">
                Wellness & Spa
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-serif font-bold text-[#1C1916] text-lg group-hover:text-[#947139] transition-colors">
                  Jiva Ayurvedic Sanctuary & Spa
                </h3>
                <p className="text-xs text-[#665E55] mt-1.5 leading-relaxed font-light">
                  Authentic herbal oils, Abhyanga massages, Shirodhara head therapies, and Himalayan crystal steam chambers.
                </p>
              </div>
              <div className="pt-3 border-t border-[#F3ECE1] flex items-center justify-between text-xs">
                <span className="text-[#947139] font-semibold text-[11px]">Open 06:00 – 21:00</span>
                <button
                  onClick={onNavigateToServices}
                  className="text-[#1C1916] font-bold hover:text-[#947139] flex items-center gap-1 cursor-pointer"
                >
                  <span>View Treatments</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#947139]" />
                </button>
              </div>
            </div>
          </div>

          {/* Service 3: Azure Pool & Private Cabanas */}
          <div className="group bg-white rounded-3xl border border-[#E5DAC6] overflow-hidden hover:border-[#947139] hover:shadow-xl transition-all duration-300 flex flex-col justify-between shadow-[0_4px_20px_rgba(28,25,22,0.03)]">
            <div className="relative aspect-[16/10] overflow-hidden bg-[#FAF8F5]">
              <img
                src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80"
                alt="Palace Pool"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-3 left-3 bg-white/95 text-[#1C1916] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs border border-[#ECE5D8]">
                Azure Pool
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-serif font-bold text-[#1C1916] text-lg group-hover:text-[#947139] transition-colors">
                  Temperature-Controlled Azure Pool
                </h3>
                <p className="text-xs text-[#665E55] mt-1.5 leading-relaxed font-light">
                  Relax in azure waters surrounded by swaying palms and shaded cabanas with fresh tropical juices.
                </p>
              </div>
              <div className="pt-3 border-t border-[#F3ECE1] flex items-center justify-between text-xs">
                <span className="text-[#947139] font-semibold text-[11px]">Open 06:00 – 22:00</span>
                <button
                  onClick={onNavigateToServices}
                  className="text-[#1C1916] font-bold hover:text-[#947139] flex items-center gap-1 cursor-pointer"
                >
                  <span>Cabana Booking</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#947139]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. GUEST REVIEWS & PATRON TESTIMONIALS */}
      <section className="bg-[#181614] text-white rounded-3xl p-6 sm:p-10 lg:p-14 space-y-8 border border-[#ECE5D8]/20 shadow-2xl">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#E6CA85] uppercase">
            Patron Testimonials
          </span>
          <h2 className="text-2xl sm:text-3xl font-normal font-serif text-[#FAF8F5] tracking-tight">
            Memories of Splendor & Unrivaled Hospitality
          </h2>
          <p className="text-xs text-[#DCD5C9] font-light">
            Real reviews from verified patrons who stayed at The Grand Imperial Palace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#24211D] border border-[#3A352F] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-1 text-[#E6CA85]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#E6CA85]" />
              ))}
            </div>
            <p className="text-xs text-[#DCD5C9] italic leading-relaxed font-light">
              "The Arabian Sea view from our 4th floor Executive Suite was breathtaking. The traditional Indian breakfast and personal butler service made our anniversary truly unforgettable."
            </p>
            <div className="pt-2 border-t border-[#3A352F] flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white block">Dr. Rohan & Ananya Sharma</span>
                <span className="text-[11px] text-[#E6CA85]">Stayed in Suite 402 • Delhi</span>
              </div>
              <span className="text-[10px] text-[#8C8275] font-mono">Verified Patron</span>
            </div>
          </div>

          <div className="bg-[#24211D] border border-[#3A352F] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-1 text-[#E6CA85]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#E6CA85]" />
              ))}
            </div>
            <p className="text-xs text-[#DCD5C9] italic leading-relaxed font-light">
              "Outstanding conference and dining facilities. We hosted our international symposium here; the technical support, catering, and luxurious rooms received high praise from every delegate."
            </p>
            <div className="pt-2 border-t border-[#3A352F] flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white block">Marcus Vance</span>
                <span className="text-[11px] text-[#E6CA85]">Stayed in Deluxe Room 301 • London</span>
              </div>
              <span className="text-[10px] text-[#8C8275] font-mono">Verified Patron</span>
            </div>
          </div>

          <div className="bg-[#24211D] border border-[#3A352F] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-1 text-[#E6CA85]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#E6CA85]" />
              ))}
            </div>
            <p className="text-xs text-[#DCD5C9] italic leading-relaxed font-light">
              "The Ayurvedic spa therapies melted away all stress. Booking online was fast and transparent with clear INR pricing. Can't wait to return next winter!"
            </p>
            <div className="pt-2 border-t border-[#3A352F] flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white block">Priya Singhania</span>
                <span className="text-[11px] text-[#E6CA85]">Stayed in Heritage Suite 404 • Bangalore</span>
              </div>
              <span className="text-[10px] text-[#8C8275] font-mono">Verified Patron</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRIME COLABA LOCATION & SIGHTSEEING */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5DAC6] shadow-[0_4px_20px_rgba(28,25,22,0.03)] space-y-6">
        <div className="space-y-1">
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#947139] uppercase">
            Prime Colaba Location
          </span>
          <h2 className="text-2xl sm:text-3xl font-normal font-serif text-[#1C1916] tracking-tight">
            At the Heart of Mumbai’s Heritage & Seafront
          </h2>
          <p className="text-xs text-[#665E55] font-light">
            Conveniently situated along the Colaba Promenade, minutes from iconic landmarks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#ECE5D8] space-y-1.5">
            <div className="flex items-center gap-2 text-[#1C1916] font-semibold text-xs">
              <MapPin className="w-4 h-4 text-[#947139]" />
              <span>Gateway of India</span>
            </div>
            <p className="text-[11px] text-[#665E55]">3 minutes walk (250m) via the heritage seaside promenade.</p>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#ECE5D8] space-y-1.5">
            <div className="flex items-center gap-2 text-[#1C1916] font-semibold text-xs">
              <MapPin className="w-4 h-4 text-[#947139]" />
              <span>Colaba Causeway Market</span>
            </div>
            <p className="text-[11px] text-[#665E55]">5 minutes walk for artisanal crafts, antiques & boutique cafes.</p>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#ECE5D8] space-y-1.5">
            <div className="flex items-center gap-2 text-[#1C1916] font-semibold text-xs">
              <MapPin className="w-4 h-4 text-[#947139]" />
              <span>Marine Drive Promenade</span>
            </div>
            <p className="text-[11px] text-[#665E55]">10 minutes drive along the famous Queen’s Necklace curve.</p>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#ECE5D8] space-y-1.5">
            <div className="flex items-center gap-2 text-[#1C1916] font-semibold text-xs">
              <Car className="w-4 h-4 text-[#947139]" />
              <span>Mumbai Int'l Airport (BOM)</span>
            </div>
            <p className="text-[11px] text-[#665E55]">Chauffeur transfer via the Coastal Road & Sea Link.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

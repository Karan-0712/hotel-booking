import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed,
  Flower2,
  Waves,
  Building2,
  Car,
  Wine,
  Coffee,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Users,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  X,
  Phone,
  Mail,
  HeartHandshake,
  AlertCircle,
} from 'lucide-react';

interface ServicesViewProps {
  onNavigateToBooking: () => void;
}

interface ServiceInquiry {
  serviceName: string;
  category: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  date: string;
  time: string;
  guestsCount: number;
  specialNotes: string;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ onNavigateToBooking }) => {
  const { user, profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'dining' | 'wellness' | 'events' | 'concierge'>('all');
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [activeServiceForInquiry, setActiveServiceForInquiry] = useState<string>('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState<string>('');

  const [formData, setFormData] = useState<ServiceInquiry>({
    serviceName: '',
    category: 'Dining',
    guestName: profile?.name || user?.displayName || '',
    guestEmail: profile?.email || user?.email || '',
    guestPhone: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:30',
    guestsCount: 2,
    specialNotes: '',
  });

  const openInquiry = (serviceTitle: string, category: string) => {
    setActiveServiceForInquiry(serviceTitle);
    setFormData({
      serviceName: serviceTitle,
      category,
      guestName: profile?.name || user?.displayName || '',
      guestEmail: profile?.email || user?.email || '',
      guestPhone: '',
      date: new Date().toISOString().split('T')[0],
      time: '19:30',
      guestsCount: 2,
      specialNotes: '',
    });
    setInquiryError('');
    setInquirySubmitted(false);
    setInquiryModalOpen(true);
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName.trim() || formData.guestName.trim().length < 2) {
      setInquiryError('Please enter your full name (minimum 2 characters).');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.guestEmail.trim() || !emailRegex.test(formData.guestEmail.trim())) {
      setInquiryError('Please enter a valid email address.');
      return;
    }
    const cleanPhone = formData.guestPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setInquiryError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setInquiryError('');
    setInquirySubmitted(true);
  };

  const servicesData = [
    {
      id: 'dining-1',
      category: 'dining',
      title: 'The Maharaja Royal Dining Hall',
      subtitle: 'Imperial Indian Gastronomy & Silver Thalis',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
      timing: '07:00 – 11:00 (Breakfast) | 12:30 – 15:30 (Lunch) | 19:30 – 23:30 (Dinner)',
      location: 'Ground Floor, North Heritage Wing',
      priceGuide: '₹2,500 – ₹4,500 per person',
      description:
        'Savor authentic recipes once prepared for Indian royal dynasties. Indulge in our signature 24-karat edible gold Maharaja Thali, slow-cooked Awadhi dum biryanis, and tandoori delicacies accompanied by live sitar recitals.',
      highlights: [
        'Signature Royal 24-Karat Maharaja Thali',
        'Live Indian Classical Sitar & Flute',
        'Sommelier Curated International Wine Pairings',
        'Private Royal Dining Chambers available',
      ],
    },
    {
      id: 'dining-2',
      category: 'dining',
      title: 'Bayfront Terrace & Sunset Lounge',
      subtitle: 'Coastal Seafood & Arabian Sea Cocktails',
      image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1000&q=80',
      timing: '17:00 – 01:00 (Evening & Late Night)',
      location: '4th Floor Rooftop Promenade',
      priceGuide: '₹1,800 – ₹3,200 per person',
      description:
        'Perched high above the Colaba coastline with panoramic views of the Gateway of India and the Arabian Sea. Enjoy fresh Malabar catch, charcoal grills, botanical mocktails, and artisanal spirits.',
      highlights: [
        'Unobstructed Sunset Views of Arabian Sea',
        'Fresh Coastline Catch & Grills',
        'Botanical Cocktails & Fine Single Malts',
        'Ambient Sea Breeze & Acoustic Lounge Music',
      ],
    },
    {
      id: 'wellness-1',
      category: 'wellness',
      title: 'Jiva Ayurvedic Sanctuary & Spa',
      subtitle: 'Ancient Vedic Therapies & Rejuvenation',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
      timing: '06:00 – 21:30 Daily',
      location: 'Level 1, Wellness Courtyard',
      priceGuide: '₹3,500 – ₹8,000 per ritual',
      description:
        'Guided by certified Ayurvedic vaidyas, our therapies utilize pure herb-infused warm oils, Himalayan crystal salts, and traditional brass vessels to balance mind, body, and spirit.',
      highlights: [
        'Traditional Abhyanga 4-Hand Full Body Massage',
        'Shirodhara Meditative Warm Herb Oil Therapy',
        'Himalayan Salt Crystal Steam Sauna & Jacuzzi',
        'Customized Prakriti Dosha Consultations',
      ],
    },
    {
      id: 'wellness-2',
      category: 'wellness',
      title: 'Heated Azure Infinity Pool & Cabanas',
      subtitle: 'Seaside Aquatic Sanctuary & Sun Decks',
      image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1000&q=80',
      timing: '06:00 – 22:00 Daily',
      location: 'Central Palace Courtyard',
      priceGuide: 'Complimentary for Hotel In-House Guests',
      description:
        'Surrounded by royal stone arches, palm trees, and plush private shaded daybeds. Temperature regulated year-round, complete with attentive poolside refreshments and chilled towel service.',
      highlights: [
        'Temperature Controlled Filtered Waters',
        'Private Shaded Daybed Cabanas with Butler Service',
        'Fresh Fruit Smoothies & Mocktail Bar',
        'Dedicated Children’s Shallow Wading Pool',
      ],
    },
    {
      id: 'events-1',
      category: 'events',
      title: 'The Darbar Royal Ballroom & Banquets',
      subtitle: 'Regal Weddings, Galas & World Summits',
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80',
      timing: 'Custom Booking Schedules',
      location: 'Grand Ballroom Wing (Capacity up to 350 Guests)',
      priceGuide: 'Custom Event Packages Available',
      description:
        'With towering 18-foot ceilings, Bohemian crystal chandeliers, and acoustic teak paneling, The Darbar Hall provides an unforgettable venue for royal Indian weddings, diplomatic conferences, and luxury corporate galas.',
      highlights: [
        'Accommodates 50 to 350 Guests in Banquet Setup',
        'State-of-the-art 4K Projection & Laser Audio',
        'Bespoke Imperial Catering by Executive Chefs',
        'Dedicated VIP Entrance & Valet Logistics',
      ],
    },
    {
      id: 'concierge-1',
      category: 'concierge',
      title: 'Royal Chauffeur & Private Mumbai Sightseeing',
      subtitle: 'Mercedes-Benz Fleet & Heritage Excursions',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
      timing: '24/7 On-Demand Chauffeur Service',
      location: 'Main Porte-Cochère & Reception Desk',
      priceGuide: '₹3,000 for Airport Chauffeur | ₹6,500 Full Day Tour',
      description:
        'Experience seamless luxury transit in our private fleet of Mercedes-Benz and BMW sedans. Enjoy curated heritage tours of South Mumbai, Elephanta Caves private motorboat charters, and Art Deco architectural walks.',
      highlights: [
        'Airport Meet-and-Greet with Luggage Assistance',
        'Uniformed Chauffeurs with In-Car Wi-Fi & Refreshments',
        'Private Speedboat to Elephanta Caves',
        'Customized Mumbai Heritage & Art Deco Walks',
      ],
    },
    {
      id: 'concierge-2',
      category: 'concierge',
      title: '24/7 Palace Butler & In-Room Dining',
      subtitle: 'Bespoke Personalized Service Round the Clock',
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
      timing: '24 Hours Daily for all In-House Guests',
      location: 'Available in all 34 Rooms & Suites',
      priceGuide: 'Complimentary Butler Service with In-Room Menu Tariffs',
      description:
        'Your dedicated palace butler assists with wardrobe pressing, packing/unpacking, personalized tea service, bath rituals, and private five-star dining served directly on your room terrace overlooking the bay.',
      highlights: [
        'Dedicated Floor Butler on Call 24/7',
        'Complimentary Daily Garment Pressing',
        'Curated Essential Oil Bath Rituals on Request',
        'Multi-course In-Room Suite Dining',
      ],
    },
  ];

  const filteredServices = servicesData.filter((s) => {
    if (selectedCategory === 'all') return true;
    return s.category === selectedCategory;
  });

  return (
    <div className="space-y-12 pb-16">
      {/* 1. HERO HEADER */}
      <section className="bg-[#1C1917] text-white rounded-3xl p-6 sm:p-10 lg:p-14 relative overflow-hidden border border-[#DFCEAF]/30 shadow-xl">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80"
            alt="Services Banner"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1C1917] via-[#1C1917]/85 to-transparent" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#966A28]/30 border border-[#DFCEAF]/40 px-3.5 py-1 rounded-full text-[#D4AF37] text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Palace Experiences & Gastronomy</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif tracking-tight text-[#FAF7F2]">
            World-Class Services & Heritage Amenities
          </h1>

          <p className="text-[#D8CEBE] text-sm sm:text-base leading-relaxed font-light">
            Every moment at The Grand Imperial is curated with imperial grace. Discover Michelin-level Indian royal cuisine, rejuvenating Ayurvedic wellness therapies, and 24/7 personalized concierge hospitality.
          </p>

          {/* Quick CTA to Room Booking */}
          <div className="pt-2 flex flex-wrap gap-4">
            <button
              onClick={onNavigateToBooking}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#966A28] to-[#785116] hover:from-[#855D21] hover:to-[#6E4710] text-[#FDFBF7] font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer border border-[#DFCEAF]"
            >
              <span>Book A Luxury Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#services-list"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF7F2] font-semibold text-xs border border-white/20 transition-all flex items-center gap-2 uppercase tracking-wider"
            >
              <span>Explore Offerings Below</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY FILTER TABS */}
      <section id="services-list" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#E8E1D5]">
          <div>
            <h2 className="text-xl font-bold font-serif text-[#1C1917]">
              Palace Service Directory
            </h2>
            <p className="text-xs text-[#7A7265] font-light">
              Filter by experience category or submit an instant table / spa reservation inquiry.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E1D5] text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#785116] text-[#FDF6EE] shadow-xs'
                  : 'text-[#7A7265] hover:text-[#1C1917] hover:bg-white'
              }`}
            >
              All Services
            </button>
            <button
              onClick={() => setSelectedCategory('dining')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'dining'
                  ? 'bg-[#785116] text-[#FDF6EE] shadow-xs'
                  : 'text-[#7A7265] hover:text-[#1C1917] hover:bg-white'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              Dining & Lounges
            </button>
            <button
              onClick={() => setSelectedCategory('wellness')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'wellness'
                  ? 'bg-[#785116] text-[#FDF6EE] shadow-xs'
                  : 'text-[#7A7265] hover:text-[#1C1917] hover:bg-white'
              }`}
            >
              <Flower2 className="w-3.5 h-3.5" />
              Spa & Wellness
            </button>
            <button
              onClick={() => setSelectedCategory('events')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'events'
                  ? 'bg-[#785116] text-[#FDF6EE] shadow-xs'
                  : 'text-[#7A7265] hover:text-[#1C1917] hover:bg-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Banquets & Events
            </button>
            <button
              onClick={() => setSelectedCategory('concierge')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'concierge'
                  ? 'bg-[#785116] text-[#FDF6EE] shadow-xs'
                  : 'text-[#7A7265] hover:text-[#1C1917] hover:bg-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              Chauffeur & Butler
            </button>
          </div>
        </div>

        {/* 3. SERVICE CARDS IN DETAILED LIST */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-3xl border border-[#E8E1D5] overflow-hidden hover:border-[#DFCEAF] hover:shadow-[0_8px_30px_rgba(40,30,20,0.06)] transition-all flex flex-col justify-between"
            >
              {/* Image & Badges */}
              <div className="relative aspect-[16/9] overflow-hidden bg-[#FAF7F2]">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                <div className="absolute top-3 left-3 bg-white/95 text-[#1C1917] text-xs font-bold px-3 py-1 rounded-xl shadow-xs border border-[#DFCEAF]">
                  {service.subtitle}
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10 text-[#FAF7F2]">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {service.timing.split('|')[0]}
                  </span>
                  <span className="bg-[#785116] text-[#FDF6EE] font-medium px-2.5 py-1 rounded-lg text-[11px] border border-[#DFCEAF]/40">
                    {service.priceGuide}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-bold font-serif text-[#1C1917]">
                      {service.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#785116] font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#966A28]" />
                    <span>{service.location}</span>
                  </div>

                  <p className="text-xs text-[#5E564D] leading-relaxed font-light">
                    {service.description}
                  </p>

                  {/* Highlights checklist */}
                  <div className="pt-2 border-t border-[#F2ECE1] space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-[#785116] font-bold block">
                      Key Service Highlights
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {service.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-[#5E564D]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#966A28] shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-[#F2ECE1] flex items-center justify-between">
                  <span className="text-[11px] text-[#7A7265]">
                    Timings: {service.timing}
                  </span>

                  <button
                    onClick={() => openInquiry(service.title, service.category)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#966A28] to-[#785116] hover:from-[#855D21] hover:to-[#6E4710] text-[#FDFBF7] font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider border border-[#DFCEAF]"
                  >
                    <span>Reserve / Inquire</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PALACE CONCIERGE HELP DESK STRIP */}
      <section className="bg-[#FAF3E8] border border-[#DFCEAF] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-[#785116] font-bold text-base font-serif">
            <HeartHandshake className="w-5 h-5 text-[#966A28]" />
            <span>Need Custom Itinerary Planning or Private Dining?</span>
          </div>
          <p className="text-xs text-[#5E564D] leading-relaxed font-light">
            Our Head Concierge is at your disposal 24 hours a day to tailor bespoke romantic dinners, yacht charters, and private conference arrangements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="tel:+912266554321"
            className="px-4 py-2.5 rounded-xl bg-white border border-[#E8E1D5] text-[#1C1917] font-semibold text-xs hover:bg-[#FAF7F2] transition-all flex items-center gap-2 shadow-xs"
          >
            <Phone className="w-3.5 h-3.5 text-[#966A28]" />
            <span>+91 (022) 6655 4321</span>
          </a>
          <button
            onClick={() => openInquiry('Bespoke Concierge & Private Dining', 'concierge')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#966A28] to-[#785116] hover:from-[#855D21] hover:to-[#6E4710] text-[#FDFBF7] font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider border border-[#DFCEAF]"
          >
            <Mail className="w-3.5 h-3.5 text-[#FAF7F2]" />
            <span>Send Direct Inquiry</span>
          </button>
        </div>
      </section>

      {/* 5. INTERACTIVE SERVICE INQUIRY / RESERVATION MODAL */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1C1917]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E8E1D5] shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#F2ECE1] pb-3">
              <div>
                <span className="text-[11px] text-[#785116] font-bold uppercase tracking-wider">
                  Palace Service Reservation
                </span>
                <h3 className="text-lg font-bold font-serif text-[#1C1917] mt-0.5">
                  {formData.serviceName}
                </h3>
              </div>
              <button
                onClick={() => setInquiryModalOpen(false)}
                className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#7A7265] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inquirySubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#FAF3E8] text-[#785116] border border-[#DFCEAF] flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8 text-[#966A28]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold font-serif text-[#1C1917]">
                    Request Received with Honor
                  </h4>
                  <p className="text-xs text-[#5E564D] max-w-sm mx-auto leading-relaxed font-light">
                    Thank you, <strong>{formData.guestName}</strong>. Our Head Concierge has received your request for <strong>{formData.serviceName}</strong> on {formData.date} at {formData.time} for {formData.guestsCount} guests. We will reach out via {formData.guestPhone || formData.guestEmail} shortly.
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => setInquiryModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl bg-[#1C1917] hover:bg-black text-[#FAF7F2] font-semibold text-xs cursor-pointer uppercase tracking-wider"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#785116]">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#E8E1D5] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#966A28]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#785116]">Mobile Number *</label>
                      <span className="text-[10px] text-[#7A7265]">10 Digits</span>
                    </div>
                    <div className="flex rounded-xl border border-[#E8E1D5] bg-[#FAF7F2] focus-within:border-[#966A28] focus-within:bg-white overflow-hidden">
                      <span className="inline-flex items-center px-2.5 text-xs font-medium text-[#7A7265] bg-[#EFE8DC] border-r border-[#E8E1D5] select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="Enter 10-digit mobile number"
                        value={formData.guestPhone}
                        onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        className="w-full bg-transparent p-2.5 text-xs text-[#1C1917] focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#785116]">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="patron@domain.com"
                    value={formData.guestEmail}
                    onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E1D5] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#966A28]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#785116]">Preferred Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#E8E1D5] rounded-xl p-2 text-xs text-[#1C1917] focus:outline-none focus:border-[#966A28]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#785116]">Time</label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#E8E1D5] rounded-xl p-2 text-xs text-[#1C1917] focus:outline-none focus:border-[#966A28]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#785116]">Guests</label>
                    <select
                      value={formData.guestsCount}
                      onChange={(e) => setFormData({ ...formData, guestsCount: Number(e.target.value) })}
                      className="w-full bg-[#FAF7F2] border border-[#E8E1D5] rounded-xl p-2 text-xs text-[#1C1917] focus:outline-none focus:border-[#966A28]"
                    >
                      <option value={1}>1 Guest</option>
                      <option value={2}>2 Guests</option>
                      <option value={4}>3-4 Guests</option>
                      <option value={8}>5-8 Guests</option>
                      <option value={20}>9+ Banquet</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#785116]">Special Notes or Dietary Preferences</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Anniversary celebration, vegetarian Jain options, airport flight number..."
                    value={formData.specialNotes}
                    onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E1D5] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#966A28] resize-none placeholder:text-[#8C8275]"
                  />
                </div>

                {inquiryError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2.5 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{inquiryError}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setInquiryModalOpen(false)}
                    className="px-4 py-2 text-xs text-[#7A7265] hover:text-[#1C1917] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-[#966A28] to-[#785116] hover:from-[#855D21] hover:to-[#6E4710] text-[#FDFBF7] font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider border border-[#DFCEAF]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Reservation Request</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

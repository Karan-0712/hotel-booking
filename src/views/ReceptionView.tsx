import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Printer,
  Receipt,
  UserCheck,
  DoorClosed,
  Coffee,
  Sparkles,
  Calendar,
  CreditCard,
  Building,
  RefreshCw,
  Clock,
  Check,
  X,
  FileText,
  DollarSign,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  Phone,
  Mail,
  User,
  Shield,
  Utensils,
  Car,
  ShoppingBag,
  Sparkle,
} from 'lucide-react';
import { Room, Booking, FolioItem } from '../types.ts';
import { OtpVerificationModal } from '../components/OtpVerificationModal.tsx';
import { issueOtp } from '../utils/otpService.ts';
import {
  ID_CONFIGS,
  getIdConfig,
  formatIdNumber,
  validateIdNumber,
} from '../utils/idValidator.ts';
import { InvoiceModal } from '../components/InvoiceModal.tsx';
import { NetworkStatusIndicator } from '../components/NetworkStatusIndicator.tsx';

interface ReceptionViewProps {
  rooms?: Room[];
  bookings?: Booking[];
  onRefreshData?: () => Promise<void> | void;
  onNavigateToExplore?: () => void;
  onNavigateHome?: () => void;
}

export const ReceptionView: React.FC<ReceptionViewProps> = ({
  rooms: propRooms,
  bookings: propBookings,
  onRefreshData,
  onNavigateHome,
}) => {
  const [internalRooms, setInternalRooms] = useState<Room[]>(propRooms || []);
  const [internalBookings, setInternalBookings] = useState<Booking[]>(propBookings || []);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchReceptionData = async () => {
    setIsLoadingData(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/reception/bookings'),
      ]);
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        if (Array.isArray(roomsData)) setInternalRooms(roomsData);
      }
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        if (Array.isArray(bookingsData)) setInternalBookings(bookingsData);
      }
    } catch (err) {
      console.warn('Notice loading reception data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (propRooms && propRooms.length > 0) {
      setInternalRooms(propRooms);
    }
  }, [propRooms]);

  useEffect(() => {
    if (propBookings && propBookings.length > 0) {
      setInternalBookings(propBookings);
    }
  }, [propBookings]);

  useEffect(() => {
    fetchReceptionData();

    // Multi-device sync: refresh reception data every 5 seconds
    const interval = setInterval(() => {
      fetchReceptionData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const refreshAll = async () => {
    await fetchReceptionData();
    if (onRefreshData) {
      await onRefreshData();
    }
  };

  const rooms = internalRooms.length > 0 ? internalRooms : (propRooms || []);
  const bookings = internalBookings.length > 0 ? internalBookings : (propBookings || []);

  const [activeTab, setActiveTab] = useState<'walkin' | 'frontdesk' | 'housekeeping' | 'folios' | 'shift'>(
    'frontdesk'
  );

  // Front desk sub-filter: 'arrivals' | 'inhouse' | 'departures' | 'all'
  const [frontDeskFilter, setFrontDeskFilter] = useState<'all' | 'arrivals' | 'inhouse' | 'departures'>('inhouse');
  const [searchQuery, setSearchQuery] = useState('');

  // Loading & notification states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // OTP Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpPhoneTarget, setOtpPhoneTarget] = useState('');
  const [otpGuestNameTarget, setOtpGuestNameTarget] = useState('');
  const [otpVerifiedForWalkIn, setOtpVerifiedForWalkIn] = useState(false);

  // Walk-In Form State
  const [walkInForm, setWalkInForm] = useState({
    roomId: rooms.find((r) => r.status === 'available')?.id || (rooms[0]?.id ?? 1),
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    guestAddress: '',
    idProofType: 'Aadhaar Card',
    idProofNumber: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    guestsCount: 2,
    specialRequests: '',
    paymentMethod: 'Cash at Counter',
    keyCardNumber: '',
  });

  // Check-In Modal State
  const [checkInModal, setCheckInModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
    keyCardNumber: string;
    idProofType: string;
    idProofNumber: string;
    isOtpVerified: boolean;
  }>({
    isOpen: false,
    booking: null,
    keyCardNumber: '',
    idProofType: 'Aadhaar Card',
    idProofNumber: '',
    isOtpVerified: false,
  });

  // Check-Out Modal State
  const [checkOutModal, setCheckOutModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
    settlementMethod: string;
  }>({
    isOpen: false,
    booking: null,
    settlementMethod: 'Cash at Counter',
  });

  // Add Folio Charge Modal State
  const [folioModal, setFolioModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
    description: string;
    category: 'Dining' | 'Spa' | 'Laundry' | 'Transport' | 'Minibar' | 'Other';
    amount: number;
  }>({
    isOpen: false,
    booking: null,
    description: 'In-Room Fine Dining Order',
    category: 'Dining',
    amount: 1250,
  });

  // Printable Invoice / Folio Modal
  const [invoiceModal, setInvoiceModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
  }>({
    isOpen: false,
    booking: null,
  });

  // Auto-clear success message
  useEffect(() => {
    if (actionSuccess) {
      const t = setTimeout(() => setActionSuccess(null), 5000);
      return () => clearTimeout(t);
    }
  }, [actionSuccess]);

  // Selected Walk-In Room details
  const selectedWalkInRoom = useMemo(() => {
    return rooms.find((r) => r.id === Number(walkInForm.roomId)) || rooms[0];
  }, [rooms, walkInForm.roomId]);

  // Auto calculate nights
  const calculatedNights = useMemo(() => {
    const start = new Date(walkInForm.checkInDate).getTime();
    const end = new Date(walkInForm.checkOutDate).getTime();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, isNaN(diff) ? 1 : diff);
  }, [walkInForm.checkInDate, walkInForm.checkOutDate]);

  // Calculate Walk-in Totals
  const walkInTotals = useMemo(() => {
    if (!selectedWalkInRoom) return { subtotal: 0, tax: 0, total: 0 };
    const rate = selectedWalkInRoom.pricePerNight;
    const subtotal = rate * calculatedNights;
    const tax = Math.round(subtotal * 0.12); // 12% Luxury GST
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [selectedWalkInRoom, calculatedNights]);

  // Real-time Front Desk Metrics
  const frontDeskMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const totalRooms = rooms.length || 34;
    const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
    const availableRooms = rooms.filter((r) => r.status === 'available').length;
    const cleaningRooms = rooms.filter((r) => r.status === 'cleaning').length;
    const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance').length;

    const inHouseBookings = bookings.filter((b) => b.bookingStatus === 'checked_in');
    const arrivalsToday = bookings.filter(
      (b) => b.bookingStatus === 'confirmed' && (b.checkInDate <= todayStr || true)
    );
    const departuresToday = bookings.filter(
      (b) => b.bookingStatus === 'checked_in' && (b.checkOutDate <= todayStr || true)
    );

    const shiftRevenue = bookings
      .filter((b) => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      cleaningRooms,
      maintenanceRooms,
      inHouseCount: inHouseBookings.length,
      arrivalsCount: arrivalsToday.length,
      departuresCount: departuresToday.length,
      occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      shiftRevenue,
    };
  }, [rooms, bookings]);

  // Filtered Front Desk Bookings
  const filteredBookings = useMemo(() => {
    let list = [...bookings];

    if (frontDeskFilter === 'inhouse') {
      list = list.filter((b) => b.bookingStatus === 'checked_in');
    } else if (frontDeskFilter === 'arrivals') {
      list = list.filter((b) => b.bookingStatus === 'confirmed');
    } else if (frontDeskFilter === 'departures') {
      list = list.filter((b) => b.bookingStatus === 'checked_in');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.guestName.toLowerCase().includes(q) ||
          b.guestPhone.includes(q) ||
          b.bookingReference.toLowerCase().includes(q) ||
          (b.roomNumber && b.roomNumber.toLowerCase().includes(q)) ||
          (b.keyCardNumber && b.keyCardNumber.toLowerCase().includes(q))
      );
    }

    return list;
  }, [bookings, frontDeskFilter, searchQuery]);

  // Handle Walk-In Submission
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!walkInForm.guestName.trim()) {
      setActionError('Please enter the guest full name.');
      return;
    }
    if (!walkInForm.guestPhone.trim() || walkInForm.guestPhone.replace(/\D/g, '').length < 10) {
      setActionError('Please enter a valid 10-digit mobile number for the guest.');
      return;
    }
    if (!walkInForm.idProofNumber.trim()) {
      setActionError('Please enter the government ID Proof number (e.g. Aadhaar, PAN, or Passport).');
      return;
    }

    const idValidation = validateIdNumber(walkInForm.idProofType, walkInForm.idProofNumber);
    if (!idValidation.isValid) {
      setActionError(idValidation.error || 'Invalid government ID number format.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        roomId: Number(walkInForm.roomId),
        guestName: walkInForm.guestName.trim(),
        guestPhone: walkInForm.guestPhone.trim(),
        guestEmail: walkInForm.guestEmail.trim() || undefined,
        guestAddress: walkInForm.guestAddress.trim() || undefined,
        idProofType: walkInForm.idProofType,
        idProofNumber: walkInForm.idProofNumber.trim(),
        checkInDate: walkInForm.checkInDate,
        checkOutDate: walkInForm.checkOutDate,
        totalNights: calculatedNights,
        guestsCount: walkInForm.guestsCount,
        specialRequests: walkInForm.specialRequests.trim() || undefined,
        roomRatePerNight: selectedWalkInRoom.pricePerNight,
        taxesAndFees: walkInTotals.tax,
        totalAmount: walkInTotals.total,
        paymentMethod: walkInForm.paymentMethod,
        keyCardNumber:
          walkInForm.keyCardNumber.trim() ||
          `KEY-${selectedWalkInRoom.roomNumber || selectedWalkInRoom.id}-A`,
        isOtpVerified: otpVerifiedForWalkIn,
      };

      const res = await fetch('/api/reception/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process walk-in check-in.');
      }

      await refreshAll();
      setActionSuccess(
        `Walk-in guest ${payload.guestName} successfully checked into Suite #${selectedWalkInRoom.roomNumber || selectedWalkInRoom.id}! Key ${payload.keyCardNumber} issued.`
      );

      // Open printable folio invoice
      if (data.booking) {
        setInvoiceModal({ isOpen: true, booking: data.booking });
      }

      // Reset Form
      setWalkInForm({
        roomId: rooms.find((r) => r.status === 'available' && r.id !== Number(walkInForm.roomId))?.id || 1,
        guestName: '',
        guestPhone: '',
        guestEmail: '',
        guestAddress: '',
        idProofType: 'Aadhaar Card',
        idProofNumber: '',
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        guestsCount: 2,
        specialRequests: '',
        paymentMethod: 'Cash at Counter',
        keyCardNumber: '',
      });
      setOtpVerifiedForWalkIn(false);
      setActiveTab('frontdesk');
    } catch (err: any) {
      setActionError(err.message || 'An error occurred during walk-in check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Perform Express Check-In on existing booking
  const handleConfirmCheckIn = async () => {
    if (!checkInModal.booking) return;

    if (checkInModal.idProofNumber && checkInModal.idProofNumber.trim()) {
      const idValidation = validateIdNumber(checkInModal.idProofType, checkInModal.idProofNumber);
      if (!idValidation.isValid) {
        setActionError(idValidation.error || 'Invalid government ID format.');
        return;
      }
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch('/api/reception/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: checkInModal.booking.id,
          keyCardNumber: checkInModal.keyCardNumber || `KEY-${checkInModal.booking.roomNumber || checkInModal.booking.roomId}-A`,
          idProofType: checkInModal.idProofType,
          idProofNumber: checkInModal.idProofNumber,
          isOtpVerified: checkInModal.isOtpVerified,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete check-in.');

      const checkedInGuest = checkInModal.booking.guestName;
      const assignedKey = checkInModal.keyCardNumber || `KEY-${checkInModal.booking.roomNumber || checkInModal.booking.roomId}-A`;

      setCheckInModal({
        isOpen: false,
        booking: null,
        keyCardNumber: '',
        idProofType: 'Aadhaar Card',
        idProofNumber: '',
        isOtpVerified: false,
      });

      await refreshAll();
      setActionSuccess(
        `Guest ${checkedInGuest} successfully checked in! Key Card ${assignedKey} activated.`
      );
    } catch (err: any) {
      setActionError(err.message || 'An error occurred during check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Perform Express Check-Out on staying booking
  const handleConfirmCheckOut = async () => {
    if (!checkOutModal.booking) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch('/api/reception/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: checkOutModal.booking.id,
          settlementMethod: checkOutModal.settlementMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete check-out.');

      await refreshAll();
      setActionSuccess(
        `Guest ${checkOutModal.booking.guestName} checked out successfully. Key returned and Suite #${checkOutModal.booking.roomNumber || checkOutModal.booking.roomId} marked for Housekeeping.`
      );

      // Open Final Settled Invoice
      if (data.booking) {
        setInvoiceModal({ isOpen: true, booking: data.booking });
      }

      setCheckOutModal({ isOpen: false, booking: null, settlementMethod: 'Cash at Counter' });
    } catch (err: any) {
      setActionError(err.message || 'Check-out failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Incidentals / Folio Charge
  const handleAddFolioCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folioModal.booking) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch('/api/reception/folio/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: folioModal.booking.id,
          description: folioModal.description,
          category: folioModal.category,
          amount: Number(folioModal.amount),
          addedBy: 'Front Desk Concierge',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add folio charge.');

      await refreshAll();
      setActionSuccess(
        `Added ₹${folioModal.amount} (${folioModal.description}) to ${folioModal.booking.guestName}'s room folio.`
      );
      setFolioModal({
        isOpen: false,
        booking: null,
        description: 'In-Room Fine Dining Order',
        category: 'Dining',
        amount: 1250,
      });
    } catch (err: any) {
      setActionError(err.message || 'Failed to update folio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Room Housekeeping Status
  const handleUpdateRoomStatus = async (
    roomId: number,
    newStatus: 'available' | 'occupied' | 'cleaning' | 'maintenance'
  ) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/reception/rooms/${roomId}/housekeeping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update room status.');
      await refreshAll();
      setActionSuccess(`Room #${roomId} status updated to ${newStatus.toUpperCase()}.`);
    } catch (err: any) {
      setActionError(err.message || 'Could not update room status.');
    }
  };

  // Parse Folio Items safely
  const parseFolioItems = (booking: Booking): FolioItem[] => {
    if (!booking.folioItems) {
      return [
        {
          id: 'base_tariff',
          description: `Room Tariff (${booking.totalNights} Night${booking.totalNights > 1 ? 's' : ''})`,
          category: 'Room',
          amount: booking.roomRatePerNight * booking.totalNights,
          timestamp: booking.createdAt || new Date().toISOString(),
          addedBy: 'Reservation System',
        },
        {
          id: 'base_tax',
          description: 'Heritage Luxury GST & Service Fee (12%)',
          category: 'Other',
          amount: booking.taxesAndFees || 0,
          timestamp: booking.createdAt || new Date().toISOString(),
          addedBy: 'Reservation System',
        },
      ];
    }
    try {
      return JSON.parse(booking.folioItems);
    } catch {
      return [];
    }
  };

  return (
    <div id="reception-panel-view" className="min-h-screen bg-[#FBF9F5] text-[#1C1916] pb-24">
      {/* Top Front Desk Header Bar */}
      <header className="bg-[#1C1916] text-[#FAF8F5] border-b border-[#947139]/30 sticky top-16 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Front Desk Branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#947139]/20 border border-[#947139]/50 flex items-center justify-center text-[#E6CA85] shadow-xs">
                <Building className="w-5 h-5 text-[#E6CA85]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-serif font-bold text-white tracking-tight">
                    Grand Reception &amp; Concierge Desk
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    Reception &amp; POS Ready
                  </span>
                </div>
                <p className="text-xs text-[#ECE5D8] font-light">
                  The Grand Imperial Palace Reception &bull; {frontDeskMetrics.totalRooms} Luxury Chambers &bull; Shift POS, Keycards &amp; OTP Verification
                </p>
              </div>
            </div>

            {/* Quick Shift Live Badges & Refresh */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <NetworkStatusIndicator compact />

              <div className="bg-[#2C2723] px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 text-xs">
                <span className="text-[#948A7D]">Occupancy:</span>
                <strong className="text-[#E6CA85] font-semibold">
                  {frontDeskMetrics.occupancyRate}%
                </strong>
                <span className="text-[10px] text-[#ECE5D8]">
                  ({frontDeskMetrics.occupiedRooms}/{frontDeskMetrics.totalRooms})
                </span>
              </div>

              <div className="bg-[#2C2723] px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 text-xs">
                <span className="text-[#948A7D]">Shift Intake:</span>
                <strong className="text-emerald-400 font-semibold">
                  ₹{frontDeskMetrics.shiftRevenue.toLocaleString('en-IN')}
                </strong>
              </div>

              <button
                id="reception-refresh-data-btn"
                onClick={() => onRefreshData()}
                className="p-2 rounded-lg bg-[#947139]/20 hover:bg-[#947139]/40 text-[#E6CA85] border border-[#947139]/40 transition-colors cursor-pointer"
                title="Refresh Front Desk Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10 overflow-x-auto no-scrollbar">
            <button
              id="tab-btn-frontdesk"
              onClick={() => setActiveTab('frontdesk')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'frontdesk'
                  ? 'bg-[#947139] text-[#FAF8F5] shadow-xs'
                  : 'text-[#ECE5D8] hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Live Operations ({frontDeskMetrics.inHouseCount} In-House)
            </button>

            <button
              id="tab-btn-walkin"
              onClick={() => setActiveTab('walkin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'walkin'
                  ? 'bg-[#947139] text-[#FAF8F5] shadow-xs'
                  : 'text-[#ECE5D8] hover:text-white hover:bg-white/5'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              New Walk-In Check-In (Offline)
            </button>

            <button
              id="tab-btn-housekeeping"
              onClick={() => setActiveTab('housekeeping')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'housekeeping'
                  ? 'bg-[#947139] text-[#FAF8F5] shadow-xs'
                  : 'text-[#ECE5D8] hover:text-white hover:bg-white/5'
              }`}
            >
              <DoorClosed className="w-3.5 h-3.5" />
              Floor Rack (34 Rooms)
              {frontDeskMetrics.cleaningRooms > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              id="tab-btn-folios"
              onClick={() => setActiveTab('folios')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'folios'
                  ? 'bg-[#947139] text-[#FAF8F5] shadow-xs'
                  : 'text-[#ECE5D8] hover:text-white hover:bg-white/5'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Folios & Invoices
            </button>

            <button
              id="tab-btn-shift"
              onClick={() => setActiveTab('shift')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'shift'
                  ? 'bg-[#947139] text-[#FAF8F5] shadow-xs'
                  : 'text-[#ECE5D8] hover:text-white hover:bg-white/5'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Shift Cash Register
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Global Action Alerts */}
        {actionSuccess && (
          <div
            id="reception-success-alert"
            className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-3 shadow-xs animate-in fade-in"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex-1">{actionSuccess}</div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {actionError && (
          <div
            id="reception-error-alert"
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center gap-3 shadow-xs animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1">{actionError}</div>
            <button
              onClick={() => setActionError(null)}
              className="text-rose-600 hover:text-rose-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: LIVE FRONT DESK OPERATIONS (ARRIVALS / IN-HOUSE / DEPARTURES)     */}
        {/* ========================================================================= */}
        {activeTab === 'frontdesk' && (
          <div className="space-y-6">
            {/* Quick KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#ECE5D8] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#665E55] mb-1">
                  <span>Currently In-House</span>
                  <UserCheck className="w-4 h-4 text-[#947139]" />
                </div>
                <div className="text-2xl font-serif font-bold text-[#1C1916]">
                  {frontDeskMetrics.inHouseCount}
                </div>
                <div className="text-[11px] text-[#948A7D] mt-1">Active registered guests</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#ECE5D8] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#665E55] mb-1">
                  <span>Expected Arrivals</span>
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-serif font-bold text-blue-900">
                  {frontDeskMetrics.arrivalsCount}
                </div>
                <div className="text-[11px] text-[#948A7D] mt-1">Due for check-in today</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#ECE5D8] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#665E55] mb-1">
                  <span>Available Rooms</span>
                  <DoorClosed className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-serif font-bold text-emerald-800">
                  {frontDeskMetrics.availableRooms}
                </div>
                <div className="text-[11px] text-[#948A7D] mt-1">Clean & ready to sell</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#ECE5D8] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#665E55] mb-1">
                  <span>Housekeeping Queue</span>
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-serif font-bold text-amber-800">
                  {frontDeskMetrics.cleaningRooms}
                </div>
                <div className="text-[11px] text-[#948A7D] mt-1">Requires room cleaning</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-[#ECE5D8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-lg border border-[#ECE5D8] w-full sm:w-auto">
                <button
                  id="filter-btn-inhouse"
                  onClick={() => setFrontDeskFilter('inhouse')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    frontDeskFilter === 'inhouse'
                      ? 'bg-[#1C1916] text-[#FAF8F5] shadow-xs'
                      : 'text-[#665E55] hover:text-[#1C1916]'
                  }`}
                >
                  In-House Guests ({frontDeskMetrics.inHouseCount})
                </button>
                <button
                  id="filter-btn-arrivals"
                  onClick={() => setFrontDeskFilter('arrivals')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    frontDeskFilter === 'arrivals'
                      ? 'bg-[#1C1916] text-[#FAF8F5] shadow-xs'
                      : 'text-[#665E55] hover:text-[#1C1916]'
                  }`}
                >
                  Arrivals ({frontDeskMetrics.arrivalsCount})
                </button>
                <button
                  id="filter-btn-all"
                  onClick={() => setFrontDeskFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    frontDeskFilter === 'all'
                      ? 'bg-[#1C1916] text-[#FAF8F5] shadow-xs'
                      : 'text-[#665E55] hover:text-[#1C1916]'
                  }`}
                >
                  All Records ({bookings.length})
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#948A7D] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="frontdesk-search-input"
                  type="text"
                  placeholder="Search guest, room, or ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#ECE5D8] bg-[#FAF8F5] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#947139]/20"
                />
              </div>
            </div>

            {/* Bookings & Front Desk Table */}
            <div className="bg-white rounded-xl border border-[#ECE5D8] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] text-[#665E55] uppercase text-[10px] tracking-wider border-b border-[#ECE5D8]">
                    <tr>
                      <th className="py-3 px-4">Room & Key</th>
                      <th className="py-3 px-4">Guest Information</th>
                      <th className="py-3 px-4">Dates & Duration</th>
                      <th className="py-3 px-4">Folio & Total</th>
                      <th className="py-3 px-4">Status & Proof</th>
                      <th className="py-3 px-4 text-right">Front Desk Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE5D8]">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#948A7D]">
                          <UserCheck className="w-8 h-8 mx-auto mb-2 text-[#ECE5D8]" />
                          <p className="font-serif text-sm text-[#665E55]">No matching reservation records found</p>
                          <p className="text-[11px] text-[#948A7D] mt-1">
                            Click &ldquo;New Walk-In Check-In&rdquo; to register a guest at the counter.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => {
                        const folio = parseFolioItems(b);
                        const isCheckedIn = b.bookingStatus === 'checked_in';
                        const isConfirmed = b.bookingStatus === 'confirmed';
                        const isCheckedOut = b.bookingStatus === 'checked_out';

                        return (
                          <tr
                            key={b.id}
                            id={`frontdesk-row-${b.id}`}
                            className="hover:bg-[#FAF8F5]/80 transition-colors"
                          >
                            {/* Room & Key Card */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#ECE5D8] flex items-center justify-center font-bold text-xs text-[#1C1916]">
                                  {b.roomNumber || b.roomId}
                                </div>
                                <div>
                                  <div className="font-semibold text-[#1C1916] text-xs">
                                    {b.roomName || `Suite #${b.roomId}`}
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] text-[#7B5C28]">
                                    <KeyRound className="w-3 h-3" />
                                    <span>{b.keyCardNumber || 'Key Not Issued'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Guest Details */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-[#1C1916] flex items-center gap-1.5">
                                {b.guestName}
                                {b.isWalkIn && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#F6F1E7] text-[#7B5C28] border border-[#947139]/30">
                                    Walk-In
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#665E55] flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-[#948A7D]" />
                                <span>{b.guestPhone}</span>
                                {b.isOtpVerified && (
                                  <span
                                    title="OTP Verified"
                                    className="text-emerald-600 inline-flex items-center"
                                  >
                                    <ShieldCheck className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#948A7D] font-mono mt-0.5">
                                Ref: {b.bookingReference}
                              </div>
                            </td>

                            {/* Dates */}
                            <td className="py-3.5 px-4">
                              <div className="text-xs text-[#1C1916]">
                                <strong>{b.checkInDate}</strong> &rarr; <strong>{b.checkOutDate}</strong>
                              </div>
                              <div className="text-[11px] text-[#665E55]">
                                {b.totalNights} Night{b.totalNights > 1 ? 's' : ''} &bull; {b.guestsCount} Guest(s)
                              </div>
                            </td>

                            {/* Folio & Total */}
                            <td className="py-3.5 px-4">
                              <div className="text-xs font-bold text-[#1C1916]">
                                ₹{Number(b.totalAmount).toLocaleString('en-IN')}
                              </div>
                              <div className="text-[11px] text-[#665E55]">
                                {folio.length} itemized charge{folio.length > 1 ? 's' : ''}
                              </div>
                              <span className="inline-block mt-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                {b.paymentMethod || 'Paid'}
                              </span>
                            </td>

                            {/* Status & ID Proof */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                {isCheckedIn && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                                    In-House (Stayover)
                                  </span>
                                )}
                                {isConfirmed && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                    Expected Arrival
                                  </span>
                                )}
                                {isCheckedOut && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    Checked Out
                                  </span>
                                )}

                                {b.idProofType && (
                                  <div className="text-[10px] text-[#7B5C28]">
                                    ID: {b.idProofType} ({b.idProofNumber || 'On File'})
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Front Desk Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {/* If Confirmed: Express Check In */}
                                {isConfirmed && (
                                  <button
                                    id={`checkin-btn-${b.id}`}
                                    onClick={() =>
                                      setCheckInModal({
                                        isOpen: true,
                                        booking: b,
                                        keyCardNumber:
                                          b.keyCardNumber ||
                                          `KEY-${b.roomNumber || b.roomId}-A`,
                                        idProofType: b.idProofType || 'Aadhaar Card',
                                        idProofNumber: b.idProofNumber || '',
                                        isOtpVerified: Boolean(b.isOtpVerified),
                                      })
                                    }
                                    className="px-2.5 py-1 bg-[#1C1916] hover:bg-[#2C2723] text-white text-[11px] font-semibold rounded-md flex items-center gap-1 shadow-xs cursor-pointer"
                                  >
                                    <KeyRound className="w-3 h-3 text-[#E6CA85]" />
                                    Check In
                                  </button>
                                )}

                                {/* If In-House: Add Folio & Express Checkout */}
                                {isCheckedIn && (
                                  <>
                                    <button
                                      id={`add-charge-btn-${b.id}`}
                                      onClick={() =>
                                        setFolioModal({
                                          isOpen: true,
                                          booking: b,
                                          description: 'In-Room Fine Dining Order',
                                          category: 'Dining',
                                          amount: 1250,
                                        })
                                      }
                                      className="px-2 py-1 bg-[#FAF8F5] hover:bg-[#F6F1E7] border border-[#947139]/40 text-[#7B5C28] text-[11px] font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                                      title="Add dining, spa, or minibar charge"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add Charge
                                    </button>

                                    <button
                                      id={`checkout-btn-${b.id}`}
                                      onClick={() =>
                                        setCheckOutModal({
                                          isOpen: true,
                                          booking: b,
                                          settlementMethod: 'Cash at Counter',
                                        })
                                      }
                                      className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-semibold rounded-md flex items-center gap-1 shadow-xs cursor-pointer"
                                    >
                                      <DoorClosed className="w-3 h-3" />
                                      Check Out
                                    </button>
                                  </>
                                )}

                                {/* View / Print Folio */}
                                <button
                                  id={`view-folio-btn-${b.id}`}
                                  onClick={() => setInvoiceModal({ isOpen: true, booking: b })}
                                  className="p-1 text-[#665E55] hover:text-[#1C1916] hover:bg-[#FAF8F5] rounded border border-[#ECE5D8] cursor-pointer"
                                  title="View Itemized Folio Invoice"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: NEW WALK-IN REGISTRATION & INSTANT CHECK-IN (OFFLINE)              */}
        {/* ========================================================================= */}
        {activeTab === 'walkin' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-[#ECE5D8] shadow-sm overflow-hidden">
              {/* Form Banner */}
              <div className="bg-[#1C1916] p-6 text-[#FAF8F5] relative border-b border-[#947139]/30">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-[#947139]/30 border border-[#947139]/50 flex items-center justify-center text-[#E6CA85] text-xs font-bold font-serif">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-xs uppercase tracking-widest text-[#E6CA85] font-serif font-bold">
                    Front Desk Direct Walk-In
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                  Express Walk-In Guest Registration
                </h2>
                <p className="text-xs text-[#ECE5D8] mt-1 font-light">
                  Direct counter registration with instant OTP identity verification, room allocation, and key issuance.
                </p>
              </div>

              {/* Form Content */}
              <form onSubmit={handleWalkInSubmit} className="p-6 sm:p-8 space-y-8">
                {/* Section 1: Guest Identity */}
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#1C1916] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[#ECE5D8] pb-2">
                    <User className="w-4 h-4 text-[#947139]" />
                    1. Guest Identity & Contact Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#665E55] mb-1">
                        Full Guest Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="walkin-guest-name-input"
                        type="text"
                        required
                        placeholder="e.g. Vikramaditya Rathore"
                        value={walkInForm.guestName}
                        onChange={(e) => setWalkInForm({ ...walkInForm, guestName: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] focus:bg-white focus:border-[#947139] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#665E55] mb-1">
                        10-Digit Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#948A7D] font-mono font-bold">
                            +91
                          </span>
                          <input
                            id="walkin-guest-phone-input"
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="9876543210"
                            value={walkInForm.guestPhone}
                            onChange={(e) =>
                              setWalkInForm({
                                ...walkInForm,
                                guestPhone: e.target.value.replace(/\D/g, ''),
                              })
                            }
                            className="w-full pl-11 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] focus:bg-white focus:border-[#947139] focus:outline-hidden"
                          />
                        </div>

                        {/* Trigger OTP Button */}
                        <button
                          id="walkin-send-otp-btn"
                          type="button"
                          onClick={() => {
                            if (walkInForm.guestPhone.length < 10) {
                              setActionError('Please enter a full 10-digit mobile number before sending OTP.');
                              return;
                            }
                            setOtpPhoneTarget(walkInForm.guestPhone);
                            setOtpGuestNameTarget(walkInForm.guestName || 'Walk-In Guest');
                            setOtpModalOpen(true);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            otpVerifiedForWalkIn
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-[#947139] hover:bg-[#7B5C28] text-white'
                          }`}
                        >
                          {otpVerifiedForWalkIn ? (
                            <>
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span>OTP Verified</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-4 h-4" />
                              <span>Send & Verify OTP</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#665E55] mb-1">
                        Email Address (Optional for e-bill)
                      </label>
                      <input
                        id="walkin-guest-email-input"
                        type="email"
                        placeholder="guest@example.com"
                        value={walkInForm.guestEmail}
                        onChange={(e) => setWalkInForm({ ...walkInForm, guestEmail: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] focus:bg-white focus:border-[#947139] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#665E55] mb-1">
                        City / Home Address
                      </label>
                      <input
                        id="walkin-guest-address-input"
                        type="text"
                        placeholder="e.g. Jaipur, Rajasthan"
                        value={walkInForm.guestAddress}
                        onChange={(e) => setWalkInForm({ ...walkInForm, guestAddress: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] focus:bg-white focus:border-[#947139] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Government ID Verification */}
                <div>
                  <div className="flex items-center justify-between border-b border-[#ECE5D8] pb-2 mb-4">
                    <h3 className="text-sm font-serif font-bold text-[#1C1916] uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#947139]" />
                      2. Government ID Proof & Compliance
                    </h3>
                    <span className="text-[11px] font-semibold text-[#7B5C28] bg-[#F6F1E7] px-2.5 py-0.5 rounded-full border border-[#947139]/20">
                      {getIdConfig(walkInForm.idProofType).badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#665E55] mb-1">
                        Government ID Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="walkin-id-type-select"
                        value={walkInForm.idProofType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setWalkInForm({
                            ...walkInForm,
                            idProofType: newType,
                            idProofNumber: formatIdNumber(newType, walkInForm.idProofNumber),
                          });
                        }}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] focus:bg-white focus:border-[#947139] focus:outline-hidden"
                      >
                        <option value="Aadhaar Card">Aadhaar Card (UIDAI &bull; 12 Digits)</option>
                        <option value="Passport">Passport (Indian / Intl &bull; 8-9 Chars)</option>
                        <option value="PAN Card">PAN Card (Income Tax &bull; 10 Chars)</option>
                        <option value="Voter ID Card">Voter ID (Election Commission &bull; 10 Chars)</option>
                        <option value="Driving License">Indian Driving License (15-16 Chars)</option>
                      </select>
                      <p className="text-[10px] text-[#948A7D] mt-1">
                        {getIdConfig(walkInForm.idProofType).formatDescription}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-[#665E55]">
                          ID Document Number <span className="text-rose-500">*</span>
                        </label>
                        {walkInForm.idProofNumber && (
                          <span
                            className={`text-[10px] font-mono font-bold ${
                              validateIdNumber(walkInForm.idProofType, walkInForm.idProofNumber).isValid
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {validateIdNumber(walkInForm.idProofType, walkInForm.idProofNumber).rawValue.length} /{' '}
                            {getIdConfig(walkInForm.idProofType).rawMaxLength}{' '}
                            {walkInForm.idProofType === 'Aadhaar Card' ? 'digits' : 'chars'}
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          id="walkin-id-number-input"
                          type="text"
                          required
                          maxLength={getIdConfig(walkInForm.idProofType).inputMaxLength}
                          placeholder={getIdConfig(walkInForm.idProofType).placeholder}
                          value={walkInForm.idProofNumber}
                          onChange={(e) =>
                            setWalkInForm({
                              ...walkInForm,
                              idProofNumber: formatIdNumber(walkInForm.idProofType, e.target.value),
                            })
                          }
                          className={`w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border ${
                            walkInForm.idProofNumber
                              ? validateIdNumber(walkInForm.idProofType, walkInForm.idProofNumber).isValid
                                ? 'border-emerald-500 bg-emerald-50/20'
                                : 'border-amber-400 bg-amber-50/20'
                              : 'border-[#ECE5D8] bg-[#FAF8F5]'
                          } focus:bg-white focus:border-[#947139] focus:outline-hidden uppercase`}
                        />
                        {walkInForm.idProofNumber && validateIdNumber(walkInForm.idProofType, walkInForm.idProofNumber).isValid && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                      </div>

                      {walkInForm.idProofNumber && !validateIdNumber(walkInForm.idProofType, walkInForm.idProofNumber).isValid && (
                        <p className="text-[10px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                          {validateIdNumber(walkInForm.idProofType, walkInForm.idProofNumber).error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Room Selection & Stay Dates */}
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#1C1916] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[#ECE5D8] pb-2">
                    <DoorClosed className="w-4 h-4 text-[#947139]" />
                    3. Room Allocation & Stay Dates
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-[#665E55] mb-1">
                        Select Available Suite <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="walkin-room-select"
                        value={walkInForm.roomId}
                        onChange={(e) => setWalkInForm({ ...walkInForm, roomId: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] focus:bg-white focus:border-[#947139] focus:outline-hidden"
                      >
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            Suite #{room.roomNumber} - {room.name} ({room.category}) &bull; Floor {room.floor} &bull; ₹{room.pricePerNight.toLocaleString('en-IN')}/night ({room.status.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#665E55] mb-1">
                        Check-In Date
                      </label>
                      <input
                        id="walkin-checkin-date"
                        type="date"
                        value={walkInForm.checkInDate}
                        onChange={(e) => setWalkInForm({ ...walkInForm, checkInDate: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#665E55] mb-1">
                        Check-Out Date
                      </label>
                      <input
                        id="walkin-checkout-date"
                        type="date"
                        value={walkInForm.checkOutDate}
                        onChange={(e) => setWalkInForm({ ...walkInForm, checkOutDate: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#665E55] mb-1">
                        Guests Count
                      </label>
                      <input
                        id="walkin-guests-count"
                        type="number"
                        min={1}
                        max={6}
                        value={walkInForm.guestsCount}
                        onChange={(e) =>
                          setWalkInForm({ ...walkInForm, guestsCount: Number(e.target.value) })
                        }
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Room Highlight Card */}
                  {selectedWalkInRoom && (
                    <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#ECE5D8] flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono px-2 py-0.5 bg-[#1C1916] text-white rounded">
                            Suite #{selectedWalkInRoom.roomNumber}
                          </span>
                          <span className="text-xs font-semibold text-[#7B5C28]">
                            {selectedWalkInRoom.name}
                          </span>
                          <span className="text-[11px] text-[#948A7D]">
                            ({selectedWalkInRoom.bedType} &bull; {selectedWalkInRoom.viewType})
                          </span>
                        </div>
                        <p className="text-[11px] text-[#665E55] line-clamp-1">
                          {selectedWalkInRoom.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs text-[#948A7D]">Tariff per night</div>
                        <div className="text-lg font-serif font-bold text-[#1C1916]">
                          ₹{selectedWalkInRoom.pricePerNight.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 4: Counter Payment & Key Card Issuance */}
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#1C1916] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[#ECE5D8] pb-2">
                    <KeyRound className="w-4 h-4 text-[#947139]" />
                    4. Key Card Allocation & Counter Billing
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#665E55] mb-1">
                        Physical Key Card RFID / Number
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="walkin-key-card-input"
                          type="text"
                          placeholder={`KEY-${selectedWalkInRoom?.roomNumber || '101'}-A`}
                          value={walkInForm.keyCardNumber}
                          onChange={(e) => setWalkInForm({ ...walkInForm, keyCardNumber: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] focus:bg-white focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setWalkInForm({
                              ...walkInForm,
                              keyCardNumber: `KEY-${selectedWalkInRoom?.roomNumber || '101'}-${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`,
                            })
                          }
                          className="px-2.5 py-2 rounded-xl text-[11px] font-semibold bg-[#FAF8F5] hover:bg-[#F6F1E7] border border-[#ECE5D8] text-[#7B5C28] shrink-0 cursor-pointer"
                        >
                          Auto-Assign
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#665E55] mb-1">
                        Counter Settlement Method
                      </label>
                      <select
                        id="walkin-payment-method-select"
                        value={walkInForm.paymentMethod}
                        onChange={(e) => setWalkInForm({ ...walkInForm, paymentMethod: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] focus:bg-white focus:outline-hidden"
                      >
                        <option value="Cash at Counter">Cash at Counter</option>
                        <option value="POS Card Swipe">POS Card Swipe (Debit/Credit)</option>
                        <option value="Counter UPI QR Code">Counter UPI QR Code (GPay/PhonePe/Paytm)</option>
                        <option value="Direct Company Bill">Corporate / Direct Company Bill</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary Breakdown Box */}
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#947139]/30 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#665E55]">
                      <span>
                        Room Tariff ({calculatedNights} Night{calculatedNights > 1 ? 's' : ''} &times; ₹
                        {selectedWalkInRoom?.pricePerNight.toLocaleString('en-IN')})
                      </span>
                      <span className="font-semibold text-[#1C1916]">
                        ₹{walkInTotals.subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#665E55]">
                      <span>Luxury Heritage Taxes & GST (12%)</span>
                      <span className="font-semibold text-[#1C1916]">
                        ₹{walkInTotals.tax.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="border-t border-[#ECE5D8] pt-2 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#1C1916]">Total Amount Settled at Counter</div>
                        <div className="text-[10px] text-[#948A7D]">Immediate Check-In & Folio Active</div>
                      </div>
                      <div className="text-xl font-serif font-bold text-[#1C1916]">
                        ₹{walkInTotals.total.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  id="walkin-submit-checkin-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-[#1C1916] hover:bg-[#2C2723] text-[#FAF8F5] font-semibold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#947139]/40 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5 text-[#E6CA85]" />
                      <span>Complete Walk-In Check-In & Issue RFID Key</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: 34-ROOM HOUSEKEEPING & FLOOR RACK                                  */}
        {/* ========================================================================= */}
        {activeTab === 'housekeeping' && (
          <div className="space-y-6">
            {/* Status Legend */}
            <div className="bg-white p-4 rounded-xl border border-[#ECE5D8] shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 text-xs font-semibold flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  Available (Clean) &bull; {frontDeskMetrics.availableRooms}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  Occupied &bull; {frontDeskMetrics.occupiedRooms}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  Cleaning / Housekeeping &bull; {frontDeskMetrics.cleaningRooms}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  Maintenance &bull; {frontDeskMetrics.maintenanceRooms}
                </span>
              </div>

              <span className="text-[11px] text-[#948A7D]">
                Click status badge on any suite to update housekeeping status instantly.
              </span>
            </div>

            {/* Floors Visual Grid (1 to 5) */}
            {[1, 2, 3, 4, 5].map((floorNum) => {
              const floorRooms = rooms.filter((r) => r.floor === floorNum);
              if (floorRooms.length === 0) return null;

              return (
                <div key={floorNum} className="bg-white p-5 rounded-2xl border border-[#ECE5D8] shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#ECE5D8] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#1C1916] text-[#E6CA85] text-xs font-mono font-bold flex items-center justify-center">
                        F{floorNum}
                      </div>
                      <h3 className="font-serif font-bold text-sm text-[#1C1916]">
                        {floorNum === 1
                          ? 'Floor 1 &bull; Heritage Courtyard'
                          : floorNum === 2
                          ? 'Floor 2 &bull; Garden Terrace'
                          : floorNum === 3
                          ? 'Floor 3 &bull; Grand Panoramic Sea View'
                          : floorNum === 4
                          ? 'Floor 4 &bull; Executive Club'
                          : 'Floor 5 &bull; Imperial Royal Penthouse'}
                      </h3>
                    </div>
                    <span className="text-xs text-[#948A7D]">{floorRooms.length} Suites</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {floorRooms.map((room) => {
                      const isAvail = room.status === 'available';
                      const isOcc = room.status === 'occupied';
                      const isClean = room.status === 'cleaning';
                      const isMaint = room.status === 'maintenance';

                      return (
                        <div
                          key={room.id}
                          id={`rack-room-${room.roomNumber}`}
                          className={`p-3 rounded-xl border transition-all relative ${
                            isAvail
                              ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-500'
                              : isOcc
                              ? 'bg-rose-50/40 border-rose-300 hover:border-rose-500'
                              : isClean
                              ? 'bg-amber-50/60 border-amber-300 hover:border-amber-500'
                              : 'bg-slate-50 border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-xs text-[#1C1916]">
                              #{room.roomNumber}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isAvail
                                  ? 'bg-emerald-500'
                                  : isOcc
                                  ? 'bg-rose-500'
                                  : isClean
                                  ? 'bg-amber-500 animate-pulse'
                                  : 'bg-slate-400'
                              }`}
                            />
                          </div>

                          <div className="text-[11px] font-semibold text-[#1C1916] truncate">
                            {room.name}
                          </div>
                          <div className="text-[10px] text-[#948A7D] truncate mb-2">
                            {room.category} &bull; ₹{room.pricePerNight.toLocaleString('en-IN')}
                          </div>

                          {/* Quick Status Selector */}
                          <div className="mt-2 pt-2 border-t border-[#ECE5D8]/80">
                            <select
                              value={room.status}
                              onChange={(e) =>
                                handleUpdateRoomStatus(
                                  room.id,
                                  e.target.value as 'available' | 'occupied' | 'cleaning' | 'maintenance'
                                )
                              }
                              className={`w-full text-[10px] font-semibold rounded px-1.5 py-1 border transition-colors cursor-pointer ${
                                isAvail
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : isOcc
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : isClean
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-slate-200 text-slate-800 border-slate-300'
                              }`}
                            >
                              <option value="available">Available (Clean)</option>
                              <option value="occupied">Occupied</option>
                              <option value="cleaning">Needs Housekeeping</option>
                              <option value="maintenance">Maintenance</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: FOLIOS & INVOICE SEARCH                                            */}
        {/* ========================================================================= */}
        {activeTab === 'folios' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-[#ECE5D8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-serif font-bold text-[#1C1916]">
                  Guest Folios & Tax Invoices
                </h2>
                <p className="text-xs text-[#665E55]">
                  Search, review itemized charges, and print official hotel tax invoices.
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#948A7D] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#ECE5D8] bg-[#FAF8F5] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#947139]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((booking) => {
                const folio = parseFolioItems(booking);
                return (
                  <div
                    key={booking.id}
                    id={`folio-card-${booking.id}`}
                    className="bg-white p-5 rounded-2xl border border-[#ECE5D8] shadow-xs hover:border-[#947139]/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#FAF8F5] border border-[#ECE5D8] rounded text-[#7B5C28]">
                          {booking.bookingReference}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            booking.bookingStatus === 'checked_in'
                              ? 'bg-emerald-100 text-emerald-800'
                              : booking.bookingStatus === 'checked_out'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {booking.bookingStatus.toUpperCase()}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-sm text-[#1C1916] truncate">
                        {booking.guestName}
                      </h3>
                      <div className="text-xs text-[#665E55] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-[#948A7D]" />
                        <span>{booking.guestPhone}</span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#ECE5D8] text-xs space-y-1">
                        <div className="flex justify-between text-[#665E55]">
                          <span>Room Allocated:</span>
                          <strong className="text-[#1C1916]">
                            Suite #{booking.roomNumber || booking.roomId}
                          </strong>
                        </div>
                        <div className="flex justify-between text-[#665E55]">
                          <span>Stay Dates:</span>
                          <span>
                            {booking.checkInDate} to {booking.checkOutDate}
                          </span>
                        </div>
                        <div className="flex justify-between text-[#665E55]">
                          <span>Folio Items:</span>
                          <span>{folio.length} charges</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#ECE5D8] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[#948A7D]">Total Folio Amount</div>
                        <div className="text-base font-serif font-bold text-[#1C1916]">
                          ₹{Number(booking.totalAmount).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <button
                        onClick={() => setInvoiceModal({ isOpen: true, booking })}
                        className="px-3 py-1.5 bg-[#1C1916] hover:bg-[#2C2723] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Receipt className="w-3.5 h-3.5 text-[#E6CA85]" />
                        Print Folio
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SHIFT CASH REGISTER & COUNTER SETTLEMENTS                          */}
        {/* ========================================================================= */}
        {activeTab === 'shift' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[#ECE5D8] shadow-xs">
              <div className="flex items-center justify-between border-b border-[#ECE5D8] pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#1C1916]">
                    Front Desk Daily Shift Register
                  </h2>
                  <p className="text-xs text-[#665E55]">
                    Counter cash reconciliation, POS card batches, and transaction journal.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#948A7D]">Shift Date</span>
                  <div className="text-sm font-bold font-mono text-[#1C1916]">
                    {new Date().toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Shift Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#ECE5D8]">
                  <div className="text-xs text-[#665E55]">Total Front Desk Intake</div>
                  <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
                    ₹{frontDeskMetrics.shiftRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-[#948A7D] mt-0.5">
                    {bookings.filter((b) => b.paymentStatus === 'paid').length} transactions
                  </div>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#ECE5D8]">
                  <div className="text-xs text-[#665E55]">Active Keys in Circulation</div>
                  <div className="text-2xl font-serif font-bold text-[#1C1916] mt-1">
                    {frontDeskMetrics.inHouseCount} RFID Cards
                  </div>
                  <div className="text-[11px] text-[#948A7D] mt-0.5">Assigned to in-house suites</div>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#ECE5D8]">
                  <div className="text-xs text-[#665E55]">Housekeeping Queue</div>
                  <div className="text-2xl font-serif font-bold text-amber-700 mt-1">
                    {frontDeskMetrics.cleaningRooms} Suites
                  </div>
                  <div className="text-[11px] text-[#948A7D] mt-0.5">Pending room turnover</div>
                </div>
              </div>

              {/* Transactions List */}
              <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#665E55] mb-3">
                Shift Transactions Journal
              </h3>
              <div className="divide-y divide-[#ECE5D8] border border-[#ECE5D8] rounded-xl overflow-hidden">
                {bookings.slice(0, 8).map((b) => (
                  <div key={b.id} className="p-3.5 bg-white flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[#1C1916]">
                        {b.guestName} &bull; Suite #{b.roomNumber || b.roomId}
                      </div>
                      <div className="text-[11px] text-[#665E55]">
                        Txn: {b.transactionId || `TXN-${b.id}`} &bull; {b.paymentMethod}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-800">
                        +₹{Number(b.totalAmount).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-[#948A7D]">
                        {b.bookingStatus === 'checked_in' ? 'In-House' : 'Confirmed'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: EXPRESS CHECK-IN MODAL (KEY CARD ALLOCATION & OTP)              */}
      {/* ========================================================================= */}
      {checkInModal.isOpen && checkInModal.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1916]/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#ECE5D8] overflow-hidden">
            <div className="bg-[#1C1916] p-5 text-white flex items-center justify-between border-b border-[#947139]/30">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#E6CA85]" />
                <h3 className="font-serif font-bold text-lg">
                  Express Check-In &bull; Suite #{checkInModal.booking.roomNumber || checkInModal.booking.roomId}
                </h3>
              </div>
              <button
                onClick={() =>
                  setCheckInModal({
                    isOpen: false,
                    booking: null,
                    keyCardNumber: '',
                    idProofType: 'Aadhaar Card',
                    idProofNumber: '',
                    isOtpVerified: false,
                  })
                }
                className="text-[#ECE5D8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#ECE5D8] space-y-1">
                <div className="font-semibold text-sm text-[#1C1916]">
                  {checkInModal.booking.guestName}
                </div>
                <div className="text-[#665E55]">
                  Mobile: {checkInModal.booking.guestPhone} &bull; Booking Ref: {checkInModal.booking.bookingReference}
                </div>
                <div className="text-[#665E55]">
                  Dates: {checkInModal.booking.checkInDate} to {checkInModal.booking.checkOutDate} ({checkInModal.booking.totalNights} Nights)
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#665E55] mb-1">
                  Assign Key Card RFID / Number
                </label>
                <input
                  type="text"
                  value={checkInModal.keyCardNumber}
                  onChange={(e) =>
                    setCheckInModal({ ...checkInModal, keyCardNumber: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] font-mono font-bold text-sm"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#665E55]">Government ID Proof</span>
                  <span className="text-[10px] font-semibold text-[#7B5C28] bg-[#F6F1E7] px-2 py-0.5 rounded-full border border-[#947139]/20">
                    {getIdConfig(checkInModal.idProofType).badge}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#665E55] mb-1">ID Document Type</label>
                    <select
                      value={checkInModal.idProofType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setCheckInModal({
                          ...checkInModal,
                          idProofType: newType,
                          idProofNumber: formatIdNumber(newType, checkInModal.idProofNumber),
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="Aadhaar Card">Aadhaar Card (12 Digits)</option>
                      <option value="Passport">Passport (8-9 Chars)</option>
                      <option value="PAN Card">PAN Card (10 Chars)</option>
                      <option value="Voter ID Card">Voter ID (10 Chars)</option>
                      <option value="Driving License">Driving License (15-16 Chars)</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-[#665E55]">ID Document Number</label>
                      {checkInModal.idProofNumber && (
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            validateIdNumber(checkInModal.idProofType, checkInModal.idProofNumber).isValid
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {validateIdNumber(checkInModal.idProofType, checkInModal.idProofNumber).rawValue.length} /{' '}
                          {getIdConfig(checkInModal.idProofType).rawMaxLength}{' '}
                          {checkInModal.idProofType === 'Aadhaar Card' ? 'digits' : 'chars'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={getIdConfig(checkInModal.idProofType).inputMaxLength}
                        placeholder={getIdConfig(checkInModal.idProofType).placeholder}
                        value={checkInModal.idProofNumber}
                        onChange={(e) =>
                          setCheckInModal({
                            ...checkInModal,
                            idProofNumber: formatIdNumber(checkInModal.idProofType, e.target.value),
                          })
                        }
                        className={`w-full px-3 py-2 rounded-xl border ${
                          checkInModal.idProofNumber
                            ? validateIdNumber(checkInModal.idProofType, checkInModal.idProofNumber).isValid
                              ? 'border-emerald-500 bg-emerald-50/20'
                              : 'border-amber-400 bg-amber-50/20'
                            : 'border-[#ECE5D8] bg-[#FAF8F5]'
                        } font-mono font-bold text-xs uppercase focus:outline-hidden`}
                      />
                      {checkInModal.idProofNumber && validateIdNumber(checkInModal.idProofType, checkInModal.idProofNumber).isValid && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>
                </div>

                {checkInModal.idProofNumber && !validateIdNumber(checkInModal.idProofType, checkInModal.idProofNumber).isValid && (
                  <p className="text-[10px] text-amber-700 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                    {validateIdNumber(checkInModal.idProofType, checkInModal.idProofNumber).error}
                  </p>
                )}
              </div>

              {/* OTP Option */}
              <div className="pt-2 flex items-center justify-between bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                <span className="text-emerald-900 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Mobile OTP Verification Status
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOtpPhoneTarget(checkInModal.booking!.guestPhone);
                    setOtpGuestNameTarget(checkInModal.booking!.guestName);
                    setOtpModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  {checkInModal.isOtpVerified ? 'Verified ✓' : 'Verify Mobile OTP'}
                </button>
              </div>

              <div className="pt-4 border-t border-[#ECE5D8] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCheckInModal({
                      isOpen: false,
                      booking: null,
                      keyCardNumber: '',
                      idProofType: 'Aadhaar Card',
                      idProofNumber: '',
                      isOtpVerified: false,
                    })
                  }
                  className="px-4 py-2 rounded-xl border border-[#ECE5D8] text-[#665E55] hover:bg-[#FAF8F5] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCheckIn}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#1C1916] hover:bg-[#2C2723] text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 text-[#E6CA85]" />
                      <span>Confirm Check-In</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EXPRESS CHECK-OUT & ROOM RELEASE MODAL                           */}
      {/* ========================================================================= */}
      {checkOutModal.isOpen && checkOutModal.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1916]/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#ECE5D8] overflow-hidden">
            <div className="bg-rose-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DoorClosed className="w-5 h-5 text-rose-200" />
                <h3 className="font-serif font-bold text-lg">
                  Express Check-Out &bull; Suite #{checkOutModal.booking.roomNumber || checkOutModal.booking.roomId}
                </h3>
              </div>
              <button
                onClick={() => setCheckOutModal({ isOpen: false, booking: null, settlementMethod: 'Cash at Counter' })}
                className="text-rose-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#ECE5D8] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-[#1C1916]">
                    {checkOutModal.booking.guestName}
                  </span>
                  <span className="font-mono font-bold text-xs text-[#7B5C28]">
                    Key: {checkOutModal.booking.keyCardNumber || 'Returned'}
                  </span>
                </div>
                <div className="flex justify-between text-[#665E55] pt-2 border-t border-[#ECE5D8]">
                  <span>Total Final Folio Balance:</span>
                  <strong className="text-base font-serif font-bold text-[#1C1916]">
                    ₹{Number(checkOutModal.booking.totalAmount).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#665E55] mb-1">
                  Settlement & Receipt Method
                </label>
                <select
                  value={checkOutModal.settlementMethod}
                  onChange={(e) =>
                    setCheckOutModal({ ...checkOutModal, settlementMethod: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] font-semibold text-xs"
                >
                  <option value="Cash at Counter">Cash at Counter</option>
                  <option value="POS Card Swipe">POS Card Swipe</option>
                  <option value="Counter UPI QR Code">Counter UPI QR Code</option>
                  <option value="Corporate / Company Bill">Corporate / Company Bill</option>
                </select>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Confirming check-out will automatically return the key and mark Suite #
                  {checkOutModal.booking.roomNumber || checkOutModal.booking.roomId} as{' '}
                  <strong>&ldquo;Needs Housekeeping&rdquo;</strong> for room cleaning.
                </span>
              </div>

              <div className="pt-4 border-t border-[#ECE5D8] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCheckOutModal({ isOpen: false, booking: null, settlementMethod: 'Cash at Counter' })
                  }
                  className="px-4 py-2 rounded-xl border border-[#ECE5D8] text-[#665E55] hover:bg-[#FAF8F5] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCheckOut}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <DoorClosed className="w-4 h-4" />
                      <span>Settle & Check-Out</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD FOLIO CHARGE MODAL (DINING, SPA, MINIBAR, ETC)              */}
      {/* ========================================================================= */}
      {folioModal.isOpen && folioModal.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1916]/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#ECE5D8] overflow-hidden">
            <div className="bg-[#1C1916] p-5 text-white flex items-center justify-between border-b border-[#947139]/30">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#E6CA85]" />
                <h3 className="font-serif font-bold text-lg">
                  Add Incidental Folio Charge
                </h3>
              </div>
              <button
                onClick={() =>
                  setFolioModal({
                    isOpen: false,
                    booking: null,
                    description: 'In-Room Fine Dining Order',
                    category: 'Dining',
                    amount: 1250,
                  })
                }
                className="text-[#ECE5D8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFolioCharge} className="p-6 space-y-4 text-xs">
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#ECE5D8]">
                <div className="font-semibold text-[#1C1916]">
                  Guest: {folioModal.booking.guestName}
                </div>
                <div className="text-[#665E55]">
                  Suite #{folioModal.booking.roomNumber || folioModal.booking.roomId} &bull; Key:{' '}
                  {folioModal.booking.keyCardNumber || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#665E55] mb-1">
                  Charge Category
                </label>
                <select
                  value={folioModal.category}
                  onChange={(e) =>
                    setFolioModal({
                      ...folioModal,
                      category: e.target.value as any,
                      description:
                        e.target.value === 'Dining'
                          ? 'In-Room Fine Dining Order'
                          : e.target.value === 'Spa'
                          ? 'Imperial Ayurvedic Spa Treatment'
                          : e.target.value === 'Laundry'
                          ? 'Express Silk & Linen Laundry'
                          : e.target.value === 'Transport'
                          ? 'Airport Luxury Chauffeur Transfer'
                          : e.target.value === 'Minibar'
                          ? 'Suite Minibar & Artisan Refreshments'
                          : 'Incidental Service',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] font-semibold"
                >
                  <option value="Dining">Fine Dining & In-Room Service</option>
                  <option value="Spa">Imperial Ayurvedic Spa & Wellness</option>
                  <option value="Laundry">Express Laundry & Dry Cleaning</option>
                  <option value="Transport">Airport & City Chauffeur Cab</option>
                  <option value="Minibar">Minibar & Gourmet Snack Basket</option>
                  <option value="Other">Other Front Desk Charges</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#665E55] mb-1">
                  Item Description
                </label>
                <input
                  type="text"
                  required
                  value={folioModal.description}
                  onChange={(e) =>
                    setFolioModal({ ...folioModal, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ECE5D8] bg-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#665E55] mb-1">
                  Amount in INR (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={folioModal.amount}
                  onChange={(e) =>
                    setFolioModal({ ...folioModal, amount: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ECE5D8] bg-[#FAF8F5] font-mono font-bold text-sm"
                />
              </div>

              <div className="pt-4 border-t border-[#ECE5D8] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFolioModal({
                      isOpen: false,
                      booking: null,
                      description: 'In-Room Fine Dining Order',
                      category: 'Dining',
                      amount: 1250,
                    })
                  }
                  className="px-4 py-2 rounded-xl border border-[#ECE5D8] text-[#665E55] hover:bg-[#FAF8F5] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#1C1916] hover:bg-[#2C2723] text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-[#E6CA85]" />
                      <span>Add to Room Folio</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: OFFICIAL GUEST TAX INVOICE & FOLIO RECEIPT (PRINTABLE)           */}
      {/* ========================================================================= */}
      <InvoiceModal
        isOpen={invoiceModal.isOpen}
        booking={invoiceModal.booking}
        onClose={() => setInvoiceModal({ isOpen: false, booking: null })}
      />

      {/* ========================================================================= */}
      {/* OTP VERIFICATION MODAL COMPONENT (TRIGGERED ANYWHERE)                     */}
      {/* ========================================================================= */}
      <OtpVerificationModal
        isOpen={otpModalOpen}
        phone={otpPhoneTarget}
        guestName={otpGuestNameTarget}
        onClose={() => setOtpModalOpen(false)}
        onVerified={(phone) => {
          setOtpVerifiedForWalkIn(true);
          if (checkInModal.isOpen) {
            setCheckInModal((prev) => ({ ...prev, isOtpVerified: true }));
          }
          setActionSuccess(`Mobile number ${phone} successfully verified with OTP.`);
        }}
      />
    </div>
  );
};

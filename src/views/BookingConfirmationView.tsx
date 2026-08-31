import React, { useState, useEffect } from 'react';
import { Booking } from '../types.ts';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Printer,
  Calendar,
  BedDouble,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  QrCode,
  MapPin,
  Crown,
  Receipt,
} from 'lucide-react';
import { InvoiceModal } from '../components/InvoiceModal.tsx';

interface BookingConfirmationViewProps {
  booking: Booking;
  onViewMyBookings: () => void;
  onExploreMore: () => void;
}

export const BookingConfirmationView: React.FC<BookingConfirmationViewProps> = ({
  booking,
  onViewMyBookings,
  onExploreMore,
}) => {
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  // Fire celebratory confetti upon loading confirmation
  useEffect(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#966A28', '#DFCEAF', '#1C1917', '#7A5116'],
      });
    } catch (e) {
      console.warn('Confetti effect failed gracefully:', e);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Top Success Badge */}
      <div className="bg-white border border-[#E8E1D5] rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-[#FAF3E8] border border-[#DFCEAF] flex items-center justify-center mx-auto text-[#785116]">
          <CheckCircle2 className="w-10 h-10 text-[#966A28]" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#785116]">
            Reservation Confirmed & Secured
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold font-serif text-[#1C1917] tracking-tight">
            Namaste & Welcome, {booking.guestName}!
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7265] max-w-md mx-auto">
            Your luxury accommodation at The Grand Imperial Palace is reserved and confirmed.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <span className="bg-[#FAF7F2] px-4 py-2 rounded-xl text-xs font-mono border border-[#DFCEAF] text-[#1C1917]">
            Booking Ref: <strong className="text-[#785116]">{booking.bookingReference}</strong>
          </span>
          <span className="bg-[#FAF7F2] px-4 py-2 rounded-xl text-xs font-mono border border-[#DFCEAF] text-[#1C1917]">
            Transaction ID: <strong className="text-emerald-700">{booking.transactionId}</strong>
          </span>
        </div>
      </div>

      {/* Official Voucher / Receipt Container (Print-optimized) */}
      <div
        id="printable-voucher"
        className="bg-white border border-[#E8E1D5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative text-[#1C1917]"
      >
        {/* Voucher Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F2ECE1] pb-6 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7A5116] via-[#966A28] to-[#5C3C0E] flex items-center justify-center text-white shadow-md border border-[#DFCEAF]">
              <Crown className="w-6 h-6 text-[#FDF6EE]" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-[#1C1917]">THE GRAND IMPERIAL PALACE</h2>
              <p className="text-xs text-[#7A7265]">108 Heritage Bay Promenade, Colaba, Mumbai, Maharashtra</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block bg-[#FAF3E8] text-[#785116] border border-[#DFCEAF] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {booking.paymentStatus === 'paid' ? 'PAID IN FULL' : booking.paymentStatus}
            </span>
            <p className="text-[11px] text-[#8C8275] mt-1">
              Issued: {new Date(booking.createdAt).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        {/* Room & Stay Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8E1D5]">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-[#8C8275] uppercase tracking-wider font-semibold">Reserved Accommodation</p>
              <h3 className="text-base font-bold text-[#1C1917] font-serif">{booking.roomName || 'Palace Suite'}</h3>
              <p className="text-xs text-[#785116] font-medium">Suite #{booking.roomNumber || '101'} • {booking.roomCategory || 'Deluxe'}</p>
            </div>

            <div>
              <p className="text-[10px] text-[#8C8275] uppercase tracking-wider font-semibold">Primary Patron</p>
              <p className="text-xs font-semibold text-[#1C1917]">{booking.guestName}</p>
              <p className="text-[11px] text-[#7A7265]">{booking.guestEmail} • {booking.guestPhone}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-[#8C8275] uppercase tracking-wider font-semibold">Check-in Date</p>
                <p className="text-xs font-bold text-[#1C1917]">{booking.checkInDate}</p>
                <p className="text-[10px] text-[#8C8275]">From 14:00 PM</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8C8275] uppercase tracking-wider font-semibold">Check-out Date</p>
                <p className="text-xs font-bold text-[#1C1917]">{booking.checkOutDate}</p>
                <p className="text-[10px] text-[#8C8275]">Until 11:00 AM</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E8E1D5]">
              <div>
                <p className="text-[10px] text-[#8C8275] uppercase tracking-wider font-semibold">Duration</p>
                <p className="text-xs font-semibold text-[#1C1917]">{booking.totalNights} Nights</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8C8275] uppercase tracking-wider font-semibold">Occupancy</p>
                <p className="text-xs font-semibold text-[#1C1917]">{booking.guestsCount} Guests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Special Requests */}
        {booking.specialRequests && (
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E1D5] text-xs">
            <p className="text-[10px] text-[#8C8275] uppercase tracking-wider font-semibold">Palace Addons & Special Notes</p>
            <p className="text-[#5E564D] mt-0.5">{booking.specialRequests}</p>
          </div>
        )}

        {/* Itemized Billing Table in INR */}
        <div className="border-t border-[#F2ECE1] pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-[#5E564D]">
            <span>Suite Base Tariff (₹{booking.roomRatePerNight.toLocaleString('en-IN')} × {booking.totalNights} nights)</span>
            <span className="text-[#1C1917] font-semibold">₹{(booking.roomRatePerNight * booking.totalNights).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-[#5E564D]">
            <span>Sanitization & Linens Service</span>
            <span className="text-[#1C1917] font-semibold">₹{booking.cleaningFee.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-[#5E564D]">
            <span>Goods & Services Tax (GST) & Addon Charges</span>
            <span className="text-[#1C1917] font-semibold">₹{booking.taxesAndFees.toLocaleString('en-IN')}</span>
          </div>
          <div className="border-t border-[#E8E1D5] pt-3 flex justify-between items-baseline">
            <div>
              <span className="text-sm font-bold text-[#1C1917]">Total Amount Paid</span>
              <p className="text-[10px] text-[#8C8275]">
                Via {booking.paymentMethod} {booking.paymentCardLast4 ? `(ending ${booking.paymentCardLast4})` : ''}
              </p>
            </div>
            <span className="text-2xl font-bold font-serif text-[#785116]">₹{booking.totalAmount.toLocaleString('en-IN')} INR</span>
          </div>
        </div>

        {/* Simulated Barcode / QR Section */}
        <div className="pt-4 border-t border-[#F2ECE1] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-[#7A7265]">
          <div className="flex items-center gap-3">
            <QrCode className="w-10 h-10 text-[#1C1917] bg-[#FAF7F2] p-1 rounded-lg border border-[#DFCEAF]" />
            <div>
              <p className="font-mono text-[#1C1917] font-semibold">{booking.bookingReference}</p>
              <p className="text-[10px] text-[#8C8275]">Present this reference at the front desk upon arrival</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setInvoiceOpen(true)}
              className="px-4 py-2 bg-[#966A28] hover:bg-[#7A5116] text-[#FDF6EE] font-semibold text-xs rounded-xl flex items-center gap-1.5 border border-[#DFCEAF] transition-colors cursor-pointer uppercase tracking-wider shadow-2xs"
              title="View & Print Official GST Tax Invoice"
            >
              <Receipt className="w-4 h-4 text-[#FDF6EE]" />
              Official Tax Invoice
            </button>

            <button
              id="print-invoice-btn"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#1C1917] font-semibold text-xs rounded-xl flex items-center gap-1.5 border border-[#DFCEAF] transition-colors cursor-pointer uppercase tracking-wider"
            >
              <Printer className="w-4 h-4 text-[#966A28]" />
              Print Voucher
            </button>
          </div>
        </div>
      </div>

      {/* Official Tax Invoice Modal */}
      <InvoiceModal
        isOpen={invoiceOpen}
        booking={booking}
        onClose={() => setInvoiceOpen(false)}
      />

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onExploreMore}
          className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-[#FAF7F2] text-[#5E564D] font-semibold text-xs rounded-xl border border-[#DFCEAF] transition-colors shadow-xs uppercase tracking-wider cursor-pointer"
        >
          Explore More Accommodations
        </button>

        <button
          id="confirm-go-to-my-bookings-btn"
          onClick={onViewMyBookings}
          className="w-full sm:w-auto px-6 py-3 bg-[#966A28] hover:bg-[#7A5116] text-[#FDF6EE] font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider border border-[#DFCEAF]"
        >
          <span>View in My Reservations</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

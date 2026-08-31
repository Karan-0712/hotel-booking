import React from 'react';
import { Booking } from '../types.ts';
import { Printer, X, Receipt, CheckCircle2, ShieldCheck, Download, Calendar, Phone, Mail, MapPin } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  booking,
  onClose,
}) => {
  if (!isOpen || !booking) return null;

  // Parse itemized folio charges
  let folioItems: Array<{ id?: string; description: string; category?: string; amount: number; addedBy?: string }> = [];
  try {
    if (Array.isArray(booking.folioItems)) {
      folioItems = booking.folioItems;
    } else if (typeof booking.folioItems === 'string') {
      folioItems = JSON.parse(booking.folioItems);
    }
  } catch {
    folioItems = [];
  }

  // Calculate base tariff vs extras
  const totalAmount = Number(booking.totalAmount) || 0;
  const extrasTotal = folioItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const roomBaseTotal = Math.max(0, totalAmount - extrasTotal);
  const subtotalBeforeTax = Math.round(totalAmount / 1.12);
  const gstAmount = totalAmount - subtotalBeforeTax;
  const cgst = Math.round(gstAmount / 2);
  const sgst = gstAmount - cgst;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1916]/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-[#ECE5D8] overflow-hidden my-6">
        {/* Top Actions Bar (Hidden during printing) */}
        <div className="bg-[#1C1916] p-4 text-white flex items-center justify-between border-b border-[#947139]/30 no-print">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-[#E6CA65]" />
            <span className="font-serif font-bold text-sm">
              Official Hotel Tax Invoice &bull; {booking.bookingReference}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#947139] hover:bg-[#7B5C28] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#ECE5D8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="printable-tax-invoice" className="p-6 sm:p-10 space-y-6 text-[#1C1916] bg-white">
          {/* Hotel Letterhead */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-[#947139]/40 pb-6 gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#947139] font-serif">
                The Grand Imperial Heritage Palace
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1916] tracking-tight">
                Tax Folio & Bill of Supply
              </h1>
              <p className="text-xs text-[#665E55] mt-1.5 leading-relaxed">
                Apollo Bunder, Marine Drive, Mumbai, Maharashtra 400001, India
                <br />
                <span className="font-mono text-[11px] text-[#7B5C28]">
                  GSTIN: 27AAACG0489Q1Z4 &bull; SAC Code: 996311 (Hotel Accommodation)
                </span>
                <br />
                Concierge Desk: +91 (022) 6655 4321 &bull; Email: reservations@grandimperialpalace.in
              </p>
            </div>

            <div className="text-left sm:text-right bg-[#FAF8F5] sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#ECE5D8] w-full sm:w-auto">
              <div className="text-[10px] text-[#948A7D] uppercase tracking-wider font-semibold">Invoice Ref #</div>
              <div className="text-base font-bold font-mono text-[#1C1916]">
                {booking.bookingReference}
              </div>
              <div className="text-[10px] text-[#948A7D] uppercase tracking-wider font-semibold mt-2">
                Date of Issue
              </div>
              <div className="text-xs font-semibold text-[#1C1916]">
                {new Date().toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {booking.paymentStatus === 'paid' ? 'PAID IN FULL' : 'SETTLED AT COUNTER'}
              </div>
            </div>
          </div>

          {/* Guest & Room Details Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF8F5] p-5 rounded-2xl border border-[#ECE5D8]">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-[#948A7D] font-bold">
                Billed To (Primary Patron)
              </div>
              <div className="font-bold text-sm text-[#1C1916]">
                {booking.guestName}
              </div>
              <div className="text-[#665E55] flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-[#947139]" />
                <span>{booking.guestPhone}</span>
              </div>
              {booking.guestEmail && (
                <div className="text-[#665E55] flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-[#947139]" />
                  <span>{booking.guestEmail}</span>
                </div>
              )}
              {booking.idProofType && (
                <div className="text-[#7B5C28] font-mono text-[11px] pt-1">
                  ID Verification: {booking.idProofType} &bull; {booking.idProofNumber || 'Verified on Arrival'}
                </div>
              )}
            </div>

            <div className="space-y-1 sm:text-right">
              <div className="text-[10px] uppercase tracking-wider text-[#948A7D] font-bold">
                Stay & Room Allocation
              </div>
              <div className="font-bold text-sm text-[#1C1916]">
                Suite #{booking.roomNumber || booking.roomId} &bull; {booking.roomName || 'Luxury Palace Chamber'}
              </div>
              <div className="text-[#665E55]">
                {booking.roomCategory || 'Royal Heritage'} &bull; {booking.guestsCount} Registered Guests
              </div>
              <div className="text-[#665E55]">
                Arrival: <strong className="text-[#1C1916]">{booking.checkInDate}</strong> &bull; Departure: <strong className="text-[#1C1916]">{booking.checkOutDate}</strong>
              </div>
              <div className="text-[#7B5C28] font-mono text-[11px] pt-1">
                Duration: {booking.totalNights} Nights &bull; Key: {booking.keyCardNumber || 'KEY-PRIMARY'}
              </div>
            </div>
          </div>

          {/* Itemized Charges Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-[#ECE5D8] rounded-xl overflow-hidden">
              <thead className="bg-[#FAF8F5] text-[#665E55] uppercase text-[10px] tracking-wider border-b border-[#ECE5D8]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Service Particulars</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-right">SAC Code</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE5D8]">
                {/* Main Chamber Tariff */}
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#1C1916]">
                      {booking.roomName || 'Chamber Stay'} ({booking.totalNights} Nights)
                    </div>
                    <div className="text-[10px] text-[#948A7D]">
                      Nightly luxury tariff including palace amenities & Wi-Fi
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#665E55]">Accommodation</td>
                  <td className="py-3 px-4 text-right font-mono text-[#948A7D]">996311</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-[#1C1916]">
                    ₹{roomBaseTotal.toLocaleString('en-IN')}
                  </td>
                </tr>

                {/* Additional Folio Items */}
                {folioItems.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1C1916]">{item.description}</div>
                      {item.addedBy && (
                        <div className="text-[10px] text-[#948A7D]">Logged by: {item.addedBy}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#665E55]">{item.category || 'Incidental'}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#948A7D]">996331</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#1C1916]">
                      ₹{Number(item.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Total Settlement */}
          <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#ECE5D8] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1 text-xs">
              <div className="text-[#665E55]">
                Tax Breakdown (12% GST applicable on hospitality services):
              </div>
              <div className="font-mono text-[11px] text-[#7B5C28]">
                Taxable Base: ₹{subtotalBeforeTax.toLocaleString('en-IN')} &bull; CGST (6%): ₹{cgst.toLocaleString('en-IN')} &bull; SGST (6%): ₹{sgst.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-[#948A7D]">
                Payment Mode: <strong className="text-[#1C1916]">{booking.paymentMethod || 'Online Credit/Debit Card'}</strong> &bull; TXN: {booking.transactionId || 'TXN-LOCAL'}
              </div>
            </div>

            <div className="text-left sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#ECE5D8]">
              <span className="text-[10px] text-[#948A7D] uppercase tracking-wider font-bold">
                Net Folio Amount Settled
              </span>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1916] font-mono">
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">
                Including all applicable taxes
              </span>
            </div>
          </div>

          {/* Signatures & Palace Stamp */}
          <div className="pt-4 border-t border-[#ECE5D8] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs text-[#948A7D]">
            <div>
              <p className="italic">
                Thank you for choosing The Grand Imperial Heritage Palace. We look forward to your next royal visit.
              </p>
              <p className="text-[10px] text-[#BAAE9B] mt-1">
                Computer-generated tax folio. No physical signature required for electronic verification.
              </p>
            </div>

            <div className="text-center sm:text-right shrink-0">
              <div className="w-36 border-b border-[#1C1916] mb-1 mx-auto sm:ml-auto sm:mr-0" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#1C1916]">
                Front Office Manager / Cashier
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

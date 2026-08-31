export interface FolioItem {
  id: string;
  description: string;
  category: 'Room' | 'Dining' | 'Spa' | 'Laundry' | 'Transport' | 'Minibar' | 'Other';
  amount: number;
  timestamp: string;
  addedBy?: string;
}

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  name: string | null;
  role: 'guest' | 'admin' | 'receptionist';
  phone: string | null;
  address: string | null;
  country: string | null;
  avatar: string | null;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
  totalBookings?: number;
  totalSpent?: number;
}

export interface Room {
  id: number;
  roomNumber: string;
  name: string;
  category: 'Standard' | 'Deluxe' | 'Executive' | 'Suite';
  pricePerNight: number;
  discountPercent?: number;
  capacity: number;
  bedType: string;
  sizeSqFt: number;
  floor: number;
  viewType: string;
  description: string;
  amenities: string; // JSON string
  images: string; // JSON string
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  rating: string;
  reviewCount: number;
  featured: boolean;
  createdAt?: string;
  isAvailableForDates?: boolean;
}

export interface Booking {
  id: number;
  bookingReference: string;
  roomId: number;
  userId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  guestsCount: number;
  specialRequests?: string | null;
  roomRatePerNight: number;
  cleaningFee: number;
  taxesAndFees: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  paymentMethod: string;
  paymentCardLast4?: string | null;
  transactionId: string;
  bookingStatus: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  keyCardNumber?: string | null;
  idProofType?: string | null;
  idProofNumber?: string | null;
  isWalkIn?: boolean;
  isOtpVerified?: boolean;
  folioItems?: string | null; // JSON string of FolioItem[]
  createdAt: string;
  roomName?: string;
  roomNumber?: string;
  roomCategory?: string;
  roomImages?: string;
  bedType?: string;
}

export interface Review {
  id: number;
  roomId: number;
  userId: string;
  guestName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface HotelSettings {
  id?: number;
  hotelName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  checkInTime?: string;
  checkOutTime?: string;
  taxRatePercent?: number;
  currency?: string;
  cancellationPolicy?: string;
  announcementBanner?: string | null;
}

export interface AdminStats {
  totalRooms: number;
  availableRooms: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  totalUsers: number;
}

export interface AdminAnalytics {
  totalRooms: number;
  totalBookings: number;
  activeBookingsCount: number;
  completedBookingsCount: number;
  cancelledBookingsCount: number;
  totalRevenue: number;
  totalGuests: number;
  occupancyRate: number;
  categoryDistribution: Record<string, number>;
  recentBookings: Booking[];
}

export type ActiveView = 
  | 'home'
  | 'explore' 
  | 'services'
  | 'room_detail' 
  | 'checkout' 
  | 'confirmation' 
  | 'my_bookings' 
  | 'profile' 
  | 'admin'
  | 'reception';


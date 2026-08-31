import { Room, Booking, Review, HotelSettings, UserProfile } from '../types.ts';
import { INITIAL_ROOMS } from '../data/seedRooms.ts';

const STORAGE_KEYS = {
  ROOMS: 'grand_imperial_rooms_v1',
  BOOKINGS: 'grand_imperial_bookings_v1',
  REVIEWS: 'grand_imperial_reviews_v1',
  SETTINGS: 'grand_imperial_settings_v1',
  USERS: 'grand_imperial_users_v1',
};

// Initial default settings
export const DEFAULT_SETTINGS: HotelSettings = {
  hotelName: 'The Grand Imperial Heritage Palace & Luxury Suites',
  contactEmail: 'reservations@grandimperialpalace.in',
  contactPhone: '+91 (022) 6655 4321',
  address: 'Apollo Bunder, Marine Drive, Mumbai, Maharashtra 400001, India',
  checkInTime: '14:00',
  checkOutTime: '11:00',
  taxRatePercent: 12,
  cancellationPolicy: '100% Free cancellation up to 24 hours prior to check-in.',
  announcementBanner: '👑 Welcome to The Grand Imperial Palace — Experience Luxury Indian Hospitality in the Heart of Mumbai.',
};

// Helper: load from localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

// Helper: save to localStorage
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage save warning:', e);
  }
}

export class ClientStore {
  // Initialize rooms
  static getRooms(): Room[] {
    const stored = loadFromStorage<Room[]>(STORAGE_KEYS.ROOMS, []);
    if (!stored || stored.length === 0) {
      saveToStorage(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
      return INITIAL_ROOMS;
    }
    return stored;
  }

  static getRoomById(id: number): Room | undefined {
    const rooms = this.getRooms();
    return rooms.find((r) => r.id === id);
  }

  static saveRooms(rooms: Room[]): void {
    saveToStorage(STORAGE_KEYS.ROOMS, rooms);
  }

  static updateRoom(id: number, updates: Partial<Room>): Room | null {
    const rooms = this.getRooms();
    const index進 = rooms.findIndex((r) => r.id === id);
    if (index進 === -1) return null;
    rooms[index進] = { ...rooms[index進], ...updates };
    this.saveRooms(rooms);
    return rooms[index進];
  }

  static createRoom(newRoom: Omit<Room, 'id'>): Room {
    const rooms進 = this.getRooms();
    const newId = rooms進.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const created: Room = {
      ...newRoom,
      id: newId,
      status: newRoom.status || 'available',
      rating: newRoom.rating || '5.0',
      reviewCount: newRoom.reviewCount || 0,
      featured: newRoom.featured || false,
    };
    rooms進.push(created);
    this.saveRooms(rooms進);
    return created;
  }

  static deleteRoom(id: number): boolean {
    const rooms = this.getRooms();
    const filtered = rooms.filter((r) => r.id !== id);
    if (filtered.length === rooms.length) return false;
    this.saveRooms(filtered);
    return true;
  }

  // Bookings management
  static getBookings(): Booking[] {
    return loadFromStorage<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
  }

  static saveBookings(bookings: Booking[]): void {
    saveToStorage(STORAGE_KEYS.BOOKINGS, bookings);
  }

  static createBooking(data: Partial<Booking>): Booking {
    const bookings = this.getBookings();
    const room = this.getRoomById(Number(data.roomId));

    const refNumber = `GIP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newId = bookings.reduce((max, b) => Math.max(max, b.id), 0) + 1;

    const newBooking: Booking = {
      id: newId,
      bookingReference: refNumber,
      roomId: Number(data.roomId),
      userId: data.userId || 'guest_' + Math.random().toString(36).substring(2, 9),
      guestName: data.guestName || 'Valued Guest',
      guestEmail: data.guestEmail || '',
      guestPhone: data.guestPhone || '',
      checkInDate: data.checkInDate || new Date().toISOString().split('T')[0],
      checkOutDate: data.checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      totalNights: data.totalNights || 1,
      guestsCount: data.guestsCount || 2,
      specialRequests: data.specialRequests || '',
      roomRatePerNight: data.roomRatePerNight || room?.pricePerNight || 3500,
      cleaningFee: data.cleaningFee || 0,
      taxesAndFees: data.taxesAndFees || 0,
      totalAmount: data.totalAmount || (room?.pricePerNight || 3500) * 1.12,
      paymentStatus: data.paymentStatus || 'paid',
      paymentMethod: data.paymentMethod || 'Credit / Debit Card',
      paymentCardLast4: data.paymentCardLast4 || '4242',
      transactionId: `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      bookingStatus: 'confirmed',
      createdAt: new Date().toISOString(),
      roomName: room?.name,
      roomNumber: room?.roomNumber,
      roomCategory: room?.category,
      roomImages: room?.images,
      bedType: room?.bedType,
      isOtpVerified: true,
      keyCardNumber: null,
      folioItems: JSON.stringify([]),
    };

    bookings.unshift(newBooking);
    this.saveBookings(bookings);
    return newBooking;
  }

  static getBookingsByUser(userId?: string, email?: string): Booking[] {
    const bookings = this.getBookings();
    if (!userId && !email) return bookings;
    return bookings.filter((b) => (userId && b.userId === userId) || (email && b.guestEmail.toLowerCase() === email.toLowerCase()));
  }

  static updateBookingStatus(
    id: number,
    status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled',
    extras: Partial<Booking> = {}
  ): Booking | null {
    const bookings = this.getBookings();
    const index = bookings.findIndex((b) => b.id === id);
    if (index === -1) return null;

    bookings[index] = {
      ...bookings[index],
      bookingStatus: status,
      ...extras,
    };
    this.saveBookings(bookings);
    return bookings[index];
  }

  static processWalkIn(data: any): Booking {
    const bookings = this.getBookings();
    const room = this.getRoomById(Number(data.roomId));

    const refNumber = `GIP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newId = bookings.reduce((max, b) => Math.max(max, b.id), 0) + 1;

    const baseTariff = Number(data.roomRatePerNight || room?.pricePerNight || 3500) * Number(data.totalNights || 1);
    const tax = Number(data.taxesAndFees || Math.round(baseTariff * 0.12));
    const total = Number(data.totalAmount || baseTariff + tax);

    const initialFolio = [
      {
        id: 'base_tariff',
        description: `Room Tariff (${data.totalNights || 1} Night${(data.totalNights || 1) > 1 ? 's' : ''})`,
        category: 'Room',
        amount: baseTariff,
        timestamp: new Date().toISOString(),
        addedBy: 'Front Desk Walk-In',
      },
      {
        id: 'base_tax',
        description: 'Heritage Luxury GST & Service Fee (12%)',
        category: 'Other',
        amount: tax,
        timestamp: new Date().toISOString(),
        addedBy: 'Front Desk Walk-In',
      },
    ];

    const newBooking: Booking = {
      id: newId,
      bookingReference: refNumber,
      roomId: Number(data.roomId),
      userId: `walkin_${Date.now()}`,
      guestName: data.guestName,
      guestEmail: data.guestEmail || 'walkin@guest.in',
      guestPhone: data.guestPhone || '',
      guestAddress: data.guestAddress || '',
      idProofType: data.idProofType || 'Aadhaar Card',
      idProofNumber: data.idProofNumber || '',
      checkInDate: data.checkInDate || new Date().toISOString().split('T')[0],
      checkOutDate: data.checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      totalNights: Number(data.totalNights || 1),
      guestsCount: Number(data.guestsCount || 2),
      specialRequests: data.specialRequests || '',
      roomRatePerNight: Number(data.roomRatePerNight || room?.pricePerNight || 3500),
      cleaningFee: 0,
      taxesAndFees: tax,
      totalAmount: total,
      paymentStatus: 'paid',
      paymentMethod: data.paymentMethod || 'Cash at Counter',
      paymentCardLast4: data.paymentMethod?.includes('Card') ? '4242' : 'CASH',
      transactionId: `WALKIN-${Date.now().toString(36).toUpperCase()}`,
      bookingStatus: 'checked_in',
      createdAt: new Date().toISOString(),
      roomName: room?.name,
      roomNumber: room?.roomNumber,
      roomCategory: room?.category,
      roomImages: room?.images,
      bedType: room?.bedType,
      isOtpVerified: Boolean(data.isOtpVerified),
      keyCardNumber: data.keyCardNumber || `KEY-${room?.roomNumber || data.roomId}-A`,
      folioItems: JSON.stringify(initialFolio),
    };

    bookings.unshift(newBooking);
    this.saveBookings(bookings);

    if (room) {
      this.updateRoom(room.id, { status: 'occupied' });
    }

    return newBooking;
  }

  static addFolioItem(bookingId: number, item: { description: string; category: string; amount: number; addedBy?: string }): Booking | null {
    const bookings = this.getBookings();
    const index = bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) return null;

    const currentBooking = bookings[index];
    let folio: any[] = [];
    try {
      folio = currentBooking.folioItems ? JSON.parse(currentBooking.folioItems) : [];
    } catch {
      folio = [];
    }

    const newItem = {
      id: `folio_${Date.now()}`,
      description: item.description,
      category: item.category,
      amount: Number(item.amount),
      timestamp: new Date().toISOString(),
      addedBy: item.addedBy || 'Front Desk Concierge',
    };

    folio.push(newItem);
    const newTotal = Number(currentBooking.totalAmount) + Number(item.amount);

    bookings[index] = {
      ...currentBooking,
      folioItems: JSON.stringify(folio),
      totalAmount: newTotal,
    };

    this.saveBookings(bookings);
    return bookings[index];
  }

  // Settings
  static getSettings(): HotelSettings {
    return loadFromStorage<HotelSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  static updateSettings(updates: Partial<HotelSettings>): HotelSettings {
    const current = this.getSettings();
    const merged = { ...current, ...updates };
    saveToStorage(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  }

  // Reviews
  static getReviews(roomId?: number): Review[] {
    const all = loadFromStorage<Review[]>(STORAGE_KEYS.REVIEWS, [
      {
        id: 1,
        roomId: 1,
        userId: 'rev_1',
        guestName: 'Ananya Sharma',
        rating: 5,
        comment: 'Exquisite hospitality! The heritage decor and courteous butler service made our anniversary truly royal.',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 2,
        roomId: 1,
        userId: 'rev_2',
        guestName: 'Vikram Mehta',
        rating: 5,
        comment: 'Top-tier luxury right on Marine Drive. Spotless rooms, breathtaking views, and remarkable dining.',
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
    ]);
    if (roomId) {
      return all.filter((r) => r.roomId === roomId);
    }
    return all;
  }

  static createReview(data: Omit<Review, 'id' | 'createdAt'>): Review {
    const reviews = this.getReviews();
    const newId述 = reviews.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const review: Review = {
      ...data,
      id: newId述,
      createdAt: new Date().toISOString(),
    };
    reviews.unshift(review);
    saveToStorage(STORAGE_KEYS.REVIEWS, reviews);
    return review;
  }
}

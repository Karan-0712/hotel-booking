import { relations } from 'drizzle-orm';
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

// Users table (maps to Firebase Auth UID & guest/admin profiles)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or internal unique ID
  email: text('email').notNull(),
  password: text('password'), // Direct password hash or text for database authentication
  name: text('name'),
  role: text('role').notNull().default('guest'), // 'guest' | 'admin'
  phone: text('phone'),
  address: text('address'),
  country: text('country'),
  avatar: text('avatar'),
  loyaltyPoints: integer('loyalty_points').notNull().default(100),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Rooms table
export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  roomNumber: text('room_number').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'Standard', 'Deluxe', 'Executive', 'Suite'
  pricePerNight: integer('price_per_night').notNull(), // INR (₹)
  discountPercent: integer('discount_percent').notNull().default(0),
  capacity: integer('capacity').notNull().default(2),
  bedType: text('bed_type').notNull(), // '1 King Bed', '2 Queen Beds', '1 Queen Bed', etc.
  sizeSqFt: integer('size_sq_ft').notNull().default(450),
  floor: integer('floor').notNull().default(1),
  viewType: text('view_type').notNull().default('City View'), // 'Arabian Sea View', 'Palace Garden View', 'City View', etc.
  description: text('description').notNull(),
  amenities: text('amenities').notNull(), // JSON string array: ["WiFi", "Tea Bar", "Marble Bath", ...]
  images: text('images').notNull(), // JSON string array of image URLs
  status: text('status').notNull().default('available'), // 'available', 'occupied', 'maintenance'
  rating: text('rating').notNull().default('4.9'),
  reviewCount: integer('review_count').notNull().default(24),
  featured: boolean('featured').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Bookings table
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  bookingReference: text('booking_reference').notNull().unique(),
  roomId: integer('room_id')
    .references(() => rooms.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id').notNull(), // Firebase UID
  guestName: text('guest_name').notNull(),
  guestEmail: text('guest_email').notNull(),
  guestPhone: text('guest_phone').notNull(),
  checkInDate: text('check_in_date').notNull(), // YYYY-MM-DD
  checkOutDate: text('check_out_date').notNull(), // YYYY-MM-DD
  totalNights: integer('total_nights').notNull(),
  guestsCount: integer('guests_count').notNull().default(1),
  specialRequests: text('special_requests'),
  roomRatePerNight: integer('room_rate_per_night').notNull(),
  cleaningFee: integer('cleaning_fee').notNull().default(25),
  taxesAndFees: integer('taxes_and_fees').notNull().default(35),
  totalAmount: integer('total_amount').notNull(),
  paymentStatus: text('payment_status').notNull().default('paid'), // 'paid' | 'pending' | 'refunded'
  paymentMethod: text('payment_method').notNull().default('Credit Card (Simulated)'),
  paymentCardLast4: text('payment_card_last4').default('4242'),
  transactionId: text('transaction_id').notNull(),
  bookingStatus: text('booking_status').notNull().default('confirmed'), // 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Reviews table
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id')
    .references(() => rooms.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id').notNull(),
  guestName: text('guest_name').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Hotel settings and policies
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  hotelName: text('hotel_name').notNull().default('Grand Horizon Bay Resort & Luxury Suites'),
  contactEmail: text('contact_email').notNull().default('reservations@grandhorizon.com'),
  contactPhone: text('contact_phone').notNull().default('+1 (800) 555-0199'),
  address: text('address').notNull().default('742 Ocean Promenade, Bayfront Heights, CA 90210'),
  checkInTime: text('check_in_time').notNull().default('15:00'),
  checkOutTime: text('check_out_time').notNull().default('11:00'),
  taxRatePercent: integer('tax_rate_percent').notNull().default(12),
  cancellationPolicy: text('cancellation_policy').notNull().default('Free cancellation up to 48 hours prior to check-in.'),
  announcementBanner: text('announcement_banner').default('Special Summer Escapes: Enjoy up to 25% off luxury ocean-view suites with complimentary gourmet breakfast.'),
});

// Relations
export const roomsRelations = relations(rooms, ({ many }) => ({
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  room: one(rooms, {
    fields: [bookings.roomId],
    references: [rooms.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  room: one(rooms, {
    fields: [reviews.roomId],
    references: [rooms.id],
  }),
}));

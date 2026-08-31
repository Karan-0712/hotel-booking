import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, optionalAuth, requireAdmin, ADMIN_MASTER_CREDENTIALS, activeAdminTokens, activeUserSessions, AuthRequest, createLocalSessionToken } from './src/middleware/auth.ts';
import {
  seedDatabaseIfEmpty,
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getOrCreateUser,
  getUserProfile,
  updateUserProfile,
  getAllGuests,
  registerDbUser,
  authenticateDbUser,
  getUserByEmail,
  createBooking,
  getBookingsByUser,
  getAllBookings,
  getBookingByRef,
  updateBookingStatus,
  getReviewsByRoom,
  createReview,
  getSettings,
  updateSettings,
  getAdminAnalytics,
  createWalkInBooking,
  addFolioItemToBooking,
  checkInBookingWithKey,
  checkOutBookingAndRelease,
  updateRoomHousekeepingStatus,
  CATEGORY_ROOM_IMAGES,
} from './src/db/queries.ts';
import { issueOtp, verifyOtpCode } from './src/utils/otpService.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json());

  // Trigger database initial check and auto-seed if needed
  try {
    await seedDatabaseIfEmpty();
  } catch (err) {
    console.error('Initial database seeding check error:', err);
  }

  // ----------------------------------------------------
  // PUBLIC & GUEST API ROUTES
  // ----------------------------------------------------

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Hotel general settings & policies
  app.get('/api/settings', async (req, res) => {
    try {
      const data = await getSettings();
      res.json(data);
    } catch (error: any) {
      console.error('Failed to get settings:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch settings' });
    }
  });

  // Get all rooms with filtering
  app.get('/api/rooms', async (req, res) => {
    try {
      const { category, minPrice, maxPrice, capacity, search, checkIn, checkOut, status } = req.query;
      const rooms = await getAllRooms({
        category: category ? String(category) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        capacity: capacity ? Number(capacity) : undefined,
        search: search ? String(search) : undefined,
        checkIn: checkIn ? String(checkIn) : undefined,
        checkOut: checkOut ? String(checkOut) : undefined,
        status: status ? String(status) : undefined,
      });
      res.json(rooms);
    } catch (error: any) {
      console.error('Failed to fetch rooms:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch rooms' });
    }
  });

  // Get single room details
  app.get('/api/rooms/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid room id' });
      const room = await getRoomById(id);
      if (!room) return res.status(404).json({ error: 'Room not found' });
      res.json(room);
    } catch (error: any) {
      console.error('Failed to fetch room:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch room details' });
    }
  });

  // Get room reviews
  app.get('/api/reviews/:roomId', async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId, 10);
      if (isNaN(roomId)) return res.status(400).json({ error: 'Invalid room id' });
      const reviews = await getReviewsByRoom(roomId);
      res.json(reviews);
    } catch (error: any) {
      console.error('Failed to fetch reviews:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch reviews' });
    }
  });

  // Create review (auth required)
  app.post('/api/reviews', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { roomId, rating, comment } = req.body;
      if (!roomId || !rating || !comment) {
        return res.status(400).json({ error: 'Room ID, rating, and comment are required.' });
      }
      const review = await createReview({
        roomId: Number(roomId),
        userId: req.user!.uid,
        guestName: req.user!.name || req.user!.email?.split('@')[0] || 'Guest',
        rating: Number(rating),
        comment: String(comment).trim(),
      });
      res.status(201).json(review);
    } catch (error: any) {
      console.error('Failed to create review:', error);
      res.status(500).json({ error: error.message || 'Failed to submit review' });
    }
  });

  // ----------------------------------------------------
  // OTP PHONE & IDENTITY VERIFICATION SERVICE
  // ----------------------------------------------------

  // Dispatch 6-digit OTP code to phone number
  app.post('/api/otp/send', async (req, res) => {
    try {
      const { phone, purpose } = req.body;
      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required for OTP verification.' });
      }

      const cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
      }

      const otpResult = issueOtp(cleanPhone, purpose || 'identity_verification');
      res.json({
        success: true,
        message: otpResult.message,
        formattedPhone: otpResult.formattedPhone,
        expiresAt: otpResult.expiresAt,
        demoOtp: otpResult.code, // Returned for instant testing and simulated SMS banner
      });
    } catch (error: any) {
      console.error('OTP Send error:', error);
      res.status(500).json({ error: error.message || 'Failed to dispatch verification code.' });
    }
  });

  // Verify entered 6-digit OTP code
  app.post('/api/otp/verify', async (req, res) => {
    try {
      const { phone, otp, code } = req.body;
      const inputCode = String(otp || code || '').trim();

      if (!phone || !inputCode) {
        return res.status(400).json({ error: 'Both phone number and 6-digit OTP code are required.' });
      }

      const verifyResult = verifyOtpCode(phone, inputCode);
      if (!verifyResult.success) {
        return res.status(400).json({ error: verifyResult.error || 'Invalid or expired OTP code.' });
      }

      res.json({
        success: true,
        verified: true,
        phone: verifyResult.verifiedPhone,
        message: 'Phone identity verified successfully.',
      });
    } catch (error: any) {
      console.error('OTP Verify error:', error);
      res.status(500).json({ error: error.message || 'Verification failed.' });
    }
  });

  // ----------------------------------------------------
  // FRONT DESK RECEPTION PANEL (OFFLINE WALK-INS & GUEST FOLIOS)
  // ----------------------------------------------------

  // Reception walk-in instant booking & check-in
  app.post('/api/reception/walkin', async (req, res) => {
    try {
      const {
        roomId,
        guestName,
        guestPhone,
        guestEmail,
        guestAddress,
        idProofType,
        idProofNumber,
        checkInDate,
        checkOutDate,
        totalNights,
        guestsCount,
        specialRequests,
        roomRatePerNight,
        cleaningFee,
        taxesAndFees,
        totalAmount,
        paymentMethod,
        keyCardNumber,
        isOtpVerified,
      } = req.body;

      if (!roomId || !guestName || !guestPhone || !idProofType || !idProofNumber) {
        return res.status(400).json({
          error: 'Room selection, Guest Name, Mobile Number, and ID Proof details are required for walk-in registration.',
        });
      }

      const walkIn = await createWalkInBooking({
        roomId: Number(roomId),
        guestName: String(guestName).trim(),
        guestPhone: String(guestPhone).trim(),
        guestEmail: guestEmail ? String(guestEmail).trim() : undefined,
        guestAddress: guestAddress ? String(guestAddress).trim() : undefined,
        idProofType: String(idProofType),
        idProofNumber: String(idProofNumber).trim(),
        checkInDate: checkInDate || new Date().toISOString().split('T')[0],
        checkOutDate: checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        totalNights: Number(totalNights) || 1,
        guestsCount: Number(guestsCount) || 1,
        specialRequests: specialRequests ? String(specialRequests).trim() : undefined,
        roomRatePerNight: Number(roomRatePerNight) || 0,
        cleaningFee: Number(cleaningFee ?? 0),
        taxesAndFees: Number(taxesAndFees ?? 0),
        totalAmount: Number(totalAmount),
        paymentMethod: paymentMethod || 'Cash at Counter',
        keyCardNumber: keyCardNumber ? String(keyCardNumber).trim() : undefined,
        isOtpVerified: Boolean(isOtpVerified),
      });

      res.status(201).json({
        success: true,
        booking: walkIn,
        message: `Walk-in Guest ${walkIn.guestName} successfully checked into Suite #${walkIn.roomNumber || walkIn.roomId}. Room key issued: ${walkIn.keyCardNumber}`,
      });
    } catch (error: any) {
      console.error('Walk-in booking error:', error);
      res.status(400).json({ error: error.message || 'Failed to process walk-in check-in.' });
    }
  });

  // Front desk 1-click Express Check-In with Key Card allocation
  app.post('/api/reception/checkin', async (req, res) => {
    try {
      const { bookingId, keyCardNumber, idProofType, idProofNumber, isOtpVerified } = req.body;
      let bId = Number(bookingId);

      if (isNaN(bId) && typeof bookingId === 'string' && bookingId.trim()) {
        // Look up by reference
        const found = await getBookingByRef(bookingId.trim());
        if (found) {
          bId = found.id;
        }
      }

      if (isNaN(bId)) {
        return res.status(400).json({ error: 'Valid booking ID or reference is required.' });
      }

      const updated = await checkInBookingWithKey(
        bId,
        keyCardNumber,
        idProofType,
        idProofNumber,
        Boolean(isOtpVerified)
      );

      if (!updated) {
        return res.status(404).json({ error: 'Reservation record not found.' });
      }

      res.json({
        success: true,
        booking: updated,
        message: `Guest successfully checked in. Key card ${updated.keyCardNumber} activated.`,
      });
    } catch (error: any) {
      console.error('Check-in error:', error);
      res.status(500).json({ error: error.message || 'Failed to complete check-in.' });
    }
  });

  // Front desk Express Check-Out, Folio Settlement, & Room Release for Housekeeping
  app.post('/api/reception/checkout', async (req, res) => {
    try {
      const { bookingId, settlementMethod } = req.body;
      let bId = Number(bookingId);

      if (isNaN(bId) && typeof bookingId === 'string' && bookingId.trim()) {
        const found = await getBookingByRef(bookingId.trim());
        if (found) {
          bId = found.id;
        }
      }

      if (isNaN(bId)) {
        return res.status(400).json({ error: 'Valid booking ID or reference is required.' });
      }

      const updated = await checkOutBookingAndRelease(bId, settlementMethod || 'Settled at Counter');
      if (!updated) {
        return res.status(404).json({ error: 'Reservation record not found.' });
      }

      res.json({
        success: true,
        booking: updated,
        message: `Guest checked out successfully. Key returned and room marked for housekeeping.`,
      });
    } catch (error: any) {
      console.error('Check-out error:', error);
      res.status(500).json({ error: error.message || 'Failed to complete check-out.' });
    }
  });

  // Add folio incidental charges (Dining, Spa, Laundry, Taxi, Minibar)
  app.post('/api/reception/folio/add', async (req, res) => {
    try {
      const { bookingId, description, category, amount, addedBy } = req.body;
      const bId = Number(bookingId);
      if (isNaN(bId) || !description || !amount) {
        return res.status(400).json({ error: 'Booking ID, item description, and amount are required.' });
      }

      const result = await addFolioItemToBooking(bId, {
        description: String(description).trim(),
        category: category || 'Other',
        amount: Number(amount),
        addedBy: addedBy || 'Front Desk Staff',
      });

      if (!result.success) {
        return res.status(404).json({ error: result.error || 'Failed to add folio charge.' });
      }

      res.json(result);
    } catch (error: any) {
      console.error('Folio charge error:', error);
      res.status(500).json({ error: error.message || 'Failed to add charge to guest bill.' });
    }
  });

  // Front desk list all bookings (arrivals, departures, in-house, completed)
  app.get('/api/reception/bookings', async (req, res) => {
    try {
      const list = await getAllBookings();
      res.json(list);
    } catch (error: any) {
      console.error('Failed to get reception bookings:', error);
      res.status(500).json({ error: error.message || 'Failed to load front desk bookings' });
    }
  });

  // Front desk & Housekeeping live room status changer
  app.patch('/api/reception/rooms/:id/housekeeping', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      if (!status || !['available', 'occupied', 'cleaning', 'maintenance'].includes(status)) {
        return res.status(400).json({ error: 'Valid status is required (available, occupied, cleaning, maintenance).' });
      }

      const updated = await updateRoomHousekeepingStatus(id, status);
      res.json({ success: true, room: updated });
    } catch (error: any) {
      console.error('Housekeeping update error:', error);
      res.status(500).json({ error: error.message || 'Failed to update housekeeping status.' });
    }
  });

  // ----------------------------------------------------
  // AUTHENTICATION & USER PROFILE (DATABASE + FIREBASE)
  // ----------------------------------------------------

  // Register / Sign Up new guest account (saves directly to Cloud SQL)
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required for registration.' });
      }
      if (password.length < 5) {
        return res.status(400).json({ error: 'Password must be at least 5 characters long.' });
      }

      const user = await registerDbUser({ name, email, password, phone });
      
      const sessionData = {
        uid: user.uid,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        role: user.role || 'guest',
      };
      const sessionToken = createLocalSessionToken(sessionData);

      const isAdmin = user.role === 'admin' || user.email.toLowerCase() === 'admin@grandimperialpalace.in';
      if (isAdmin) {
        activeAdminTokens.add(sessionToken);
      }

      res.status(201).json({
        success: true,
        token: sessionToken,
        user: sessionData,
        profile: user,
        isAdmin,
        message: 'Account created successfully! Welcome to The Grand Imperial Palace.',
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      res.status(400).json({ error: error.message || 'Failed to create account.' });
    }
  });

  // Login with Email & Password (authenticated against Cloud SQL database)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const authResult = await authenticateDbUser(email, password);
      if (!authResult) {
        return res.status(401).json({ error: 'Invalid email or password. Please verify your credentials.' });
      }

      const { user, isAdmin } = authResult;
      const sessionData = {
        uid: user.uid,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        role: user.role || (isAdmin ? 'admin' : 'guest'),
      };
      const sessionToken = createLocalSessionToken(sessionData);

      if (isAdmin) {
        activeAdminTokens.add(sessionToken);
      }

      res.json({
        success: true,
        token: sessionToken,
        user: sessionData,
        profile: user,
        isAdmin,
        message: isAdmin ? 'Welcome back, Palace Administrator.' : 'Signed in successfully.',
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message || 'Authentication error' });
    }
  });

  // Logout current session
  app.post('/api/auth/logout', async (req, res) => {
    const token = (req.headers.authorization?.replace('Bearer ', '') || req.headers['x-admin-token'] || req.body?.token) as string;
    if (token) {
      activeUserSessions.delete(token);
      activeAdminTokens.delete(token);
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  // Verify current session
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const profile = await getUserProfile(req.user!.uid);
      const isAdm = req.isAdmin || req.user?.role === 'admin' || (req.user?.email && req.user.email.toLowerCase() === 'admin@grandimperialpalace.in');
      res.json({
        user: req.user,
        profile: profile || req.user,
        isAdmin: !!isAdm,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Sync / Register authenticated user
  app.post('/api/user/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { name, avatar, role } = req.body;
      const user = await getOrCreateUser({
        uid: req.user!.uid,
        email: req.user!.email || 'guest@example.com',
        name: name || req.user!.name || req.user!.email?.split('@')[0],
        avatar: avatar || req.user!.picture || '',
        role: role,
      });
      res.json(user);
    } catch (error: any) {
      console.error('Failed to sync user profile:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // Get current user profile
  app.get('/api/user/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getUserProfile(req.user!.uid);
      if (!user) {
        // Automatically sync if not found
        const newUser = await getOrCreateUser({
          uid: req.user!.uid,
          email: req.user!.email || 'guest@example.com',
          name: req.user!.name,
          avatar: req.user!.picture,
        });
        return res.json(newUser);
      }
      res.json(user);
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error);
      res.status(500).json({ error: error.message || 'Failed to get profile' });
    }
  });

  // Update user profile
  app.put('/api/user/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { name, phone, address, country, avatar, role } = req.body;
      const updated = await updateUserProfile(req.user!.uid, {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(country !== undefined && { country }),
        ...(avatar !== undefined && { avatar }),
        ...(role !== undefined && { role }),
      });
      res.json(updated);
    } catch (error: any) {
      console.error('Failed to update user profile:', error);
      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  });

  // ----------------------------------------------------
  // BOOKINGS & SIMULATED PAYMENTS
  // ----------------------------------------------------

  // Create booking with simulated checkout payment
  app.post('/api/bookings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        roomId,
        guestName,
        guestEmail,
        guestPhone,
        checkInDate,
        checkOutDate,
        checkIn,
        checkOut,
        totalNights,
        nights,
        guestsCount,
        guests,
        specialRequests,
        roomRatePerNight,
        cleaningFee,
        taxesAndFees,
        totalAmount,
        totalPrice,
        paymentMethod,
        paymentCardLast4,
      } = req.body;

      const finalRoomId = roomId ? Number(roomId) : null;
      const finalCheckIn = checkInDate || checkIn;
      const finalCheckOut = checkOutDate || checkOut;
      const finalTotalAmount = totalAmount !== undefined ? Number(totalAmount) : (totalPrice !== undefined ? Number(totalPrice) : null);

      if (!finalRoomId) {
        return res.status(400).json({ error: 'Missing room selection. Please reselect your preferred suite.' });
      }
      if (!finalCheckIn) {
        return res.status(400).json({ error: 'Missing check-in date for reservation.' });
      }
      if (!finalCheckOut) {
        return res.status(400).json({ error: 'Missing check-out date for reservation.' });
      }
      if (finalTotalAmount === null || isNaN(finalTotalAmount) || finalTotalAmount <= 0) {
        return res.status(400).json({ error: 'Invalid or missing total reservation amount.' });
      }

      const booking = await createBooking({
        roomId: finalRoomId,
        userId: req.user!.uid,
        guestName: (guestName || req.user!.name || 'Valued Patron').trim(),
        guestEmail: (guestEmail || req.user!.email || 'patron@example.com').trim(),
        guestPhone: (guestPhone || '+91 98200 12345').trim(),
        checkInDate: finalCheckIn,
        checkOutDate: finalCheckOut,
        totalNights: Number(totalNights || nights) || 1,
        guestsCount: Number(guestsCount || guests) || 1,
        specialRequests: specialRequests || '',
        roomRatePerNight: Number(roomRatePerNight) || 0,
        cleaningFee: Number(cleaningFee ?? 0),
        taxesAndFees: Number(taxesAndFees ?? 0),
        totalAmount: finalTotalAmount,
        paymentMethod: paymentMethod || 'Mobile Pay / Digital Express',
        paymentCardLast4: paymentCardLast4 || '8888',
      });

      res.status(201).json(booking);
    } catch (error: any) {
      console.error('Booking failed:', error);
      res.status(400).json({ error: error.message || 'Booking reservation could not be completed.' });
    }
  });

  // Get current logged-in user's bookings
  app.get('/api/bookings/my', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getBookingsByUser(req.user!.uid);
      res.json(list);
    } catch (error: any) {
      console.error('Failed to get user bookings:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch your bookings' });
    }
  });

  // Get booking details by reference (for receipts and invoices)
  app.get('/api/bookings/ref/:reference', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { reference } = req.params;
      const booking = await getBookingByRef(reference);
      if (!booking) return res.status(404).json({ error: 'Reservation not found.' });
      res.json(booking);
    } catch (error: any) {
      console.error('Failed to get booking by ref:', error);
      res.status(500).json({ error: error.message || 'Failed to retrieve booking' });
    }
  });

  // Cancel booking (Guest or Admin)
  app.post('/api/bookings/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { reason } = req.body;
      const updated = await updateBookingStatus(id, 'cancelled', reason || 'Cancelled by guest');
      res.json(updated);
    } catch (error: any) {
      console.error('Failed to cancel booking:', error);
      res.status(500).json({ error: error.message || 'Failed to cancel reservation' });
    }
  });

  // ----------------------------------------------------
  // ADMIN AUTHENTICATION & ACCESS CONTROL
  // ----------------------------------------------------

  // Admin login endpoint
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password, secretKey } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();
      const cleanKey = (secretKey || '').trim();

      const isValidKey = cleanKey && cleanKey === ADMIN_MASTER_CREDENTIALS.masterKey;
      const isValidEmailPass =
        cleanPass === ADMIN_MASTER_CREDENTIALS.password ||
        cleanPass === 'Admin@1234' ||
        cleanPass === 'admin' ||
        cleanPass === 'ImperialAdmin2026!';

      const isAllowedAdminUser =
        cleanEmail === ADMIN_MASTER_CREDENTIALS.email.toLowerCase() ||
        cleanEmail === 'davekaran2006@gmail.com' ||
        cleanEmail === 'admin' ||
        cleanEmail === 'admin@grandimperialpalace.in' ||
        cleanEmail === 'palacemanager';

      if (isValidKey || (isAllowedAdminUser && isValidEmailPass) || (cleanEmail && isValidKey)) {
        // Generate secure session token
        const adminSessionToken = createLocalSessionToken({
          uid: 'admin_master_uid',
          email: cleanEmail || ADMIN_MASTER_CREDENTIALS.email,
          name: 'Palace General Manager',
          role: 'admin',
        });
        activeAdminTokens.add(adminSessionToken);

        return res.json({
          success: true,
          token: adminSessionToken,
          user: {
            uid: 'admin_master_uid',
            email: cleanEmail || ADMIN_MASTER_CREDENTIALS.email,
            name: 'Palace General Manager',
            role: 'admin',
          },
          message: 'Palace Administrator access granted.',
        });
      }

      return res.status(401).json({
        error: 'Invalid administrator credentials or master key. Access denied.',
      });
    } catch (error: any) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: error.message || 'Authentication error' });
    }
  });

  // Admin logout
  app.post('/api/admin/logout', async (req, res) => {
    const adminToken = (req.headers['x-admin-token'] as string) || (req.body && req.body.token);
    if (adminToken) {
      activeAdminTokens.delete(adminToken);
    }
    res.json({ success: true, message: 'Logged out of admin session.' });
  });

  // Admin verify session
  app.get('/api/admin/verify', requireAdmin, async (req: AuthRequest, res) => {
    res.json({
      valid: true,
      role: 'admin',
      user: req.user,
    });
  });

  // ----------------------------------------------------
  // ADMIN SECURE ENDPOINTS
  // ----------------------------------------------------

  // Admin Analytics & Metrics
  app.get(['/api/admin/stats', '/api/admin/analytics'], requireAdmin, async (req: AuthRequest, res) => {
    try {
      const stats = await getAdminAnalytics();
      res.json(stats);
    } catch (error: any) {
      console.error('Failed to get admin analytics:', error);
      res.status(500).json({ error: error.message || 'Failed to load analytics' });
    }
  });

  // Admin list all bookings
  app.get('/api/admin/bookings', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const list = await getAllBookings();
      res.json(list);
    } catch (error: any) {
      console.error('Failed to get all bookings for admin:', error);
      res.status(500).json({ error: error.message || 'Failed to load bookings' });
    }
  });

  // Admin update booking status (e.g. check-in, check-out, confirmed, cancelled)
  app.put('/api/admin/bookings/:id/status', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, bookingStatus, reason } = req.body;
      const targetStatus = status || bookingStatus;
      if (!targetStatus) return res.status(400).json({ error: 'Status is required' });
      const updated = await updateBookingStatus(id, targetStatus, reason);
      res.json(updated);
    } catch (error: any) {
      console.error('Failed to update booking status:', error);
      res.status(500).json({ error: error.message || 'Failed to update status' });
    }
  });

  // Admin list all guests and their history
  app.get('/api/admin/guests', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const guests = await getAllGuests();
      res.json(guests);
    } catch (error: any) {
      console.error('Failed to get guests for admin:', error);
      res.status(500).json({ error: error.message || 'Failed to load guest list' });
    }
  });

  // Admin add new room (Direct DB creation)
  app.post('/api/admin/rooms', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const roomData = req.body;
      if (!roomData.roomNumber || !roomData.name || !roomData.pricePerNight) {
        return res.status(400).json({ error: 'Room number, room name, and tariff per night are required.' });
      }

      const roomNumberTrimmed = String(roomData.roomNumber).trim();

      // Check room number uniqueness
      const currentRooms = await getAllRooms();
      const duplicate = currentRooms.find(r => r.roomNumber.toLowerCase() === roomNumberTrimmed.toLowerCase());
      if (duplicate) {
        return res.status(400).json({ error: `A suite with Room Number "${roomNumberTrimmed}" already exists in the palace inventory.` });
      }

      const category = roomData.category || 'Deluxe';
      const categoryImg = CATEGORY_ROOM_IMAGES[category] || CATEGORY_ROOM_IMAGES.Standard;

      // Palace floor limit check (Max 5 floors)
      let floor = Number(roomData.floor || 1);
      if (floor < 1 || floor > 5) {
        return res.status(400).json({ error: 'Floor level must be between 1 and 5 (Palace architectural limit).' });
      }

      // Category sq ft limits check
      const sqFtLimits: Record<string, { min: number; max: number }> = {
        Standard: { min: 200, max: 800 },
        Deluxe: { min: 300, max: 1500 },
        Executive: { min: 400, max: 2200 },
        Suite: { min: 500, max: 4500 },
      };
      const limit = sqFtLimits[category] || sqFtLimits.Deluxe;
      let sizeSqFt = Number(roomData.sizeSqFt || 450);
      if (sizeSqFt < limit.min || sizeSqFt > limit.max) {
        return res.status(400).json({ error: `${category} room size must be between ${limit.min} and ${limit.max} sq ft.` });
      }

      const created = await createRoom({
        roomNumber: roomNumberTrimmed,
        name: String(roomData.name).trim(),
        category,
        pricePerNight: Number(roomData.pricePerNight),
        discountPercent: Number(roomData.discountPercent || 0),
        capacity: Number(roomData.capacity || 2),
        bedType: roomData.bedType || '1 King Bed',
        sizeSqFt,
        floor,
        viewType: roomData.viewType || 'City View',
        description: roomData.description || `Handcrafted ${category} accommodation offering bespoke luxury and personalized heritage hospitality.`,
        amenities: typeof roomData.amenities === 'string' ? roomData.amenities : JSON.stringify(roomData.amenities || ['Fiber Wi-Fi', '24/7 Butler Service', 'In-Room Safe']),
        images: JSON.stringify([categoryImg]),
        status: roomData.status || 'available',
        rating: '5.0',
        reviewCount: 0,
        featured: Boolean(roomData.featured),
      });
      res.status(201).json(created);
    } catch (error: any) {
      console.error('Failed to add room:', error);
      res.status(500).json({ error: error.message || 'Failed to create room in database' });
    }
  });

  // Admin update room (Direct DB edit)
  app.put('/api/admin/rooms/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updateData: any = { ...req.body };

      if (updateData.roomNumber !== undefined) {
        const roomNumberTrimmed = String(updateData.roomNumber).trim();
        const currentRooms = await getAllRooms();
        const duplicate = currentRooms.find(r => r.id !== id && r.roomNumber.toLowerCase() === roomNumberTrimmed.toLowerCase());
        if (duplicate) {
          return res.status(400).json({ error: `Room Number "${roomNumberTrimmed}" is already assigned to another suite.` });
        }
        updateData.roomNumber = roomNumberTrimmed;
      }
      
      if (updateData.pricePerNight !== undefined) updateData.pricePerNight = Number(updateData.pricePerNight);
      if (updateData.discountPercent !== undefined) updateData.discountPercent = Number(updateData.discountPercent);
      if (updateData.capacity !== undefined) updateData.capacity = Number(updateData.capacity);

      if (updateData.floor !== undefined) {
        const floor = Number(updateData.floor);
        if (floor < 1 || floor > 5) {
          return res.status(400).json({ error: 'Floor level must be between 1 and 5 (Palace architectural limit).' });
        }
        updateData.floor = floor;
      }

      if (updateData.sizeSqFt !== undefined) {
        const targetCategory = updateData.category || 'Deluxe';
        const sqFtLimits: Record<string, { min: number; max: number }> = {
          Standard: { min: 200, max: 800 },
          Deluxe: { min: 300, max: 1500 },
          Executive: { min: 400, max: 2200 },
          Suite: { min: 500, max: 4500 },
        };
        const limit = sqFtLimits[targetCategory] || sqFtLimits.Deluxe;
        const sizeSqFt = Number(updateData.sizeSqFt);
        if (sizeSqFt < limit.min || sizeSqFt > limit.max) {
          return res.status(400).json({ error: `${targetCategory} room size must be between ${limit.min} and ${limit.max} sq ft.` });
        }
        updateData.sizeSqFt = sizeSqFt;
      }

      if (updateData.featured !== undefined) updateData.featured = Boolean(updateData.featured);

      if (updateData.category) {
        const catImg = CATEGORY_ROOM_IMAGES[updateData.category] || CATEGORY_ROOM_IMAGES.Standard;
        updateData.images = JSON.stringify([catImg]);
      } else if (Array.isArray(updateData.images)) {
        updateData.images = JSON.stringify(updateData.images);
      }

      if (Array.isArray(updateData.amenities)) {
        updateData.amenities = JSON.stringify(updateData.amenities);
      }

      const updated = await updateRoom(id, updateData);
      if (!updated) {
        return res.status(404).json({ error: 'Room not found for update' });
      }
      res.json(updated);
    } catch (error: any) {
      console.error('Failed to update room in database:', error);
      res.status(500).json({ error: error.message || 'Failed to update room in database' });
    }
  });

  // Admin quick update room status
  app.patch('/api/admin/rooms/:id/status', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'Status is required' });

      const updated = await updateRoom(id, { status });
      res.json(updated);
    } catch (error: any) {
      console.error('Failed to update room status:', error);
      res.status(500).json({ error: error.message || 'Failed to update room status' });
    }
  });

  // Admin delete room (Direct DB removal with booking check)
  app.delete('/api/admin/rooms/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const allBookings = await getAllBookings();
      const activeForRoom = allBookings.filter(b => b.roomId === id && (b.bookingStatus === 'confirmed' || b.bookingStatus === 'checked_in'));
      if (activeForRoom.length > 0) {
        return res.status(400).json({
          error: `Cannot delete this suite because it has ${activeForRoom.length} active reservation(s). Please cancel or reassign those bookings first.`
        });
      }

      const deleted = await deleteRoom(id);
      res.json({ success: true, message: 'Room removed from Cloud SQL database.', deleted });
    } catch (error: any) {
      console.error('Failed to delete room from database:', error);
      res.status(500).json({ error: error.message || 'Failed to delete room' });
    }
  });

  // Admin update hotel settings (Direct DB update)
  app.put('/api/admin/settings', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const updated = await updateSettings(req.body);
      res.json(updated);
    } catch (error: any) {
      console.error('Failed to update settings in database:', error);
      res.status(500).json({ error: error.message || 'Failed to save settings' });
    }
  });

  // ----------------------------------------------------
  // VITE & STATIC FILES SERVING
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hotel Reservation System server running on http://localhost:${PORT}`);
  });
}

startServer();

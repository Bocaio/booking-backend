interface Total {
  totalBookings: number;
  activeUsers: number;
  totalBookedMinutes: number;
}

interface Booking {
  id: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface User {
  userId: string;
  name: string;
  roleName: string;
  bookingCount: number;
  bookedMinutes: number;
  bookings: Booking[];
}

export interface Summary {
  total: Total;
  users: User[];
}

export interface ISummaryService {
  get: () => Promise<Summary>;
}

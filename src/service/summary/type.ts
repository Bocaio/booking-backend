interface Total {
  total_bookings: number;
  active_users: number;
  total_booked_minutes: number;
}

interface Booking {
  id: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

export interface User {
  user_id: string;
  name: string;
  role_name: string;
  booking_count: number;
  booked_minutes: number;
  bookings: Booking[];
}

export interface Summary {
  total: Total;
  users: User[];
}

export interface ISummaryService {
  get: () => Promise<Summary>;
}

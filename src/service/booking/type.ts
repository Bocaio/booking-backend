import { Pagination } from "../../types/response.js";

export interface Booking {
  id: number;
  user_id: string;
  user_name: string;
  start_time: string;
  end_time: string;
}

export interface PaginatedBookings {
  data: Booking[];
  pagination: Pagination;
}

export interface IBookingService {
  getAll: (page: number, limit: number) => Promise<PaginatedBookings>;
  create: (
    user_id: string,
    start_time: string,
    end_time: string,
  ) => Promise<void>;
  delete: (
    user_id: string,
    booking_id: number,
    permission: string[],
  ) => Promise<void>;
}

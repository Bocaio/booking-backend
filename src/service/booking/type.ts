import { Pagination } from "../../types/response.js";

export interface Booking {
  id: number;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
}

export interface PaginatedBookings {
  data: Booking[];
  pagination: Pagination;
}

export interface IBookingService {
  getAll: (page: number, limit: number) => Promise<PaginatedBookings>;
  create: (
    userId: string,
    startTime: string,
    endTime: string,
  ) => Promise<void>;
  delete: (
    userId: string,
    bookingId: number,
    permission: string[],
  ) => Promise<void>;
}

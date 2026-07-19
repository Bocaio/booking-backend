import { IBookingRepository } from "../../repository/mysql/booking.js";
import { AppError } from "../../types/AppError.js";
import { ErrorMessage } from "../../constants/message.js";
import { IBookingService, PaginatedBookings } from "./type.js";
import { Permission } from "../../constants/permission.js";

export class BookingService implements IBookingService {
  private readonly bookingRepository: IBookingRepository;
  constructor(bookingRepository: IBookingRepository) {
    this.bookingRepository = bookingRepository;
  }
  getAll = async (page: number, limit: number): Promise<PaginatedBookings> => {
    const offset = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      this.bookingRepository.getPage(offset, limit),
      this.bookingRepository.count(),
    ]);

    return {
      data: bookings.map((booking) => ({
        id: booking.id,
        userId: booking.userId,
        userName: booking.userName,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  };

  create = async (
    userId: string,
    startTime: string,
    endTime: string,
  ): Promise<void> => {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (startDate.getTime() >= endDate.getTime()) {
      throw new AppError(400, ErrorMessage.INVALID_TIME_RANGE);
    }

    const overlaps = await this.bookingRepository.hasOverlap(
      startDate,
      endDate,
    );
    if (overlaps) {
      throw new AppError(409, ErrorMessage.BOOKING_TIME_CONFLICT);
    }

    await this.bookingRepository.create(userId, startDate, endDate);
  };

  delete = async (
    userId: string,
    bookingId: number,
    permission: string[],
  ): Promise<void> => {
    const booking = await this.bookingRepository.getById(bookingId);
    if (userId === booking?.userId) {
      await this.bookingRepository.delete(bookingId);
      return;
    }
    if (permission.includes(Permission.BOOKING_DELETE_ANY)) {
      await this.bookingRepository.delete(bookingId);
    } else {
      throw new AppError(403, ErrorMessage.FORBIDDEN);
    }
  };
}

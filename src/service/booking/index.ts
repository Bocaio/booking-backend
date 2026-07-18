import { IBookingRepository } from "../../repository/mysql/booking.js";
import { AppError } from "../../types/AppError.js";
import { ErrorMessage } from "../../constants/message.js";
import { Booking, IBookingService } from "./type.js";
import { requirePermission } from "../../middlewares/permission.js";
import { Permission } from "../../constants/permission.js";

export class BookingService implements IBookingService {
  private readonly bookingRepository: IBookingRepository;
  constructor(bookingRepository: IBookingRepository) {
    this.bookingRepository = bookingRepository;
  }
  getAll = async (): Promise<Booking[]> => {
    const bookings = await this.bookingRepository.getAll();
    return bookings.map((booking) => ({
      id: booking.id,
      user_id: booking.user_id,
      user_name: booking.user_name,
      start_time: booking.start_time.toISOString(),
      end_time: booking.end_time.toISOString(),
    }));
  };

  create = async (
    user_id: string,
    start_time: string,
    end_time: string,
  ): Promise<void> => {
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

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

    await this.bookingRepository.create(user_id, startDate, endDate);
  };

  delete = async (
    user_id: string,
    booking_id: number,
    permission: string[],
  ): Promise<void> => {
    const booking = await this.bookingRepository.getById(booking_id);
    if (user_id == booking?.user_id) {
      await this.bookingRepository.delete(booking_id);
      return;
    }
    if (permission.includes(Permission.BOOKING_DELETE_ANY)) {
      await this.bookingRepository.delete(booking_id);
    } else {
      throw new AppError(403, ErrorMessage.FORBIDDEN);
    }
  };
}

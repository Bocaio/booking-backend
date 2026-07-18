import { IBookingRepository } from "../../repository/mysql/booking.js";
import { IUserRepository } from "../../repository/mysql/user.js";
import { ISummaryService, Summary } from "./type.js";

export class SummaryService implements ISummaryService {
  private readonly userRepository: IUserRepository;
  private readonly bookingRepository: IBookingRepository;
  constructor(
    userRepository: IUserRepository,
    bookingRepository: IBookingRepository,
  ) {
    ((this.userRepository = userRepository),
      (this.bookingRepository = bookingRepository));
  }

  get = async (): Promise<Summary> => {
    const bookings = await this.bookingRepository.getAll();
    const users = await this.userRepository.getAll();
    const map = new Map(
      users
        .map((u) => ({
          user_id: u.id,
          name: u.name,
          role_name: u.role_name,
          booking_count: 0,
          booked_minutes: 0,
          bookings: [] as any[],
        }))
        .map((u) => [u.user_id, u]),
    );

    for (const booking of bookings) {
      const entry = map.get(booking.user_id);
      if (!entry) continue;
      const durationMinutes = Math.round(
        (new Date(booking.end_time).getTime() -
          new Date(booking.start_time).getTime()) /
          60000,
      );
      entry.bookings.push({
        id: booking.id,
        startTime: new Date(booking.start_time).toISOString(),
        endTime: new Date(booking.end_time).toISOString(),
        durationMinutes,
      });
      entry.booking_count += 1;
      entry.booked_minutes += durationMinutes;
    }

    const usersSummary = [...map.values()].sort(
      (a, b) => b.booking_count - a.booking_count,
    );

    return {
      total: {
        total_bookings: bookings.length,
        active_users: usersSummary.filter((user) => user.booking_count > 0)
          .length,
        total_booked_minutes: usersSummary.reduce(
          (a, c) => a + c.booked_minutes,
          0,
        ),
      },
      users: usersSummary,
    };
  };
}

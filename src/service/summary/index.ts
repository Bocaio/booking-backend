import { IBookingRepository } from "../../repository/mysql/booking.js";
import { IUserRepository } from "../../repository/mysql/user.js";
import { ISummaryService, Summary, User } from "./type.js";

export class SummaryService implements ISummaryService {
  private readonly userRepository: IUserRepository;
  private readonly bookingRepository: IBookingRepository;
  constructor(
    userRepository: IUserRepository,
    bookingRepository: IBookingRepository,
  ) {
    this.userRepository = userRepository;
    this.bookingRepository = bookingRepository;
  }

  get = async (): Promise<Summary> => {
    const bookings = await this.bookingRepository.getAll();
    const users = await this.userRepository.getAll();
    const map = new Map<string, User>(
      users
        .map<User>((u) => ({
          userId: u.id,
          name: u.name,
          roleName: u.roleName,
          bookingCount: 0,
          bookedMinutes: 0,
          bookings: [],
        }))
        .map((u) => [u.userId, u]),
    );

    const now = Date.now();
    let totalPastBookings = 0;
    let totalCurrentBookings = 0;
    let totalUpcomingBookings = 0;

    for (const booking of bookings) {
      const startMs = booking.startTime.getTime();
      const endMs = booking.endTime.getTime();
      if (endMs <= now) {
        totalPastBookings += 1;
      } else if (startMs <= now) {
        totalCurrentBookings += 1;
      } else {
        totalUpcomingBookings += 1;
      }

      const entry = map.get(booking.userId);
      if (!entry) continue;
      const durationMinutes = Math.round((endMs - startMs) / 60000);
      entry.bookings.push({
        id: booking.id,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        durationMinutes,
      });
      entry.bookingCount += 1;
      entry.bookedMinutes += durationMinutes;
    }

    const usersSummary = [...map.values()].sort(
      (a, b) => b.bookingCount - a.bookingCount,
    );

    return {
      total: {
        totalBookings: bookings.length,
        totalPastBookings,
        totalCurrentBookings,
        totalUpcomingBookings,
        activeUsers: usersSummary.filter((user) => user.bookingCount > 0)
          .length,
        totalBookedMinutes: usersSummary.reduce(
          (a, c) => a + c.bookedMinutes,
          0,
        ),
      },
      users: usersSummary,
    };
  };
}

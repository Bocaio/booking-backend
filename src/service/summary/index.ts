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

    for (const booking of bookings) {
      const entry = map.get(booking.userId);
      if (!entry) continue;
      const durationMinutes = Math.round(
        (new Date(booking.endTime).getTime() -
          new Date(booking.startTime).getTime()) /
          60000,
      );
      entry.bookings.push({
        id: booking.id,
        startTime: new Date(booking.startTime).toISOString(),
        endTime: new Date(booking.endTime).toISOString(),
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

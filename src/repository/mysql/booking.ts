import database from "../../config/database.js";
import { Booking } from "../../types/index.js";

export interface BookingWithUser {
  id: number;
  user_id: string;
  user_name: string;
  start_time: Date;
  end_time: Date;
  created_at: Date;
}

export interface IBookingRepository {
  create: (userId: string, startTime: Date, endTime: Date) => Promise<number>;
  delete: (id: number) => Promise<number>;
  getById: (id: number) => Promise<Booking | null>;
  getAll: () => Promise<BookingWithUser[]>;
  getPage: (offset: number, limit: number) => Promise<BookingWithUser[]>;
  count: () => Promise<number>;
  hasOverlap: (startTime: Date, endTime: Date) => Promise<boolean>;
}

class BookingRepository implements IBookingRepository {
  create = async (
    userId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<number> => {
    const result = await database
      .insertInto("bookings")
      .values({ user_id: userId, start_time: startTime, end_time: endTime })
      .executeTakeFirst();
    return Number(result.insertId);
  };

  delete = async (id: number): Promise<number> => {
    const result = await database
      .deleteFrom("bookings")
      .where("id", "=", id)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  };

  getById = async (id: number): Promise<Booking | null> => {
    const booking = await database
      .selectFrom("bookings")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return booking ?? null;
  };

  private baseListQuery() {
    return database
      .selectFrom("bookings")
      .innerJoin("users", "users.id", "bookings.user_id")
      .select([
        "bookings.id as id",
        "bookings.user_id as user_id",
        "users.name as user_name",
        "bookings.start_time as start_time",
        "bookings.end_time as end_time",
        "bookings.created_at as created_at",
      ])
      .orderBy("bookings.start_time", "asc");
  }

  getAll = async (): Promise<BookingWithUser[]> => {
    return this.baseListQuery().execute();
  };

  getPage = async (
    offset: number,
    limit: number,
  ): Promise<BookingWithUser[]> => {
    return this.baseListQuery().offset(offset).limit(limit).execute();
  };

  count = async (): Promise<number> => {
    const row = await database
      .selectFrom("bookings")
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .executeTakeFirst();
    return Number(row?.total ?? 0);
  };

  hasOverlap = async (startTime: Date, endTime: Date): Promise<boolean> => {
    const row = await database
      .selectFrom("bookings")
      .select("id")
      .where("start_time", "<", endTime)
      .where("end_time", ">", startTime)
      .limit(1)
      .executeTakeFirst();
    return row !== undefined;
  };
}

export { BookingRepository };

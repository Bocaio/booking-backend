import database from "../../config/database.js";

export interface Booking {
  id: number;
  userId: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
}

export interface BookingWithUser extends Booking {
  userName: string;
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
      .select([
        "id as id",
        "user_id as userId",
        "start_time as startTime",
        "end_time as endTime",
        "created_at as createdAt",
      ])
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
        "bookings.user_id as userId",
        "users.name as userName",
        "bookings.start_time as startTime",
        "bookings.end_time as endTime",
        "bookings.created_at as createdAt",
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

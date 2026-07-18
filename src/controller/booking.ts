import { SuccessMessage } from "../constants/message.js";
import { IBookingService } from "../service/booking/type.js";
import { UserPayload } from "../types/JwtPayload.js";
import { sendSuccess } from "../utils/helper.js";
import { Request, Response, NextFunction } from "express";

export class BookingController {
  private readonly bookingService: IBookingService;
  constructor(bookingService: IBookingService) {
    this.bookingService = bookingService;
  }
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.bookingService.getAll();
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  };
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user!;
      const { start_time, end_time } = req.body;
      await this.bookingService.create(userId, start_time, end_time);
      sendSuccess(res, {}, 201, { message: SuccessMessage.BOOKING_CREATED });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, permissions } = req.user!;
      const { id } = req.body;
      await this.bookingService.delete(userId, id, permissions as string[]);
      sendSuccess(res, {}, 204, { message: SuccessMessage.BOOKING_DELETED });
    } catch (err) {
      next(err);
    }
  };
}

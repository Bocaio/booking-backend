import z from "zod";
import { ValidateBody } from "../index.js";

const createBookingSchema = z.object({
  start_time: z.iso.datetime({ offset: true }),
  end_time: z.iso.datetime({ offset: true }),
});

const deleteBookingSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const validateCreateBooking = ValidateBody(createBookingSchema);
export const validateDeleteBooking = ValidateBody(deleteBookingSchema);

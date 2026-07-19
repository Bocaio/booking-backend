import z from "zod";
import { ValidateBody, ValidateQueryParams } from "../index.js";

const createBookingSchema = z.object({
  start_time: z.iso.datetime({ offset: true }),
  end_time: z.iso.datetime({ offset: true }),
});

const deleteBookingSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const getAllSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().catch(20),
});

export const validateCreateBooking = ValidateBody(createBookingSchema);
export const validateDeleteBooking = ValidateBody(deleteBookingSchema);
export const validateGetAllBooking = ValidateQueryParams(getAllSchema);

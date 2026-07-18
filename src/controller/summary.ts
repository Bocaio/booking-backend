import { Request, Response, NextFunction } from "express";
import { ISummaryService } from "../service/summary/type.js";
import { sendSuccess } from "../utils/helper.js";

export class SummaryController {
  private readonly summaryService: ISummaryService;

  constructor(summaryService: ISummaryService) {
    this.summaryService = summaryService;
  }

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.summaryService.get();
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  };
}

import { $log, MultipartFile, PlatformMulterFile, BodyParams } from "@tsed/common";
import { Post } from "@tsed/schema";
import { Controller, Inject } from  "@tsed/di";
import { SecurityReviewService } from "../services";
import { FileModel } from "../models/FileModel";
import { Authorize } from "@tsed/passport";
import * as fs from "fs";
import * as util from "util";
import {InternalServerError} from "@tsed/exceptions";

const readFile = util.promisify(fs.readFile);

@Controller("/review")
export class ReviewController {
  @Inject()
  private securityReviewService: SecurityReviewService;

  @Authorize('jwt')
  @Post("/upload")
  async uploadFiles(
    @BodyParams("context") context: string,
    @MultipartFile("files") files: PlatformMulterFile[]
  ) {
    const fileContents: FileModel[] = await Promise.all(files.map(async file => {
      const content = await readFile(file.path, "utf-8");
      const numberedContent = this.addLineNumbers(content);
      return { filename: file.originalname, content: numberedContent } as FileModel;
    }));

    const issues = await this.securityReviewService.reviewCode(context, fileContents);
    if (issues == undefined) {
      throw new InternalServerError("Internal Server Error");
    }

    $log.info("Response", issues);
    return { result: issues };
  }

  private addLineNumbers(content: string) {
    return content.split("\n").map((line, index) => `${index + 1}: ${line}`).join("\n");
  }
}


import { Property, Required } from "@tsed/schema";

export class FileModel {
  @Property()
  @Required()
  filename: string;

  @Property()
  @Required()
  content: string;
}

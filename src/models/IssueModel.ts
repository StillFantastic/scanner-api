import { Property, Required, Nullable } from "@tsed/schema";

export class IssueModel {
  @Property()
  @Required()
  filename: string;

  @Property()
  @Required()
  @Nullable(String)
  line_range: string | null;

  @Property()
  @Required()
  @Nullable(String)
  issue_title: string | null;

  @Property()
  @Required()
  @Nullable(String)
  issue_description: string | null;
}

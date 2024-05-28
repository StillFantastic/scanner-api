import { $log, Controller, Post, BodyParams } from "@tsed/common";
import { Inject } from '@tsed/di';
import { sign } from "jsonwebtoken";
import { Unauthorized } from "@tsed/exceptions";
import { UserService } from '../services';


@Controller("/auth")
export class AuthController {
  @Inject()
  private userService: UserService;

  @Post("/login")
  async login(@BodyParams("email") email: string, @BodyParams("password") password: string) {
    $log.info("IN");
    const user = await this.userService.findUserByEmail(email);
    $log.info("OUT");

    if (!user || user.password !== password) {
      throw new Unauthorized("Invalid email or password");
    }

    // TODO: use real secret
    const token = sign({ id: user.id, email: user.email }, "secret", { expiresIn: "1h" });

    return { token };
  }
}

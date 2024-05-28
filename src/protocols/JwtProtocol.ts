import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Req } from '@tsed/common';
import { Injectable, Inject } from '@tsed/di';
import { OnVerify, Protocol, Arg } from '@tsed/passport';
import { UserService } from "../services";

// TODO: use real secret
const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'secret',
};

@Injectable()
@Protocol<StrategyOptions>({
  name: 'jwt',
  useStrategy: JwtStrategy,
  settings: opts,
})
export class JwtProtocol implements OnVerify {
  @Inject()
  private userService: UserService;

  async $onVerify(@Req() req: Req, @Arg(0) jwtPayload: any) {
    const user = await this.userService.findUserById(jwtPayload.id);

    return user ? user : false;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/module/users/schemas/user.schema';
import { User } from 'src/module/users/schemas/user.schema';
import { FastifyRequest } from 'fastify';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: FastifyRequest) => {
          const accessToken = request.cookies?.['accessToken'];
          if (!accessToken) {
            return null;
          }
          return accessToken;
        },
      ]),
      secretOrKey: process.env.JWT_SECRET || 'secret',
      ignoreExpiration: false,
    });
  }
  /**
   * Validate the JWT payload and return the user.
   * @param payload The JWT payload containing user information.
   * @returns The user object if found, otherwise throws UnauthorizedException.
   */
  async validate(payload: JwtPayload): Promise<any> {
    const user = await this.userModel.findById(payload.sub).populate('role');
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}

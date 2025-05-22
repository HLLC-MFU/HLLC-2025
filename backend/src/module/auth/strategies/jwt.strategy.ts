import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/module/users/schemas/user.schema';
import { User } from 'src/module/users/schemas/user.schema';
import { JwtPayload } from '../types/jwt-payload.type';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'secret',
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    try {
      console.log('🔍 JWT Payload:', payload);

      const user = await this.userModel.findById(payload.sub)
        .select('-password -refreshToken')
        .populate('role')
        .lean();

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      console.log('✅ Found user:', user);

      return {
        ...payload,
        ...user,
        _id: user._id.toString(), // Ensure string for frontend safety
      };
    } catch (error) {
      console.error('❌ JWT Validation Error:', error);
      throw new UnauthorizedException('Invalid token or user not found');
    }
  }
}

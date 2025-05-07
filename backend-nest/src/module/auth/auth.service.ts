import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async validateUser(username: string, pass: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ username }).exec();
  
    if (!user) return null;
  
    const isMatch = await bcrypt.compare(pass, user.password);
    console.log(isMatch);
    if (!isMatch) return null;

    return user;
  }
  

  async login(user: UserDocument) {
    const payload = { sub: user._id, roleId: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

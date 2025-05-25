import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Query,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { PermissionsGuard } from './guards/permissions.guard';
import { LoginDto } from './dto/login.dto';
import { UserRequest } from 'src/pkg/types/users';
import { FastifyReply } from 'fastify';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Query('useCookie') useCookie: string, // ✅ อ่านจาก query
    @Res() res: FastifyReply,
  ) {
    const { username, password } = loginDto;
    const user = await this.authService.validateUser(username, password);

    const useCookieBool = useCookie === 'true'; // ✅ แปลงเป็น boolean
    const tokens = await this.authService.login(user, {
      useCookie: useCookieBool,
      response: res,
    });

    if (useCookieBool) {
      return res.send({ message: 'Login successful!', user });
    }

    return { tokens, user };
  }
  @Public()
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(PermissionsGuard)
  async logout(@Req() req: UserRequest) {
    return this.authService.logout(req.user._id);
  }
}

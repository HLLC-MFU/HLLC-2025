import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Query,
  Res,
  Get,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { PermissionsGuard } from './guards/permissions.guard';
import { LoginDto } from './dto/login.dto';
import { UserRequest } from 'src/pkg/types/users';
import { FastifyReply } from 'fastify';
import { Permissions } from './decorators/permissions.decorator';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';
import { RemovePasswordDto } from './dto/remove-password.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Query('useCookies') useCookie: string,
    @Res() res: FastifyReply,
  ) {
    const { username, password } = loginDto;
    const user = await this.authService.validateUser(username, password);

    const useCookieBool = useCookie === 'true';
    const tokens = await this.authService.login(user, {
      useCookie: useCookieBool,
      response: res,
    });

    if (useCookieBool) {
      return res.send({ message: 'Login successful!', user });
    }

    return res.send({ tokens, user });
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Public()
  @Get('student/status/:id')
  async check(@Param('id') id: string, @Res() res: FastifyReply) {
    const user = await this.authService.getRegisteredUser(id);
    if (!user) {
      return res.status(404).send({
        message: 'User not found. Please check your username and try again.',
      });
    }
    return res.send({ user });
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Permissions('auth:update')
  @Post('remove-password')
  async removePassword(@Body() removePasswordDto: RemovePasswordDto) {
    return this.authService.removePassword(removePasswordDto);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('logout')
  @UseGuards(PermissionsGuard)
  async logout(
    @Req() req: UserRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.authService.logout(req.user._id, res);
  }

  @Get('permissions')
  @Permissions('permissions:read')
  getAllPermissions() {
    return this.authService.scanPermissions();
  }
}

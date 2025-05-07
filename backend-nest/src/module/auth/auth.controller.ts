// src/module/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { PermissionsGuard } from './guards/permissions.guard';


@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @Post('login')
    async login(@Body() body: { username: string, password: string }) {
        const user = await this.authService.validateUser(body.username, body.password);
        return this.authService.login(user);
    }

    @Public()
    @Post('refresh')
    async refresh(@Body() body: { refreshToken: string }) {
        return this.authService.refreshToken(body.refreshToken);
    }

    @Post('logout')
    @UseGuards(PermissionsGuard)
    async logout(@Req() req) {
        return this.authService.logout(req.user._id);
    }
}

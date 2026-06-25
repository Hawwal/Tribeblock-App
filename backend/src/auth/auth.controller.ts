import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsString()
  @IsOptional()
  handle?: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

class OAuthProviderParam {
  @IsIn(['google', 'github'])
  provider: 'google' | 'github';
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('oauth/:provider/start')
  oauthStart(@Param() params: OAuthProviderParam) {
    return this.authService.getOAuthStart(params.provider);
  }

  @Get('oauth/:provider/callback')
  async oauthCallback(
    @Param() params: OAuthProviderParam,
    @Query('code') code: string | undefined,
    @Query('error') error: string | undefined,
    @Res() response: { redirect: (url: string) => void },
  ) {
    const frontendOrigin = this.authService.getFrontendOrigin();

    if (error) {
      return response.redirect(`${frontendOrigin}/auth/callback?error=${encodeURIComponent(error)}`);
    }

    const authResult = await this.authService.handleOAuthCallback(params.provider, code);
    const sessionPayload = Buffer.from(
      JSON.stringify({
        user: authResult.user,
        authHeader: {
          name: authResult.session.header,
          value: authResult.session.value,
        },
      }),
    ).toString('base64url');

    return response.redirect(`${frontendOrigin}/auth/callback#session=${sessionPayload}`);
  }
}

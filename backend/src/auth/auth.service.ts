import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { PrismaService } from '../prisma/prisma.service';

const scrypt = promisify(scryptCallback);

type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
  handle?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type OAuthProfile = {
  provider: 'google' | 'github';
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl?: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });

    if (existing) {
      throw new ConflictException('An account already exists for this email.');
    }

    const handle = input.handle ?? this.slugify(input.displayName);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        handle: await this.uniqueHandle(handle),
        passwordHash: await this.hashPassword(input.password),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        handle: true,
        role: true,
        preferredCurrency: true,
      },
    });

    return {
      user,
      session: {
        type: 'local-development-header',
        header: 'x-user-id',
        value: user.id,
      },
    };
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });

    if (!user || !(await this.verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        handle: user.handle,
        role: user.role,
        preferredCurrency: user.preferredCurrency,
      },
      session: {
        type: 'local-development-header',
        header: 'x-user-id',
        value: user.id,
      },
    };
  }

  getOAuthStart(provider: 'google' | 'github') {
    if (provider === 'google') {
      const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
      const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI');

      if (!clientId || !redirectUri) {
        return {
          configured: false,
          provider,
          message: 'Google OAuth is not configured yet. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI to backend/.env.',
        };
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
      });

      return {
        configured: true,
        provider,
        authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      };
    }

    const clientId = this.config.get<string>('GITHUB_CLIENT_ID');
    const redirectUri = this.config.get<string>('GITHUB_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      return {
        configured: false,
        provider,
        message: 'GitHub OAuth is not configured yet. Add GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_REDIRECT_URI to backend/.env.',
      };
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
    });

    return {
      configured: true,
      provider,
      authorizationUrl: `https://github.com/login/oauth/authorize?${params.toString()}`,
    };
  }

  getFrontendOrigin() {
    return this.config.get<string>('FRONTEND_ORIGIN') ?? 'http://127.0.0.1:5173';
  }

  async handleOAuthCallback(provider: 'google' | 'github', code?: string) {
    if (!code) {
      throw new BadRequestException('OAuth callback is missing an authorization code.');
    }

    const profile = provider === 'google' ? await this.fetchGoogleProfile(code) : await this.fetchGitHubProfile(code);

    const credential = await this.prisma.authCredential.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (credential) {
      const user = await this.prisma.user.update({
        where: { id: credential.userId },
        data: {
          displayName: credential.user.displayName || profile.displayName,
          avatarUrl: credential.user.avatarUrl ?? profile.avatarUrl,
          emailVerifiedAt: credential.user.emailVerifiedAt ?? (profile.emailVerified ? new Date() : null),
          role: this.roleForEmail(profile.email, credential.user.role),
        },
        select: this.userSelect(),
      });

      return this.sessionResponse(user);
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: profile.email } });

    if (existingUser) {
      const user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          avatarUrl: existingUser.avatarUrl ?? profile.avatarUrl,
          emailVerifiedAt: existingUser.emailVerifiedAt ?? (profile.emailVerified ? new Date() : null),
          role: this.roleForEmail(profile.email, existingUser.role),
          credentials: {
            create: {
              provider,
              providerAccountId: profile.providerAccountId,
            },
          },
        },
        select: this.userSelect(),
      });

      return this.sessionResponse(user);
    }

    const handleBase = this.slugify(profile.displayName || profile.email.split('@')[0]);
    const user = await this.prisma.user.create({
      data: {
        email: profile.email,
        displayName: profile.displayName || profile.email.split('@')[0],
        handle: await this.uniqueHandle(handleBase),
        avatarUrl: profile.avatarUrl,
        emailVerifiedAt: profile.emailVerified ? new Date() : null,
        role: this.roleForEmail(profile.email),
        credentials: {
          create: {
            provider,
            providerAccountId: profile.providerAccountId,
          },
        },
      },
      select: this.userSelect(),
    });

    return this.sessionResponse(user);
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 28);
  }

  private async uniqueHandle(baseHandle: string) {
    const root = baseHandle || 'student';
    let handle = root;
    let suffix = 0;

    while (await this.prisma.user.findUnique({ where: { handle } })) {
      suffix += 1;
      handle = `${root}-${suffix}`;
    }

    return handle;
  }

  private async fetchGoogleProfile(code: string): Promise<OAuthProfile> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Google OAuth is not configured.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code,
      }),
    });

    const tokenBody = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenBody.access_token) {
      throw new BadRequestException('Google OAuth token exchange failed.');
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenBody.access_token}` },
    });
    const profileBody = await profileResponse.json();

    if (!profileResponse.ok || !profileBody.sub || !profileBody.email) {
      throw new BadRequestException('Google OAuth profile lookup failed.');
    }

    return {
      provider: 'google',
      providerAccountId: profileBody.sub,
      email: profileBody.email,
      emailVerified: Boolean(profileBody.email_verified),
      displayName: profileBody.name || profileBody.email.split('@')[0],
      avatarUrl: profileBody.picture,
    };
  }

  private async fetchGitHubProfile(code: string): Promise<OAuthProfile> {
    const clientId = this.config.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.config.get<string>('GITHUB_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GITHUB_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('GitHub OAuth is not configured.');
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });
    const tokenBody = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenBody.access_token) {
      throw new BadRequestException('GitHub OAuth token exchange failed.');
    }

    const [profileResponse, emailsResponse] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${tokenBody.access_token}`,
        },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${tokenBody.access_token}`,
        },
      }),
    ]);
    const profileBody = await profileResponse.json();
    const emailsBody = await emailsResponse.json();

    if (!profileResponse.ok || !profileBody.id) {
      throw new BadRequestException('GitHub OAuth profile lookup failed.');
    }

    const emailRecord = Array.isArray(emailsBody)
      ? emailsBody.find((email) => email.primary && email.verified) ?? emailsBody.find((email) => email.verified)
      : null;
    const email = emailRecord?.email ?? profileBody.email;

    if (!email) {
      throw new BadRequestException('GitHub did not return a verified email address.');
    }

    return {
      provider: 'github',
      providerAccountId: String(profileBody.id),
      email,
      emailVerified: Boolean(emailRecord?.verified ?? profileBody.email),
      displayName: profileBody.name || profileBody.login || email.split('@')[0],
      avatarUrl: profileBody.avatar_url,
    };
  }

  private userSelect() {
    return {
      id: true,
      email: true,
      displayName: true,
      handle: true,
      role: true,
      preferredCurrency: true,
      avatarUrl: true,
      bio: true,
      isPublicProfile: true,
      emailVerifiedAt: true,
    };
  }

  private roleForEmail(email: string, existingRole: UserRole = UserRole.STUDENT) {
    if (existingRole === UserRole.ADMIN) {
      return existingRole;
    }

    const adminEmails = (this.config.get<string>('ADMIN_EMAILS') ?? '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    return adminEmails.includes(email.toLowerCase()) ? UserRole.ADMIN : existingRole;
  }

  private sessionResponse(user: {
    id: string;
    email: string;
    displayName: string;
    handle: string;
    role: string;
    preferredCurrency: string;
  }) {
    return {
      user,
      session: {
        type: 'local-development-header',
        header: 'x-user-id',
        value: user.id,
      },
    };
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return `scrypt:${salt}:${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(password: string, passwordHash: string | null) {
    if (!passwordHash) return false;

    if (passwordHash.startsWith('local-dev:')) {
      return passwordHash === `local-dev:${password}`;
    }

    const [algorithm, salt, hash] = passwordHash.split(':');

    if (algorithm !== 'scrypt' || !salt || !hash) {
      return false;
    }

    const expected = Buffer.from(hash, 'hex');
    const actual = (await scrypt(password, salt, 64)) as Buffer;

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}

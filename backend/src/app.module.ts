import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccessModule } from './access/access.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CertificatesModule } from './certificates/certificates.module';
import { ContributorsModule } from './contributors/contributors.module';
import { CoursesModule } from './courses/courses.module';
import { IdeModule } from './ide/ide.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UsersModule } from './users/users.module';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    AccessModule,
    SubscriptionsModule,
    PaymentsModule,
    ProgressModule,
    IdeModule,
    CertificatesModule,
    ContributorsModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

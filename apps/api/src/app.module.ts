import { Module, OnApplicationShutdown, Inject } from '@nestjs/common';
import type { Pool } from 'pg';
import { createDb, DB } from './db/db';
import { AuthController, AuthGuard } from './auth/auth';
import { ImageService } from './common/image.service';
import { ActivityLog, Revalidator } from './common/services';
import { BannersController, BenefitsController, CategoriesController, CollectionsController, SizeGuidesController, StoriesController } from './crud/resources';
import { ProductsController } from './products/products';
import { MediaController } from './media/media';
import { OrdersController } from './orders/orders';
import { SettingsController } from './settings/settings';
import { PublicController } from './public/public';
import { DashboardController } from './dashboard/dashboard';
import { UsersController } from './users/users';

const conn = createDb();

@Module({
  controllers: [
    AuthController, PublicController, OrdersController, ProductsController, MediaController, SettingsController, DashboardController, UsersController,
    CategoriesController, CollectionsController, StoriesController, BannersController, BenefitsController, SizeGuidesController,
  ],
  providers: [{ provide: DB, useValue: conn.db }, { provide: 'POOL', useValue: conn.pool }, AuthGuard, ImageService, Revalidator, ActivityLog],
})
export class AppModule implements OnApplicationShutdown {
  constructor(@Inject('POOL') private pool: Pool) {}
  async onApplicationShutdown() { await this.pool.end(); }
}

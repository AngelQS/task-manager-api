import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { TasksModule } from './tasks/tasks.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [SupabaseModule, HealthModule, TasksModule],
})
export class AppModule {}

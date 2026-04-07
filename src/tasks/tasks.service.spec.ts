import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { SupabaseService } from '../supabase/supabase.service';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';

const seedRow = {
  id: 1,
  title: 'First task',
  status: 'PENDING',
  priority: 'MEDIUM',
  category: null,
  scheduled_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function makeQueryBuilder(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, jest.Mock> = {};
  const chain = () => builder;

  builder.from     = jest.fn().mockReturnValue(builder);
  builder.select   = jest.fn().mockReturnValue(builder);
  builder.insert   = jest.fn().mockReturnValue(builder);
  builder.update   = jest.fn().mockReturnValue(builder);
  builder.delete   = jest.fn().mockReturnValue(builder);
  builder.eq       = jest.fn().mockReturnValue(builder);
  builder.order    = jest.fn().mockReturnValue(builder);
  builder.single   = jest.fn().mockResolvedValue(result);

  // order() resolves the query when no .single() follows
  builder.order = jest.fn().mockResolvedValue(result);

  return builder;
}

function mockSupabase(result: { data?: unknown; error?: unknown }) {
  const builder = makeQueryBuilder(result);
  return {
    provide: SupabaseService,
    useValue: { db: { from: jest.fn().mockReturnValue(builder) } },
  };
}

describe('TasksService', () => {
  describe('findAll', () => {
    it('returns mapped tasks', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [TasksService, mockSupabase({ data: [seedRow], error: null })],
      }).compile();

      const service = module.get<TasksService>(TasksService);
      const tasks = await service.findAll();

      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({ id: 1, title: 'First task', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM });
    });

    it('throws InternalServerErrorException on db error', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [TasksService, mockSupabase({ data: null, error: { message: 'db error' } })],
      }).compile();

      const service = module.get<TasksService>(TasksService);
      await expect(service.findAll()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('create', () => {
    it('creates and returns mapped task', async () => {
      const newRow = { ...seedRow, id: 2, title: 'New task' };
      const module: TestingModule = await Test.createTestingModule({
        providers: [TasksService, mockSupabase({ data: newRow, error: null })],
      }).compile();

      const service = module.get<TasksService>(TasksService);
      const task = await service.create({ title: 'New task' });

      expect(task).toMatchObject({ title: 'New task', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM });
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when row not found', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [TasksService, mockSupabase({ data: null, error: { code: 'PGRST116' } })],
      }).compile();

      const service = module.get<TasksService>(TasksService);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when row not found', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [TasksService, mockSupabase({ data: null, error: { code: 'PGRST116' } })],
      }).compile();

      const service = module.get<TasksService>(TasksService);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});

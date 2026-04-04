import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('findAll', () => {
    it('should return the seeded task list', () => {
      const tasks = service.findAll();
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual({ id: 1, title: 'First task', completed: false });
    });
  });

  describe('create', () => {
    it('should add a new task and return it', () => {
      const created = service.create({ title: 'New task' });
      expect(created).toMatchObject({ title: 'New task', completed: false });
      expect(typeof created.id).toBe('number');
      expect(service.findAll()).toHaveLength(2);
    });

    it('should assign incrementing ids', () => {
      const first = service.create({ title: 'A' });
      const second = service.create({ title: 'B' });
      expect(second.id).toBeGreaterThan(first.id);
    });
  });
});

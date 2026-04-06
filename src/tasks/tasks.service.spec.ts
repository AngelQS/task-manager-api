import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';
import { NotFoundException } from '@nestjs/common';

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
      expect(tasks[0]).toMatchObject({
        id: 1,
        title: 'First task',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
      });
    });
  });

  describe('create', () => {
    it('should add a new task with defaults and return it', () => {
      const created = service.create({ title: 'New task' });
      expect(created).toMatchObject({
        title: 'New task',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
      });
      expect(typeof created.id).toBe('number');
      expect(service.findAll()).toHaveLength(2);
    });

    it('should assign incrementing ids', () => {
      const first = service.create({ title: 'A' });
      const second = service.create({ title: 'B' });
      expect(second.id).toBeGreaterThan(first.id);
    });

    it('should respect provided status and priority', () => {
      const created = service.create({
        title: 'Urgent task',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        category: 'work',
      });
      expect(created.status).toBe(TaskStatus.IN_PROGRESS);
      expect(created.priority).toBe(TaskPriority.URGENT);
      expect(created.category).toBe('work');
    });
  });

  describe('update', () => {
    it('should update task fields', () => {
      const updated = service.update(1, { status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH });
      expect(updated.status).toBe(TaskStatus.COMPLETED);
      expect(updated.priority).toBe(TaskPriority.HIGH);
    });

    it('should throw NotFoundException for unknown id', () => {
      expect(() => service.update(999, { status: TaskStatus.COMPLETED })).toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should remove the task and return it', () => {
      const deleted = service.delete(1);
      expect(deleted.id).toBe(1);
      expect(service.findAll()).toHaveLength(0);
    });

    it('should throw NotFoundException for unknown id', () => {
      expect(() => service.delete(999)).toThrow(NotFoundException);
    });
  });
});

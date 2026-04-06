import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';

const seedTask = {
  id: 1,
  title: 'First task',
  status: TaskStatus.PENDING,
  priority: TaskPriority.MEDIUM,
  createdAt: new Date().toISOString(),
};

const mockTasksService = {
  findAll: jest.fn().mockReturnValue([seedTask]),
  create: jest.fn().mockImplementation((dto) => ({
    id: 2,
    title: dto.title,
    status: dto.status ?? TaskStatus.PENDING,
    priority: dto.priority ?? TaskPriority.MEDIUM,
    createdAt: new Date().toISOString(),
  })),
  update: jest.fn().mockImplementation((id, dto) => ({ ...seedTask, ...dto })),
  delete: jest.fn().mockReturnValue(seedTask),
};

describe('TasksController', () => {
  let controller: TasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  describe('GET /tasks', () => {
    it('should return an array of tasks', () => {
      const result = controller.findAll();
      expect(result).toEqual([seedTask]);
      expect(mockTasksService.findAll).toHaveBeenCalled();
    });
  });

  describe('POST /tasks', () => {
    it('should create and return a new task', () => {
      const dto = { title: 'New task' };
      const result = controller.create(dto);
      expect(result).toMatchObject({ title: 'New task', status: TaskStatus.PENDING });
      expect(mockTasksService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should update and return the task', () => {
      const dto = { status: TaskStatus.IN_PROGRESS };
      const result = controller.update('1', dto);
      expect(result).toMatchObject({ status: TaskStatus.IN_PROGRESS });
      expect(mockTasksService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete and return the task', () => {
      const result = controller.delete('1');
      expect(result).toEqual(seedTask);
      expect(mockTasksService.delete).toHaveBeenCalledWith(1);
    });
  });
});

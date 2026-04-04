import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

const mockTasksService = {
  findAll: jest.fn().mockReturnValue([{ id: 1, title: 'First task', completed: false }]),
  create: jest.fn().mockImplementation((dto) => ({ id: 2, title: dto.title, completed: false })),
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
      expect(result).toEqual([{ id: 1, title: 'First task', completed: false }]);
      expect(mockTasksService.findAll).toHaveBeenCalled();
    });
  });

  describe('POST /tasks', () => {
    it('should create and return a new task', () => {
      const dto = { title: 'New task' };
      const result = controller.create(dto);
      expect(result).toMatchObject({ title: 'New task', completed: false });
      expect(mockTasksService.create).toHaveBeenCalledWith(dto);
    });
  });
});

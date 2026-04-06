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
  findAll:  jest.fn().mockResolvedValue([seedTask]),
  findById: jest.fn().mockResolvedValue(seedTask),
  create:   jest.fn().mockImplementation((dto) =>
    Promise.resolve({ ...seedTask, id: 2, title: dto.title }),
  ),
  update:   jest.fn().mockImplementation((id, dto) =>
    Promise.resolve({ ...seedTask, ...dto }),
  ),
  delete:   jest.fn().mockResolvedValue(seedTask),
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

  it('GET /tasks returns array', async () => {
    expect(await controller.findAll()).toEqual([seedTask]);
  });

  it('POST /tasks creates task', async () => {
    const result = await controller.create({ title: 'New task' });
    expect(result).toMatchObject({ title: 'New task' });
  });

  it('PATCH /tasks/:id updates task', async () => {
    const result = await controller.update('1', { status: TaskStatus.IN_PROGRESS });
    expect(result).toMatchObject({ status: TaskStatus.IN_PROGRESS });
  });

  it('DELETE /tasks/:id deletes task', async () => {
    expect(await controller.delete('1')).toEqual(seedTask);
  });
});

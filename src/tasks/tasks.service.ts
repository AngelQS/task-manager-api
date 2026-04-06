import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindTaskByIdDto } from './dto/find-task-by-id.dto';
import { DeleteTaskByIdDto } from './dto/delete-task-by-id.dto';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  scheduledAt?: string;
  createdAt: string;
}

@Injectable()
export class TasksService {
  private tasks: Task[] = [
    {
      id: 1,
      title: 'First task',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      createdAt: new Date().toISOString(),
    },
  ];
  private nextId = 2;

  findAll(): Task[] {
    return this.tasks;
  }

  findById(id: number): Task {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  create(dto: CreateTaskDto): Task {
    const task: Task = {
      id: this.nextId++,
      title: dto.title,
      status: dto.status ?? TaskStatus.PENDING,
      priority: dto.priority ?? TaskPriority.MEDIUM,
      category: dto.category,
      scheduledAt: dto.scheduledAt,
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    return task;
  }

  update(id: number, dto: UpdateTaskDto): Task {
    const task = this.findById(id);
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.category !== undefined) task.category = dto.category;
    if (dto.scheduledAt !== undefined) task.scheduledAt = dto.scheduledAt;
    return task;
  }

  delete(id: number): Task {
    const task = this.findById(id);
    this.tasks = this.tasks.filter((t) => t.id !== id);
    return task;
  }
}

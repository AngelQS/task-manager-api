import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindTaskByIdDto } from './dto/find-task-by-id.dto';

export interface Task {
  id: number;
  title: string;
  completed: boolean;
}

@Injectable()
export class TasksService {
  private tasks: Task[] = [{ id: 1, title: 'First task', completed: false }];
  private nextId = 2;

  findAll(): Task[] {
    return this.tasks;
  }

  findById(dto: FindTaskByIdDto): Task | undefined {
    const task = this.tasks.find((task) => task.id === dto.id);
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  }

  create(dto: CreateTaskDto): Task {
    const task: Task = {
      id: this.nextId++,
      title: dto.title,
      completed: false,
    };
    this.tasks.push(task);
    return task;
  }
}

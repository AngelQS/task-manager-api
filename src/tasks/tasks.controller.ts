import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindTaskByIdDto } from './dto/find-task-by-id.dto';
import { DeleteTaskByIdDto } from './dto/delete-task-by-id.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get()
  findById(@Body() dto: FindTaskByIdDto) {
    return this.tasksService.findById(dto);
  }

  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Delete()
  delete(@Body() dto: DeleteTaskByIdDto) {
    return this.tasksService.delete(dto);
  }
}

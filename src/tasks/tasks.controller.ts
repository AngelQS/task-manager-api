import { Body, Param, Controller, Delete, Get, Post, Patch } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get('/:id')
  findById(@Param('id') id: string) {
    return this.tasksService.findById(Number(id));
  }

  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Patch('/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(Number(id), dto);
  }

  @Delete('/:id')
  delete(@Param('id') id: string) {
    return this.tasksService.delete(Number(id));
  }

  @Post('/:id/checklist')
  addChecklistItem(@Param('id') id: string, @Body() dto: CreateChecklistItemDto) {
    return this.tasksService.addChecklistItem(Number(id), dto);
  }

  @Patch('/:id/checklist/:itemId')
  toggleChecklistItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.tasksService.toggleChecklistItem(Number(id), Number(itemId));
  }

  @Delete('/:id/checklist/:itemId')
  deleteChecklistItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.tasksService.deleteChecklistItem(Number(id), Number(itemId));
  }
}

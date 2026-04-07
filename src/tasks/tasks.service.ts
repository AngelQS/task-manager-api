import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
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

interface TaskRow {
  id: number;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    ...(row.category && { category: row.category }),
    ...(row.scheduled_at && { scheduledAt: row.scheduled_at }),
    createdAt: row.created_at,
  };
}

@Injectable()
export class TasksService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(): Promise<Task[]> {
    const { data, error } = await this.supabase.db
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return (data as TaskRow[]).map(toTask);
  }

  async findById(id: number): Promise<Task> {
    const { data, error } = await this.supabase.db
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error?.code === 'PGRST116') throw new NotFoundException(`Task ${id} not found`);
    if (error) throw new InternalServerErrorException(error.message);
    return toTask(data as TaskRow);
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const { data, error } = await this.supabase.db
      .from('tasks')
      .insert({
        title: dto.title,
        status: dto.status ?? TaskStatus.PENDING,
        priority: dto.priority ?? TaskPriority.MEDIUM,
        category: dto.category ?? null,
        scheduled_at: dto.scheduledAt ?? null,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return toTask(data as TaskRow);
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    const patch: Record<string, unknown> = {};
    if (dto.title !== undefined)       patch.title = dto.title;
    if (dto.status !== undefined)      patch.status = dto.status;
    if (dto.priority !== undefined)    patch.priority = dto.priority;
    if (dto.category !== undefined)    patch.category = dto.category;
    if (dto.scheduledAt !== undefined) patch.scheduled_at = dto.scheduledAt;

    const { data, error } = await this.supabase.db
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error?.code === 'PGRST116') throw new NotFoundException(`Task ${id} not found`);
    if (error) throw new InternalServerErrorException(error.message);
    return toTask(data as TaskRow);
  }

  async delete(id: number): Promise<Task> {
    const { data, error } = await this.supabase.db
      .from('tasks')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error?.code === 'PGRST116') throw new NotFoundException(`Task ${id} not found`);
    if (error) throw new InternalServerErrorException(error.message);
    return toTask(data as TaskRow);
  }
}

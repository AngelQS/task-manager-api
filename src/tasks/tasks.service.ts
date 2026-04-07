import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger('Supabase');

  constructor(private readonly supabase: SupabaseService) {}

  private logQuery(operation: string, table: string, params?: unknown): void {
    this.logger.log(`→ ${operation} [${table}]${params ? ` | params: ${JSON.stringify(params)}` : ''}`);
  }

  private logResult(operation: string, table: string, data: unknown, error: unknown): void {
    if (error) {
      this.logger.error(`← ${operation} [${table}] | error: ${JSON.stringify(error)}`);
    } else {
      const count = Array.isArray(data) ? `${data.length} rows` : 'single row';
      this.logger.log(`← ${operation} [${table}] | ${count}`);
    }
  }

  async findAll(): Promise<Task[]> {
    this.logQuery('SELECT', 'tasks');
    const { data, error } = await this.supabase.db
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    this.logResult('SELECT', 'tasks', data, error);
    if (error) throw new InternalServerErrorException(error.message);
    return (data as TaskRow[]).map(toTask);
  }

  async findById(id: number): Promise<Task> {
    this.logQuery('SELECT', 'tasks', { id });
    const { data, error } = await this.supabase.db
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    this.logResult('SELECT', 'tasks', data, error);
    if (error?.code === 'PGRST116') throw new NotFoundException(`Task ${id} not found`);
    if (error) throw new InternalServerErrorException(error.message);
    return toTask(data as TaskRow);
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const payload = {
      title: dto.title,
      status: dto.status ?? TaskStatus.PENDING,
      priority: dto.priority ?? TaskPriority.MEDIUM,
      category: dto.category ?? null,
      scheduled_at: dto.scheduledAt ?? null,
    };
    this.logQuery('INSERT', 'tasks', payload);
    const { data, error } = await this.supabase.db
      .from('tasks')
      .insert(payload)
      .select()
      .single();

    this.logResult('INSERT', 'tasks', data, error);
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

    this.logQuery('UPDATE', 'tasks', { id, ...patch });
    const { data, error } = await this.supabase.db
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    this.logResult('UPDATE', 'tasks', data, error);
    if (error?.code === 'PGRST116') throw new NotFoundException(`Task ${id} not found`);
    if (error) throw new InternalServerErrorException(error.message);
    return toTask(data as TaskRow);
  }

  async delete(id: number): Promise<Task> {
    this.logQuery('DELETE', 'tasks', { id });
    const { data, error } = await this.supabase.db
      .from('tasks')
      .delete()
      .eq('id', id)
      .select()
      .single();

    this.logResult('DELETE', 'tasks', data, error);
    if (error?.code === 'PGRST116') throw new NotFoundException(`Task ${id} not found`);
    if (error) throw new InternalServerErrorException(error.message);
    return toTask(data as TaskRow);
  }
}

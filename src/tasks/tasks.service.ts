import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';

export interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
  position: number;
}

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  scheduledAt?: string;
  createdAt: string;
  checklist: ChecklistItem[];
}

interface ChecklistItemRow {
  id: number;
  text: string;
  completed: boolean;
  position: number;
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
  checklist_items: ChecklistItemRow[];
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
    checklist: (row.checklist_items ?? [])
      .sort((a, b) => a.position - b.position)
      .map(({ id, text, completed, position }) => ({ id, text, completed, position })),
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
    this.logQuery('SELECT', 'tasks + checklist_items');
    const { data, error } = await this.supabase.db
      .from('tasks')
      .select('*, checklist_items(id, text, completed, position)')
      .order('created_at', { ascending: false });

    this.logResult('SELECT', 'tasks', data, error);
    if (error) throw new InternalServerErrorException(error.message);
    return (data as TaskRow[]).map(toTask);
  }

  async findById(id: number): Promise<Task> {
    this.logQuery('SELECT', 'tasks + checklist_items', { id });
    const { data, error } = await this.supabase.db
      .from('tasks')
      .select('*, checklist_items(id, text, completed, position)')
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

    const task = data as TaskRow & { checklist_items: ChecklistItemRow[] };

    if (dto.checklist?.length) {
      const items = dto.checklist.map((item, index) => ({
        task_id: task.id,
        text: item.text,
        completed: false,
        position: index,
      }));
      this.logQuery('INSERT', 'checklist_items', items);
      const { error: itemsError } = await this.supabase.db
        .from('checklist_items')
        .insert(items);
      if (itemsError) throw new InternalServerErrorException(itemsError.message);
    }

    return this.findById(task.id);
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
    return this.findById(id);
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
    return toTask({ ...(data as TaskRow), checklist_items: [] });
  }

  async addChecklistItem(taskId: number, dto: CreateChecklistItemDto): Promise<Task> {
    await this.findById(taskId);

    const { data: existing } = await this.supabase.db
      .from('checklist_items')
      .select('position')
      .eq('task_id', taskId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = existing?.length ? (existing[0] as { position: number }).position + 1 : 0;

    this.logQuery('INSERT', 'checklist_items', { taskId, text: dto.text, position: nextPosition });
    const { error } = await this.supabase.db
      .from('checklist_items')
      .insert({ task_id: taskId, text: dto.text, completed: false, position: nextPosition });

    if (error) throw new InternalServerErrorException(error.message);
    return this.findById(taskId);
  }

  async toggleChecklistItem(taskId: number, itemId: number): Promise<Task> {
    const { data: item, error: fetchError } = await this.supabase.db
      .from('checklist_items')
      .select('completed')
      .eq('id', itemId)
      .eq('task_id', taskId)
      .single();

    if (fetchError?.code === 'PGRST116') throw new NotFoundException(`Checklist item ${itemId} not found`);
    if (fetchError) throw new InternalServerErrorException(fetchError.message);

    const newCompleted = !(item as { completed: boolean }).completed;
    this.logQuery('UPDATE', 'checklist_items', { itemId, completed: newCompleted });

    const { error: updateError } = await this.supabase.db
      .from('checklist_items')
      .update({ completed: newCompleted })
      .eq('id', itemId);

    if (updateError) throw new InternalServerErrorException(updateError.message);

    // Auto-complete task if all items are checked
    const { data: allItems } = await this.supabase.db
      .from('checklist_items')
      .select('completed')
      .eq('task_id', taskId);

    const items = allItems as { completed: boolean }[];
    const allDone = items.length > 0 && items.every((i) => i.completed);
    const noneDone = items.every((i) => !i.completed);

    const { data: currentTask } = await this.supabase.db
      .from('tasks')
      .select('status')
      .eq('id', taskId)
      .single();

    const currentStatus = (currentTask as { status: string }).status;

    if (allDone) {
      this.logQuery('UPDATE', 'tasks', { id: taskId, status: TaskStatus.COMPLETED });
      await this.supabase.db
        .from('tasks')
        .update({ status: TaskStatus.COMPLETED })
        .eq('id', taskId);
    } else if (currentStatus === TaskStatus.COMPLETED) {
      this.logQuery('UPDATE', 'tasks', { id: taskId, status: TaskStatus.IN_PROGRESS });
      await this.supabase.db
        .from('tasks')
        .update({ status: TaskStatus.IN_PROGRESS })
        .eq('id', taskId);
    }

    return this.findById(taskId);
  }

  async deleteChecklistItem(taskId: number, itemId: number): Promise<Task> {
    this.logQuery('DELETE', 'checklist_items', { taskId, itemId });
    const { error } = await this.supabase.db
      .from('checklist_items')
      .delete()
      .eq('id', itemId)
      .eq('task_id', taskId);

    if (error) throw new InternalServerErrorException(error.message);
    return this.findById(taskId);
  }
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, url, body, headers } = req;
    const start = Date.now();

    const bodyLog = Object.keys(body ?? {}).length
      ? JSON.stringify(body)
      : '(empty)';

    this.logger.log(`→ ${method} ${url} | body: ${bodyLog}`);

    return next.handle().pipe(
      tap((data) => {
        const ms = Date.now() - start;
        const status: number = res.statusCode;
        this.logger.log(
          `← ${method} ${url} | ${status} | ${ms}ms | response: ${JSON.stringify(data)}`,
        );
      }),
      catchError((err) => {
        const ms = Date.now() - start;
        this.logger.error(
          `← ${method} ${url} | ERROR | ${ms}ms | ${err.message}`,
          err.stack,
        );
        return throwError(() => err);
      }),
    );
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { randomUUID } from 'crypto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    const traceId = randomUUID();

    const errorCode = this.getErrorCode(status);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const exceptionMessage = exceptionResponse['message'];

    const message =
      typeof exceptionResponse === 'object' && exceptionMessage
        ? exceptionMessage
        : exception.message;

    const jsonResponse = {
      success: false,
      message: typeof message === 'string' ? message : 'An error occurred', // Pastikan string
      error: {
        code: errorCode,
        trace_id: traceId,
      },
    };

    response.status(status).json(jsonResponse);
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'TOO_MANY_REQUESTS';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }
}

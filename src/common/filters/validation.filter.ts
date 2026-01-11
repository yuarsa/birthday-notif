/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = HttpStatus.UNPROCESSABLE_ENTITY;
    const exceptionResponse: any = exception.getResponse();

    if (this.isValidationError(exceptionResponse)) {
      const validationErrors = this.formatValidationErrors(
        exceptionResponse.message,
      );

      const errorResponse = {
        success: false,
        message: 'Validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          errors: validationErrors,
        },
      };

      return response.status(status).json(errorResponse);
    }

    return response.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: exceptionResponse.message || 'Bad Request',
      error: {
        code: 'BAD_REQUEST',
      },
    });
  }

  private isValidationError(response: any): boolean {
    return typeof response === 'object' && Array.isArray(response.message);
  }

  private formatValidationErrors(
    messages: string[] | any[],
  ): Array<{ field: string; message: string }> {
    return messages.map((msg) => {
      // Handle object with nested structure: { field: 'started_at', errors: [...] }
      if (typeof msg === 'object' && msg.field && msg.errors) {
        return {
          field: msg.field,
          message: Array.isArray(msg.errors) ? msg.errors[0] : msg.errors,
        };
      }

      // Handle object with message array: { field: 'started_at', message: [...] }
      if (typeof msg === 'object' && msg.field && msg.message) {
        return {
          field: msg.field,
          message: Array.isArray(msg.message) ? msg.message[0] : msg.message,
        };
      }

      // Handle plain string
      if (typeof msg === 'string') {
        return {
          field: 'input',
          message: msg,
        };
      }

      // Fallback for any other object format
      return {
        field: 'input',
        message: JSON.stringify(msg),
      };
    });
  }
}


import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Error as MongooseError } from 'mongoose';


@Catch(MongooseError)
export class MongooseExceptionFilter implements ExceptionFilter {
    catch(exception: MongooseError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let errorResponse = {
            success: false,
            message: 'Internal Server Error',
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                details: null,
            },
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };

        // Handle Mongoose Validation Error
        if (exception instanceof MongooseError.ValidationError) {
            const errors = Object.values(exception.errors).map((err) => ({
                field: err.path,
                message: err.message,
            }));

            errorResponse = {
                success: false,
                message: 'Validation failed',
                error: {
                    code: 'VALIDATION_ERROR',
                    details: errors as any,
                },
                statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            };
        }

        // Handle Duplicate Key Error (E11000)
        else if ((exception as any).code === 11000) {
            const keyPattern = Object.keys((exception as any).keyPattern);
            const field = keyPattern.length > 0 ? keyPattern[0] : 'unknown';

            errorResponse = {
                success: false,
                message: `${field} already exists`,
                error: {
                    code: 'CONFLICT',
                    details: [
                        {
                            field: field,
                            message: `${field} must be unique`
                        }
                    ] as any,
                },
                statusCode: HttpStatus.CONFLICT,
            };
        }

        // Handle CastError (Invalid ID)
        else if (exception instanceof MongooseError.CastError) {
            errorResponse = {
                success: false,
                message: `Invalid ${exception.path}: ${exception.value}`,
                error: {
                    code: 'BAD_REQUEST',
                    details: null
                },
                statusCode: HttpStatus.BAD_REQUEST
            };
        }

        response.status(errorResponse.statusCode).json({
            success: errorResponse.success,
            message: errorResponse.message,
            error: errorResponse.error
        });
    }
}

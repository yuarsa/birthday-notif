import { BadRequestException } from '@nestjs/common';

interface ValidationErrorItem {
  field: string;
  errors: string[];
}

export class ValidationException extends BadRequestException {
  constructor(public validationErrors: ValidationErrorItem[]) {
    super();
  }
}

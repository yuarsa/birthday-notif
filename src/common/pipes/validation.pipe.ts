import { ValidationError, ValidationPipe } from '@nestjs/common';

interface ValidationErrorWithField extends ValidationError {
  field?: string;
}

/**
 * Source: https://github.com/exonest/better-validation
 */
export class CustomValidationPipe extends ValidationPipe {
  protected flattenValidationErrors(
    validationErrors: ValidationError[],
  ): string[] {
    const result: { errors: string[]; field: string }[] = [];

    for (const error of validationErrors) {
      const mapped = this.mapChildrenToValidationErrors(
        error,
      ) as ValidationErrorWithField[];

      for (const item of mapped) {
        if (item.constraints) {
          const errors = Object.values(item.constraints);
          if (errors.length > 0) {
            result.push({
              errors,
              field: item.field ?? item.property,
            });
          }
        }
      }
    }

    return result as unknown as string[];
  }

  protected prependConstraintsWithParentProp(
    parent: string,
    error: ValidationError,
  ): ValidationErrorWithField {
    return {
      ...super.prependConstraintsWithParentProp(parent, error),
      field: `${parent}.${error.property}`,
    };
  }
}

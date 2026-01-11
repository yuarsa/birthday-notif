import { Transform } from 'class-transformer';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator for validate date-only format (YYYY-MM-DD)
 */
export function IsDateOnly(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDateOnly',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          const regex = /^\d{4}-\d{2}-\d{2}$/;
          if (!regex.test(value)) return false;
          const date = new Date(value);
          return !isNaN(date.getTime());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid date in YYYY-MM-DD format`;
        },
      },
    });
  };
}

/**
 * Composite decorator
 */
export function DateOnly(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    IsDateOnly(validationOptions)(target, propertyKey as string);
    Transform(({ value }: { value: string }) => {
      if (!value) return value;
      const date = new Date(value);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    })(target, propertyKey as string);
  };
}

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  isStrongPassword,
} from 'class-validator';

export function IsPassword(validationOptions?: ValidationOptions) {
  return function (object: Record<string, string>, propertyName: string) {
    registerDecorator({
      name: 'IsPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return isStrongPassword(value, {
            minLength: 8,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 0,
            minUppercase: 0,
          });
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be contains a lowercase alphabet and a number`;
        },
      },
    });
  };
}

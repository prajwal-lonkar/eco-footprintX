import { registerDecorator, ValidationOptions, ValidationArguments, } from 'class-validator';
import { isValidObjectId } from 'mongoose';

export function IsObjectId(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsObjectId',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return isValidObjectId(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be a valid MongoDB ObjectId`;
                },
            },
        });
    };
}
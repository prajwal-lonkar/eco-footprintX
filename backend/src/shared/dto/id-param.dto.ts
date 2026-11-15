import { IsNotEmpty } from 'class-validator';
import { IsObjectId } from 'src/shared/validators/is-object-id.validator';

export class IdParamDto {
    @IsNotEmpty()
    @IsObjectId({ message: 'Invalid product id format' })
    id: string;
}

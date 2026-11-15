import { IsNotEmpty } from 'class-validator';
import { IsObjectId } from 'src/shared/validators/is-object-id.validator';

export class ProductComponentParamsDto {
  @IsNotEmpty()
  @IsObjectId({ message: 'Invalid product id format' })
  productId: string;

  @IsNotEmpty()
  @IsObjectId({ message: 'Invalid component id format' })
  componentId: string;
}

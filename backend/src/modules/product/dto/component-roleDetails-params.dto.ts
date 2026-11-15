import { IsNotEmpty } from 'class-validator';
import { IsObjectId } from 'src/shared/validators/is-object-id.validator';

export class ComponentRoleDetailsParamsDto {
  @IsNotEmpty()
  @IsObjectId({ message: 'Invalid component id format' })
  componentId: string;

  @IsNotEmpty()
  @IsObjectId({ message: 'Invalid role details id format' })
  roleDetailsId: string;
}

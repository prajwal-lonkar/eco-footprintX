import { IsNotEmpty, IsString } from 'class-validator';
import { IsObjectId } from 'src/shared/validators/is-object-id.validator';

export class ComponentRoleSlugParamsDto {
  @IsNotEmpty()
  @IsObjectId({ message: 'Invalid component id format' })
  componentId: string;

  @IsNotEmpty()
  @IsString({ message: 'Invalid role slug format' })
  roleSlug: string;
}

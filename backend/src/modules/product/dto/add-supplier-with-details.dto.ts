import { IntersectionType } from '@nestjs/mapped-types';
import { AddSupplier } from './add-supplier.dto';
import { UpdateSupplierDetailsDto } from './update-supplier-details.dto';

export class AddSupplierWithDetailsDto extends IntersectionType(
  AddSupplier,
  UpdateSupplierDetailsDto,
) {}

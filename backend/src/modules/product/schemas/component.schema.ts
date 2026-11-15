import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/modules/user/schemas/user.schema';
import { BaseSchema } from 'src/shared/schemas/base.schema';
import { SupplierRoles } from '../../user/schemas/supplierRoles.schema';
import { Product } from './product.schema';
import {
  RawMaterialSupplierSection,
  RawMaterialSupplierSectionSchema,
} from './raw-material-supplier-section.schema';
import {
  TransportFreightSection,
  TransportFreightSectionSchema,
} from './transport-freight-section.schema';
import {
  StorageFulfilmentSection,
  StorageFulfilmentSectionSchema,
} from './storage-fulfilment-section.schema';
import {
  PackagingManufacturerSection,
  PackagingManufacturerSectionSchema,
} from './packaging-manufacturer-section.schema';
import {
  CpgBrandSection,
  CpgBrandSectionSchema,
} from './cpg-brand-section.schema';
import {
  RetailerSection,
  RetailerSectionSchema,
} from './retailer-section.schema';
import {
  ContractManufacturerSection,
  ContractManufacturerSectionSchema,
} from './contract-manufacturer-section.schema';

export type ComponentDocument = HydratedDocument<Component>;
@Schema({ collection: 'component' })
export class Component extends BaseSchema {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  internalSku: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: false })
  supplierId: Types.ObjectId;

  @Prop({ required: false, type: String })
  supplierName: string;

  @Prop({ required: false, type: String })
  supplierContactName: string;

  @Prop({ required: false, type: String })
  supplierContactEmail: string;

  @Prop({ required: false, type: String })
  companyRegistrationNumber: string;

  @Prop({ required: false, type: String })
  supplierType: string;

  @Prop({ type: Types.ObjectId, ref: Product.name, required: false })
  requestedProductId: Types.ObjectId;

  @Prop({
    type: [String],
    required: false,
  })
  supplierRoles: string[];

  @Prop({ type: Types.ObjectId, ref: Product.name, required: false })
  productId: Types.ObjectId;

  // ===== Step 2 - Add supplier role details =====

  @Prop({ type: RawMaterialSupplierSectionSchema })
  rawMaterialSupplier?: RawMaterialSupplierSection;

  @Prop({ type: TransportFreightSectionSchema })
  transportFreight?: TransportFreightSection;

  @Prop({ type: StorageFulfilmentSectionSchema })
  storageFulfilment?: StorageFulfilmentSection;

  @Prop({ type: PackagingManufacturerSectionSchema })
  packagingManufacturer?: PackagingManufacturerSection;

  @Prop({ type: CpgBrandSectionSchema })
  cpgBrand?: CpgBrandSection;

  @Prop({ type: RetailerSectionSchema })
  retailer?: RetailerSection;

  @Prop({
    type: ContractManufacturerSectionSchema,
  })
  contractManufacturer?: ContractManufacturerSection;

  // ================= STEP 3 - Build enviromental profile details =================

  // Raw Material Supplier & Processor
  @Prop({
    required: false,
    type: {
      netWeightUsedPerSku: { type: Number, required: true },
      netWeightUnit: { type: String, required: true },
      supplierLocation: { type: String, required: true }, // ecoInvent geography
      benchmarkingData: {
        type: {
          benchmarkingLciaMethodology: { type: String, required: false },
          carbonBenchmarkingData: { type: Number, required: false },
          waterBenchmarkingData: { type: Number, required: false },
          landBenchmarkingData: { type: Number, required: false },
        },
        required: false,
      },
      audit: {
        type: {
          query: { type: Object, required: false },
          results: { type: [Object], required: false, default: [] },
        },
        required: false,
        default: {},
      },
    },
  })
  rawMaterialSupplierDetails?: {
    netWeightUsedPerSku: number;
    netWeightUnit: string;
    supplierLocation: string;
    benchmarkingData?: {
      benchmarkingLciaMethodology: string;
      carbonBenchmarkingData: number;
      waterBenchmarkingData: number;
      landBenchmarkingData: number;
    };
    audit?: {
      query?: Record<string, any>;
      results?: any[];
    };
  };

  // Transport & Freight
  @Prop({
    required: false,
    type: {
      netWeightPerUnit: { type: Number, required: true },
      netWeightUnit: { type: String, required: true },
      transportRegion: { type: String, required: true },
      calculatedDistanceKm: { type: Number, required: false },
      benchmarkingData: {
        type: {
          benchmarkingLciaMethodology: { type: String, required: false },
          carbonBenchmarkingData: { type: Number, required: false },
          waterBenchmarkingData: { type: Number, required: false },
          landBenchmarkingData: { type: Number, required: false },
        },
        required: false,
      },
      audit: {
        type: {
          query: { type: Object, required: false },
          results: { type: [Object], required: false, default: [] },
        },
        required: false,
        default: {},
      },
    },
  })
  transportFreightDetails?: {
    netWeightPerUnit: number;
    netWeightUnit: string;
    transportRegion: string;
    calculatedDistanceKm?: number;
    benchmarkingData?: {
      benchmarkingLciaMethodology: string;
      carbonBenchmarkingData: number;
      waterBenchmarkingData: number;
      landBenchmarkingData: number;
    };
    audit?: {
      query?: Record<string, any>;
      results?: any[];
    };
  };

  // Storage & Fulfilment
  @Prop({
    required: false,
    type: {
      storageDays: { type: Number, required: true },
      volumePerSku: { type: Number, required: true },
      floorAreaPerSku: { type: Number, required: true },
      benchmarkingData: {
        type: {
          benchmarkingLciaMethodology: { type: String, required: false },
          carbonBenchmarkingData: { type: Number, required: false },
          waterBenchmarkingData: { type: Number, required: false },
          landBenchmarkingData: { type: Number, required: false },
        },
        required: false,
      },
      audit: {
        type: {
          query: { type: Object, required: false },
          results: { type: [Object], required: false, default: [] },
        },
        required: false,
        default: {},
      },
    },
  })
  storageFulfilmentDetails?: {
    storageDays: number;
    volumePerSku: number;
    floorAreaPerSku: number;
    benchmarkingData?: {
      benchmarkingLciaMethodology: string;
      carbonBenchmarkingData: number;
      waterBenchmarkingData: number;
      landBenchmarkingData: number;
    };
    audit?: {
      query?: Record<string, any>;
      results?: any[];
    };
  };

  // Packaging Manufacturer & Processor
  @Prop({
    required: false,
    type: {
      netWeightUsedPerSku: { type: Number, required: true },
      netWeightUnit: { type: String, required: true },
      supplierLocation: { type: String, required: true },
      benchmarkingData: {
        type: {
          benchmarkingLciaMethodology: { type: String, required: false },
          carbonBenchmarkingData: { type: Number, required: false },
          waterBenchmarkingData: { type: Number, required: false },
          landBenchmarkingData: { type: Number, required: false },
        },
        required: false,
      },
      audit: {
        type: {
          query: { type: Object, required: false },
          results: { type: [Object], required: false, default: [] },
        },
        required: false,
        default: {},
      },
    },
  })
  packagingManufacturerDetails?: {
    netWeightUsedPerSku: number;
    netWeightUnit: string;
    supplierLocation: string;
    benchmarkingData?: {
      benchmarkingLciaMethodology: string;
      carbonBenchmarkingData: number;
      waterBenchmarkingData: number;
      landBenchmarkingData: number;
    };
    audit?: {
      query?: Record<string, any>;
      results?: any[];
    };
  };

  // CPG Brand (SAME AS STORAGE & FULFILMENT)
  @Prop({
    required: false,
    type: {
      storageDays: { type: Number, required: true },
      volumePerSku: { type: Number, required: true },
      floorAreaPerSku: { type: Number, required: true },
      benchmarkingData: {
        type: {
          benchmarkingLciaMethodology: { type: String, required: false },
          carbonBenchmarkingData: { type: Number, required: false },
          waterBenchmarkingData: { type: Number, required: false },
          landBenchmarkingData: { type: Number, required: false },
        },
        required: false,
      },
      audit: {
        type: {
          query: { type: Object, required: false },
          results: { type: [Object], required: false, default: [] },
        },
        required: false,
        default: {},
      },
    },
  })
  cpgBrandDetails?: {
    storageDays: number;
    volumePerSku: number;
    floorAreaPerSku: number;
    benchmarkingData?: {
      benchmarkingLciaMethodology: string;
      carbonBenchmarkingData: number;
      waterBenchmarkingData: number;
      landBenchmarkingData: number;
    };
    audit?: {
      query?: Record<string, any>;
      results?: any[];
    };
  };

  // Retailer (SAME AS STORAGE & FULFILMENT)
  @Prop({
    required: false,
    type: {
      storageDays: { type: Number, required: true },
      volumePerSku: { type: Number, required: true },
      floorAreaPerSku: { type: Number, required: true },
      benchmarkingData: {
        type: {
          benchmarkingLciaMethodology: { type: String, required: false },
          carbonBenchmarkingData: { type: Number, required: false },
          waterBenchmarkingData: { type: Number, required: false },
          landBenchmarkingData: { type: Number, required: false },
        },
        required: false,
      },
      audit: {
        type: {
          query: { type: Object, required: false },
          results: { type: [Object], required: false, default: [] },
        },
        required: false,
        default: {},
      },
    },
  })
  retailerDetails?: {
    storageDays: number;
    volumePerSku: number;
    floorAreaPerSku: number;
    benchmarkingData?: {
      benchmarkingLciaMethodology: string;
      carbonBenchmarkingData: number;
      waterBenchmarkingData: number;
      landBenchmarkingData: number;
    };
    audit?: {
      query?: Record<string, any>;
      results?: any[];
    };
  };

  // Contract Manufacturer
  @Prop({
    required: false,
    type: {
      filling: {
        volumePerUnit: { type: Number },
        volumeUnit: { type: String }, // kg | g
      },
      mixing: {
        volumePerUnit: { type: Number },
        volumeUnit: { type: String },
      },
      heating: {
        volumePerUnit: { type: Number },
        volumeUnit: { type: String },
        currentTemperature: { type: Number }, // °C
        targetTemperature: { type: Number }, // °C
      },
      homogenising: {
        volumePerUnit: { type: Number },
        volumeUnit: { type: String },
      },
      labelling: {
        numberOfLabels: { type: Number },
      },
      cooling: {
        volumePerUnit: { type: Number },
        volumeUnit: { type: String },
        currentTemperature: { type: Number }, // °C
        targetTemperature: { type: Number }, // °C
      },
      fermenting: {
        volumePerUnit: { type: Number },
        volumeUnit: { type: String },
      },
      packaging: {
        volumePerUnit: { type: Number },
        volumeUnit: { type: String },
      },
      benchmarkingData: {
        type: {
          benchmarkingLciaMethodology: { type: String, required: false },
          carbonBenchmarkingData: { type: Number, required: false },
          waterBenchmarkingData: { type: Number, required: false },
          landBenchmarkingData: { type: Number, required: false },
        },
        required: false,
      },
      audit: {
        type: {
          query: { type: Object, required: false },
          results: { type: [Object], required: false, default: [] },
        },
        required: false,
        default: {},
      },
    },
  })
  contractManufacturerDetails?: {
    filling?: {
      volumePerUnit?: number;
      volumeUnit?: string;
    };
    mixing?: {
      volumePerUnit?: number;
      volumeUnit?: string;
    };
    heating?: {
      volumePerUnit?: number;
      volumeUnit?: string;
      currentTemperature?: number;
      targetTemperature?: number;
    };
    homogenising?: {
      volumePerUnit?: number;
      volumeUnit?: string;
    };
    labelling?: {
      numberOfLabels?: number;
    };
    cooling?: {
      volumePerUnit?: number;
      volumeUnit?: string;
      currentTemperature?: number;
      targetTemperature?: number;
    };
    fermenting?: {
      volumePerUnit?: number;
      volumeUnit?: string;
    };
    packaging?: {
      volumePerUnit?: number;
      volumeUnit?: string;
    };
    benchmarkingData?: {
      benchmarkingLciaMethodology: string;
      carbonBenchmarkingData: number;
      waterBenchmarkingData: number;
      landBenchmarkingData: number;
    };
    audit?: {
      query?: Record<string, any>;
      results?: any[];
    };
  };
}

export const ComponentSchema = SchemaFactory.createForClass(Component);

ComponentSchema.index({ createdBy: 1, internalSku: 1 });
ComponentSchema.index({ createdBy: 1, name: 1 });
ComponentSchema.index(
  { companyRegistrationNumber: 1 },
  { partialFilterExpression: { deletedAt: null } },
);
ComponentSchema.index(
  { supplierContactEmail: 1 },
  { partialFilterExpression: { deletedAt: null } },
);
ComponentSchema.index({ createdBy: 1, supplierName: 1 });

import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Service } from '../../config/aws/s3.service';
import { ConfigService } from '@nestjs/config';
import {
  BenchmarkingDataDoesNotExistError,
  ComponentNotFoundError,
  ImpactCategoryDataAlreadyExistsError,
  IncompatibleUnitError,
  ProductAlreadyExistsError,
  ProductLimitExceededError,
  ProductNotFoundError,
  SubscriptionRequiredError,
  UnsupportedImageTypeError,
} from 'src/shared/errorResponse/product.errors';
import { CreateProductDto } from './dto/add-product.dto';
import { Types, UpdateQuery } from 'mongoose';
import { UpdateRecycleProductInfoDto } from './dto/update-recycle-product-info';
import { ProductRepository } from './repositories/product.repository';
import { AddComponentDto } from './dto/add-component.dto';
import { ComponentRepository } from './repositories/component.repository';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'src/shared/errorResponse/common.errors';
import { AddSupplier } from './dto/add-supplier.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RoleRepository } from '../user/repositories/role.repository';
import { UserRepository } from '../user/repositories/user.repository';
import {
  EmailToSupplierAlreadySentError,
  RoleNotFoundError,
  SubscriptionPlanNotFoundError,
  UserNotFoundError,
} from 'src/shared/errorResponse/user.errors';
import { UpdateSupplierDetailsDto } from './dto/update-supplier-details.dto';
import { CompleteSupplierDetailsDto } from './dto/update-environmental-profile.dto';
import { SupplierRolesRepository } from '../user/repositories/supplierRoles.repository';
import { AddSupplierWithDetailsDto } from './dto/add-supplier-with-details.dto';
import { AddImpactCategoryDto } from './dto/add-impact-category.dto';
import { ComponentRoleDetailsParamsDto } from './dto/component-roleDetails-params.dto';
import { ImpactCategoryDataRepository } from './repositories/impact-category-repository';
import { ContractManufacturingActivityType } from './enums/contract-manufacturing-activity-type-enum';
import { EmailService } from 'src/utils/sendgrid/email.service';
import { InvitationRepository } from '../user/repositories/invitation.repository';
import { Component } from './schemas/component.schema';
import { Product } from './schemas/product.schema';
import { ImpactCategoryVersion } from './schemas/impact-category-version.schema';
import {
  IMPACT_CATEGORIES,
  ImpactCategory,
} from './constants/impact-category.constants';
import { UpdateBenchmarkingDataDto } from './dto/add-benchmarking.dto';
import { UnitConversionsService } from 'src/utils/unitConversions/unitConversions.service';
import { SubscriptionStatus } from '../user/enums/subscription-status.enum';
import { CompanySubscriptionRepository } from '../user/repositories/company-subscription.repository';
import { SubscriptionPlanRepository } from '../user/repositories/subscription-plan.repository';
import {
  EmailAlreadyExistsError,
  UserAccountBlockedError,
} from 'src/shared/errorResponse/auth.errors';
import { ImpactCategoryRecordRepository } from './repositories/impact-category-record.repository';
import { ImpactCategoryRequestRepository } from './repositories/impact-category-request.repository';
import { ImpactCategoryVersionRepository } from './repositories/impact-category-version.respository';
import { SubmitImpactCategoryDto } from './dto/submit-impact-category.dto';
import { OpenAIService } from 'src/utils/openai/openai.service';
import {
  Coordinates,
  ImpactCategoryInput,
  TravelRoute,
  UserTransportMethod,
} from 'src/utils/openai/openai.types';
import { axiosRequest } from 'src/utils/axios/axios.util';
import { DatahubHeadersService } from 'src/utils/datahub/datahub-headers.util';
import { randomUUID } from 'crypto';

@Injectable()
export class ProductService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
    private readonly datahubHeaders: DatahubHeadersService,
    private readonly productRepository: ProductRepository,
    private readonly componentRepository: ComponentRepository,
    private readonly roleRepository: RoleRepository,
    private readonly userRepository: UserRepository,
    private readonly supplierRolesRepository: SupplierRolesRepository,
    private readonly impactCategoryRepository: ImpactCategoryDataRepository,
    private readonly emailService: EmailService,
    private readonly invitationRepository: InvitationRepository,
    private readonly unitConversions: UnitConversionsService,
    private readonly companySubscriptionRepository: CompanySubscriptionRepository,
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
    private readonly impactCategoryRecordRepository: ImpactCategoryRecordRepository,
    private readonly impactCategoryRequestRepository: ImpactCategoryRequestRepository,
    private readonly impactCategoryVersionRepository: ImpactCategoryVersionRepository,
    private readonly openAIService: OpenAIService,
  ) {}

  async generateImageUploadUrl(key: string, contentType: string) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(contentType)) {
      throw new UnsupportedImageTypeError(
        `Invalid image type: ${contentType}`,
        { allowedTypes },
      );
    }

    // Validate extension matches folder rules
    const extension = key.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension!)) {
      throw new UnsupportedImageTypeError(
        `Invalid file extension: .${extension}`,
        { key },
      );
    }

    // Generate signed URL
    const uploadUrl = await this.s3Service.getSignedUrlForUpload(
      key,
      contentType,
    );

    const fileUrl = `${this.configService.getOrThrow('AWS_BUCKET_BASE_URL')}/${key}`;

    return {
      uploadUrl,
      fileUrl,
      key,
    };
  }

  async updateProductImageOrRecycleInfo(
    productId: string,
    recycleProductInfo: UpdateRecycleProductInfoDto,
  ) {
    const updateData: any = {};

    if (recycleProductInfo.recycleInstructions !== undefined) {
      updateData.recycleInstructions = recycleProductInfo.recycleInstructions;
    }

    if (recycleProductInfo.image !== undefined) {
      updateData.image = recycleProductInfo.image;
    }

    const result = await this.productRepository.update(
      { _id: productId, deletedAt: null },
      {
        $set: updateData,
      },
    );
    // Handle product not found
    if (!result) {
      throw new NotFoundError('Product not found');
    }
    return result;
  }

  async deleteProductById(productId: string, userId: string) {
    const productDetail = await this.productRepository.findById(productId);
    const updatePayload = {
      deletedBy: userId,
      gstin: Number(new Date()),
      comment: productDetail?.gstin,
    };

    const result = await this.productRepository.softDeleteOnIsActiveField(
      { _id: productId, deletedAt: null },
      updatePayload,
    );

    // Handle product not found
    if (!result) {
      throw new NotFoundError('Product not found');
    }
    return result;
  }

  async createProduct(dto: CreateProductDto, companyId: string) {
    await this.validateSubscriptionForProductCreation(companyId);
    const companyObjectId = new Types.ObjectId(companyId);

    // Check SKU uniqueness (only inside same company)
    const existing = await this.productRepository.findOne({
      internalSku: dto.internalSku,
      companyId: companyObjectId,
    });

    if (existing) {
      throw new ProductAlreadyExistsError('SKU already exists', {
        sku: dto.internalSku,
      });
    }

    // Check GSTIN uniqueness (global across entire platform)
    const gstinExists = await this.productRepository.findOne({
      gstin: dto.gstin,
    });

    if (gstinExists) {
      throw new ProductAlreadyExistsError('GSTIN already exists', {
        gstin: dto.gstin,
      });
    }

    // Create product
    const product = await this.productRepository.create({
      ...dto,
      companyId: companyObjectId,
      createdBy: companyId,
      publishStatus: dto.publishStatus ?? 'pending',
      recycleInstructions: dto.recycleInstructions ?? [],
    });

    // Non-blocking: calculate impact benchmarking via OpenAI and persist result
    setImmediate(() => {
      this.calculateAndSaveImpactBenchMarking(product._id.toString(), {
        productName: dto.name,
        productCategory: dto.category,
        productSize: String(dto.netSize),
        productUnit:
          dto.unit === 'Other' ? (dto.customUnit ?? dto.unit) : dto.unit,
        comparisonProductDescription: dto.comparisonProductDescription,
      });
    });

    return { productDetails: product };
  }

  private async calculateAndSaveImpactBenchMarking(
    productId: string,
    input: ImpactCategoryInput,
  ): Promise<void> {
    try {
      const result =
        await this.openAIService.calculateImpactCategoryData(input);
      await this.productRepository.update(
        { _id: new Types.ObjectId(productId) },
        {
          $set: {
            impactBenchMarking: {
              carbon: result.carbonEmissions.value,
              water: result.waterUsage.value,
              land: result.landUse.value,
              metadata: result,
            },
          },
        },
      );
    } catch (_err) {
      // Intentionally swallowed — impact benchmarking is best-effort and non-blocking
    }
  }

  // Get all products for authenticated company
  async getProductsByCompany(companyId: string, limit: number, skip: number) {
    const companyObjectId = new Types.ObjectId(companyId);

    const [products, total] = await Promise.all([
      this.productRepository.findByFilter(
        { companyId: companyObjectId, deletedAt: null },
        { skip, limit, sort: { createdAt: -1 } },
      ),
      this.productRepository.countByFilter({
        companyId: companyObjectId,
        deletedAt: null,
      }),
    ]);

    return {
      limit,
      skip,
      total,
      products,
    };
  }

  async viewProductsEnvironmentalProfilePage(gtin: string) {
    const result = await this.productRepository.findOne({
      gstin: Number(gtin),
      isPubliclyAccessible: true,
    });

    // Handle product not found
    if (!result) {
      throw new NotFoundError('Product not found');
    }

    // Shared empty impact response — includes all product fields + empty impact data
    // Used when product exists but has no publishable impact data to show
    const buildEmptyResponse = (productObj: any) => ({
      ...productObj,
      impactCategoryPublishStatus: { carbon: false, water: false, land: false },
      recycleInstructions: [],
      impactBenchMarking: {},
      impactSummary: {
        carbon: {
          value: 0,
          unit: 'kg CO2-eq/unit',
          isImpactPresent: true,
          averageComparison: null,
          dataSource: null,
        },
        water: {
          value: 0,
          unit: 'm3/unit',
          isImpactPresent: false,
          averageComparison: null,
          dataSource: null,
        },
        land: {
          value: 0,
          unit: 'm2/unit',
          isImpactPresent: false,
          averageComparison: null,
          dataSource: null,
        },
      },
    });

    // Product was previously made public but all data was deleted (publishStatus reset to pending).
    if (result.publishStatus === 'pending' && result.isPubliclyAccessible) {
      return buildEmptyResponse(result.toObject());
    }

    // If the company that owns this product is blocked (isActive: false),
    // return basic product details with empty impact data
    const companyOwner = await this.userRepository.findById(
      result.companyId.toString(),
    );
    if (!companyOwner || companyOwner.isActive === false) {
      return buildEmptyResponse(result.toObject());
    }

    const impactSummaryData =
      await this.impactCategoryRecordRepository.aggregate([
        {
          $match: {
            productId: result._id,
            isActive: true,
          },
        },
        {
          $lookup: {
            from: 'component',
            localField: 'componentId',
            foreignField: '_id',
            as: 'component',
          },
        },
        {
          $unwind: {
            path: '$component',
            preserveNullAndEmptyArrays: false, // important
          },
        },
        {
          $match: {
            'component.deletedAt': null,
            $expr: {
              $in: ['$supplierLinkedRole', '$component.supplierRoles'],
            },
          },
        },
        // Lookup latest version per record using isLatest + submittedAt logic
        // Rules:
        // - supplier drafts (isSubmitted=false) are excluded — not visible until submitted
        // - company versions always included (temp values, approved copies, manual submits)
        // - winner: supplier submittedAt > company createdAt → supplier (new pending after approval)
        // - winner: company createdAt >= supplier submittedAt → company (approved copy is final)
        {
          $lookup: {
            from: 'impactCategoryVersion',
            let: { recordId: '$_id' },
            pipeline: [
              // Step 1: only isLatest=true, exclude supplier drafts
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$impactCategoryRecordId', '$$recordId'] },
                      { $in: ['$versionOwner', ['supplier', 'company']] },
                      { $eq: ['$isLatest', true] },
                      { $eq: ['$deletedAt', null] },
                      {
                        $or: [
                          // company versions always visible
                          { $eq: ['$versionOwner', 'company'] },
                          // supplier only visible when submitted
                          {
                            $and: [
                              { $eq: ['$versionOwner', 'supplier'] },
                              { $eq: ['$isSubmitted', true] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'versions',
          },
        },

        // Step 2: extract company and supplier candidates separately
        {
          $addFields: {
            companyLatest: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$versions',
                    as: 'v',
                    cond: { $eq: ['$$v.versionOwner', 'company'] },
                  },
                },
                0,
              ],
            },
            supplierLatest: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$versions',
                    as: 'v',
                    cond: { $eq: ['$$v.versionOwner', 'supplier'] },
                  },
                },
                0,
              ],
            },
          },
        },

        // Step 3: pick winner for the public environmental profile.
        // Public view shows only the committed/approved state, so a pending
        // supplier submission must NOT override the company's last submit.
        // Since an approval creates a new company-owned copy (versionOwner:
        // 'company', dataSource: 'supplier'), the submitted companyLatest
        // already captures both own submits and approved supplier copies.
        // Prefer companyLatest whenever it exists and is submitted; only fall
        // back to supplierLatest when no company version exists at all.
        {
          $addFields: {
            resolvedVersion: {
              $cond: {
                if: {
                  $and: [
                    { $ifNull: ['$companyLatest', false] },
                    { $eq: ['$companyLatest.isSubmitted', true] },
                  ],
                },
                then: '$companyLatest',
                else: '$supplierLatest',
              },
            },
          },
        },

        // Normalize quantity + unit from resolved version
        {
          $addFields: {
            resolvedQuantity: {
              $ifNull: [
                '$resolvedVersion.quantity',
                '$resolvedVersion.tempQuantity',
              ],
            },
            resolvedUnit: {
              $ifNull: ['$resolvedVersion.unit', '$resolvedVersion.tempUnit'],
            },
            // Defensive guard: only company-owned submitted versions count
            // toward the public sum. A pending supplier version is never the
            // resolved version here (winner logic prefers companyLatest), but
            // this keeps the sum correct if that ever changes.
            isFinalizedForSum: {
              $and: [
                { $eq: ['$resolvedVersion.versionOwner', 'company'] },
                { $eq: ['$resolvedVersion.isSubmitted', true] },
                { $ne: ['$resolvedVersion.isRejected', true] },
                {
                  $ne: [
                    {
                      $ifNull: [
                        '$resolvedVersion.quantity',
                        '$resolvedVersion.tempQuantity',
                      ],
                    },
                    null,
                  ],
                },
              ],
            },
          },
        },

        // Group by category — sum only finalized quantities
        {
          $group: {
            _id: '$impactCategory',

            // Only sum values that are submitted and not rejected
            // Excludes unsubmitted drafts and rejected versions
            totalValue: {
              $sum: {
                $cond: ['$isFinalizedForSum', '$resolvedQuantity', 0],
              },
            },

            unit: {
              $first: '$resolvedUnit',
            },

            isImpactPresent: {
              $max: {
                $cond: [
                  { $eq: ['$resolvedVersion.isImpactPresent', true] },
                  1,
                  0,
                ],
              },
            },

            // prefer 'database' dataSource over others if any record has it
            hasDatabase: {
              $max: {
                $cond: [
                  { $eq: ['$resolvedVersion.dataSource', 'database'] },
                  1,
                  0,
                ],
              },
            },

            anyDataSource: {
              $first: '$resolvedVersion.dataSource',
            },
          },
        },

        {
          $addFields: {
            dataSource: {
              $cond: [
                { $eq: ['$hasDatabase', 1] },
                'database',
                '$anyDataSource',
              ],
            },
          },
        },
      ]);

    const formattedSummary: Partial<
      Record<
        'carbon' | 'water' | 'land',
        {
          value: string;
          unit: string;
          isImpactPresent: boolean;
          averageComparison: string | null | undefined;
          dataSource: string | null;
        }
      >
    > = {};

    impactSummaryData.forEach((item) => {
      const defaultUnit =
        item._id === 'carbon'
          ? 'kg CO2-eq/unit'
          : item._id === 'water'
            ? 'm3/unit'
            : 'm2/unit';

      formattedSummary[item._id] = {
        value: this.unitConversions.toDecimalString(item.totalValue ?? 0),
        unit: item.unit ?? defaultUnit,
        isImpactPresent:
          item._id === 'carbon' ? true : Boolean(item.isImpactPresent),
        averageComparison: null,
        dataSource: item.dataSource ?? null,
      };
    });

    // AverageComparison logic
    const categories = ['carbon', 'water', 'land'];

    categories.forEach((type) => {
      if (!formattedSummary[type]) return;

      const presentableQuantity = formattedSummary[type]?.value;
      const benchmarkValue = result.impactBenchMarking?.[type];

      let averageComparison;

      if (
        benchmarkValue &&
        benchmarkValue !== 0 &&
        presentableQuantity != null
      ) {
        const numericQuantity = Number(presentableQuantity);
        const difference =
          ((numericQuantity - benchmarkValue) / benchmarkValue) * 100;

        if (difference > 20) {
          averageComparison = `${difference.toFixed(0)}%`;
        } else if (difference < -20) {
          averageComparison = `${difference.toFixed(0)}%`;
        } else {
          averageComparison = `${difference.toFixed(0)}% Similar`;
        }
      }

      formattedSummary[type].averageComparison = averageComparison;
    });

    const resultObj = result.toObject();

    // If aggregate returns nothing, all roles have been deleted — no data is valid anymore
    if (impactSummaryData.length === 0) {
      resultObj.impactCategoryPublishStatus = {
        carbon: false,
        water: false,
        land: false,
      };
    }

    return {
      ...resultObj,
      impactSummary: formattedSummary,
    };
  }

  // Get product details
  async getProductDetails(productId: string) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ProductNotFoundError('Product not found', {
        productId,
      });
    }

    return product;
  }

  // Add component for the product
  async addComponent(
    productId: string,
    dto: AddComponentDto,
    companyId: string,
    isNewComponent: boolean,
  ) {
    // Validate product exists
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ProductNotFoundError('Product not found');
    }

    // Single query to find existing component
    const existingComponent = await this.componentRepository.findOne({
      internalSku: dto.internalSku,
    });

    // Check existing component based on isNewComponent:
    // If new: error if same company already has this SKU
    // If existing: error if component belongs to another company
    if (existingComponent) {
      if (
        isNewComponent &&
        existingComponent.createdBy.toString() === companyId
      ) {
        throw new ProductAlreadyExistsError(
          'Internal SKU already exists for the component',
        );
      }

      if (
        !isNewComponent &&
        existingComponent.createdBy.toString() !== companyId
      ) {
        throw new ProductAlreadyExistsError(
          'Component belongs to another company',
        );
      }
    }

    // Create the component
    const component = await this.componentRepository.create({
      name: dto.name,
      internalSku: dto.internalSku,
      productId: new Types.ObjectId(productId),
      createdBy: companyId,
    });

    return { component };
  }

  // Search by name or SKU, return unique components by internalSku
  async searchComponents(query: string, companyId: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }
    const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.componentRepository.aggregate([
      {
        $match: {
          createdBy: companyId,
          $or: [
            { internalSku: { $regex: escapedQuery, $options: 'i' } },
            { name: { $regex: escapedQuery, $options: 'i' } },
          ],
        },
      },
      {
        $group: {
          _id: '$internalSku',
          component: { $first: '$$ROOT' },
        },
      },
      {
        $replaceRoot: { newRoot: '$component' },
      },
    ]);
  }

  // Add supplier for componet
  async addSupplierWithDetailsForComponent(
    componentId: string,
    companyId: string,
    dto: AddSupplierWithDetailsDto,
  ) {
    const component = await this.componentRepository.findOne({
      _id: componentId,
      createdBy: companyId,
    });
    if (!component) {
      throw new ComponentNotFoundError('Component not found');
    }

    /*
     * If no supplierId provided, check if this company has already added a
     * supplier with the same email. Only block if the supplier is a portal user
     * (they should be added via supplierId). Off-portal suppliers are allowed
     * to be re-used across components via the "add from existing" flow.
     */
    if (!dto.supplierId) {
      const duplicateSupplier = await this.componentRepository.findOne({
        createdBy: companyId,
        supplierContactEmail: dto.supplierContactEmail.toLowerCase(),
        _id: { $ne: componentId },
      });

      if (duplicateSupplier) {
        const supplierExistsAsUser = await this.userRepository.findOne({
          email: dto.supplierContactEmail.toLowerCase(),
          deletedAt: null,
        });

        if (supplierExistsAsUser) {
          throw new BadRequestError(
            'This supplier is already added by company. Please add from existing suppliers.',
          );
        }
      }
    }

    // Validate supplier role slugs exist and are active (DB-level truth)
    const validRoles = await this.supplierRolesRepository.find({
      supplierRoleSlug: { $in: dto.supplierRoles },
    });

    if (validRoles.length !== dto.supplierRoles.length) {
      throw new BadRequestError('Invalid supplier roles');
    }

    const {
      supplierName,
      companyRegistrationNumber,
      supplierRoles,
      supplierContactName,
      supplierContactEmail,
      supplierId,
      ...roleDetailsDto
    } = dto;

    const assignedRoleSlugs = supplierRoles;
    const requestedSections = Object.keys(roleDetailsDto);

    // Check invalid section data
    const invalidSections = requestedSections.filter(
      (section) => !assignedRoleSlugs.includes(section),
    );
    if (invalidSections.length > 0) {
      throw new BadRequestError(
        `Can not add details for unassigned roles: ${invalidSections.join(', ')}`,
      );
    }

    // Check missing data for roles
    const missingSections = assignedRoleSlugs.filter(
      (role) => !requestedSections.includes(role),
    );
    if (missingSections.length > 0) {
      throw new BadRequestError(
        `All assigned roles must have data provided. Missing data for: ${missingSections.join(', ')}`,
      );
    }

    // Build update query
    const updatePayload: UpdateQuery<Component> = {
      supplierName,
      companyRegistrationNumber,
      supplierRoles,
      supplierContactName,
      supplierContactEmail,
      ...roleDetailsDto,
      updatedBy: companyId,
    };

    // Check if supplierContactEmail belongs to an existing user
    const existingUser = await this.userRepository.findOne({
      email: supplierContactEmail.toLowerCase(),
      deletedAt: null,
    });

    if (existingUser) {
      const role = await this.roleRepository.findById(existingUser.role);

      if (!role) {
        throw new RoleNotFoundError('User role not found');
      }

      // ONLY handle company_user specially
      if (role.roleSlug === 'company_user') {
        const requestedProductId = await this.validateCompanyUserProductAccess(
          existingUser._id.toString(),
          component.name,
          supplierContactEmail,
        );

        updatePayload.supplierId = existingUser._id;
        updatePayload.supplierType = 'company';
        updatePayload.requestedProductId = requestedProductId;
      }

      // For ALL other roles
      else if (supplierId) {
        updatePayload.supplierId = new Types.ObjectId(supplierId);
      }
    }

    // No existing user → fallback
    else if (supplierId) {
      updatePayload.supplierId = new Types.ObjectId(supplierId);
    }

    // Update component
    const supplier = await this.componentRepository.update(
      { _id: componentId, createdBy: companyId },
      { $set: updatePayload },
    );

    return supplier;
  }

  async updateProductDetails(
    productId: string,
    updateProductDetailsDto: UpdateProductDto,
    companyId: string,
  ) {
    const companyObjectId = new Types.ObjectId(companyId);
    const updatePayload: any = {};

    // Fetch existing product to compare benchmark-relevant fields before update
    const existingProduct = await this.productRepository.findOne({
      _id: productId,
      deletedAt: null,
    });

    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    // Only check if user is updating SKU.
    if (updateProductDetailsDto.internalSku !== undefined) {
      const existingSku = await this.productRepository.findOne({
        internalSku: updateProductDetailsDto.internalSku,
        companyId: companyObjectId,
        _id: { $ne: productId }, // Exclude current product
      });

      if (existingSku) {
        throw new ProductAlreadyExistsError('SKU already exists', {
          sku: updateProductDetailsDto.internalSku,
        });
      }
    }

    // Only check if user is updating GSTIN.
    if (updateProductDetailsDto.gstin !== undefined) {
      const existingGstin = await this.productRepository.findOne({
        gstin: updateProductDetailsDto.gstin,
        _id: { $ne: productId }, // Exclude current product
      });

      if (existingGstin) {
        throw new ProductAlreadyExistsError('GSTIN already exists', {
          gstin: updateProductDetailsDto.gstin,
        });
      }
    }

    // Add only the fields that user has provided.
    for (const key in updateProductDetailsDto) {
      if (updateProductDetailsDto[key] !== undefined) {
        updatePayload[key] = updateProductDetailsDto[key];
      }
    }

    // Perform update
    const result = await this.productRepository.update(
      { _id: productId, deletedAt: null },
      { $set: updatePayload },
    );

    if (!result) {
      throw new NotFoundError('Product not found');
    }

    // Non-blocking: recalculate benchmarking if any benchmark-relevant field changed
    const benchmarkFields = [
      'netSize',
      'unit',
      'comparisonProductDescription',
    ] as const;
    const hasBenchmarkChange = benchmarkFields.some(
      (field) =>
        updateProductDetailsDto[field] !== undefined &&
        updateProductDetailsDto[field] !== existingProduct[field],
    );

    if (hasBenchmarkChange) {
      const resolvedUnit = updateProductDetailsDto.unit ?? existingProduct.unit;
      const resolvedCustomUnit =
        updateProductDetailsDto.customUnit ?? existingProduct.customUnit;

      setImmediate(() => {
        this.calculateAndSaveImpactBenchMarking(productId, {
          productName: updateProductDetailsDto.name ?? existingProduct.name,
          productCategory:
            updateProductDetailsDto.category ?? existingProduct.category,
          productSize: String(
            updateProductDetailsDto.netSize ?? existingProduct.netSize,
          ),
          productUnit:
            resolvedUnit === 'Other'
              ? (resolvedCustomUnit ?? resolvedUnit)
              : resolvedUnit,
          comparisonProductDescription:
            updateProductDetailsDto.comparisonProductDescription ??
            existingProduct.comparisonProductDescription,
        });
      });
    }

    return result;
  }

  // Search supplier by name
  async searchSuppliers(query: string, companyId: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Component pipeline
    const componentPipeline = [
      {
        $match: {
          deletedAt: null,
          createdBy: companyId,
          supplierName: { $regex: escapedQuery, $options: 'i' },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$companyRegistrationNumber',
          supplierId: { $first: '$supplierId' },
          supplierName: { $first: '$supplierName' },
          supplierContactName: { $first: '$supplierContactName' },
          supplierContactEmail: { $first: '$supplierContactEmail' },
          companyRegistrationNumber: { $first: '$companyRegistrationNumber' },
          supplierRoles: { $first: '$supplierRoles' },
          createdAt: { $first: '$createdAt' },
        },
      },
      {
        $project: {
          _id: 0,
          supplierId: 1,
          supplierName: 1,
          supplierContactName: 1,
          supplierContactEmail: 1,
          companyRegistrationNumber: 1,
          supplierRoles: 1,
          createdAt: 1,
        },
      },
    ];

    // User pipeline
    const userPipeline = [
      {
        $match: {
          deletedAt: null,
          isEmailVerified: true,
          'companyDetails.name': { $regex: trimmedQuery, $options: 'i' },
        },
      },
      { $sort: { createdAt: -1 } },

      {
        $group: {
          _id: '$companyDetails.registrationNumber',
          supplierId: { $first: '$_id' },
          supplierName: { $first: '$companyDetails.name' },
          supplierContactName: { $first: '$name' },
          supplierContactEmail: { $first: '$email' },
          companyRegistrationNumber: {
            $first: '$companyDetails.registrationNumber',
          },
          createdAt: { $first: '$createdAt' },
        },
      },

      {
        $project: {
          _id: 0,
          supplierId: 1,
          supplierName: 1,
          supplierContactName: 1,
          supplierContactEmail: 1,
          companyRegistrationNumber: 1,
          supplierRoles: [],
          createdAt: 1,
        },
      },
    ];

    // Run both queries in parallel
    const [componentResults, userResults] = await Promise.all([
      this.componentRepository.aggregate(componentPipeline),
      this.userRepository.aggregate(userPipeline),
    ]);

    // Merge results
    const combinedMap = new Map<string, any>();

    // Insert component results first
    for (const supplier of componentResults) {
      const key = supplier.supplierId
        ? `id-${supplier.supplierId}`
        : `component-${supplier.createdAt}-${supplier.supplierName}`;

      combinedMap.set(key, supplier);
    }

    // Insert user results (deduplicate only by supplierId)
    for (const supplier of userResults) {
      const key = `id-${supplier.supplierId}`;

      if (!combinedMap.has(key)) {
        combinedMap.set(key, supplier);
      }
    }

    const combinedResults = Array.from(combinedMap.values());

    // Sort by latest createdAt
    combinedResults.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Limit to 10
    return combinedResults.slice(0, 10);
  }

  // Add supplier role details
  async updateSupplierRoles(
    componentId: string,
    updateDto: UpdateSupplierDetailsDto,
    companyId: string,
  ) {
    // Find component by ID and user using BaseRepository's findOne
    const component = await this.componentRepository.findOne({
      _id: componentId,
      createdBy: companyId,
    });
    if (!component) {
      throw new ComponentNotFoundError('Component not found');
    }

    const assignedRoleSlugs = component.supplierRoles ?? [];
    const requestedSections = Object.keys(updateDto);

    // Check for invalid sections (user providing data for unassigned roles)
    const invalidSections = requestedSections.filter(
      (section) => !assignedRoleSlugs.includes(section),
    );
    if (invalidSections.length > 0) {
      throw new BadRequestError(
        `Cannot add details for unassigned roles: ${invalidSections.join(', ')}`,
      );
    }

    // Check if all assigned roles have data provided
    const missingSections = assignedRoleSlugs.filter(
      (section) => !requestedSections.includes(section),
    );
    if (missingSections.length > 0) {
      throw new BadRequestError(
        `All assigned roles must have data provided. Missing data for: ${missingSections.join(', ')}`,
      );
    }

    // Build update fields dynamically
    const updateFields = requestedSections.reduce(
      (acc, key) => {
        acc[key] = updateDto[key];
        return acc;
      },
      {} as Record<string, any>,
    );

    // Update using BaseRepository's update method
    return this.componentRepository.update(
      { _id: componentId, createdBy: companyId },
      { $set: updateFields },
    );
  }

  async removeSupplierRoleFromComponent(
    productId: string,
    componentId: string,
    userId: string,
    supplierRoleSlug: string,
  ) {
    // Validate supplier role exists
    const supplierRole = await this.supplierRolesRepository.findOne({
      supplierRoleSlug,
    });

    if (!supplierRole) {
      throw new NotFoundError(
        `No data found for supplier role: ${supplierRoleSlug}`,
      );
    }

    // Ensure component exists
    const component = await this.componentRepository.findOne({
      _id: componentId,
      createdBy: userId,
      productId: new Types.ObjectId(productId),
      deletedAt: null,
    });

    if (!component) {
      throw new ComponentNotFoundError('Component not found');
    }

    if (!component.supplierRoles?.includes(supplierRoleSlug)) {
      throw new NotFoundError(
        `Supplier role '${supplierRoleSlug}' is not assigned to this component`,
      );
    }

    // Dynamic field keys
    const roleFieldKey = supplierRoleSlug;
    const roleDetailsFieldKey = `${supplierRoleSlug}Details`;

    const session =
      await this.impactCategoryRecordRepository.startTransaction();

    try {
      const updatedComponent = await this.componentRepository.update(
        {
          _id: componentId,
          createdBy: userId,
          productId: new Types.ObjectId(productId),
        },
        {
          // Remove slug from array
          $pull: {
            supplierRoles: supplierRoleSlug,
          },

          // Remove dynamic fields
          $unset: {
            [roleFieldKey]: 1,
            [roleDetailsFieldKey]: 1,
          },
        },
        session,
      );

      if (!updatedComponent) {
        throw new ComponentNotFoundError('Failed to update component');
      }

      // Fetch record IDs to cascade delete request and version docs
      const impactCategoryRecords =
        await this.impactCategoryRecordRepository.find({
          componentId: new Types.ObjectId(componentId),
          supplierLinkedRole: supplierRoleSlug,
        });

      const recordIds = impactCategoryRecords.map((r: any) => r._id);

      if (recordIds.length > 0) {
        await this.impactCategoryRequestRepository.deleteMany(
          { impactCategoryRecordId: { $in: recordIds } },
          session,
        );

        await this.impactCategoryVersionRepository.deleteMany(
          { impactCategoryRecordId: { $in: recordIds } },
          session,
        );
      }

      await this.impactCategoryRecordRepository.deleteMany(
        {
          componentId: new Types.ObjectId(componentId),
          supplierLinkedRole: supplierRoleSlug,
        },
        session,
      );

      // If no other records remain for this product, reset impactCategoryPublishStatus
      const hasOtherRecords = await this.impactCategoryRecordRepository.exists({
        productId: new Types.ObjectId(productId),
        isActive: true,
        _id: { $nin: recordIds },
      });

      if (!hasOtherRecords) {
        await this.productRepository.update(
          { _id: new Types.ObjectId(productId) },
          {
            $set: {
              'impactCategoryPublishStatus.carbon': false,
              'impactCategoryPublishStatus.water': false,
              'impactCategoryPublishStatus.land': false,
              publishStatus: 'pending',
            },
          },
          session,
        );
      }

      await this.impactCategoryRecordRepository.commitTransaction(session);
    } catch (error) {
      await this.impactCategoryRecordRepository.abortTransaction(session);
      throw error;
    }

    return {
      success: true,
      message: `Supplier role '${supplierRoleSlug}' removed successfully`,
    };
  }

  async fetchSuppliersListForComponent(
    userId: string,
    userRoleSlug: string,
    productId: string,
    limit = 10,
    page = 1,
  ) {
    const productObjectId = new Types.ObjectId(productId);
    const companyObjectId = new Types.ObjectId(userId);

    limit = limit > 0 ? limit : 10;
    page = page > 0 ? page : 1;
    const skip = (page - 1) * limit;

    // Validate Product
    const productFilter: any = {
      _id: productObjectId,
      deletedAt: null,
    };

    if (userRoleSlug !== 'admin_user') {
      productFilter.companyId = companyObjectId;
    }

    const product = await this.productRepository.findOne(productFilter);
    if (!product) {
      throw new ProductNotFoundError('Product not found');
    }

    // Aggregation Pipeline
    const result = await this.componentRepository.aggregate([
      {
        $match: {
          productId: productObjectId,
          deletedAt: null,
          supplierName: { $ne: null },
        },
      },

      // Separate row per supplierRole
      { $unwind: '$supplierRoles' },

      // Lookup Supplier Role Master

      {
        $lookup: {
          from: 'supplierRoles',
          let: { roleSlug: '$supplierRoles' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$supplierRoleSlug', '$$roleSlug'] },
              },
            },
          ],
          as: 'roleData',
        },
      },
      {
        $unwind: {
          path: '$roleData',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup Impact Record

      {
        $lookup: {
          from: 'impactCategoryRecord',
          let: {
            componentId: '$_id',
            roleSlug: '$supplierRoles',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$componentId', '$$componentId'] },
                    { $eq: ['$supplierLinkedRole', '$$roleSlug'] },
                    { $eq: ['$deletedAt', null] },
                  ],
                },
              },
            },
          ],
          as: 'impactRecords',
        },
      },

      // ─── REWRITTEN LOOKUP ───────────────────────────────────────────
      {
        $lookup: {
          from: 'impactCategoryVersion',
          let: { recordIds: '$impactRecords._id' },
          pipeline: [
            // Step 1: only isLatest=true records for both owners
            /* 
              Supplier drafts (isSubmitted=false) are excluded —
              they must not be visible on the company side until submitted.
              Company versions are always included regardless of isSubmitted.
            */
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$impactCategoryRecordId', '$$recordIds'] },
                    { $in: ['$versionOwner', ['supplier', 'company']] },
                    { $eq: ['$isLatest', true] },
                    { $eq: ['$deletedAt', null] },
                    {
                      $or: [
                        { $eq: ['$versionOwner', 'company'] },
                        {
                          $and: [
                            { $eq: ['$versionOwner', 'supplier'] },
                            { $eq: ['$isSubmitted', true] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },

            // Step 2: group per category, collect both candidates
            {
              $group: {
                _id: {
                  recordId: '$impactCategoryRecordId',
                  impactCategory: '$impactCategory',
                },
                versions: { $push: '$$ROOT' },
              },
            },

            // Step 3: extract company and supplier candidates separately
            {
              $addFields: {
                companyLatest: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$versions',
                        as: 'v',
                        cond: { $eq: ['$$v.versionOwner', 'company'] },
                      },
                    },
                    0,
                  ],
                },
                supplierLatest: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$versions',
                        as: 'v',
                        cond: { $eq: ['$$v.versionOwner', 'supplier'] },
                      },
                    },
                    0,
                  ],
                },
              },
            },

            // Step 4: pick winner
            // Rule 1: only supplier exists (pending, never approved) → supplier
            // Rule 2: only company exists (manual/db submit or rejected+own) → company
            // Rule 3: both exist, supplier newer than company → supplier (new pending after approval)
            // Rule 4: both exist, company newer than supplier → company (approved copy is final)
            {
              $addFields: {
                selectedVersion: {
                  $cond: {
                    if: {
                      $and: [
                        { $ifNull: ['$supplierLatest', false] },
                        { $ifNull: ['$companyLatest', false] },
                        {
                          $gt: [
                            '$supplierLatest.submittedAt',
                            '$companyLatest.createdAt',
                          ],
                        },
                      ],
                    },
                    then: '$supplierLatest',
                    else: {
                      $cond: {
                        if: { $ifNull: ['$companyLatest', false] },
                        then: '$companyLatest',
                        else: '$supplierLatest',
                      },
                    },
                  },
                },
              },
            },

            { $replaceRoot: { newRoot: '$selectedVersion' } },
          ],
          as: 'versions',
        },
      },
      // ────────────────────────────────────────────────────────────────

      // Separate lookup for company versions (not affected by winner selection)
      {
        $lookup: {
          from: 'impactCategoryVersion',
          let: { recordIds: '$impactRecords._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$impactCategoryRecordId', '$$recordIds'] },
                    { $eq: ['$versionOwner', 'company'] },
                    { $eq: ['$isLatest', true] },
                    { $eq: ['$deletedAt', null] },
                  ],
                },
              },
            },
          ],
          as: 'companyVersions',
        },
      },

      // Count Submitted
      {
        $addFields: {
          requestedCategoryCount: { $size: '$impactRecords' },
          submittedCount: {
            $size: {
              $filter: {
                input: '$companyVersions',
                as: 'v',
                cond: {
                  $and: [
                    { $ne: ['$$v', null] },
                    { $ne: ['$$v.isRejected', true] },
                    { $eq: ['$$v.isSubmitted', true] },
                  ],
                },
              },
            },
          },
        },
      },

      {
        $addFields: {
          companySavedCount: {
            $size: {
              $filter: {
                input: '$companyVersions',
                as: 'v',
                cond: {
                  $and: [
                    { $ne: ['$$v', null] },
                    { $ne: ['$$v.isSubmitted', true] },
                    { $ne: ['$$v.tempQuantity', null] },
                  ],
                },
              },
            },
          },
        },
      },

      {
        $addFields: {
          // Derive submission lifecycle status based on category counts
          submissionStatus: {
            $switch: {
              branches: [
                // No categories exist for the request
                {
                  case: { $eq: ['$requestedCategoryCount', 0] },
                  then: 'pending',
                },
                // All categories are saved/drafted but none are submitted
                {
                  case: {
                    $and: [
                      {
                        $eq: ['$requestedCategoryCount', '$companySavedCount'],
                      },
                      { $eq: ['$submittedCount', 0] },
                    ],
                  },
                  then: 'ready',
                },
                // No items have been submitted
                {
                  case: { $eq: ['$submittedCount', 0] },
                  then: 'pending',
                },
                // All requested categories are submitted
                {
                  case: {
                    $eq: ['$submittedCount', '$requestedCategoryCount'],
                  },
                  then: 'submitted',
                },
                // More than zero but less than the total count submitted
                {
                  case: {
                    $and: [
                      { $gt: ['$submittedCount', 0] },
                      { $lt: ['$submittedCount', '$requestedCategoryCount'] },
                    ],
                  },
                  then: 'partial',
                },
              ],
              default: 'partial',
            },
          },
        },
      },

      {
        $addFields: {
          latestImpactCreatedAt: {
            $max: {
              $map: {
                input: {
                  $filter: {
                    input: '$versions',
                    as: 'v',
                    cond: {
                      $or: [
                        { $eq: ['$$v.isSubmitted', true] },
                        { $eq: ['$$v.isRejected', true] },
                      ],
                    },
                  },
                },
                as: 'v',
                in: '$$v.createdAt',
              },
            },
          },
        },
      },

      // Build impacts from the already-selected versions (one per category)
      {
        $addFields: {
          impacts: {
            carbon: {
              $let: {
                vars: {
                  version: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$versions',
                          as: 'v',
                          cond: { $eq: ['$$v.impactCategory', 'carbon'] },
                        },
                      },
                      0,
                    ],
                  },
                },
                in: {
                  $cond: [
                    { $ifNull: ['$$version', false] },
                    {
                      quantity: {
                        $ifNull: [
                          '$$version.quantity',
                          '$$version.tempQuantity',
                        ],
                      },
                      unit: {
                        $ifNull: ['$$version.unit', '$$version.tempUnit'],
                      },
                      lciaMethodology: {
                        $ifNull: [
                          '$$version.lciaMethodology',
                          '$$version.tempLciaMethodology',
                        ],
                      },
                      isSubmitted: {
                        $or: [
                          '$$version.isSubmitted',
                          { $eq: ['$$version.isRejected', true] },
                        ],
                      },
                      isImpactPresent: '$$version.isImpactPresent',
                      isProspective: {
                        $ifNull: ['$$version.isProspective', false],
                      },
                    },
                    null,
                  ],
                },
              },
            },

            water: {
              $let: {
                vars: {
                  version: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$versions',
                          as: 'v',
                          cond: { $eq: ['$$v.impactCategory', 'water'] },
                        },
                      },
                      0,
                    ],
                  },
                },
                in: {
                  $cond: [
                    { $ifNull: ['$$version', false] },
                    {
                      quantity: {
                        $ifNull: [
                          '$$version.quantity',
                          '$$version.tempQuantity',
                        ],
                      },
                      unit: {
                        $ifNull: ['$$version.unit', '$$version.tempUnit'],
                      },
                      lciaMethodology: {
                        $ifNull: [
                          '$$version.lciaMethodology',
                          '$$version.tempLciaMethodology',
                        ],
                      },
                      isSubmitted: {
                        $or: [
                          '$$version.isSubmitted',
                          { $eq: ['$$version.isRejected', true] },
                        ],
                      },
                      isImpactPresent: '$$version.isImpactPresent',
                      isProspective: {
                        $ifNull: ['$$version.isProspective', false],
                      },
                    },
                    null,
                  ],
                },
              },
            },

            land: {
              $let: {
                vars: {
                  version: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$versions',
                          as: 'v',
                          cond: { $eq: ['$$v.impactCategory', 'land'] },
                        },
                      },
                      0,
                    ],
                  },
                },
                in: {
                  $cond: [
                    { $ifNull: ['$$version', false] },
                    {
                      quantity: {
                        $ifNull: [
                          '$$version.quantity',
                          '$$version.tempQuantity',
                        ],
                      },
                      unit: {
                        $ifNull: ['$$version.unit', '$$version.tempUnit'],
                      },
                      lciaMethodology: {
                        $ifNull: [
                          '$$version.lciaMethodology',
                          '$$version.tempLciaMethodology',
                        ],
                      },
                      isSubmitted: {
                        $or: [
                          '$$version.isSubmitted',
                          { $eq: ['$$version.isRejected', true] },
                        ],
                      },
                      isImpactPresent: '$$version.isImpactPresent',
                      isProspective: {
                        $ifNull: ['$$version.isProspective', false],
                      },
                    },
                    null,
                  ],
                },
              },
            },
          },
        },
      },

      {
        $addFields: {
          componentCreatedAt: '$createdAt',
        },
      },

      // Final Projection
      {
        $project: {
          productId: productId,
          supplierName: 1,
          isProspective: 1,
          componentId: '$_id',
          componentName: '$name',
          supplierRole: {
            $ifNull: ['$roleData.role', '$supplierRoles'],
          },
          supplierRoleSlug: '$supplierRoles',
          submissionStatus: 1,
          createdAt: {
            $cond: {
              if: { $ifNull: ['$latestImpactCreatedAt', false] },
              then: '$latestImpactCreatedAt',
              else: null,
            },
          },
          benchmarkingData: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$supplierRoles', 'rawMaterialSupplier'] },
                  then: '$rawMaterialSupplierDetails.benchmarkingData',
                },
                {
                  case: { $eq: ['$supplierRoles', 'transportFreight'] },
                  then: '$transportFreightDetails.benchmarkingData',
                },
                {
                  case: { $eq: ['$supplierRoles', 'storageFulfilment'] },
                  then: '$storageFulfilmentDetails.benchmarkingData',
                },
                {
                  case: { $eq: ['$supplierRoles', 'packagingManufacturer'] },
                  then: '$packagingManufacturerDetails.benchmarkingData',
                },
                {
                  case: { $eq: ['$supplierRoles', 'cpgBrand'] },
                  then: '$cpgBrandDetails.benchmarkingData',
                },
                {
                  case: { $eq: ['$supplierRoles', 'retailer'] },
                  then: '$retailerDetails.benchmarkingData',
                },
                {
                  case: { $eq: ['$supplierRoles', 'contractManufacturer'] },
                  then: '$contractManufacturerDetails.benchmarkingData',
                },
              ],
              default: null,
            },
          },
          // NEW FIELD
          transportFreight: {
            $cond: {
              if: { $eq: ['$supplierRoles', 'transportFreight'] },
              then: '$transportFreight',
              else: null,
            },
          },
          impacts: 1,
          componentCreatedAt: 1,
        },
      },

      { $sort: { componentCreatedAt: -1 } },

      // Pagination + Total Count Together

      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ]);

    const total = result[0]?.metadata[0]?.total || 0;
    const results = result[0]?.data || [];

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      results,
    };
  }

  // Complete supplier details
  async completeSupplierDetails(
    componentId: string,
    updateDto: CompleteSupplierDetailsDto,
    companyId: string,
  ) {
    // 1. Find component
    const component = await this.componentRepository.findOne({
      _id: componentId,
      createdBy: companyId,
    });
    if (!component) {
      throw new ComponentNotFoundError('Component not found');
    }

    // 2. Build allowed DETAILS sections from assigned roles
    const assignedRoleSlugs = component.supplierRoles ?? [];
    const allowedDetailsSections = new Set(
      assignedRoleSlugs.map((slug) => `${slug}Details`),
    );

    // 3. Validate requested sections
    const requestedSections = Object.keys(updateDto);

    // User trying to write data for unassigned roles
    const invalidSections = requestedSections.filter(
      (section) => !allowedDetailsSections.has(section),
    );

    if (invalidSections.length > 0) {
      throw new BadRequestError(
        `Can not add environmental data for unassigned roles: ${invalidSections.join(', ')}`,
      );
    }

    // 4. Extra validation for Contract Manufacturer
    if (updateDto.contractManufacturerDetails) {
      const selectedActivities = (component.contractManufacturer
        ?.manufacturingActivityTypes ??
        []) as ContractManufacturingActivityType[];

      const requestedActivities = Object.keys(
        updateDto.contractManufacturerDetails,
      ) as ContractManufacturingActivityType[];

      // Reject extra activities
      const invalidActivities = requestedActivities.filter(
        (activity) => !selectedActivities.includes(activity),
      );

      if (invalidActivities.length > 0) {
        throw new BadRequestError(
          `Details provided for unselected manufacturing activities: ${invalidActivities.join(', ')}`,
        );
      }

      // Reject missing activities
      const missingActivities = selectedActivities.filter(
        (activity) => !requestedActivities.includes(activity),
      );

      if (missingActivities.length > 0) {
        throw new BadRequestError(
          `Missing details for selected manufacturing activities: ${missingActivities.join(', ')}`,
        );
      }
    }

    // Build PARTIAL update object (dot-notation, no overwrite)
    const updateFields: Record<string, any> = {};

    for (const section of requestedSections) {
      if (!allowedDetailsSections.has(section)) continue;

      const sectionData = updateDto[section];
      if (!sectionData || typeof sectionData !== 'object') continue;

      const stack: Array<{ value: any; path: string }> = [
        { value: sectionData, path: section },
      ];

      while (stack.length) {
        const { value, path } = stack.pop()!;

        for (const [key, val] of Object.entries(value)) {
          const currentPath = `${path}.${key}`;

          if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
            stack.push({ value: val, path: currentPath });
          } else {
            updateFields[currentPath] = val;
          }
        }
      }
    }

    if (Object.keys(updateFields).length === 0) {
      throw new BadRequestError('No valid fields provided for update');
    }

    return this.componentRepository.update(
      { _id: componentId, createdBy: companyId },
      { $set: updateFields },
    );
  }

  async fetchComponentDetailsById(
    productId: string,
    componentId: string,
    userId: string,
    supplierRoleSlug?: string,
    roleSlug?: string,
    userRoleSlug?: string, // added for admin handling
  ) {
    let componentDetails;

    // ADMIN USER → no ownership restriction
    if (userRoleSlug === 'admin_user') {
      componentDetails = await this.componentRepository.findOne(
        {
          _id: componentId,
          deletedAt: null,
          $or: [
            { productId: new Types.ObjectId(productId) },
            { requestedProductId: new Types.ObjectId(productId) },
          ],
        },
        {
          path: 'productId requestedProductId',
          select: ['image', 'name'],
        },
      );
    } else if (roleSlug && roleSlug === 'supplier_user') {
      componentDetails = await this.componentRepository.findOne(
        {
          _id: componentId,
          productId: new Types.ObjectId(productId),
          supplierId: new Types.ObjectId(userId),
          deletedAt: null,
        },
        {
          path: 'productId',
          select: ['image', 'name'],
        },
      );
    } else if (roleSlug && roleSlug === 'company_user') {
      componentDetails = await this.componentRepository.findOne(
        {
          _id: componentId,
          productId: new Types.ObjectId(productId),
          deletedAt: null,
        },
        {
          path: 'productId',
          select: ['image', 'name'],
        },
      );
    } else {
      componentDetails = await this.componentRepository.findOne(
        {
          _id: componentId,
          productId: new Types.ObjectId(productId),
          createdBy: userId,
          deletedAt: null,
        },
        {
          path: 'productId',
          select: ['image', 'name'],
        },
      );
    }

    if (!componentDetails) {
      throw new ComponentNotFoundError('Component not found for Product');
    }

    const productImage = (componentDetails as any)?.productId?.image ?? null;
    const productName = (componentDetails as any)?.productId?.name ?? null;

    if (supplierRoleSlug) {
      let componentDetailsWithSlug: any;

      // ADMIN USER → no ownership restriction
      if (userRoleSlug === 'admin_user') {
        componentDetailsWithSlug = await this.componentRepository.findOne(
          {
            _id: componentId,
            deletedAt: null,
            $or: [
              { productId: new Types.ObjectId(productId) },
              { requestedProductId: new Types.ObjectId(productId) },
            ],
            ...(supplierRoleSlug && {
              supplierRoles: supplierRoleSlug,
            }),
          },
          {
            path: 'productId requestedProductId',
            select: ['image', 'name'],
          },
        );
      } else if (roleSlug && roleSlug === 'supplier_user') {
        componentDetailsWithSlug = await this.componentRepository.findOne(
          {
            _id: componentId,
            productId: new Types.ObjectId(productId),
            supplierId: new Types.ObjectId(userId),
            deletedAt: null,
            ...(supplierRoleSlug && {
              supplierRoles: supplierRoleSlug,
            }),
          },
          {
            path: 'productId',
            select: ['image', 'name'],
          },
        );
      } else if (roleSlug && roleSlug === 'company_user') {
        componentDetailsWithSlug = await this.componentRepository.findOne(
          {
            _id: componentId,
            productId: new Types.ObjectId(productId),
            deletedAt: null,
            ...(supplierRoleSlug && {
              supplierRoles: supplierRoleSlug,
            }),
          },
          {
            path: 'productId',
            select: ['image', 'name'],
          },
        );
      } else {
        componentDetailsWithSlug = await this.componentRepository.findOne(
          {
            _id: componentId,
            productId: new Types.ObjectId(productId),
            createdBy: userId,
            deletedAt: null,
            ...(supplierRoleSlug && {
              supplierRoles: supplierRoleSlug,
            }),
          },
          {
            path: 'productId',
            select: ['image', 'name'],
          },
        );
      }
      if (!componentDetailsWithSlug) {
        throw new NotFoundError(
          supplierRoleSlug
            ? `Supplier role '${supplierRoleSlug}' not assigned to this component`
            : 'Component not found',
        );
      }

      const supplierRole = await this.supplierRolesRepository.findOne({
        supplierRoleSlug: supplierRoleSlug,
      });

      if (!supplierRole) {
        throw new NotFoundError(
          `No data found for supplier role: ${supplierRoleSlug}`,
        );
      }
      const companyDetails = await this.userRepository.findOne({
        _id: new Types.ObjectId(componentDetailsWithSlug.createdBy),
      });

      if (!companyDetails) {
        throw new UserNotFoundError('Company user not found');
      }

      const supplierRoleSlugs: string[] = componentDetails.supplierRoles ?? [];
      const roleObjects: Record<string, any> = {};

      for (const slug of supplierRoleSlugs) {
        const roleKey = slug;
        const roleDetailsKey = `${slug}Details`;

        const roleValue = (componentDetails as any)[roleKey];
        const roleDetailsValue = (componentDetails as any)[roleDetailsKey];

        if (roleValue) {
          roleObjects[roleKey] =
            typeof roleValue === 'object' && roleValue.toObject
              ? roleValue.toObject()
              : roleValue;
        }

        if (roleDetailsValue) {
          roleObjects[roleDetailsKey] =
            typeof roleDetailsValue === 'object' && roleDetailsValue.toObject
              ? roleDetailsValue.toObject()
              : roleDetailsValue;
        }
      }

      let flattenedRoleData: Record<string, any> = {};
      let supplierRoleLabel: string | null = null;

      supplierRoleLabel = supplierRole.role;

      const roleValue = (componentDetails as any)[supplierRoleSlug];
      const roleDetailsValue = (componentDetails as any)[
        `${supplierRoleSlug}Details`
      ];

      const roleObj =
        roleValue && roleValue.toObject
          ? roleValue.toObject()
          : (roleValue ?? {});

      const roleDetailsObj =
        roleDetailsValue && roleDetailsValue.toObject
          ? roleDetailsValue.toObject()
          : (roleDetailsValue ?? {});

      flattenedRoleData = {
        ...roleObj,
        ...roleDetailsObj,
      };
      // Fetch latest request date for this component & supplier role
      const impactRecords = await this.impactCategoryRecordRepository.find({
        componentId: new Types.ObjectId(componentId),
        supplierLinkedRole: supplierRoleSlug,
      });

      let dateOfRequest;

      if (impactRecords.length) {
        const recordIds = impactRecords.map((r) => r._id);

        const latestRequest =
          await this.impactCategoryRequestRepository.findLatestRequestDate(
            recordIds,
          );

        if (latestRequest.length) {
          dateOfRequest = latestRequest[0].createdAt;
        }
      }
      // Final response
      return {
        name: componentDetails.name,
        companyRegistrationNumber: componentDetails.companyRegistrationNumber,
        productName: productName,
        requestedProductId: componentDetails.requestedProductId ?? null,
        requestSentBy: companyDetails?.companyDetails?.name,
        nameOfCompanyContact: companyDetails?.name,
        emailIdOfCompanyContact: companyDetails?.email,
        companyWebsite: companyDetails?.companyDetails?.website,
        supplierRole: supplierRoleLabel,
        supplierRoleSlug,
        ...flattenedRoleData,
        supplierName: componentDetails.supplierName,
        supplierContactName: componentDetails.supplierContactName,
        supplierContactEmail: componentDetails.supplierContactEmail,
        supplierRoles: supplierRoleSlugs,
        ...roleObjects,
        internalSku: componentDetails.internalSku,
        dateOfRequest,
      };
    } else {
      const componentObj = componentDetails.toObject();
      delete componentObj.productId;

      return {
        ...componentObj,
        image: productImage,
        productName: productName,
      };
    }
  }

  async fetchSupplierDetails(
    productId: string,
    componentId: string,
    userId: string,
    supplierRoleSlug: string,
  ) {
    const componentDetails = await this.componentRepository.findOne({
      _id: componentId,
      productId: new Types.ObjectId(productId),
      createdBy: userId,
      deletedAt: null,
    });

    const supplierRole = await this.supplierRolesRepository.findOne({
      supplierRoleSlug: supplierRoleSlug,
    });

    if (!componentDetails) {
      throw new ComponentNotFoundError('Component not found for Product');
    }

    const roleFieldKey = supplierRoleSlug;
    const roleDetailsFieldKey = `${supplierRoleSlug}Details`;

    const roleValue = (componentDetails as any)[roleFieldKey];
    const roleDetailsValue = (componentDetails as any)[roleDetailsFieldKey];

    // if (!roleValue && !roleDetailsValue) {
    //   throw new NotFoundError(
    //     `No data found for supplier role: ${supplierRoleSlug}`,
    //   );
    // }

    const roleObj =
      roleValue && typeof roleValue === 'object' && roleValue.toObject
        ? roleValue.toObject()
        : (roleValue ?? {});

    const roleDetailsObj =
      roleDetailsValue &&
      typeof roleDetailsValue === 'object' &&
      roleDetailsValue.toObject
        ? roleDetailsValue.toObject()
        : (roleDetailsValue ?? {});

    const response = {
      ...roleObj,
      ...roleDetailsObj,
      supplierRole: supplierRole?.role,
      supplierName: componentDetails.supplierName,
      supplierContactName: componentDetails.supplierContactName,
      supplierContactEmail: componentDetails.supplierContactEmail,
    };
    return response;
  }

  async saveImpactCategories(
    params: any,
    dto: AddImpactCategoryDto,
    userId: string,
    productRequested,
  ) {
    let { componentId, roleDetailsId } = params;
    const impactTypes = ['carbon', 'water', 'land'];

    let mailTriggeredMessage;
    let requestEmailSent = false;
    let shouldTriggerEmail = false;

    const user: any = await this.userRepository.findOne(
      { _id: userId },
      { path: 'role', select: 'roleSlug' },
    );

    // SUPPLIER MODE DETECTION
    let isSupplierUser = false;

    if (user.role?.roleSlug === 'supplier_user') {
      isSupplierUser = true;
    }

    if (user.role?.roleSlug === 'admin_user') {
      isSupplierUser = true;
    }

    if (user.role?.roleSlug === 'company_user' && productRequested === 'true') {
      isSupplierUser = true;
    }
    const component: any = await this.componentRepository.findOne({
      _id: componentId,
    });

    const productName = await this.productRepository.findOne({
      _id: component.productId,
    });

    const companyUser = await this.userRepository.findOne({
      _id: component.createdBy,
    });

    for (const type of impactTypes) {
      const impactData = dto[type];
      if (!impactData) continue;

      let record: any = await this.impactCategoryRecordRepository.findOne({
        productId: component.productId,
        componentId: new Types.ObjectId(componentId),
        supplierLinkedRole: dto.supplierLinkedRole,
        impactCategory: type,
      });

      if (!record) {
        record = await this.impactCategoryRecordRepository.create({
          productId: component.productId,
          companyName: companyUser?.companyDetails.name,
          componentId: new Types.ObjectId(componentId),
          roleDetailsId: new Types.ObjectId(roleDetailsId),
          supplierLinkedRole: dto.supplierLinkedRole,
          impactCategory: type,
          supplierContactName: dto.supplierContactName,
          supplierContactEmail: dto.supplierContactEmail,
          dataSource: impactData.dataSource,
          requestEmailSent: false,
        });
      }

      const versionOwner = isSupplierUser ? 'supplier' : 'company';

      // GET OR CREATE DRAFT
      let draftVersion: any =
        await this.impactCategoryVersionRepository.findOne({
          impactCategoryRecordId: record._id,
          versionOwner,
          isLatest: true,
          isSubmitted: false,
        });

      if (!draftVersion) {
        const lastVersion =
          await this.impactCategoryVersionRepository.findLatestVersion(
            record._id,
            versionOwner,
          );

        const nextVersionNumber = lastVersion
          ? lastVersion.versionNumber + 1
          : 1;

        draftVersion = await this.impactCategoryVersionRepository.create({
          impactCategoryRecordId: record._id,
          impactCategory: type,
          versionOwner,
          versionNumber: nextVersionNumber,
          isLatest: true,
          isSubmitted: false,
          createdBy: userId,
          ...(versionOwner === 'supplier' && { isProspective: false }),
        });
      }

      //  DIRECT UPDATE (NO FALLBACK)
      await this.impactCategoryVersionRepository.update(
        { _id: draftVersion._id },
        {
          quantity: impactData.quantity,
          unit: impactData.unit,
          lciaMethodology: impactData.lciaMethodology,
          dataSource: impactData.dataSource,
          tempQuantity: impactData.tempQuantity,
          tempUnit: impactData.tempUnit,
          tempLciaMethodology: impactData.tempLciaMethodology,
          offsetCarbonImpact: impactData.offsetCarbonImpact,
          offsetQuantity: impactData.offsetQuantity,
          offsetUnit: impactData.offsetUnit,
          isImpactPresent: impactData.isImpactPresent,
          audit: impactData.audit,
          updatedBy: userId,
        },
      );

      const existingRequest =
        await this.impactCategoryRequestRepository.findOne({
          impactCategoryRecordId: record._id,
          impactCategory: type,
        });

      if (impactData.isRequested === true) {
        if (!existingRequest) {
          await this.impactCategoryRequestRepository.create({
            impactCategoryRecordId: record._id,
            impactCategory: type,
            isRequested: true,
            requestedBy: new Types.ObjectId(userId),
          });
        } else {
          await this.impactCategoryRequestRepository.update(
            { _id: existingRequest._id },
            { isRequested: true, requestedBy: userId },
          );
        }
      }

      if (impactData.isRequested === false && existingRequest) {
        await this.impactCategoryRequestRepository.deletePermanently({
          _id: existingRequest._id,
        });
      }

      if (!isSupplierUser && impactData.isRequested) {
        shouldTriggerEmail = true;
      }

      if (isSupplierUser && existingRequest) {
        await this.impactCategoryRequestRepository.update(
          { _id: existingRequest._id },
          { isFulfilled: true },
        );
      }
    }

    if (shouldTriggerEmail && dto.isSaveAndExit == false && !isSupplierUser) {
      const emailBodyDetails = {
        companyName: companyUser?.companyDetails.name,
        componentName: component.name,
        productName,
        supplierName: component.supplierName,
        supplierContactEmail: component.supplierContactEmail,
      };

      const mailType = await this.handleSupplierEmail(emailBodyDetails, user);

      if (mailType) {
        requestEmailSent = true;
        mailTriggeredMessage =
          mailType === 'platformInviteSent' ? 'mail sent' : null;

        await this.impactCategoryRecordRepository.updateMany(
          {
            productId: component.productId,
            componentId: new Types.ObjectId(componentId),
            roleDetailsId: new Types.ObjectId(roleDetailsId),
          },
          { requestEmailSent: true },
        );
      }
    }

    const records = await this.impactCategoryRecordRepository.find({
      productId: component.productId,
      componentId: new Types.ObjectId(componentId),
      roleDetailsId: new Types.ObjectId(roleDetailsId),
    });

    const response: any = {
      _id: records[0]?._id,
      componentId,
      roleDetailsId,
      supplierLinkedRole: records[0]?.supplierLinkedRole,
      supplierContactEmail: records[0]?.supplierContactEmail,
      supplierContactName: records[0]?.supplierContactName,
      requestEmailSent,
      mailTriggeredMessage,
      carbon: {},
      water: {},
      land: {},
    };

    for (const record of records) {
      const type = record.impactCategory;

      const companyVersion = await this.impactCategoryVersionRepository.findOne(
        {
          impactCategoryRecordId: record._id,
          versionOwner: 'company',
          isLatest: true,
        },
      );

      const supplierVersion =
        await this.impactCategoryVersionRepository.findOne({
          impactCategoryRecordId: record._id,
          versionOwner: 'supplier',
          isLatest: true,
        });

      const request = await this.impactCategoryRequestRepository.findOne({
        impactCategoryRecordId: record._id,
        impactCategory: type,
      });

      response[type] = {
        quantity: companyVersion?.quantity || null,
        unit: companyVersion?.unit || null,
        lciaMethodology: companyVersion?.lciaMethodology || null,
        dataSource: companyVersion?.dataSource || null,
        tempQuantity: companyVersion?.tempQuantity || null,
        tempUnit: companyVersion?.tempUnit || null,
        tempLciaMethodology: companyVersion?.tempLciaMethodology || null,
        offsetCarbonImpact: companyVersion?.offsetCarbonImpact || null,
        offsetQuantity: companyVersion?.offsetQuantity || null,
        offsetUnit: companyVersion?.offsetUnit || null,
        audit: companyVersion?.audit || null,
        isImpactPresent: companyVersion?.isImpactPresent,
        isSubmitted: companyVersion?.isSubmitted || false,
        isRequested: request?.isRequested || false,
        supplierQuantity: supplierVersion?.quantity || null,
        supplierUnit: supplierVersion?.unit || null,
        supplierLciaMethodology: supplierVersion?.lciaMethodology || null,
        supplierIsSubmitted: supplierVersion?.isSubmitted || false,
        offsetCarbonImpactSupplier:
          supplierVersion?.offsetCarbonImpact || false,
        offsetQuantitySupplier: supplierVersion?.isSubmitted || false,
      };
    }

    return response;
  }

  async fetchImpactCategorySummaryOnSummaryPage(
    params,
    userId,
    userRoleSlug,
    productRequested,
  ) {
    const { componentId, roleSlug } = params;

    const component = await this.componentRepository.findOne({
      _id: componentId,
    });

    if (!component) {
      throw new NotFoundError('Component not found');
    }

    const records = await this.impactCategoryRecordRepository.find({
      componentId: new Types.ObjectId(componentId),
      supplierLinkedRole: roleSlug,
    });

    if (!records || records.length === 0) {
      throw new NotFoundError('Impact Category data not found');
    }

    // const isSupplierView = userRoleSlug === 'supplier_user';
    // const currentOwner = isSupplierView ? 'supplier' : 'company';

    /**
     * ============================
     * VIEW MODE DETECTION
     * ============================
     */

    let isSupplierView = false;

    if (userRoleSlug === 'supplier_user') {
      isSupplierView = true;
    }

    /**
     * Admin behaves like supplier
     */
    if (userRoleSlug === 'admin_user') {
      isSupplierView = true;
    }

    /**
     * Company acting as supplier when product is requested
     */
    if (userRoleSlug === 'company_user' && productRequested === 'true') {
      isSupplierView = true;
    }

    const currentOwner = isSupplierView ? 'supplier' : 'company';
    const response: any = {
      componentId: new Types.ObjectId(componentId),
      supplierLinkedRole: roleSlug,
      carbon: {},
      water: {},
      land: {},
    };

    const detailsField = `${roleSlug}Details`;
    const benchmarkingData =
      component?.[detailsField]?.benchmarkingData ?? null;

    // Versioning tracking: collect originalVersion and draftVersion per category
    const versioningMap: Record<
      string,
      {
        originalVersion: any;
        draftVersion: any;
        request: any;
        ownLatest: any;
        approvedSupplierDataSource: string | null;
      }
    > = {};

    // ── Helper: compute presentable fields from a version + request ──────────
    const computePresentable = (version: any, request: any, type: string) => {
      let pQuantity;
      let pUnit;
      let pLcia;
      let pDataSource;

      if (version?.quantity != null) {
        pQuantity = version.quantity;
        pUnit = version.unit;
        pLcia = version.lciaMethodology;
        if (isSupplierView) {
          pDataSource =
            version.dataSource === 'manual' ? 'Manual Input' : 'Database';
        } else {
          if (request?.isRequested) {
            pDataSource = 'Supplier';
          } else {
            pDataSource =
              version.dataSource === 'manual'
                ? 'Manual Input'
                : version.dataSource === 'temporary'
                  ? 'Temporary Data'
                  : 'Database';
          }
        }
      } else if (version?.tempQuantity != null) {
        pQuantity = version.tempQuantity;
        pUnit = version.tempUnit;
        pLcia = version.tempLciaMethodology;
        if (isSupplierView) {
          pDataSource = version.dataSource ?? null;
        } else {
          pDataSource = request?.isRequested ? 'Supplier' : 'Temporary Data';
        }
      } else if (request?.isRequested) {
        pDataSource = 'Requested data';
      }

      // Benchmarking
      let averageComparison = 'No benchmarking value available for comparison';
      if (benchmarkingData && pQuantity != null) {
        const benchmarkField =
          type === 'carbon'
            ? 'carbonBenchmarkingData'
            : type === 'water'
              ? 'waterBenchmarkingData'
              : 'landBenchmarkingData';
        const benchmarkValue = benchmarkingData?.[benchmarkField];
        if (benchmarkValue && benchmarkValue !== 0) {
          const difference =
            ((pQuantity - benchmarkValue) / benchmarkValue) * 100;
          if (difference > 20) {
            averageComparison = `${difference.toFixed(0)}%`;
          } else if (difference < -20) {
            averageComparison = `${difference.toFixed(0)}%`;
          } else {
            averageComparison = `${difference.toFixed(0)}% Similar`;
          }
        }
      }

      return {
        presentableQuantity: this.unitConversions.toDecimalString(pQuantity),
        presentableUnit: pUnit,
        presentableLciaMethodology: pLcia,
        presentableDataSource: pDataSource,
        averageComparison,
      };
    };
    // ── End helper ────────────────────────────────────────────────────────────

    for (const record of records) {
      const type = record.impactCategory;

      const request = await this.impactCategoryRequestRepository.findOne({
        impactCategoryRecordId: record._id,
        impactCategory: type,
      });

      const ownLatest =
        await this.impactCategoryVersionRepository.findLatestVersion(
          record._id,
          currentOwner,
        );

      let effectiveVersion = ownLatest;

      if (
        request?.isRequested &&
        ownLatest &&
        ownLatest.quantity == null &&
        ownLatest.tempQuantity == null
      ) {
        //  previous draft with values
        const previousDraft =
          await this.impactCategoryVersionRepository.findLatestNonEmptyDraftVersion(
            record._id,
            currentOwner,
          );

        if (previousDraft) {
          effectiveVersion = previousDraft;
        } else {
          // fallback to submitted
          const lastSubmitted =
            await this.impactCategoryVersionRepository.findLatestSubmittedVersion(
              record._id,
              currentOwner,
            );

          if (lastSubmitted) {
            effectiveVersion = lastSubmitted;
          }
        }
      }

      // Versioning: fetch the latest submitted version and the current draft separately
      let originalVersion;

      /**
       * STEP 1: Detect if company accepted supplier data
       */
      let companyAcceptedSupplierVersion;

      if (!isSupplierView) {
        companyAcceptedSupplierVersion =
          await this.impactCategoryVersionRepository.findLatestVersion(
            record._id,
            'company',
          );

        if (
          companyAcceptedSupplierVersion &&
          companyAcceptedSupplierVersion.isSubmitted === true &&
          companyAcceptedSupplierVersion.dataSource === 'supplier'
        ) {
          /**
           * STEP 2: Fetch ORIGINAL company submitted version (exclude supplier data)
           */
          originalVersion =
            await this.impactCategoryVersionRepository.findLatestOriginalCompanySubmittedVersion(
              record._id,
            );
        }
      }

      /**
       * STEP 3: Normal flow (no supplier acceptance)
       * Always use the latest submitted version (highest version number)
       */
      if (!originalVersion) {
        originalVersion =
          await this.impactCategoryVersionRepository.findLatestSubmittedVersion(
            record._id,
            currentOwner,
          );
      }

      const draftVersion =
        ownLatest && ownLatest.isSubmitted === false ? ownLatest : null;

      // Resolve 'supplier' dataSource to actual source (manual/database) used by the supplier
      let approvedSupplierDataSource: string | null = null;
      if (!isSupplierView) {
        const approvedSupplier =
          await this.impactCategoryVersionRepository.findLatestApprovedSupplierVersion(
            record._id,
          );
        if (approvedSupplier?.dataSource) {
          approvedSupplierDataSource = approvedSupplier.dataSource;
        }
      }

      versioningMap[type] = {
        originalVersion,
        draftVersion,
        request,
        ownLatest,
        approvedSupplierDataSource,
      };

      // ===============================
      // PRESENTABLE DATA LOGIC (unchanged)
      // ===============================
      const {
        presentableQuantity,
        presentableUnit,
        presentableLciaMethodology,
        presentableDataSource: computedPresentableDataSource,
        averageComparison,
      } = computePresentable(effectiveVersion, request, type);

      // Override dataSource and presentableDataSource when company accepted supplier data
      const resolvedDataSource =
        effectiveVersion?.dataSource === 'supplier' &&
        approvedSupplierDataSource
          ? approvedSupplierDataSource
          : (effectiveVersion?.dataSource ?? null);
      const presentableDataSource =
        effectiveVersion?.dataSource === 'supplier' &&
        approvedSupplierDataSource
          ? approvedSupplierDataSource === 'manual'
            ? 'Manual Input'
            : 'Database'
          : computedPresentableDataSource;

      // ===============================
      // FINAL RESPONSE OBJECT (unchanged structure)
      // ===============================

      const tds = this.unitConversions.toDecimalString.bind(
        this.unitConversions,
      );

      response[type] = {
        quantity: tds(effectiveVersion?.quantity ?? null),
        unit: effectiveVersion?.unit ?? null,
        tempQuantity: tds(effectiveVersion?.tempQuantity ?? null),
        tempUnit: effectiveVersion?.tempUnit ?? null,
        tempLciaMethodology: effectiveVersion?.tempLciaMethodology ?? null,
        lciaMethodology: effectiveVersion?.lciaMethodology ?? null,
        dataSource: resolvedDataSource,
        offsetCarbonImpact: effectiveVersion?.offsetCarbonImpact ?? false,
        offsetQuantity: tds(effectiveVersion?.offsetQuantity ?? null),
        offsetUnit: effectiveVersion?.offsetUnit ?? null,
        isSubmitted: ownLatest?.isSubmitted ?? false,
        isImpactPresent: effectiveVersion?.isImpactPresent ?? true,
        audit: effectiveVersion?.audit ?? null,
        isRequested: request?.isRequested ?? false,
        presentableQuantity: tds(presentableQuantity),
        presentableUnit,
        presentableLciaMethodology,
        presentableDataSource,
        averageComparison,
      };
    }

    // ===============================
    // VERSIONING OVERLAY
    // ===============================

    const hasAnyOriginal = Object.values(versioningMap).some(
      (v) => v.originalVersion != null,
    );
    const hasAnyDraft = Object.values(versioningMap).some(
      (v) => v.draftVersion != null,
    );

    // Versioning is shown only when there is at least one submitted (original)
    // AND at least one pending draft (to be submitted)
    // const hasVersioning = hasAnyOriginal && hasAnyDraft;
    const hasVersioning = hasAnyOriginal;

    const originalCategories: Record<string, any> = {};
    const toBeSubmittedCategories: Record<string, any> = {};

    if (hasVersioning) {
      for (const [
        type,
        {
          originalVersion,
          draftVersion,
          request,
          ownLatest,
          approvedSupplierDataSource,
        },
      ] of Object.entries(versioningMap)) {
        // Build "Original Impact Categories Submitted" item
        if (originalVersion) {
          const presentable = computePresentable(
            originalVersion,
            request,
            type,
          );

          // Resolve supplier dataSource for original version
          const resolvedOriginalDs =
            originalVersion.dataSource === 'supplier' &&
            approvedSupplierDataSource
              ? approvedSupplierDataSource
              : (originalVersion.dataSource ?? null);
          const resolvedOriginalPresentableDs =
            originalVersion.dataSource === 'supplier' &&
            approvedSupplierDataSource
              ? approvedSupplierDataSource === 'manual'
                ? 'Manual Input'
                : 'Database'
              : presentable.presentableDataSource;

          const tds = this.unitConversions.toDecimalString.bind(
            this.unitConversions,
          );

          originalCategories[type] = {
            quantity: tds(originalVersion.quantity ?? null),
            unit: originalVersion.unit ?? null,
            tempQuantity: tds(originalVersion.tempQuantity ?? null),
            tempUnit: originalVersion.tempUnit ?? null,
            tempLciaMethodology: originalVersion.tempLciaMethodology ?? null,
            lciaMethodology: originalVersion.lciaMethodology ?? null,
            dataSource: resolvedOriginalDs,
            isImpactPresent: originalVersion.isImpactPresent ?? true,
            isSubmitted: true,
            offsetCarbonImpact: originalVersion.offsetCarbonImpact ?? false,
            offsetQuantity: tds(originalVersion.offsetQuantity ?? null),
            offsetUnit: originalVersion.offsetUnit ?? null,
            versionNumber: originalVersion.versionNumber,
            submittedAt: originalVersion.submittedAt ?? null,
            ...presentable,
            presentableDataSource: resolvedOriginalPresentableDs,
          };
        }
        let versionForToBeSubmitted = draftVersion ?? originalVersion;

        /**
         * SCENARIO FIX:
         * If company requested supplier data and draft exists but contains no values,
         * fallback to original submitted version values (v1) while keeping request behavior.
         */
        if (
          request?.isRequested &&
          draftVersion &&
          draftVersion.quantity == null &&
          draftVersion.tempQuantity == null
        ) {
          versionForToBeSubmitted = originalVersion;
        }

        if (versionForToBeSubmitted) {
          const presentable = computePresentable(
            versionForToBeSubmitted,
            request,
            type,
          );

          // Resolve supplier dataSource for toBeSubmitted version
          const resolvedToBeSubmittedDs =
            versionForToBeSubmitted.dataSource === 'supplier' &&
            approvedSupplierDataSource
              ? approvedSupplierDataSource
              : (versionForToBeSubmitted.dataSource ?? null);
          const resolvedToBeSubmittedPresentableDs =
            versionForToBeSubmitted.dataSource === 'supplier' &&
            approvedSupplierDataSource
              ? approvedSupplierDataSource === 'manual'
                ? 'Manual Input'
                : 'Database'
              : presentable.presentableDataSource;

          const tds = this.unitConversions.toDecimalString.bind(
            this.unitConversions,
          );

          toBeSubmittedCategories[type] = {
            quantity: tds(versionForToBeSubmitted.quantity ?? null),
            unit: versionForToBeSubmitted.unit ?? null,
            tempQuantity: tds(versionForToBeSubmitted.tempQuantity ?? null),
            tempUnit: versionForToBeSubmitted.tempUnit ?? null,
            tempLciaMethodology:
              versionForToBeSubmitted.tempLciaMethodology ?? null,
            lciaMethodology: versionForToBeSubmitted.lciaMethodology ?? null,
            dataSource: resolvedToBeSubmittedDs,
            isImpactPresent:
              ownLatest?.isImpactPresent ??
              versionForToBeSubmitted?.isImpactPresent ??
              true,
            isSubmitted: draftVersion ? false : true,
            offsetCarbonImpact:
              versionForToBeSubmitted.offsetCarbonImpact ?? false,
            offsetQuantity: tds(versionForToBeSubmitted.offsetQuantity ?? null),
            offsetUnit: versionForToBeSubmitted.offsetUnit ?? null,
            versionNumber: versionForToBeSubmitted.versionNumber,
            submittedAt: draftVersion
              ? null
              : versionForToBeSubmitted.submittedAt,
            ...presentable,
            presentableDataSource: resolvedToBeSubmittedPresentableDs,
          };
        }
      }
    }

    response.hasVersioning = hasVersioning;
    response.originalCategories = originalCategories;
    response.toBeSubmittedCategories = toBeSubmittedCategories;

    // Sync isImpactPresent from toBeSubmittedCategories to outer response categories
    for (const cat of ['carbon', 'water', 'land']) {
      if (toBeSubmittedCategories[cat] != null && response[cat] != null) {
        response[cat].isImpactPresent =
          toBeSubmittedCategories[cat].isImpactPresent;
      }
    }

    return response;
  }

  // Update impact category status
  async updateImpactCategoryStatus(
    productId: string,
    category: ImpactCategory,
    isPublished: boolean,
    userId: string,
  ) {
    const product = await this.productRepository.findOne({
      _id: new Types.ObjectId(productId),
      companyId: new Types.ObjectId(userId),
      isActive: true,
    });
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Block only when product is pending
    if (product.publishStatus === 'pending') {
      throw new BadRequestError('Product is not ready to publish');
    }

    // Runtime safety (extra guard)
    if (!IMPACT_CATEGORIES.includes(category)) {
      throw new BadRequestError('Invalid impact category');
    }

    // Update requested category
    const updatePath = `impactCategoryPublishStatus.${category}`;
    const updatePayload: any = {
      [updatePath]: isPublished,
    };

    // Set flag for publicly access
    if (!product.isPubliclyAccessible) {
      updatePayload.isPubliclyAccessible = true;
    }
    const updatedProduct = await this.productRepository.update(
      { _id: product._id },
      { $set: updatePayload },
    );

    if (!updatedProduct) {
      throw new NotFoundError('Product not found after update');
    }

    // Recalculate publishStatus
    const impactStatus = updatedProduct.impactCategoryPublishStatus || {};

    const values = IMPACT_CATEGORIES.map((key) => impactStatus[key] === true);

    const hasAnyPublished = values.some(Boolean);
    const isFullyPublished = values.every(Boolean);

    let finalPublishStatus;

    if (isFullyPublished) {
      finalPublishStatus = 'published';
    } else if (hasAnyPublished) {
      finalPublishStatus = 'partial';
    } else {
      // All categories unpublished — check if any eligible component is not
      // fully finalized (no records, or records without a company-submitted
      // version). If so, use 'awaiting' (Pending Submission) instead of 'ready'.
      const allComponents = await this.componentRepository.find({
        productId: updatedProduct._id,
        isActive: true,
      });
      const eligibleComps = allComponents.filter(
        (c) => c.supplierRoles?.length > 0,
      );
      let hasIncompleteComponent = false;
      outer: for (const comp of eligibleComps) {
        const records = await this.impactCategoryRecordRepository.find({
          componentId: comp._id,
          isActive: true,
        });
        if (records.length === 0) {
          hasIncompleteComponent = true;
          break;
        }
        for (const record of records) {
          const companySubmitted =
            await this.impactCategoryVersionRepository.findLatestSubmittedVersion(
              record._id,
              'company',
            );
          if (!companySubmitted) {
            hasIncompleteComponent = true;
            break outer;
          }
        }
      }
      finalPublishStatus = hasIncompleteComponent ? 'awaiting' : 'ready';
    }

    // Update publishStatus only if changed
    if (updatedProduct.publishStatus !== finalPublishStatus) {
      const finalProduct = await this.productRepository.update(
        { _id: updatedProduct._id },
        { $set: { publishStatus: finalPublishStatus } },
      );

      if (!finalProduct) {
        throw new NotFoundError(
          'Product not found while updating publish status',
        );
      }

      // Fire-and-forget: save product-level master data when publishing
      if (isPublished) {
        this.buildAndSaveProductMasterData(finalProduct).catch((err) => {
          console.error(
            `[MasterData] Failed to save product master data for ${productId}:`,
            err?.message ?? err,
          );
        });
      }

      return finalProduct;
    }

    return updatedProduct;
  }

  // Get total impact for all categories
  async getProductImpactSummary(
    productId: string,
    userId: string,
    userRoleSlug: string,
  ) {
    const productObjectId = new Types.ObjectId(productId);

    // Role-based product filter
    const filter: any = {
      _id: productObjectId,
      isActive: true,
    };

    if (userRoleSlug !== 'admin_user') {
      filter.companyId = new Types.ObjectId(userId);
    }

    const product = await this.productRepository.findOne(filter);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Fetch all components for strict validation
    const components = await this.componentRepository.find({
      productId: productObjectId,
      isActive: true,
    });

    const impactSummaryData =
      await this.impactCategoryRecordRepository.aggregate([
        {
          $match: {
            productId: productObjectId,
            isActive: true,
          },
        },

        // Lookup component to get supplierRoles
        {
          $lookup: {
            from: 'component',
            localField: 'componentId',
            foreignField: '_id',
            as: 'component',
          },
        },
        {
          $unwind: {
            path: '$component',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $expr: {
              $in: [
                '$supplierLinkedRole',
                { $ifNull: ['$component.supplierRoles', []] },
              ],
            },
          },
        },
        // Lookup submitted version (for quantity + unit)
        {
          $lookup: {
            from: 'impactCategoryVersion',
            let: { recordId: '$_id' },
            pipeline: [
              // Step 1: only isLatest=true, exclude supplier drafts
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$impactCategoryRecordId', '$$recordId'] },
                      { $in: ['$versionOwner', ['supplier', 'company']] },
                      { $eq: ['$isLatest', true] },
                      { $eq: ['$deletedAt', null] },
                      {
                        $or: [
                          { $eq: ['$versionOwner', 'company'] },
                          {
                            $and: [
                              { $eq: ['$versionOwner', 'supplier'] },
                              { $eq: ['$isSubmitted', true] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              // Sort by versionNumber desc so $arrayElemAt[0] always picks the
              // highest (most recent) version — handles the case where both a
              // draft and an old submitted version share isLatest:true
              { $sort: { versionNumber: -1 } },
            ],
            as: 'versions',
          },
        },

        // Step 2: extract company and supplier candidates separately
        {
          $addFields: {
            companyLatest: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$versions',
                    as: 'v',
                    cond: { $eq: ['$$v.versionOwner', 'company'] },
                  },
                },
                0,
              ],
            },
            supplierLatest: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$versions',
                    as: 'v',
                    cond: { $eq: ['$$v.versionOwner', 'supplier'] },
                  },
                },
                0,
              ],
            },
          },
        },

        // Step 3: pick winner
        // Rule 1: only supplier exists (pending, never approved) → supplier
        // Rule 2: only company exists (manual/db submit or rejected+own) → company
        // Rule 3: both exist, supplier submittedAt > company createdAt → supplier (new pending after approval)
        // Rule 4: both exist, company createdAt >= supplier submittedAt → company (approved copy is final)
        {
          $addFields: {
            resolvedVersion: {
              $cond: {
                if: {
                  $and: [
                    { $ifNull: ['$supplierLatest', false] },
                    { $ifNull: ['$companyLatest', false] },
                    {
                      $gt: [
                        '$supplierLatest.submittedAt',
                        '$companyLatest.createdAt',
                      ],
                    },
                  ],
                },
                then: '$supplierLatest',
                else: {
                  $cond: {
                    if: { $ifNull: ['$companyLatest', false] },
                    then: '$companyLatest',
                    else: '$supplierLatest',
                  },
                },
              },
            },
          },
        },

        // Normalize quantity + unit
        {
          $addFields: {
            resolvedQuantity: {
              $ifNull: [
                '$resolvedVersion.quantity',
                '$resolvedVersion.tempQuantity',
              ],
            },

            resolvedUnit: {
              $ifNull: ['$resolvedVersion.unit', '$resolvedVersion.tempUnit'],
            },

            isSubmittedFinal: {
              $and: [
                { $eq: ['$resolvedVersion.isSubmitted', true] },
                { $ne: ['$resolvedVersion.isRejected', true] },
              ],
            },

            // Finalized = company version exists and isSubmitted=true.
            // Checked against companyLatest directly (not resolvedVersion) so that
            // when supplier submits/re-submits and becomes the resolved winner,
            // the company's existing temp or approved value is still counted.
            isFinalizedForPublish: {
              $and: [
                { $ifNull: ['$companyLatest', false] },
                { $eq: ['$companyLatest.isSubmitted', true] },
                {
                  $or: [
                    { $ne: ['$companyLatest.quantity', null] },
                    { $ne: ['$companyLatest.tempQuantity', null] },
                    { $eq: ['$companyLatest.isImpactPresent', false] },
                  ],
                },
              ],
            },

            isEnteredFinal: {
              $or: [
                {
                  $ne: [
                    {
                      $ifNull: [
                        '$resolvedVersion.quantity',
                        '$resolvedVersion.tempQuantity',
                      ],
                    },
                    null,
                  ],
                },
                { $eq: ['$resolvedVersion.isImpactPresent', false] },
              ],
            },

            // expected roles
            expectedRolesCount: {
              $size: {
                $ifNull: ['$component.supplierRoles', []],
              },
            },
          },
        },

        // group per component
        {
          $group: {
            _id: {
              impactCategory: '$impactCategory',
              componentId: '$componentId',
            },

            componentId: { $first: '$componentId' },
            expectedRolesCount: { $first: '$expectedRolesCount' },

            recordsCount: { $sum: 1 },

            finalizedCount: {
              $sum: {
                $cond: ['$isFinalizedForPublish', 1, 0],
              },
            },

            enteredCount: {
              $sum: {
                $cond: ['$isEnteredFinal', 1, 0],
              },
            },

            totalValue: {
              $sum: {
                $cond: [
                  '$isFinalizedForPublish',
                  {
                    $ifNull: [
                      '$companyLatest.quantity',
                      '$companyLatest.tempQuantity',
                    ],
                  },
                  0,
                ],
              },
            },

            unit: { $first: '$resolvedUnit' },

            isImpactPresent: {
              $max: {
                $cond: [
                  {
                    $or: [
                      // Impact is present
                      {
                        $eq: [
                          {
                            $ifNull: [
                              '$companyLatest.isImpactPresent',
                              '$resolvedVersion.isImpactPresent',
                            ],
                          },
                          true,
                        ],
                      },
                      // Draft (not submitted) — treat as impact present for summary
                      {
                        $and: [
                          { $ifNull: ['$companyLatest', false] },
                          { $ne: ['$companyLatest.isSubmitted', true] },
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },

        // category level grouping + keep components
        {
          $group: {
            _id: '$_id.impactCategory',

            totalComponents: { $sum: 1 },

            components: {
              $push: {
                componentId: '$componentId',
                recordsCount: '$recordsCount',
                finalizedCount: '$finalizedCount',
                expectedRolesCount: '$expectedRolesCount',
              },
            },

            submittedComponents: { $sum: 0 },

            finalizedComponents: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$recordsCount', '$expectedRolesCount'] },
                      { $eq: ['$finalizedCount', '$expectedRolesCount'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            enteredComponents: {
              $sum: {
                $cond: ['$enteredCount', 1, 0],
              },
            },

            totalValue: { $sum: '$totalValue' },

            unit: { $first: '$unit' },

            isImpactPresent: { $max: '$isImpactPresent' },
          },
        },
      ]);

    // Per-category completion check
    // A category can be published independently if all components with supplierRoles
    // have all their records finalized for that specific category
    const categoryCompleteMap: Record<string, boolean> = {};

    const categoryComponentMap: Record<
      string,
      Map<string, { recordsCount: number; finalizedCount: number }>
    > = {};

    impactSummaryData.forEach((item: any) => {
      const compMap = new Map<
        string,
        { recordsCount: number; finalizedCount: number }
      >();
      item.components?.forEach((comp) => {
        compMap.set(comp.componentId.toString(), {
          recordsCount: comp.recordsCount,
          finalizedCount: comp.finalizedCount,
        });
      });
      categoryComponentMap[item._id] = compMap;
    });

    const eligibleComponents = components.filter(
      (comp) => comp.supplierRoles?.length > 0,
    );

    impactSummaryData
      .map((item) => item._id)
      .forEach((category) => {
        if (eligibleComponents.length === 0) {
          categoryCompleteMap[category] = false;
          return;
        }

        const compMap = categoryComponentMap[category] || new Map();

        categoryCompleteMap[category] = eligibleComponents.every((comp) => {
          const compId = comp._id.toString();
          const expectedRoles = comp.supplierRoles?.length || 0;
          const aggData = compMap.get(compId);

          if (!aggData) return false;

          return (
            aggData.recordsCount === expectedRoles &&
            aggData.finalizedCount === expectedRoles
          );
        });
      });
    // Format response structure — only categories with records are included;
    // categories the user has not touched are returned as {}
    const formattedSummary: Partial<
      Record<
        'carbon' | 'water' | 'land',
        {
          value: string;
          unit: string;
          isImpactPresent: boolean;
          averageComparison: string | null | undefined;
          canPublish: boolean;
          isDataInputInProgress: boolean;
        }
      >
    > = {};

    // Components present in aggregation per category (have at least one record)
    const categoryComponentsWithRecords: Record<string, Set<string>> = {};
    impactSummaryData.forEach((item: any) => {
      const set = new Set<string>();
      item.components?.forEach((comp) => set.add(comp.componentId.toString()));
      categoryComponentsWithRecords[item._id] = set;
    });

    impactSummaryData.forEach((item) => {
      // Skip categories where no data has been entered at all
      if (item.enteredComponents === 0 && item.finalizedComponents === 0) {
        return;
      }

      const defaultUnit =
        item._id === 'carbon'
          ? 'kg CO2-eq/unit'
          : item._id === 'water'
            ? 'm3/unit'
            : 'm2/unit';

      // A new component with no records at all won't appear in the aggregation —
      // detect it here so isDataInputInProgress reflects reality.
      const withRecords = categoryComponentsWithRecords[item._id] ?? new Set();
      const hasComponentWithNoRecords = eligibleComponents.some(
        (comp) => !withRecords.has(comp._id.toString()),
      );

      formattedSummary[item._id] = {
        value: this.unitConversions.toDecimalString(item.totalValue ?? 0),
        unit: item.unit ?? defaultUnit,
        isImpactPresent:
          item._id === 'carbon' ? true : Boolean(item.isImpactPresent),
        averageComparison: null,
        canPublish: categoryCompleteMap[item._id] ?? false,
        isDataInputInProgress:
          // New component added with no records at all for this category
          hasComponentWithNoRecords ||
          // Some components finalized but not all (mixed state)
          (item.finalizedComponents > 0 &&
            item.finalizedComponents < eligibleComponents.length) ||
          // No finalized yet but some data has been entered (original behaviour)
          (item.finalizedComponents === 0 && item.enteredComponents > 0),
      };
    });

    const categories = ['carbon', 'water', 'land'];

    categories.forEach((type) => {
      if (!formattedSummary[type]) return;

      const presentableQuantity = formattedSummary[type]?.value;
      const benchmarkValue = product.impactBenchMarking?.[type];

      let averageComparison;

      if (
        benchmarkValue &&
        benchmarkValue !== 0 &&
        presentableQuantity != null
      ) {
        const numericQuantity = Number(presentableQuantity);
        const difference =
          ((numericQuantity - benchmarkValue) / benchmarkValue) * 100;

        if (difference > 20) {
          averageComparison = `${difference.toFixed(0)}%`;
        } else if (difference < -20) {
          averageComparison = `${difference.toFixed(0)}%`;
        } else {
          averageComparison = `${difference.toFixed(0)}% Similar`;
        }
      }

      formattedSummary[type].averageComparison = averageComparison;
    });

    // Compute publishStatus at runtime: 'ready' if any one impact category is
    // fully submitted (company-finalized) across all components and supplier roles.
    // Preserves 'published'/'partial'/'awaiting' states set by the publish toggle flow,
    // but resets to 'pending' if there are no eligible components (all deleted).
    const hasEligibleData = eligibleComponents.length > 0;
    let runtimePublishStatus: string;

    if (!hasEligibleData) {
      // No components with supplier roles — no data to publish
      runtimePublishStatus = 'pending';
    } else if (
      product.publishStatus === 'published' ||
      product.publishStatus === 'partial'
    ) {
      // Preserve published/partial — managed by the publish-toggle flow
      runtimePublishStatus = product.publishStatus;
    } else if (Object.values(categoryCompleteMap).some(Boolean)) {
      runtimePublishStatus = 'ready';
    } else {
      // No category is fully complete. Determine whether this is a brand-new
      // product with no data ('pending') or one with incomplete/in-progress
      // data ('awaiting' = Pending Submission).
      const hasAnyDataInProgress = Object.values(formattedSummary).some(
        (cat: any) => cat.isDataInputInProgress,
      );
      runtimePublishStatus = hasAnyDataInProgress ? 'awaiting' : 'pending';
    }

    // Sync the computed publishStatus back to the DB
    if (product.publishStatus !== runtimePublishStatus) {
      await this.productRepository.update(
        { _id: product._id },
        { publishStatus: runtimePublishStatus },
      );
    }

    return {
      productId: product._id,
      publishStatus: runtimePublishStatus,
      productName: product.name,
      productCategory: product.category,

      impactCategoryPublishStatus: {
        carbon: product.impactCategoryPublishStatus?.carbon ?? false,
        water: product.impactCategoryPublishStatus?.water ?? false,
        land: product.impactCategoryPublishStatus?.land ?? false,
      },

      impactBenchMarking: {
        carbon: product.impactBenchMarking?.carbon ?? null,
        water: product.impactBenchMarking?.water ?? null,
        land: product.impactBenchMarking?.land ?? null,
        metadata: product.impactBenchMarking?.metadata ?? {},
      },

      impactSummary: formattedSummary,
    };
  }

  async addBenchmarkingDataForCompany(
    userId: string,
    componentId: string,
    dto,
    supplierRoleSlug: string,
    dynamicQueryParams,
  ) {
    // Fetching component details
    const componentDetails: any = await this.componentRepository.findOne({
      _id: componentId,
      createdBy: userId,
    });

    if (!componentDetails) {
      throw new ComponentNotFoundError('Component not found');
    }

    const auditArray = dto.audit;
    const rowsSelected = auditArray.length;
    if (rowsSelected == 0) {
      let existingDetailsFieldData;
      existingDetailsFieldData = await this.componentRepository.findOne({
        _id: componentId,
      });
      const dynamicSupplierRoleDetailsField = `${supplierRoleSlug}Details`;
      const onlyexistingDetailsFieldData =
        existingDetailsFieldData[dynamicSupplierRoleDetailsField].toObject();

      const updatingBenchmarkingDataWithNoRowsSelected =
        this.componentRepository.update(
          { _id: componentId },
          {
            $set: {
              [`${dynamicSupplierRoleDetailsField}.audit.query`]:
                dynamicQueryParams,
              [`${dynamicSupplierRoleDetailsField}.audit.results`]: dto.audit,
              [`${dynamicSupplierRoleDetailsField}.benchmarkingData`]: null,
            },
          },
        );
      return updatingBenchmarkingDataWithNoRowsSelected;
    }
    let carbonBenchmarkingData;
    let waterBenchmarkingData;
    let landBenchmarkingData;

    switch (supplierRoleSlug) {
      case 'rawMaterialSupplier':
      case 'packagingManufacturer':
        let netWeightUsedPerSkuInKg;
        let detailsFieldOfComponent;
        if (supplierRoleSlug == 'rawMaterialSupplier') {
          detailsFieldOfComponent = componentDetails.rawMaterialSupplierDetails;
          netWeightUsedPerSkuInKg = detailsFieldOfComponent.netWeightUsedPerSku;
        } else if (supplierRoleSlug == 'packagingManufacturer') {
          detailsFieldOfComponent =
            componentDetails.packagingManufacturerDetails;
          netWeightUsedPerSkuInKg = detailsFieldOfComponent.netWeightUsedPerSku;
        }
        if (detailsFieldOfComponent.netWeightUnit != 'kg') {
          netWeightUsedPerSkuInKg = this.unitConversions.convertToKilogram(
            +detailsFieldOfComponent.netWeightUsedPerSku,
            detailsFieldOfComponent.netWeightUnit,
          );
        }

        let totalCarbonForRawMaterialSupplierRole = 0;
        let totalWaterForRawMaterialSupplierRole = 0;
        let totalLandForRawMaterialSupplierRole = 0;

        const toFixedNumber = (value: number, decimals = 8) =>
          Number(value.toFixed(decimals));

        dto.audit.forEach((item) => {
          if (!item.impacts) return;

          const impactMethodKey = Object.keys(item.impacts)[0];
          if (!impactMethodKey) return;

          const impactValues = item.impacts[impactMethodKey];
          const denominator =
            item.impacts?.netWeight !== undefined &&
            item.impacts?.netWeight !== null
              ? item.impacts.netWeight
              : 1;

          const carbon = toFixedNumber(
            (impactValues?.carbon ?? 0) / denominator,
          );
          const water = toFixedNumber((impactValues?.water ?? 0) / denominator);
          const land = toFixedNumber((impactValues?.land ?? 0) / denominator);

          totalCarbonForRawMaterialSupplierRole += carbon;
          totalWaterForRawMaterialSupplierRole += water;
          totalLandForRawMaterialSupplierRole += land;
        });

        const rawMaterialSupplierAgggregationResult =
          this.aggregateBenchmarkingData(
            totalCarbonForRawMaterialSupplierRole,
            totalWaterForRawMaterialSupplierRole,
            totalLandForRawMaterialSupplierRole,
            rowsSelected,
          );

        carbonBenchmarkingData =
          rawMaterialSupplierAgggregationResult.carbonBenchmarkingData *
          netWeightUsedPerSkuInKg;
        waterBenchmarkingData =
          rawMaterialSupplierAgggregationResult.waterBenchmarkingData *
          netWeightUsedPerSkuInKg;
        landBenchmarkingData =
          rawMaterialSupplierAgggregationResult.landBenchmarkingData *
          netWeightUsedPerSkuInKg;

        let carbonBenchmarkingDataForRawMaterialSupplierRole =
          carbonBenchmarkingData;
        let waterBenchmarkingDataForRawMaterialSupplierRole =
          waterBenchmarkingData;
        let landBenchmarkingDataForRawMaterialSupplierRole =
          landBenchmarkingData;

        const benchmarkingDataForRawMaterialSupplierRole = {
          benchmarkingLciaMethodology: Object.keys(dto.audit[0].impacts)[0],
          carbonBenchmarkingData:
            carbonBenchmarkingDataForRawMaterialSupplierRole,
          waterBenchmarkingData:
            waterBenchmarkingDataForRawMaterialSupplierRole,
          landBenchmarkingData: landBenchmarkingDataForRawMaterialSupplierRole,
        };

        if (supplierRoleSlug == 'rawMaterialSupplier') {
          let existingRawMaterialSupplierDetailsFieldData;
          existingRawMaterialSupplierDetailsFieldData =
            await this.componentRepository.findOne({
              _id: componentId,
            });

          const onlyExistingRawMaterialSupplierDetailsFieldData =
            existingRawMaterialSupplierDetailsFieldData.rawMaterialSupplierDetails.toObject();

          const updatedRawMaterialSupplierDetails = {
            ...onlyExistingRawMaterialSupplierDetailsFieldData,
            benchmarkingData: benchmarkingDataForRawMaterialSupplierRole,
            audit: {
              query: dynamicQueryParams,
              results: dto.audit,
            },
          };

          const updateBenchmarkingDataFieldForRawMaterialSupplierRole =
            await this.componentRepository.update(
              { _id: componentId },
              {
                $set: {
                  rawMaterialSupplierDetails: updatedRawMaterialSupplierDetails,
                },
              },
            );
          return updateBenchmarkingDataFieldForRawMaterialSupplierRole;
        } else if (supplierRoleSlug == 'packagingManufacturer') {
          let existingPackagingManufacturerDetailsFieldData;
          existingPackagingManufacturerDetailsFieldData =
            await this.componentRepository.findOne({
              _id: componentId,
            });

          const onlyExistingPackagingManufacturerDetailsFieldData =
            existingPackagingManufacturerDetailsFieldData.packagingManufacturerDetails.toObject();

          const updatedPackagingManufacturerDetails = {
            ...onlyExistingPackagingManufacturerDetailsFieldData,
            benchmarkingData: benchmarkingDataForRawMaterialSupplierRole,
            audit: {
              query: dynamicQueryParams,
              results: dto.audit,
            },
          };

          const updateBenchmarkingDataFieldForpackagingManufacturer =
            await this.componentRepository.update(
              { _id: componentId },
              {
                $set: {
                  packagingManufacturerDetails:
                    updatedPackagingManufacturerDetails,
                },
              },
            );
          return updateBenchmarkingDataFieldForpackagingManufacturer;
        }

        break;

      case 'transportFreight':
        const transportAndFreightDetailsOfComonent =
          componentDetails.transportFreightDetails;
        const transportFreight = componentDetails.transportFreight;
        const calculatedDistanceKm =
          transportFreight.calculatedDistanceKm !== 0
            ? transportFreight.calculatedDistanceKm
            : 0;
        let netWeightPerUnitTransportedInMetricTonne: number =
          transportAndFreightDetailsOfComonent.netWeightPerUnit;
        if (transportAndFreightDetailsOfComonent.netWeightUnit != 't') {
          netWeightPerUnitTransportedInMetricTonne =
            this.unitConversions.convertToTonnes(
              +transportAndFreightDetailsOfComonent.netWeightPerUnit,
              transportAndFreightDetailsOfComonent.netWeightUnit,
            );
        }
        let totalCarbonForTransportAndFreightRole = 0;
        let totalWaterForTransportAndFreightRole = 0;
        let totalLandForTransportAndFreightRole = 0;

        const toFixedNumberForTransportAndFreightRole = (
          value: number,
          decimals = 8,
        ) => Number(value.toFixed(decimals));

        dto.audit.forEach((item) => {
          if (!item.impacts) return;

          const impactMethodKey = Object.keys(item.impacts)[0];
          if (!impactMethodKey) return;

          const impactValues = item.impacts[impactMethodKey];

          const carbon = toFixedNumberForTransportAndFreightRole(
            impactValues?.carbon ?? 0,
          );
          const water = toFixedNumberForTransportAndFreightRole(
            impactValues?.water ?? 0,
          );
          const land = toFixedNumberForTransportAndFreightRole(
            impactValues?.land ?? 0,
          );

          totalCarbonForTransportAndFreightRole += carbon;
          totalWaterForTransportAndFreightRole += water;
          totalLandForTransportAndFreightRole += land;
        });

        const transportAndFreightAgggregationResult =
          this.aggregateBenchmarkingData(
            totalCarbonForTransportAndFreightRole,
            totalWaterForTransportAndFreightRole,
            totalLandForTransportAndFreightRole,
            rowsSelected,
          );

        carbonBenchmarkingData =
          transportAndFreightAgggregationResult.carbonBenchmarkingData;
        waterBenchmarkingData =
          transportAndFreightAgggregationResult.waterBenchmarkingData;
        landBenchmarkingData =
          transportAndFreightAgggregationResult.landBenchmarkingData;

        let carbonBenchmarkingDataForTransportAndFreightRole =
          carbonBenchmarkingData *
          netWeightPerUnitTransportedInMetricTonne *
          calculatedDistanceKm;
        let waterBenchmarkingDataForTransportAndFreightRole =
          waterBenchmarkingData *
          netWeightPerUnitTransportedInMetricTonne *
          calculatedDistanceKm;
        let landBenchmarkingDataForTransportAndFreightRole =
          landBenchmarkingData *
          netWeightPerUnitTransportedInMetricTonne *
          calculatedDistanceKm;

        const benchmarkingDataForTransportAndFreightRole = {
          benchmarkingLciaMethodology: Object.keys(dto.audit[0].impacts)[0],
          carbonBenchmarkingData:
            carbonBenchmarkingDataForTransportAndFreightRole,
          waterBenchmarkingData:
            waterBenchmarkingDataForTransportAndFreightRole,
          landBenchmarkingData: landBenchmarkingDataForTransportAndFreightRole,
        };

        let existingTransportFreightDetailsFieldData;
        existingTransportFreightDetailsFieldData =
          await this.componentRepository.findOne({
            _id: componentId,
          });

        const onlyExistingTransportFreightDetailsFieldData =
          existingTransportFreightDetailsFieldData.transportFreightDetails.toObject();

        const updatedTransportFreightDetails = {
          ...onlyExistingTransportFreightDetailsFieldData,
          benchmarkingData: benchmarkingDataForTransportAndFreightRole,
          audit: {
            query: dynamicQueryParams,
            results: dto.audit,
          },
        };

        const updateBenchmarkingDataFieldForTransportAndFreightRole =
          await this.componentRepository.update(
            { _id: componentId },
            {
              $set: {
                transportFreightDetails: updatedTransportFreightDetails,
              },
            },
          );
        return updateBenchmarkingDataFieldForTransportAndFreightRole;
        break;

      case 'storageFulfilment':
      case 'retailer':
      case 'cpgBrand':
        let storageType;
        let detailFieldOfComponent;
        if (supplierRoleSlug == 'storageFulfilment') {
          storageType = componentDetails.storageFulfilment.storageType;
          detailFieldOfComponent = componentDetails.storageFulfilmentDetails;
        } else if (supplierRoleSlug == 'retailer') {
          storageType = componentDetails.retailer.storageType;
          detailFieldOfComponent = componentDetails.retailerDetails;
        } else if (supplierRoleSlug == 'cpgBrand') {
          storageType = componentDetails.cpgBrand.storageType;
          detailFieldOfComponent = componentDetails.cpgBrandDetails;
        }
        let dailyEnergyConsumptionPerUnit;

        //  1. Compute annual energy per unit
        let annualEnergyConsumptionPerUnitValue;
        if (supplierRoleSlug == 'storageFulfilment') {
          if (storageType == 'ambient') {
            annualEnergyConsumptionPerUnitValue =
              detailFieldOfComponent.floorAreaPerSku * 65;
          } else if (storageType == 'chilled') {
            annualEnergyConsumptionPerUnitValue =
              detailFieldOfComponent.volumePerSku * 56;
          } else if (storageType == 'frozen') {
            annualEnergyConsumptionPerUnitValue =
              detailFieldOfComponent.volumePerSku * 69;
          }
        } else {
          if (storageType == 'ambient') {
            dailyEnergyConsumptionPerUnit =
              detailFieldOfComponent.floorAreaPerSku * 0.48;
          } else if (storageType == 'chilled') {
            dailyEnergyConsumptionPerUnit =
              detailFieldOfComponent.floorAreaPerSku * 0.82;
          } else if (storageType == 'frozen') {
            dailyEnergyConsumptionPerUnit =
              detailFieldOfComponent.floorAreaPerSku * 1.1;
          }
        }
        if (supplierRoleSlug == 'storageFulfilment') {
          // 2. Convert annual energy consumption figures into daily basis
          dailyEnergyConsumptionPerUnit =
            +annualEnergyConsumptionPerUnitValue / 365;
        }

        // 3. Scale on basis of storage duration (days)
        const energyForStorageDaysPerUnitInKwh =
          +dailyEnergyConsumptionPerUnit * detailFieldOfComponent.storageDays;

        let totalCarbonForStorageFulfilmentRole = 0;
        let totalWaterForStorageFulfilmentRole = 0;
        let totalLandForStorageFulfilmentRole = 0;

        const toFixedNumberForStorageFulfilmentRole = (
          value: number,
          decimals = 8,
        ) => Number(value.toFixed(decimals));

        dto.audit.forEach((item) => {
          if (!item.impacts) return;

          const impactMethodKey = Object.keys(item.impacts)[0];
          if (!impactMethodKey) return;

          // Determine denominator
          const denominator =
            item.impacts?.kwhEnergy !== undefined &&
            item.impacts?.kwhEnergy !== null
              ? item.impacts.kwhEnergy
              : 1;

          const impactValues = item.impacts[impactMethodKey];

          const carbon = toFixedNumberForStorageFulfilmentRole(
            (impactValues?.carbon ?? 0) / denominator,
          );
          const water = toFixedNumberForStorageFulfilmentRole(
            (impactValues?.water ?? 0) / denominator,
          );
          const land = toFixedNumberForStorageFulfilmentRole(
            (impactValues?.land ?? 0) / denominator,
          );

          totalCarbonForStorageFulfilmentRole += carbon;
          totalWaterForStorageFulfilmentRole += water;
          totalLandForStorageFulfilmentRole += land;
        });

        const storageAndFulfilmentAggregationResult =
          this.aggregateBenchmarkingData(
            totalCarbonForStorageFulfilmentRole,
            totalWaterForStorageFulfilmentRole,
            totalLandForStorageFulfilmentRole,
            rowsSelected,
          );

        carbonBenchmarkingData =
          storageAndFulfilmentAggregationResult.carbonBenchmarkingData *
          energyForStorageDaysPerUnitInKwh;
        waterBenchmarkingData =
          storageAndFulfilmentAggregationResult.waterBenchmarkingData *
          energyForStorageDaysPerUnitInKwh;
        landBenchmarkingData =
          storageAndFulfilmentAggregationResult.landBenchmarkingData *
          energyForStorageDaysPerUnitInKwh;

        let carbonBenchmarkingDataForStorageFulfilmentRole =
          carbonBenchmarkingData;
        let waterBenchmarkingDataForStorageFulfilmentRole =
          waterBenchmarkingData;
        let landBenchmarkingDataForStorageFulfilmentRole = landBenchmarkingData;

        const benchmarkingDataForStorageFulfilmentRole = {
          benchmarkingLciaMethodology: Object.keys(dto.audit[0].impacts)[0],
          carbonBenchmarkingData:
            carbonBenchmarkingDataForStorageFulfilmentRole,
          waterBenchmarkingData: waterBenchmarkingDataForStorageFulfilmentRole,
          landBenchmarkingData: landBenchmarkingDataForStorageFulfilmentRole,
        };

        if (supplierRoleSlug == 'storageFulfilment') {
          let existingstorageFulfilmentDetailsFieldData;
          existingstorageFulfilmentDetailsFieldData =
            await this.componentRepository.findOne({
              _id: componentId,
            });

          const onlyExistingStorageFulfilmentDetailsFieldData =
            existingstorageFulfilmentDetailsFieldData.storageFulfilmentDetails.toObject();

          const updatedStorageFulfilmentDetails = {
            ...onlyExistingStorageFulfilmentDetailsFieldData,
            benchmarkingData: benchmarkingDataForStorageFulfilmentRole,
            audit: {
              query: dynamicQueryParams,
              results: dto.audit,
            },
          };

          const updateBenchmarkingDataFieldForStorageFulfilmentRole =
            await this.componentRepository.update(
              { _id: componentId },
              {
                $set: {
                  storageFulfilmentDetails: updatedStorageFulfilmentDetails,
                },
              },
            );
          return updateBenchmarkingDataFieldForStorageFulfilmentRole;
        } else if (supplierRoleSlug == 'retailer') {
          let existingRetailerDetailsFieldData;
          existingRetailerDetailsFieldData =
            await this.componentRepository.findOne({
              _id: componentId,
            });

          const onlyExistingRetailerDetailsFieldData =
            existingRetailerDetailsFieldData.retailerDetails.toObject();

          const updatedRetailerDetails = {
            ...onlyExistingRetailerDetailsFieldData,
            benchmarkingData: benchmarkingDataForStorageFulfilmentRole,
            audit: {
              query: dynamicQueryParams,
              results: dto.audit,
            },
          };

          const updateBenchmarkingDataFieldForRetailerRole =
            await this.componentRepository.update(
              { _id: componentId },
              {
                $set: {
                  retailerDetails: updatedRetailerDetails,
                },
              },
            );
          return updateBenchmarkingDataFieldForRetailerRole;
        } else if (supplierRoleSlug == 'cpgBrand') {
          let existingCpgBrandDetailsFieldData;
          existingCpgBrandDetailsFieldData =
            await this.componentRepository.findOne({
              _id: componentId,
            });

          const onlyExistingCpgBrandDetailsFieldData =
            existingCpgBrandDetailsFieldData.cpgBrandDetails.toObject();

          const updatedCpgBrandDetails = {
            ...onlyExistingCpgBrandDetailsFieldData,
            benchmarkingData: benchmarkingDataForStorageFulfilmentRole,
            audit: {
              query: dynamicQueryParams,
              results: dto.audit,
            },
          };

          const updateBenchmarkingDataFieldForCpgBrandRole =
            await this.componentRepository.update(
              { _id: componentId },
              {
                $set: {
                  cpgBrandDetails: updatedCpgBrandDetails,
                },
              },
            );
          return updateBenchmarkingDataFieldForCpgBrandRole;
        }
        break;

      case 'contractManufacturer': {
        const rowsSelected = dto.audit.length;
        const manufacturingActivityTypesArray =
          componentDetails.contractManufacturer.manufacturingActivityTypes;
        const manufacturingDetailsField =
          componentDetails.contractManufacturerDetails;

        /* Benchmarks (kWh per unit) */
        const ENERGY_BENCHMARKS = {
          filling: 0.035, // kWh/kg
          mixing: 0.05, // kWh/kg
          homogenising: 0.15, // kWh/kg
          fermenting: 0.1, // kWh/kg
          packaging: 0.06, // kWh/kg
          labelling: 0.003, // kWh/label
          heating: 0.004, // kWh/kg·°C
          cooling: 0.006, // kWh/kg·°C
        };
        const toKg = (value: number, unit: string): number => {
          if (unit === 'kg') return value;
          if (unit === 'g') return value / 1000;
          throw new IncompatibleUnitError(`Unsupported unit: ${unit}`);
        };

        const toFixed = (value: number, decimals = 8) =>
          Number(value.toFixed(decimals));

        /* 1: Energy calculation */
        let totalEnergyConsumptionKwh = 0;

        manufacturingActivityTypesArray.forEach((activity: string) => {
          const activityData = manufacturingDetailsField[activity];
          if (!activityData) return;

          switch (activity) {
            case 'filling':
            case 'mixing':
            case 'homogenising':
            case 'fermenting':
            case 'packaging': {
              const volumeKg = toKg(
                activityData.volumePerUnit,
                activityData.volumeUnit,
              );
              totalEnergyConsumptionKwh +=
                volumeKg * ENERGY_BENCHMARKS[activity];

              break;
            }

            case 'labelling': {
              totalEnergyConsumptionKwh +=
                activityData.numberOfLabels * ENERGY_BENCHMARKS.labelling;
              break;
            }

            case 'heating':
            case 'cooling': {
              const volumeKg = toKg(
                activityData.volumePerUnit,
                activityData.volumeUnit,
              );
              const deltaTemp = Math.abs(
                activityData.targetTemperature -
                  activityData.currentTemperature,
              );
              totalEnergyConsumptionKwh +=
                volumeKg * deltaTemp * ENERGY_BENCHMARKS[activity];
              break;
            }
          }
        });

        /*  2: Impact per kWh */
        let totalCarbon = 0;
        let totalWater = 0;
        let totalLand = 0;

        dto.audit.forEach((item) => {
          if (!item.impacts) return;

          const lciaMethod = Object.keys(item.impacts)[0];
          if (!lciaMethod) return;

          // Determine denominator
          const denominator =
            item.impacts?.kwhEnergy !== undefined &&
            item.impacts?.kwhEnergy !== null
              ? item.impacts.kwhEnergy
              : 1;

          const impactValues = item.impacts[lciaMethod];

          totalCarbon += (impactValues?.carbon ?? 0) / denominator;
          totalWater += (impactValues?.water ?? 0) / denominator;
          totalLand += (impactValues?.land ?? 0) / denominator;
        });

        let carbonBenchmarkingData =
          rowsSelected > 1
            ? toFixed(totalCarbon / rowsSelected)
            : toFixed(totalCarbon);

        let waterBenchmarkingData =
          rowsSelected > 1
            ? toFixed(totalWater / rowsSelected)
            : toFixed(totalWater);

        let landBenchmarkingData =
          rowsSelected > 1
            ? toFixed(totalLand / rowsSelected)
            : toFixed(totalLand);

        carbonBenchmarkingData =
          carbonBenchmarkingData * totalEnergyConsumptionKwh;
        waterBenchmarkingData =
          waterBenchmarkingData * totalEnergyConsumptionKwh;
        landBenchmarkingData = landBenchmarkingData * totalEnergyConsumptionKwh;

        const benchmarkingData = {
          benchmarkingLciaMethodology: Object.keys(dto.audit[0].impacts)[0],
          carbonBenchmarkingData,
          waterBenchmarkingData,
          landBenchmarkingData,
        };

        let existingContractManufacturerDetailsFieldData;
        existingContractManufacturerDetailsFieldData =
          await this.componentRepository.findOne({
            _id: componentId,
          });

        const onlyExistingContractManufacturerDetailsFieldData =
          existingContractManufacturerDetailsFieldData.contractManufacturerDetails.toObject();

        const updatedContractManufacturerDetails = {
          ...onlyExistingContractManufacturerDetailsFieldData,
          benchmarkingData: benchmarkingData,
          audit: {
            query: dynamicQueryParams,
            results: dto.audit,
          },
        };

        /* 4: Persist */
        const updateContractManufacturerBenchmarking =
          await this.componentRepository.update(
            { _id: componentId },
            {
              $set: {
                contractManufacturerDetails: updatedContractManufacturerDetails,
              },
            },
          );

        return updateContractManufacturerBenchmarking;
      }
    }
  }

  aggregateBenchmarkingData(
    totalCarbon: number,
    totalWater: number,
    totalLand: number,
    rowsSelected: number,
    decimals = 8,
  ) {
    const toFixedNumber = (value: number) => Number(value.toFixed(decimals));

    if (rowsSelected > 1) {
      return {
        carbonBenchmarkingData: toFixedNumber(totalCarbon / rowsSelected),
        waterBenchmarkingData: toFixedNumber(totalWater / rowsSelected),
        landBenchmarkingData: toFixedNumber(totalLand / rowsSelected),
      };
    }

    return {
      carbonBenchmarkingData: toFixedNumber(totalCarbon),
      waterBenchmarkingData: toFixedNumber(totalWater),
      landBenchmarkingData: toFixedNumber(totalLand),
    };
  }

  async fetchBenchmarkingDataForComponent(
    userId: string,
    componentId: string,
    supplierRoleSlug: string,
    userRole,
  ) {
    let componentBenchmarkingResults;
    if (userRole == 'supplier_user') {
      componentBenchmarkingResults = await this.componentRepository.findOne({
        _id: componentId,
        supplierId: new Types.ObjectId(userId),
      });
    } else {
      componentBenchmarkingResults = await this.componentRepository.findOne({
        _id: componentId,
        // createdBy: userId,
      });
    }

    if (!componentBenchmarkingResults) {
      throw new ComponentNotFoundError('Component not found');
    }

    const dynamicSupplierRoleDetailsField = `${supplierRoleSlug}Details`;
    if (
      !componentBenchmarkingResults[dynamicSupplierRoleDetailsField] ||
      !componentBenchmarkingResults[dynamicSupplierRoleDetailsField].audit
    ) {
      throw new BenchmarkingDataDoesNotExistError(
        'Benchmarking data does not exist for this supplier role',
      );
    }

    return componentBenchmarkingResults[dynamicSupplierRoleDetailsField];
  }

  async validateSubscriptionForProductCreation(userId: string) {
    // Get active subscription
    const subscription = await this.companySubscriptionRepository.findOne({
      userId: new Types.ObjectId(userId),
      status: SubscriptionStatus.ACTIVE,
    });

    // Count existing products
    const productCount = await this.productRepository.countByFilter({
      companyId: new Types.ObjectId(userId),
      deletedAt: null,
    });

    // If no subscription exists
    if (!subscription) {
      // If user already has 1 or more products → block (need subscription for 2nd product)
      if (productCount >= 1) {
        throw new SubscriptionRequiredError();
      }
      // If user has 0 products → allow (first product is free)
      return { subscription: null, plan: null };
    }

    // Get plan
    const plan = await this.subscriptionPlanRepository.findOne({
      slug: subscription.planSlug,
    });
    if (!plan) {
      throw new SubscriptionPlanNotFoundError();
    }

    // If unlimited plan → allow
    if (plan.maxProducts === null) {
      return { subscription, plan };
    }

    // Enforce limit
    if (productCount >= plan.maxProducts) {
      throw new ProductLimitExceededError(plan.maxProducts);
    }

    return { subscription, plan };
  }

  async checkEmailExistsForProduct(email: string, componentName: string) {
    const user = await this.userRepository.findOne({
      email: email.toLowerCase(),
      deletedAt: null,
    });

    if (!user) {
      return {
        isExists: false,
        canProceed: true,
        reason: 'Email available',
      };
    }

    const role = await this.roleRepository.findById(user.role);

    if (!role) {
      throw new RoleNotFoundError('User role not found');
    }

    if (role.roleSlug === 'supplier_user') {
      throw new EmailAlreadyExistsError(
        'Email already exists for a supplier user',
      );
    }

    if (role.roleSlug === 'company_user') {
      await this.validateCompanyUserProductAccess(
        user._id.toString(),
        componentName,
        email,
      );

      return {
        isExists: true,
        canProceed: true,
        reason: 'Company user with valid product',
      };
    }

    // Other roles
    return {
      isExists: true,
      canProceed: false,
      reason: 'Email already exists',
    };
  }

  // Helper method to escape special regex characters
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Validate component belong to the company for supplier type company
  private async validateCompanyUserProductAccess(
    companyUserId: string,
    componentName: string,
    email: string,
  ) {
    const product = await this.productRepository.findOne({
      name: {
        $regex: new RegExp(`^${this.escapeRegex(componentName)}$`, 'i'),
      },
      companyId: new Types.ObjectId(companyUserId),
      deletedAt: null,
    });

    if (!product) {
      throw new ProductNotFoundError(
        `No product found with name ${componentName} for supplier ${email}`,
      );
    }
    return product._id;
  }

  private async handleSupplierEmail(record: any, user: any) {
    if (!record?.supplierContactEmail) {
      return null;
    }

    const supplierExistAsUser = await this.userRepository.findOne({
      email: record.supplierContactEmail,
    });

    const invitationResult = await this.invitationRepository.findOne({
      invitedEmail: record.supplierContactEmail,
      invitedBy: user._id,
      status: 'pending',
    });

    //Supplier already platform user
    if (supplierExistAsUser) {
      await this.emailService.sendEmail(
        {
          toEmail: record.supplierContactEmail,
          emailType: 'requestImpactCategoryDataFromSupplier',
        },
        record,
      );

      return 'requestMailSent';
    }

    //Not user & no invite sent yet
    if (!supplierExistAsUser && !invitationResult) {
      await this.emailService.sendEmail(
        {
          toEmail: record.supplierContactEmail,
          emailType: 'supplierPlatformInvite',
        },
        record,
      );

      await this.invitationRepository.create({
        invitedEmail: record.supplierContactEmail,
        invitedBy: user._id,
        status: 'pending',
      });

      return 'platformInviteSent';
    }
    // Already invited but not yet onboarded — re-send platform invite
    await this.emailService.sendEmail(
      {
        toEmail: record.supplierContactEmail,
        emailType: 'supplierPlatformInvite',
      },
      record,
    );

    return 'platformInviteSent';
  }

  // Get product requests
  async getIncomingRequestsForProduct(
    productId: string,
    userId: string,
    userRoleSlug: string,
    skip = 0,
    limit = 10,
  ) {
    const productObjectId = new Types.ObjectId(productId);

    // Validate Product Access
    const productFilter: any = {
      _id: productObjectId,
      deletedAt: null,
    };

    if (userRoleSlug !== 'admin_user') {
      productFilter.companyId = new Types.ObjectId(userId);
    }

    const product = await this.productRepository.findOne(productFilter);

    if (!product) {
      throw new ProductNotFoundError('Product not found or access denied');
    }

    // Join only components requested for this product
    const pipeline = [
      {
        $lookup: {
          from: 'component',
          let: { componentId: '$componentId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$componentId'] },
                    { $eq: ['$requestedProductId', productObjectId] },
                    { $eq: ['$supplierType', 'company'] },
                    { $eq: ['$deletedAt', null] },
                  ],
                },
              },
            },
          ],
          as: 'component',
        },
      },
      { $unwind: '$component' },

      {
        $match: {
          deletedAt: null,
          $expr: {
            $in: ['$supplierLinkedRole', '$component.supplierRoles'],
          },
        },
      },

      // Only include records that exist in ImpactCategoryRequest with isRequested = true
      {
        $lookup: {
          from: 'impactCategoryRequest',
          let: { recordId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$impactCategoryRecordId', '$$recordId'] },
                    { $eq: ['$isRequested', true] },
                  ],
                },
              },
            },
          ],
          as: 'requestCheck',
        },
      },
      {
        $match: {
          requestCheck: { $ne: [] }, // Only keep if request exists
        },
      },

      {
        $addFields: {
          createdByObjectId: {
            $cond: {
              if: { $eq: [{ $type: '$component.createdBy' }, 'string'] },
              then: { $toObjectId: '$component.createdBy' },
              else: '$component.createdBy',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdByObjectId',
          foreignField: '_id',
          as: 'requestingCompany',
        },
      },
      {
        $unwind: {
          path: '$requestingCompany',
          preserveNullAndEmptyArrays: true,
        },
      },
      // GET VERSIONS
      {
        $lookup: {
          from: 'impactCategoryVersion',
          let: { recordId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$impactCategoryRecordId', '$$recordId'],
                },
              },
            },

            // sort by versionNumber DESC
            {
              $sort: {
                versionNumber: -1,
              },
            },

            // pick latest per category + owner
            {
              $group: {
                _id: {
                  impactCategory: '$impactCategory',
                  versionOwner: '$versionOwner',
                },
                doc: { $first: '$$ROOT' },
              },
            },

            {
              $replaceRoot: { newRoot: '$doc' },
            },
          ],
          as: 'versions',
        },
      },

      // Group per component + role
      {
        $group: {
          _id: {
            componentId: '$componentId',
            roleDetailsId: '$roleDetailsId',
          },
          supplierLinkedRole: { $first: '$supplierLinkedRole' },
          impactCategories: { $addToSet: '$impactCategory' },
          versions: { $push: '$versions' },
          createdAt: { $max: '$createdAt' },
          component: { $first: '$component' },
          requestingCompany: { $first: '$requestingCompany' },
        },
      },

      // Flatten versions array
      {
        $addFields: {
          flatVersions: {
            $reduce: {
              input: '$versions',
              initialValue: [],
              in: { $concatArrays: ['$$value', '$$this'] },
            },
          },
        },
      },

      // Supplier latest versions only
      {
        $addFields: {
          supplierVersions: {
            $filter: {
              input: '$flatVersions',
              as: 'v',
              cond: { $eq: ['$$v.versionOwner', 'supplier'] },
            },
          },
          displayVersions: {
            $filter: {
              input: '$flatVersions',
              as: 'v',
              cond: {
                $in: ['$$v.versionOwner', ['supplier', 'company']],
              },
            },
          },
        },
      },
      // Build impacts object
      {
        $addFields: {
          impacts: {
            $arrayToObject: {
              $map: {
                input: '$impactCategories',
                as: 'category',
                in: {
                  k: '$$category',
                  v: {
                    $let: {
                      vars: {
                        matchedVersion: {
                          $arrayElemAt: [
                            {
                              $sortArray: {
                                input: {
                                  $map: {
                                    input: {
                                      $filter: {
                                        input: '$displayVersions',
                                        as: 'v',
                                        cond: {
                                          $eq: [
                                            '$$v.impactCategory',
                                            '$$category',
                                          ],
                                        },
                                      },
                                    },
                                    as: 'v',
                                    in: {
                                      $mergeObjects: [
                                        '$$v',
                                        {
                                          priority: {
                                            $cond: [
                                              {
                                                $and: [
                                                  {
                                                    $eq: [
                                                      '$$v.versionOwner',
                                                      'supplier',
                                                    ],
                                                  },
                                                  {
                                                    $eq: [
                                                      '$$v.isSubmitted',
                                                      true,
                                                    ],
                                                  },
                                                ],
                                              },
                                              1,
                                              0,
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                },
                                sortBy: {
                                  versionNumber: -1,
                                  priority: -1,
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: {
                        quantity: {
                          $cond: [
                            {
                              $and: [
                                {
                                  $eq: [
                                    '$$matchedVersion.versionOwner',
                                    'company',
                                  ],
                                },
                                {
                                  $eq: ['$$matchedVersion.isSubmitted', false],
                                },
                              ],
                            },
                            null,
                            {
                              $ifNull: [
                                '$$matchedVersion.quantity',
                                '$$matchedVersion.tempQuantity',
                              ],
                            },
                          ],
                        },

                        unit: {
                          $cond: [
                            {
                              $and: [
                                {
                                  $eq: [
                                    '$$matchedVersion.versionOwner',
                                    'company',
                                  ],
                                },
                                {
                                  $eq: ['$$matchedVersion.isSubmitted', false],
                                },
                              ],
                            },
                            null,
                            {
                              $ifNull: [
                                '$$matchedVersion.unit',
                                '$$matchedVersion.tempUnit',
                              ],
                            },
                          ],
                        },

                        lciaMethodology: {
                          $cond: [
                            {
                              $and: [
                                {
                                  $eq: [
                                    '$$matchedVersion.versionOwner',
                                    'company',
                                  ],
                                },
                                {
                                  $eq: ['$$matchedVersion.isSubmitted', false],
                                },
                              ],
                            },
                            null,
                            {
                              $ifNull: [
                                '$$matchedVersion.lciaMethodology',
                                '$$matchedVersion.tempLciaMethodology',
                              ],
                            },
                          ],
                        },
                        isSubmitted: {
                          $ifNull: ['$$matchedVersion.isSubmitted', false],
                        },
                        isImpactPresent: {
                          $ifNull: ['$$matchedVersion.isImpactPresent', false],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Status counts
      {
        $addFields: {
          requestedCategoryCount: { $size: '$impactCategories' },

          savedCount: {
            $size: {
              $filter: {
                input: '$supplierVersions',
                as: 'v',
                cond: {
                  $ne: ['$$v.quantity', null],
                },
              },
            },
          },

          submittedCount: {
            $size: {
              $filter: {
                input: '$supplierVersions',
                as: 'v',
                cond: {
                  $eq: ['$$v.isSubmitted', true],
                },
              },
            },
          },
        },
      },

      // Final Status Logic
      {
        $addFields: {
          submissionStatus: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ['$submittedCount', '$requestedCategoryCount'],
                  },
                  then: 'submitted',
                },
                {
                  case: {
                    $and: [
                      { $eq: ['$savedCount', '$requestedCategoryCount'] },
                      { $eq: ['$submittedCount', 0] },
                    ],
                  },
                  then: 'ready',
                },
                {
                  case: {
                    $gt: ['$submittedCount', 0],
                  },
                  then: 'partial',
                },
              ],
              default: 'pending',
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          componentId: '$_id.componentId',
          productId: '$component.productId',
          roleDetailsId: '$_id.roleDetailsId',
          supplierLinkedRole: 1,
          companyName: {
            $ifNull: ['$requestingCompany.companyDetails.name', null],
          },
          supplierContactEmail: '$component.supplierContactEmail',
          supplierContactName: '$component.supplierContactName',
          requestedImpactCategories: '$impactCategories',
          submissionStatus: 1,
          impacts: 1,

          netUnitSize: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$supplierLinkedRole', 'rawMaterialSupplier'] },
                  then: '$component.rawMaterialSupplierDetails.netWeightUsedPerSku',
                },
                {
                  case: {
                    $eq: ['$supplierLinkedRole', 'packagingManufacturer'],
                  },
                  then: '$component.packagingManufacturerDetails.netWeightUsedPerSku',
                },
                {
                  case: { $eq: ['$supplierLinkedRole', 'transportFreight'] },
                  then: '$component.transportFreightDetails.netWeightPerUnit',
                },
                {
                  case: { $eq: ['$supplierLinkedRole', 'storageFulfilment'] },
                  then: '$component.storageFulfilmentDetails.volumePerSku',
                },
                {
                  case: { $eq: ['$supplierLinkedRole', 'retailer'] },
                  then: '$component.retailerDetails.volumePerSku',
                },
                {
                  case: { $eq: ['$supplierLinkedRole', 'cpgBrand'] },
                  then: '$component.cpgBrandDetails.volumePerSku',
                },
                {
                  case: {
                    $eq: ['$supplierLinkedRole', 'contractManufacturer'],
                  },
                  then: '$component.contractManufacturerDetails',
                },
              ],
              default: null,
            },
          },

          netUnit: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$supplierLinkedRole', 'rawMaterialSupplier'] },
                  then: '$component.rawMaterialSupplierDetails.netWeightUnit',
                },
                {
                  case: {
                    $eq: ['$supplierLinkedRole', 'packagingManufacturer'],
                  },
                  then: '$component.packagingManufacturerDetails.netWeightUnit',
                },
                {
                  case: { $eq: ['$supplierLinkedRole', 'transportFreight'] },
                  then: '$component.transportFreightDetails.netWeightUnit',
                },
                {
                  case: {
                    $eq: ['$supplierLinkedRole', 'contractManufacturer'],
                  },
                  then: '$component.contractManufacturerDetails',
                },
              ],
              default: null,
            },
          },

          benchmarkingData: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$supplierLinkedRole', 'rawMaterialSupplier'] },
                  then: '$component.rawMaterialSupplierDetails.benchmarkingData',
                },
                {
                  case: {
                    $eq: ['$supplierLinkedRole', 'packagingManufacturer'],
                  },
                  then: '$component.packagingManufacturerDetails.benchmarkingData',
                },
                {
                  case: { $eq: ['$supplierLinkedRole', 'transportFreight'] },
                  then: '$component.transportFreightDetails.benchmarkingData',
                },
                {
                  case: { $eq: ['$supplierLinkedRole', 'storageFulfilment'] },
                  then: '$component.storageFulfilmentDetails.benchmarkingData',
                },
                {
                  case: { $eq: ['$supplierLinkedRole', 'retailer'] },
                  then: '$component.retailerDetails.benchmarkingData',
                },
                {
                  case: { $eq: ['$supplierLinkedRole', 'cpgBrand'] },
                  then: '$component.cpgBrandDetails.benchmarkingData',
                },
                {
                  case: {
                    $eq: ['$supplierLinkedRole', 'contractManufacturer'],
                  },
                  then: '$component.contractManufacturerDetails.benchmarkingData',
                },
              ],
              default: null,
            },
          },

          dateOfRequest: '$createdAt',
        },
      },

      { $sort: { dateOfRequest: -1 } },

      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];

    const result =
      await this.impactCategoryRecordRepository.aggregate(pipeline);

    const total = result[0]?.metadata[0]?.total || 0;
    const data = result[0]?.data || [];

    return {
      count: total,
      skip,
      limit,
      result: data,
    };
  }

  async submitImpactCategory(
    componentId: string,
    roleSlug: string,
    categories: string[] | undefined,
    userId: string,
    userRoleSlug: string,
    productRequested,
  ) {
    // const isSupplierUser = userRoleSlug === 'supplier_user';
    // const versionOwner = isSupplierUser ? 'supplier' : 'company';

    /**
     * ============================
     * SUPPLIER MODE DETECTION
     * ============================
     */

    let isSupplierUser = false;

    if (userRoleSlug === 'supplier_user') {
      isSupplierUser = true;
    }

    /**
     * Admin behaves like supplier
     */
    if (userRoleSlug === 'admin_user') {
      isSupplierUser = true;
    }

    /**
     * Company acting as supplier
     */
    if (userRoleSlug === 'company_user' && productRequested === 'true') {
      isSupplierUser = true;
    }

    const versionOwner = isSupplierUser ? 'supplier' : 'company';
    const componentObjectId = new Types.ObjectId(componentId);
    const records = await this.impactCategoryRecordRepository.find({
      componentId: componentObjectId,
      supplierLinkedRole: roleSlug,
    });

    if (!records.length) {
      throw new NotFoundError('Impact category records not found');
    }
    const submittedImpactCategoryData: any[] = [];

    // Submission logic
    for (const record of records) {
      const categoryType = record.impactCategory;

      if (categories?.length && !categories.includes(categoryType)) {
        continue;
      }

      let draft = await this.impactCategoryVersionRepository.findOne({
        impactCategoryRecordId: record._id,
        versionOwner,
        isLatest: true,
        isSubmitted: false,
      });

      const lastSubmitted =
        await this.impactCategoryVersionRepository.findLatestSubmittedVersion(
          record._id,
          versionOwner,
        );

      if (lastSubmitted) {
        await this.impactCategoryVersionRepository.update(
          { _id: lastSubmitted._id },
          { isLatest: false },
        );
      }

      /**
       * If no draft exists (common after supplier request),
       * create a draft from last submitted data
       */
      if (!draft && lastSubmitted) {
        draft = await this.impactCategoryVersionRepository.create({
          impactCategoryRecordId: record._id,
          versionOwner,
          impactCategory: categoryType,
          quantity: lastSubmitted.quantity,
          unit: lastSubmitted.unit,
          lciaMethodology: lastSubmitted.lciaMethodology,
          versionNumber: lastSubmitted.versionNumber + 1,
          tempQuantity: lastSubmitted.tempQuantity,
          tempUnit: lastSubmitted.tempUnit,
          tempLciaMethodology: lastSubmitted.tempLciaMethodology,
          dataSource: lastSubmitted.dataSource,
          isImpactPresent: lastSubmitted.isImpactPresent,
          isSubmitted: false,
          isLatest: true,
          createdBy: userId,
        });
      }

      if (!draft) continue;

      const nextVersionNumber = lastSubmitted
        ? lastSubmitted.versionNumber + 1
        : 1;

      /**
       * If draft has no data (supplier request draft),
       * copy previous submitted data before submitting
       */
      if (
        draft &&
        draft.quantity == null &&
        draft.isImpactPresent !== false &&
        draft.tempQuantity == null &&
        draft.dataSource == null &&
        lastSubmitted
      ) {
        draft.quantity = lastSubmitted.quantity;
        draft.unit = lastSubmitted.unit;
        draft.lciaMethodology = lastSubmitted.lciaMethodology;
        draft.tempQuantity = lastSubmitted.tempQuantity;
        draft.tempUnit = lastSubmitted.tempUnit;
        draft.tempLciaMethodology = lastSubmitted.tempLciaMethodology;
        draft.dataSource = lastSubmitted.dataSource;
        draft.isImpactPresent = lastSubmitted.isImpactPresent;
      }

      const submittedVersion =
        await this.impactCategoryVersionRepository.findOneAndUpdate(
          { _id: draft._id },
          {
            quantity: draft.quantity,
            unit: draft.unit,
            lciaMethodology: draft.lciaMethodology,
            tempQuantity: draft.tempQuantity,
            tempUnit: draft.tempUnit,
            tempLciaMethodology: draft.tempLciaMethodology,
            dataSource: draft.dataSource,
            isImpactPresent: draft.isImpactPresent,
            versionNumber: nextVersionNumber,
            isSubmitted: true,
            isLatest: true,
            submittedAt: new Date(),
            submittedBy: new Types.ObjectId(userId),
            updatedBy: new Types.ObjectId(userId),
            ...(versionOwner === 'supplier' && { isProspective: true }),
          },
          { new: true },
        );

      if (submittedVersion) {
        submittedImpactCategoryData.push(submittedVersion);
      }
    }

    if (isSupplierUser && submittedImpactCategoryData.length > 0) {
      const componentAndProductDetails = await this.componentRepository.findOne(
        { _id: componentObjectId },
        {
          path: 'productId',
          select: 'name',
        },
      );

      const supplierDetail = await this.userRepository.findOne({
        _id: new Types.ObjectId(userId),
      });

      const companyDetails = await this.userRepository.findOne({
        _id: componentAndProductDetails?.createdBy,
      });

      if (companyDetails?.email) {
        const productDetails: any = componentAndProductDetails?.productId;

        const componentDetails = {
          componentName: componentAndProductDetails?.name,
          productName: productDetails?.name,
          productId: productDetails?._id,
          componentId: componentAndProductDetails?.id,
          roleSlug: roleSlug,
          companyName: companyDetails?.companyDetails?.name,
          supplierName: supplierDetail?.companyDetails?.name,
        };

        const emailDto = {
          toEmail: companyDetails.email,
          emailType: 'supplierSubmitImpactCategoryData',
        };

        await this.emailService.sendEmail(emailDto, componentDetails);
      }
    }

    // Fire-and-forget: build master data payload and POST to datahub
    if (submittedImpactCategoryData.length > 0) {
      const submittedVersionIds = submittedImpactCategoryData.map((v) => v._id);
      this.buildAndSaveMasterData(
        componentObjectId,
        roleSlug,
        versionOwner,
        submittedVersionIds,
      ).catch((err) => {
        console.error(
          `[MasterData] Failed to save for component ${componentObjectId}, role ${roleSlug}:`,
          err?.message ?? err,
        );
      });
    }

    return {
      message: 'Impact category data submitted successfully',
      submissionOwner: versionOwner,
      submittedImpactCategoryData,
    };
  }

  async getImpactCategorySummaryOnComponentDetailPage(
    params,
    userId,
    userRoleSlug,
    productRequested,
    isAdminViewCompany,
  ) {
    let { componentId, roleSlug } = params;

    const component = await this.componentRepository.findOne({
      _id: componentId,
    });

    if (!component) {
      throw new NotFoundError('Component not found');
    }

    /**
     * ============================
     * VIEW MODE DETECTION
     * ============================
     */

    let isSupplierView = false;

    if (userRoleSlug === 'supplier_user') {
      isSupplierView = true;
    }

    /**
     * Admin always sees supplier view
     */
    if (userRoleSlug === 'admin_user' && isAdminViewCompany === 'true') {
      userRoleSlug = 'company_user';
    }
    if (userRoleSlug === 'admin_user' && isAdminViewCompany != 'true') {
      isSupplierView = true;
      userRoleSlug = 'supplier_user';
    }

    /**
     * Company acting as supplier
     */
    if (userRoleSlug == 'company_user' && productRequested == 'true') {
      isSupplierView = true;
    }

    /**
     * Fetch company name for uploadedBy
     */
    let companyName;
    const companyUser = await this.userRepository.findOne({
      _id: component.createdBy,
    });
    companyName = companyUser?.companyDetails?.name ?? null;

    /**
     * Fetch all records
     */
    const records = await this.impactCategoryRecordRepository.find({
      componentId: new Types.ObjectId(componentId),
      supplierLinkedRole: roleSlug,
    });

    if (!records.length) {
      return { submissionStatus: 'Awaiting Submission' };
    }

    const response: any = {
      componentId: new Types.ObjectId(componentId),
      supplierLinkedRole: roleSlug,
      carbon: {},
      water: {},
      land: {},
    };

    const detailsField = `${roleSlug}Details`;
    const benchmarkingData =
      component?.[detailsField]?.benchmarkingData ?? null;

    let totalCategories = 0;
    let companySubmittedCount = 0;
    let companyAddedButNotSubmittedCount = 0;
    let supplierSubmittedCount = 0;
    let supplierAddedButNotSubmittedCount = 0;
    let requestEmailSent = false;
    let requestedCategoriesCount = 0;
    let requestedDataAvailableCount = 0;
    let requestedSubmittedCount = 0;

    // Collect "previously submitted" data across categories for the bottom section
    const previouslySubmittedMap: Record<string, any> = {};
    const latestPreviousCompanySubmittedMap: Record<string, any> = {};

    // ── Helper: compute benchmarking comparison for any quantity ─────────────
    const computeBenchmarkComparison = (
      quantity: number | undefined,
      category: string,
    ): string => {
      let averageComparison = 'No benchmarking value available for comparison';
      if (benchmarkingData && quantity != null) {
        const benchmarkField =
          category === 'carbon'
            ? 'carbonBenchmarkingData'
            : category === 'water'
              ? 'waterBenchmarkingData'
              : 'landBenchmarkingData';
        const benchmarkValue = benchmarkingData?.[benchmarkField];
        if (benchmarkValue && benchmarkValue !== 0) {
          const difference =
            ((quantity - benchmarkValue) / benchmarkValue) * 100;
          if (difference > 20) return `${difference.toFixed(0)}%`;
          if (difference < -20) return `${difference.toFixed(0)}%`;
          return `${difference.toFixed(0)}% Similar`;
        }
      }
      return averageComparison;
    };
    // ── End helper ────────────────────────────────────────────────────────────

    /**
     * LOOP ALL CATEGORIES
     */
    for (const record of records) {
      const category = record.impactCategory;
      totalCategories++;

      /**
       * FETCH REQUEST
       */
      const request = await this.impactCategoryRequestRepository.findOne({
        impactCategoryRecordId: record._id,
        impactCategory: category,
      });

      if (request?.isRequested) {
        requestEmailSent = true;
      }

      /**
       * FETCH VERSIONS SEPARATELY
       */
      const companyLatest =
        await this.impactCategoryVersionRepository.findLatestVersion(
          record._id,
          'company',
        );

      const companySubmitted =
        await this.impactCategoryVersionRepository.findLatestSubmittedVersion(
          record._id,
          'company',
        );

      let effectiveCompanyLatest = companyLatest;

      if (
        request?.isRequested &&
        companyLatest &&
        !companyLatest.isSubmitted &&
        companyLatest.quantity == null &&
        companyLatest.tempQuantity == null &&
        companyLatest.isImpactPresent !== false
      ) {
        effectiveCompanyLatest = companySubmitted;
      }

      const supplierLatest =
        await this.impactCategoryVersionRepository.findLatestVersion(
          record._id,
          'supplier',
        );

      if (request?.isRequested) {
        requestEmailSent = true;

        requestedCategoriesCount++;

        const hasData =
          supplierLatest &&
          (supplierLatest.quantity != null ||
            supplierLatest.tempQuantity != null ||
            supplierLatest.isImpactPresent === false);

        if (hasData) {
          requestedDataAvailableCount++;
        }

        if (supplierLatest?.isSubmitted === true) {
          requestedSubmittedCount++;
        }
      }

      /**
       * ============================
       * VERSIONING: PENDING SUPPLIER SUBMISSION (company view only)
       * ============================
       */
      let pendingSupplierVersion: any = null;
      if (!isSupplierView) {
        pendingSupplierVersion =
          await this.impactCategoryVersionRepository.findPendingSupplierSubmission(
            record._id,
          );
      }

      /**
       * ============================
       * VERSIONING: PREVIOUSLY SUBMITTED VERSION
       * ============================
       * For company view: the superseded company version.
       * For supplier view: the superseded supplier version. Additionally,
       *   if the supplier has their own active data, also surface the
       *   company's submitted data so the supplier can see what was entered.
       */
      const activeOwner = isSupplierView ? 'supplier' : 'company';
      let previousVersion;
      let latestPreviousCompanySubmittedVersion;

      if (!isSupplierView) {
        // COMPANY VIEW → ONLY consider submitted company versions
        const companySubmittedVersions =
          await this.impactCategoryVersionRepository.countSubmittedVersions(
            record._id,
            'company',
          );

        latestPreviousCompanySubmittedVersion =
          await this.impactCategoryVersionRepository.findLatestOriginalCompanySubmittedVersion(
            record._id,
          );

        if (companySubmittedVersions >= 2) {
          previousVersion =
            await this.impactCategoryVersionRepository.findSecondLatestSubmittedVersionExcludingSupplier(
              record._id,
            );
        }
      } else {
        // SUPPLIER VIEW → supplier history
        const supplierSubmittedVersions =
          await this.impactCategoryVersionRepository.countSubmittedVersions(
            record._id,
            'supplier',
          );

        if (supplierSubmittedVersions >= 2) {
          previousVersion =
            await this.impactCategoryVersionRepository.findSecondLatestSubmittedVersion(
              record._id,
              'supplier',
            );
        }
      }

      // For supplier view: if supplier has their own submitted data, also show
      // the company's submitted version under "Previously Submitted"
      let companyPreviousForSupplier: any = null;
      if (isSupplierView && supplierLatest?.isSubmitted) {
        companyPreviousForSupplier =
          await this.impactCategoryVersionRepository.findSecondLatestSubmittedVersion(
            record._id,
            'supplier',
          );
      }

      const effectivePrevious = previousVersion ?? companyPreviousForSupplier;

      if (effectivePrevious) {
        const prevQuantity =
          effectivePrevious.quantity ?? effectivePrevious.tempQuantity ?? null;
        const prevDataSource =
          effectivePrevious.dataSource == null
            ? 'Supplier'
            : effectivePrevious.dataSource === 'manual'
              ? 'Manual Input'
              : effectivePrevious.dataSource === 'database'
                ? 'Database'
                : effectivePrevious.dataSource === 'supplier'
                  ? 'Supplier'
                  : effectivePrevious.dataSource === 'temporary'
                    ? 'Temporary Data'
                    : effectivePrevious.dataSource;

        const tds = this.unitConversions.toDecimalString.bind(
          this.unitConversions,
        );

        previouslySubmittedMap[category] = {
          quantity: tds(effectivePrevious.quantity ?? null),
          unit: effectivePrevious.unit ?? null,
          lciaMethodology: effectivePrevious.lciaMethodology ?? null,
          tempQuantity: tds(effectivePrevious.tempQuantity ?? null),
          tempUnit: effectivePrevious.tempUnit ?? null,
          tempLciaMethodology: effectivePrevious.tempLciaMethodology ?? null,
          dataSource: effectivePrevious.dataSource ?? null,
          isImpactPresent: effectivePrevious.isImpactPresent ?? true,
          versionNumber: effectivePrevious.versionNumber,
          submittedAt: effectivePrevious.submittedAt ?? null,
          offsetCarbonImpact: effectivePrevious.offsetCarbonImpact ?? false,
          offsetQuantity: tds(effectivePrevious.offsetQuantity ?? null),
          offsetUnit: effectivePrevious.offsetUnit ?? null,
          presentableQuantity: tds(prevQuantity),
          presentableUnit:
            effectivePrevious.unit ?? effectivePrevious.tempUnit ?? null,
          presentableLciaMethodology:
            effectivePrevious.lciaMethodology ??
            effectivePrevious.tempLciaMethodology ??
            null,
          presentableDataSource: prevDataSource,
          averageComparison: computeBenchmarkComparison(prevQuantity, category),
        };
      }

      if (latestPreviousCompanySubmittedVersion) {
        const prevCompanyQuantity =
          latestPreviousCompanySubmittedVersion.quantity ??
          latestPreviousCompanySubmittedVersion.tempQuantity ??
          null;
        const prevCompanyDataSource =
          latestPreviousCompanySubmittedVersion.dataSource == null
            ? 'Supplier'
            : latestPreviousCompanySubmittedVersion.dataSource === 'manual'
              ? 'Manual Input'
              : latestPreviousCompanySubmittedVersion.dataSource === 'database'
                ? 'Database'
                : latestPreviousCompanySubmittedVersion.dataSource ===
                    'supplier'
                  ? 'Supplier'
                  : latestPreviousCompanySubmittedVersion.dataSource ===
                      'temporary'
                    ? 'Temporary Data'
                    : latestPreviousCompanySubmittedVersion.dataSource;

        const tds = this.unitConversions.toDecimalString.bind(
          this.unitConversions,
        );

        latestPreviousCompanySubmittedMap[category] = {
          quantity: tds(latestPreviousCompanySubmittedVersion.quantity ?? null),
          unit: latestPreviousCompanySubmittedVersion.unit ?? null,
          lciaMethodology:
            latestPreviousCompanySubmittedVersion.lciaMethodology ?? null,
          tempQuantity: tds(
            latestPreviousCompanySubmittedVersion.tempQuantity ?? null,
          ),
          tempUnit: latestPreviousCompanySubmittedVersion.tempUnit ?? null,
          tempLciaMethodology:
            latestPreviousCompanySubmittedVersion.tempLciaMethodology ?? null,
          dataSource: latestPreviousCompanySubmittedVersion.dataSource ?? null,
          isImpactPresent:
            latestPreviousCompanySubmittedVersion.isImpactPresent ?? true,
          versionNumber: latestPreviousCompanySubmittedVersion.versionNumber,
          submittedAt:
            latestPreviousCompanySubmittedVersion.submittedAt ?? null,
          offsetCarbonImpact:
            latestPreviousCompanySubmittedVersion.offsetCarbonImpact ?? false,
          offsetQuantity: tds(
            latestPreviousCompanySubmittedVersion.offsetQuantity ?? null,
          ),
          offsetUnit: latestPreviousCompanySubmittedVersion.offsetUnit ?? null,
          presentableQuantity: tds(prevCompanyQuantity),
          presentableUnit:
            latestPreviousCompanySubmittedVersion.unit ??
            latestPreviousCompanySubmittedVersion.tempUnit ??
            null,
          presentableLciaMethodology:
            latestPreviousCompanySubmittedVersion.lciaMethodology ??
            latestPreviousCompanySubmittedVersion.tempLciaMethodology ??
            null,
          presentableDataSource: prevCompanyDataSource,
          averageComparison: computeBenchmarkComparison(
            prevCompanyQuantity,
            category,
          ),
        };
      }

      /**
       * ============================
       * COMPANY STATUS COUNT
       * ============================
       */

      const lastSubmitted =
        await this.impactCategoryVersionRepository.findLatestSubmittedVersion(
          record._id,
          'company',
        );

      if (effectiveCompanyLatest?.isSubmitted === true) {
        companySubmittedCount++;
      } else if (
        effectiveCompanyLatest?.quantity != null ||
        effectiveCompanyLatest?.tempQuantity != null ||
        effectiveCompanyLatest?.isImpactPresent === false ||
        (request?.isRequested && lastSubmitted)
      ) {
        companyAddedButNotSubmittedCount++;
      }

      /**
       * ============================
       * SUPPLIER STATUS COUNT
       * ============================
       */
      if (supplierLatest?.isSubmitted === true) {
        supplierSubmittedCount++;
      } else if (
        supplierLatest &&
        (supplierLatest.quantity != null ||
          supplierLatest.isImpactPresent === false)
      ) {
        supplierAddedButNotSubmittedCount++;
      }
      // Presentable Fields
      let presentableQuantity;
      let presentableUnit;
      let presentableLciaMethodology;
      let presentableDataSource;
      let presentableIsImpactPresent = true;
      let uploadedBy;

      // Company View Logic
      if (!isSupplierView) {
        if (effectiveCompanyLatest?.isImpactPresent === false) {
          presentableIsImpactPresent = false;
          presentableDataSource = 'No Impact';
        } else if (effectiveCompanyLatest?.quantity != null) {
          presentableQuantity = effectiveCompanyLatest.quantity;
          presentableUnit = effectiveCompanyLatest.unit;
          presentableLciaMethodology = effectiveCompanyLatest.lciaMethodology;

          if (request?.isRequested) {
            presentableDataSource = 'Supplier';
          } else {
            presentableDataSource =
              effectiveCompanyLatest.dataSource === 'manual'
                ? 'Manual Input'
                : effectiveCompanyLatest.dataSource === 'database'
                  ? 'Database'
                  : 'Supplier';
          }
        } else if (effectiveCompanyLatest?.tempQuantity != null) {
          presentableQuantity = effectiveCompanyLatest.tempQuantity;
          presentableUnit = effectiveCompanyLatest.tempUnit;
          presentableLciaMethodology =
            effectiveCompanyLatest.tempLciaMethodology;
          presentableDataSource = 'Supplier';
        } else if (request?.isRequested) {
          presentableDataSource = 'Requested Data';
        }
      } else {
        // Supplier View Logic
        // Supplier Saved Data
        if (supplierLatest?.isImpactPresent === false) {
          presentableIsImpactPresent = false;
          presentableDataSource = 'No Impact';
          uploadedBy = 'You';
        } else if (supplierLatest?.quantity != null) {
          presentableQuantity = supplierLatest.quantity;
          presentableUnit = supplierLatest.unit;
          presentableLciaMethodology = supplierLatest.lciaMethodology;
          presentableDataSource =
            supplierLatest.dataSource === 'manual'
              ? 'Manual Input'
              : 'Database';

          uploadedBy = 'You';
        } else if (request?.isRequested) {
          /**
           * PRIORITY 3 — Requested fallback
           */
          presentableDataSource = 'Requested Data';
        }
      }

      /**
       * ============================
       * BENCHMARKING LOGIC
       * DO NOT CHANGE (AS REQUESTED)
       * ============================
       */
      let averageComparison = 'No benchmarking value available for comparison';

      if (benchmarkingData && presentableQuantity != null) {
        const benchmarkField =
          category === 'carbon'
            ? 'carbonBenchmarkingData'
            : category === 'water'
              ? 'waterBenchmarkingData'
              : 'landBenchmarkingData';

        const benchmarkValue = benchmarkingData?.[benchmarkField];

        if (benchmarkValue && benchmarkValue !== 0) {
          const difference =
            ((presentableQuantity - benchmarkValue) / benchmarkValue) * 100;

          if (difference > 20) averageComparison = `${difference.toFixed(0)}%`;
          else if (difference < -20)
            averageComparison = `${difference.toFixed(0)}%`;
          else averageComparison = `${difference.toFixed(0)}% Similar`;
        }
      }

      /**
       * ============================
       * PENDING SUPPLIER SUBMISSION (company view only)
       * Compute benchmarking for the supplier's pending values.
       * ============================
       */
      let pendingSupplierSubmissionPayload: any = null;
      if (!isSupplierView && pendingSupplierVersion) {
        const supplierPresentableQty =
          pendingSupplierVersion.quantity ??
          pendingSupplierVersion.tempQuantity ??
          null;

        const tds = this.unitConversions.toDecimalString.bind(
          this.unitConversions,
        );

        pendingSupplierSubmissionPayload = {
          versionId: pendingSupplierVersion._id,
          quantity: tds(pendingSupplierVersion.quantity ?? null),
          unit: pendingSupplierVersion.unit ?? null,
          versionNumber: pendingSupplierVersion.versionNumber ?? null,
          lciaMethodology: pendingSupplierVersion.lciaMethodology ?? null,
          tempQuantity: tds(pendingSupplierVersion.tempQuantity ?? null),
          tempUnit: pendingSupplierVersion.tempUnit ?? null,
          tempLciaMethodology:
            pendingSupplierVersion.tempLciaMethodology ?? null,
          isImpactPresent: pendingSupplierVersion.isImpactPresent ?? true,
          dataSource: pendingSupplierVersion.dataSource ?? null,
          offsetCarbonImpact:
            pendingSupplierVersion.offsetCarbonImpact ?? false,
          offsetQuantity: tds(pendingSupplierVersion.offsetQuantity ?? null),
          submittedAt: pendingSupplierVersion.submittedAt ?? null,
          averageComparison: computeBenchmarkComparison(
            supplierPresentableQty,
            category,
          ),
        };
      }

      /**
       * ============================
       * FINAL RESPONSE PER CATEGORY
       * ============================
       */

      const baseVersion = isSupplierView
        ? supplierLatest
        : effectiveCompanyLatest;

      const tds = this.unitConversions.toDecimalString.bind(
        this.unitConversions,
      );

      response[category] = {
        quantity: tds(baseVersion?.quantity ?? null),
        unit: baseVersion?.unit ?? null,
        tempQuantity: tds(baseVersion?.tempQuantity ?? null),
        tempUnit: baseVersion?.tempUnit ?? null,
        lciaMethodology: baseVersion?.lciaMethodology ?? null,
        dataSource: baseVersion?.dataSource ?? null,
        isSubmitted:
          baseVersion?.isSubmitted === true
            ? true
            : request?.isRequested
              ? false
              : (baseVersion?.isSubmitted ?? false),
        isImpactPresent: baseVersion?.isImpactPresent ?? true,
        offsetCarbonImpact: baseVersion?.offsetCarbonImpact ?? false,
        offsetQuantity: tds(baseVersion?.offsetQuantity ?? null),
        presentableQuantity: tds(presentableQuantity),
        presentableUnit,
        presentableLciaMethodology,
        presentableDataSource,
        presentableIsImpactPresent,
        uploadedBy,
        // isRequested in response: hide "requesting data from supplier" text
        // when the supplier has already submitted data (company view only)
        isRequested:
          !isSupplierView &&
          request?.isRequested &&
          supplierLatest?.isSubmitted === true
            ? false
            : (request?.isRequested ?? false),
        averageComparison,

        // ── NEW: Temporary data tag (company view only) ──────────────────────
        // Shown only to company_user; hidden from supplier_user and admin_user
        isTemporaryData: !isSupplierView
          ? companyLatest?.dataSource === 'temporary'
          : undefined,

        // showTemporaryText:
        // - false when company accepted supplier data
        // - true when data is temporary OR when requested but supplier hasn't submitted yet
        // - false otherwise
        showTemporaryText: !isSupplierView
          ? effectiveCompanyLatest?.dataSource === 'supplier'
            ? false
            : companyLatest?.dataSource === 'temporary' ||
              (request?.isRequested && supplierLatest?.isSubmitted !== true)
          : undefined,

        // ── NEW: Pending supplier submission for approve/reject (company view) ─
        hasPendingSupplierSubmission: !isSupplierView
          ? pendingSupplierVersion != null
          : undefined,
        pendingSupplierSubmission: !isSupplierView
          ? pendingSupplierSubmissionPayload
          : undefined,
      };
    }

    /**
     * ============================
     * FINAL SUBMISSION STATUS
     * ============================
     */

    let submissionStatus = 'Awaiting Submission';

    if (isSupplierView) {
      if (requestedCategoriesCount === 0) {
        submissionStatus = 'awaiting data';
      } else if (requestedSubmittedCount === requestedCategoriesCount) {
        submissionStatus = 'submitted';
      } else if (requestedSubmittedCount > 0) {
        submissionStatus = 'partial';
      } else if (requestedDataAvailableCount > 0) {
        submissionStatus = 'ready';
      } else {
        submissionStatus = 'awaiting data';
      }
    } else {
      if (companySubmittedCount === totalCategories)
        submissionStatus = 'submitted';
      else if (companySubmittedCount > 0) submissionStatus = 'partial';
      else if (companyAddedButNotSubmittedCount > 0) submissionStatus = 'ready';
    }

    response.submissionStatus = submissionStatus;
    /**
     * Setting this flag unconditionally to 'ready' for FE to showcase on the right side (New Impact Categories Submitted) section
     *  on the accept / reject view as there the status will always be 'Ready to Submit'. Also this flag is used for that sole purpose
     *  and no where else this is being used.
     */
    response.supplierSubmissionStatus = 'ready';
    response.requestEmailSent = requestEmailSent;

    /**
     * ============================
     * NEW: PREVIOUSLY SUBMITTED DATA
     * ============================
     * Shows the superseded submitted version for each category.
     * Used to populate the "Previously Submitted Impact Category Data" section
     * on the component detail page for both company and supplier views.
     */
    const hasPreviousData = Object.keys(previouslySubmittedMap).length > 0;
    let submissionStatusForPreviousSubmitted;
    /**
     * Directly checking here with hardcoded values for FE to showcase on the left side (Original Impact Categories Submitted) section
     *  on the accept / reject view as to showcase the submission status. Also this 'submissionStatusForPreviousSubmitted' flag is used for that sole purpose
     *  and no where else this is being used.
     */
    if (Object.keys(previouslySubmittedMap).length === 3) {
      submissionStatusForPreviousSubmitted = 'Submitted';
    } else if (
      Object.keys(previouslySubmittedMap).length > 0 &&
      Object.keys(previouslySubmittedMap).length <= 2
    ) {
      submissionStatusForPreviousSubmitted = 'Partially Submitted';
    } else {
      submissionStatusForPreviousSubmitted = 'Awaiting Submission';
    }
    response.previouslySubmittedData = {
      submissionStatus: submissionStatusForPreviousSubmitted,
      hasPreviousData,
      ...(hasPreviousData ? previouslySubmittedMap : {}),
    };

    const hasLatestPreviousCompanyData =
      Object.keys(latestPreviousCompanySubmittedMap).length > 0;
    response.latestPreviousCompanySubmittedVersion = {
      hasData: hasLatestPreviousCompanyData,
      ...(hasLatestPreviousCompanyData
        ? latestPreviousCompanySubmittedMap
        : {}),
    };

    if (component) {
      const productId = component.productId;

      const currentProduct = await this.productRepository.findById(
        productId.toString(),
      );

      // Never downgrade a product that is already published/partial/awaiting —
      // those states are managed by the publish-toggle flow and must not be
      // overwritten here when a new component has incomplete data.
      const preservedStatuses = ['published', 'partial', 'awaiting'];
      if (
        currentProduct &&
        preservedStatuses.includes(currentProduct.publishStatus)
      ) {
        return response;
      }

      const allProductComponents = await this.componentRepository.find({
        productId: new Types.ObjectId(productId),
      });

      const impactCategories = ['carbon', 'water', 'land'];
      let isAnyCategoryFullySubmitted = false;

      for (const category of impactCategories) {
        let isCategoryCompleteAcrossAll = true;

        for (const comp of allProductComponents) {
          const categoryRecords =
            await this.impactCategoryRecordRepository.find({
              componentId: comp._id,
              impactCategory: category,
            });

          for (const categoryRecord of categoryRecords) {
            const companySubmitted =
              await this.impactCategoryVersionRepository.findLatestSubmittedVersion(
                categoryRecord._id,
                'company',
              );

            const supplierSubmitted =
              await this.impactCategoryVersionRepository.findLatestSubmittedVersion(
                categoryRecord._id,
                'supplier',
              );

            if (!companySubmitted && !supplierSubmitted) {
              isCategoryCompleteAcrossAll = false;
              break;
            }
          }

          if (!isCategoryCompleteAcrossAll) break;
        }

        if (isCategoryCompleteAcrossAll) {
          isAnyCategoryFullySubmitted = true;
          break;
        }
      }

      if (isAnyCategoryFullySubmitted) {
        await this.productRepository.update(
          { _id: productId },
          { publishStatus: 'ready' },
        );
      } else {
        await this.productRepository.update(
          { _id: productId },
          { publishStatus: 'pending' },
        );
      }
    }

    return response;
  }

  async calculateDistance(
    componentId: string,
    roleSlug: string,
    origin: Coordinates,
    destination: Coordinates,
    transportMethod: UserTransportMethod,
  ): Promise<TravelRoute> {
    const component = await this.componentRepository.findById(componentId);
    if (!component) {
      throw new ComponentNotFoundError(`Component not found: ${componentId}`);
    }

    return this.openAIService.getTravelRoute(
      origin,
      destination,
      transportMethod,
    );
  }

  async valueFieldCalculationForUseOurDatabase(params, dto, userId) {
    const value = dto.value;
    const supplierRoleSlug = dto.supplierRoleSlug;
    const rowSelected = dto.rowSelected;
    const componentDetails: any = await this.componentRepository.findOne({
      _id: params.componentId,
    });

    if (!componentDetails) {
      throw new ComponentNotFoundError();
    }
    let detailsFieldDynamicValue: any;
    let detailsFieldValue;
    let normalisationValue;
    switch (supplierRoleSlug) {
      case 'rawMaterialSupplier':
      case 'packagingManufacturer':
        detailsFieldDynamicValue = `${supplierRoleSlug}Details`;
        detailsFieldValue = componentDetails[detailsFieldDynamicValue];
        if (
          rowSelected.netWeight !== undefined &&
          rowSelected.netWeight !== null &&
          rowSelected.netWeight !== 0
        ) {
          normalisationValue = value / rowSelected.netWeight;
        } else {
          normalisationValue = value / 1;
        }
        let netWeightUsedPerSku = detailsFieldValue?.netWeightUsedPerSku;
        const netWeightUnit = detailsFieldValue?.netWeightUnit;

        if (netWeightUnit !== 'kg') {
          netWeightUsedPerSku = this.unitConversions.convertToKilogram(
            netWeightUsedPerSku,
            netWeightUnit,
          );
        }
        return netWeightUsedPerSku * value;
        break;

      case 'transportFreight':
        detailsFieldDynamicValue = `${supplierRoleSlug}Details`;
        detailsFieldValue = componentDetails[detailsFieldDynamicValue];
        const transportFreight = componentDetails.transportFreight;
        let netWeightPerUnitForTransportFreight =
          detailsFieldValue?.netWeightPerUnit;
        const netWeightUnitForTransportFreight =
          detailsFieldValue?.netWeightUnit;
        const calculatedDistanceKm =
          transportFreight.calculatedDistanceKm !== 0
            ? transportFreight.calculatedDistanceKm
            : 0;
        if (netWeightUnitForTransportFreight != 't') {
          netWeightPerUnitForTransportFreight =
            this.unitConversions.convertToTonnes(
              netWeightPerUnitForTransportFreight,
              netWeightUnitForTransportFreight,
            );
        }
        return (
          value * netWeightPerUnitForTransportFreight * calculatedDistanceKm
        );
        break;

      case 'storageFulfilment':
      case 'retailer':
      case 'cpgBrand':
        detailsFieldDynamicValue = `${supplierRoleSlug}Details`;
        detailsFieldValue = componentDetails[detailsFieldDynamicValue];
        let supplierRoleObject: any = componentDetails[supplierRoleSlug];
        let storageType = supplierRoleObject.storageType;
        let annualEnergyPerUnit;
        let dailyEnergyPerUnit;
        if (supplierRoleSlug == 'storageFulfilment') {
          if (storageType == 'ambient') {
            annualEnergyPerUnit = +detailsFieldValue.floorAreaPerSku * 65;
          } else if (storageType == 'chilled') {
            annualEnergyPerUnit = +detailsFieldValue.volumePerSku * 56;
          } else {
            annualEnergyPerUnit = +detailsFieldValue.volumePerSku * 69;
          }
          dailyEnergyPerUnit = +annualEnergyPerUnit / 365;
        } else {
          if (storageType == 'ambient') {
            dailyEnergyPerUnit = +detailsFieldValue.floorAreaPerSku * 0.48;
          } else if (storageType == 'chilled') {
            dailyEnergyPerUnit = +detailsFieldValue.floorAreaPerSku * 0.82;
          } else {
            dailyEnergyPerUnit = +detailsFieldValue.floorAreaPerSku * 1.1;
          }
        }
        // this will give us total kWh used to store one unit of the component
        let scaleByStorageDuration =
          +dailyEnergyPerUnit * +detailsFieldValue.storageDays;

        let kwhEnergy;
        if (
          rowSelected.kwhEnergy !== undefined &&
          rowSelected.kwhEnergy !== null
        ) {
          kwhEnergy = rowSelected.kwhEnergy;
        } else {
          kwhEnergy = 1;
        }
        let impactPerKwh = +value / +kwhEnergy;
        return +impactPerKwh * +scaleByStorageDuration;
        break;

      case 'contractManufacturer': {
        const manufacturingActivityTypesArray =
          componentDetails.contractManufacturer.manufacturingActivityTypes;

        const manufacturingDetailsField =
          componentDetails.contractManufacturerDetails;

        const ENERGY_BENCHMARKS = {
          filling: 0.035,
          mixing: 0.05,
          homogenising: 0.15,
          fermenting: 0.1,
          packaging: 0.06,
          labelling: 0.003,
          heating: 0.004,
          cooling: 0.006,
        };

        const toKg = (value: number, unit: string): number => {
          if (unit === 'kg') return value;
          if (unit === 'g') return value / 1000;
          throw new IncompatibleUnitError(`Unsupported unit: ${unit}`);
        };

        const toFixed = (value: number, decimals = 8) =>
          Number(value.toFixed(decimals));

        let totalEnergyConsumptionKwh = 0;

        manufacturingActivityTypesArray.forEach((activity: string) => {
          const activityData = manufacturingDetailsField[activity];
          if (!activityData) return;

          switch (activity) {
            case 'filling':
            case 'mixing':
            case 'homogenising':
            case 'fermenting':
            case 'packaging': {
              const volumeKg = toKg(
                activityData.volumePerUnit,
                activityData.volumeUnit,
              );

              totalEnergyConsumptionKwh +=
                volumeKg * ENERGY_BENCHMARKS[activity];
              break;
            }

            case 'labelling': {
              totalEnergyConsumptionKwh +=
                activityData.numberOfLabels * ENERGY_BENCHMARKS.labelling;
              break;
            }

            case 'heating':
            case 'cooling': {
              const volumeKg = toKg(
                activityData.volumePerUnit,
                activityData.volumeUnit,
              );

              const deltaTemp = Math.abs(
                activityData.targetTemperature -
                  activityData.currentTemperature,
              );

              totalEnergyConsumptionKwh +=
                volumeKg * deltaTemp * ENERGY_BENCHMARKS[activity];
              break;
            }
          }
        });

        let kwhEnergy;
        if (
          rowSelected.kwhEnergy !== undefined &&
          rowSelected.kwhEnergy !== null
        ) {
          kwhEnergy = rowSelected.kwhEnergy;
        } else {
          kwhEnergy = 1;
        }
        let impactPerKwh = +value / +kwhEnergy;
        const finalImpactCategoryValue =
          impactPerKwh * totalEnergyConsumptionKwh;

        return finalImpactCategoryValue;
        break;
      }
    }
  }

  /**
   * Approve or reject supplier-submitted impact category data for a component.
   * Only company users may call this method.
   *
   * For each impact category (carbon / water / land):
   *  - If included in `approvedCategories`: the supplier version is marked approved,
   *    the company version is updated with the supplier's values (new submitted version).
   *  - Otherwise: the supplier version is marked rejected, company data unchanged.
   */
  async approveRejectSupplierImpactCategory(
    componentId: string,
    roleSlug: string,
    approvedCategories: { impactCategory: string; versionNumber: number }[],
    userId: string,
  ) {
    const impactTypes = ['carbon', 'water', 'land'];
    const now = new Date();

    // Validate version numbers for all approved categories upfront
    // before processing any approve/reject to avoid partial commits
    for (const approvedItem of approvedCategories) {
      const record = await this.impactCategoryRecordRepository.findOne({
        componentId: new Types.ObjectId(componentId),
        supplierLinkedRole: roleSlug,
        impactCategory: approvedItem.impactCategory,
      });

      if (!record) continue;

      const pendingVersion =
        await this.impactCategoryVersionRepository.findPendingSupplierSubmission(
          record._id,
        );

      if (
        pendingVersion &&
        approvedItem.versionNumber !== pendingVersion.versionNumber
      ) {
        throw new ConflictError(
          `Supplier has submitted new impact category data. Please refresh to review the latest submission`,
        );
      }
    }

    const results = await Promise.all(
      impactTypes.map(async (category) => {
        const session =
          await this.impactCategoryVersionRepository.startTransaction();

        try {
          const record =
            await this.impactCategoryRecordRepository.findOneWithSession(
              {
                componentId: new Types.ObjectId(componentId),
                supplierLinkedRole: roleSlug,
                impactCategory: category,
              },
              null,
              session,
            );

          if (!record) {
            await this.impactCategoryVersionRepository.commitTransaction(
              session,
            );
            return null;
          }

          const pendingSupplierVersion =
            await this.impactCategoryVersionRepository.findPendingSupplierSubmissionWithSession(
              record._id,
              session,
            );

          if (!pendingSupplierVersion) {
            await this.impactCategoryVersionRepository.commitTransaction(
              session,
            );
            return null;
          }

          // Update isProspective
          // update ALL supplier versions for this record
          await this.impactCategoryVersionRepository.updateMany(
            {
              impactCategoryRecordId: record._id,
              versionOwner: 'supplier',
              isProspective: true, // optional but cleaner
            },
            {
              $set: { isProspective: false },
            },

            session,
          );

          const approvedItem = approvedCategories.find(
            (item) => item.impactCategory === category,
          );

          if (approvedItem) {
            // APPROVE
            await this.impactCategoryVersionRepository.update(
              { _id: pendingSupplierVersion._id },
              {
                isApproved: true,
                approvedAt: now,
                approvedBy: new Types.ObjectId(userId),
                isLatest: false,
                updatedBy: new Types.ObjectId(userId),
              },
              session,
            );

            const companyCurrentSubmitted =
              await this.impactCategoryVersionRepository.findLatestSubmittedVersionWithSession(
                record._id,
                'company',
                session,
              );

            if (companyCurrentSubmitted) {
              await this.impactCategoryVersionRepository.update(
                { _id: companyCurrentSubmitted._id },
                { isLatest: false, updatedBy: userId },
                session,
              );
            }

            const companyDraft =
              await this.impactCategoryVersionRepository.findOneWithSession(
                {
                  impactCategoryRecordId: record._id,
                  versionOwner: 'company',
                  isLatest: true,
                  isSubmitted: false,
                },
                null,
                session,
              );

            if (companyDraft) {
              await this.impactCategoryVersionRepository.softDelete(
                { _id: companyDraft._id },
                session,
              );
            }

            const highestVersion =
              await this.impactCategoryVersionRepository.findHighestVersion(
                record._id,
                'company',
                session,
              );

            const nextVersionNumber = highestVersion
              ? highestVersion.versionNumber + 1
              : 1;

            await this.impactCategoryVersionRepository.create(
              {
                impactCategoryRecordId: record._id,
                impactCategory: category,
                versionOwner: 'company',
                quantity: pendingSupplierVersion.quantity,
                unit: pendingSupplierVersion.unit,
                lciaMethodology: pendingSupplierVersion.lciaMethodology,
                tempQuantity: pendingSupplierVersion.tempQuantity,
                tempUnit: pendingSupplierVersion.tempUnit,
                tempLciaMethodology: pendingSupplierVersion.tempLciaMethodology,
                dataSource: 'supplier',
                isSubmitted: true,
                isLatest: true,
                isApproved: false,
                isRejected: false,
                isImpactPresent: pendingSupplierVersion.isImpactPresent,
                offsetCarbonImpact: pendingSupplierVersion.offsetCarbonImpact,
                offsetQuantity: pendingSupplierVersion.offsetQuantity,
                offsetUnit: pendingSupplierVersion.offsetUnit,
                versionNumber: nextVersionNumber,
                submittedAt: now,
                submittedBy: userId,
                createdBy: userId,
                updatedBy: userId,
              },
              session,
            );

            await this.impactCategoryVersionRepository.commitTransaction(
              session,
            );

            return { category, status: 'approved' };
          } else {
            // REJECT
            await this.impactCategoryVersionRepository.update(
              { _id: pendingSupplierVersion._id },
              {
                isRejected: true,
                rejectedAt: now,
                rejectedBy: new Types.ObjectId(userId),
                isLatest: false,
                isProspective: false,
                isApproved: false,
                updatedBy: new Types.ObjectId(userId),
              },
              session,
            );

            await this.impactCategoryVersionRepository.commitTransaction(
              session,
            );

            return { category, status: 'rejected' };
          }
        } catch (err) {
          await this.impactCategoryVersionRepository.abortTransaction(session);
          throw err;
        }
      }),
    );

    const approved: string[] = [];
    const rejected: string[] = [];

    for (const res of results) {
      if (!res) continue;
      if (res.status === 'approved') approved.push(res.category);
      if (res.status === 'rejected') rejected.push(res.category);
    }

    return {
      message: 'Supplier submission approval processed successfully',
      approved,
      rejected,
    };
  }

  /**
   * Builds product-level master data payload when a category is published.
   * Aggregates the latest submitted version (company or supplier) per impact
   * category record across all components of the product, normalises by product
   * net weight (kg), and POSTs (first publish) or PUTs (re-publish) to the datahub.
   * Stores the generated UUID back on the product for future updates.
   */
  private async buildAndSaveProductMasterData(product: Product): Promise<void> {
    const datahubBaseUrl = process.env.DATAHUB_BACKEND_BASE_URL;
    if (!datahubBaseUrl) {
      console.error(
        '[MasterData:Product] DATAHUB_BACKEND_BASE_URL is not set — skipping product master-data sync',
      );
      return;
    }

    if (!product?.netSize || !product?.unit) return;

    const isVolumeProduct = this.unitConversions.isVolumeUnit(product.unit);
    const netSizeNormalized = isVolumeProduct
      ? this.unitConversions.toL(product.netSize, product.unit)
      : this.unitConversions.toKg(product.netSize, product.unit);
    const productUnit = isVolumeProduct ? 'l' : 'kg';

    if (!netSizeNormalized || netSizeNormalized === 0) return;

    // Aggregate total submitted quantity per impact category across all
    // components for this product (latest submitted version from any owner —
    // company or supplier — so pure-supplier flows are included).
    const totals: { _id: string; total: number }[] =
      await this.impactCategoryRecordRepository.aggregate([
        {
          $match: {
            productId: product._id,
            isActive: true,
          },
        },
        {
          $lookup: {
            from: 'impactCategoryVersion',
            let: { recordId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$impactCategoryRecordId', '$$recordId'],
                  },
                  isSubmitted: true,
                  quantity: { $ne: null },
                  deletedAt: null,
                },
              },
              { $sort: { versionNumber: -1 } },
              { $limit: 1 },
            ],
            as: 'latestVersion',
          },
        },
        { $unwind: '$latestVersion' },
        {
          $group: {
            _id: '$impactCategory',
            total: { $sum: '$latestVersion.quantity' },
          },
        },
      ]);

    if (!totals.length) return;

    // Normalise to per 1 kg of product
    const impacts: Record<string, number> = {};
    for (const item of totals) {
      impacts[item._id] = item.total / netSizeNormalized;
    }

    // POST on first publish, PUT on subsequent publishes / new component added
    const isUpdate = !!product.masterDataUuid;
    const uuid = isUpdate ? product.masterDataUuid : randomUUID();

    const payload: Record<string, any> = {
      uuid,
      referenceProductName: product.name,
      activityName: product.description ?? null,
      geography: 'global',
      unit: productUnit,
      value: 1,
      group: product.name,
      impacts,
      dataSource: 'bfe',
      status: 'active',
    };

    if (isUpdate) {
      await axiosRequest({
        url: `${datahubBaseUrl}/master-data/${uuid}`,
        method: 'PUT',
        data: payload,
        headers: this.datahubHeaders.get(),
      });
    } else {
      await axiosRequest({
        url: `${datahubBaseUrl}/master-data`,
        method: 'POST',
        data: payload,
        headers: this.datahubHeaders.get(),
      });

      // Persist UUID on the product so future publishes reuse the same record
      await this.productRepository.update(
        { _id: product._id },
        { $set: { masterDataUuid: uuid } },
      );
    }
  }

  /**
   * Builds master data payload from submitted versions + component data
   * and POSTs it to the datahub. Stores the generated UUID back on
   * the submitted versions.
   *
   * Only uses version.quantity (not tempQuantity).
   * Saves master data for whoever just submitted (company or supplier).
   */
  private async buildAndSaveMasterData(
    componentId: Types.ObjectId,
    roleSlug: string,
    versionOwner: string,
    submittedVersionIds: Types.ObjectId[],
  ): Promise<void> {
    const supportedRoles = [
      'rawMaterialSupplier',
      'packagingManufacturer',
      'transportFreight',
      'storageFulfilment',
      'cpgBrand',
      'retailer',
      'contractManufacturer',
    ];
    if (!supportedRoles.includes(roleSlug)) return;

    const datahubBaseUrl = process.env.DATAHUB_BACKEND_BASE_URL;
    if (!datahubBaseUrl) {
      console.error(
        '[MasterData:Component] DATAHUB_BACKEND_BASE_URL is not set — skipping component master-data sync',
      );
      return;
    }

    const component: Component | null = await this.componentRepository.findOne({
      _id: componentId,
    });
    if (!component) return;

    // ── Step 1: Fetch submitted versions directly by their IDs ───────────────
    // The version schema already has impactCategory, quantity, and
    // lciaMethodology — no need to join to the record schema for the current
    // submission's data.
    const submittedVersionDocs: ImpactCategoryVersion[] =
      await this.impactCategoryVersionRepository.find(
        { _id: { $in: submittedVersionIds } },
        { createdAt: -1 },
      );

    if (!submittedVersionDocs.length) return;

    // ── Step 2: Build impactsByMethodology from the current submission ────────
    const impactsByMethodology: Record<string, Record<string, number>> = {};
    const coveredCategories = new Set<string>();

    for (const version of submittedVersionDocs) {
      if (
        version.impactCategory &&
        version.quantity != null &&
        version.lciaMethodology
      ) {
        // Normalize to 'ReCiPe' to match CSV-imported records in the datahub
        const methodology =
          version.lciaMethodology === 'ReCIPe'
            ? 'ReCiPe'
            : version.lciaMethodology;
        if (!impactsByMethodology[methodology]) {
          impactsByMethodology[methodology] = {};
        }
        impactsByMethodology[methodology][version.impactCategory] =
          version.quantity;
        coveredCategories.add(version.impactCategory);
      }
    }

    // ── Step 3: Add previously submitted categories from prior API calls ──────
    // Fetch all component records, then retrieve the latest submitted version
    // for every uncovered category in a single aggregate instead of one
    // findOneWithSorting per record (avoids N+1 query pattern).
    const { data: allComponentRecords } =
      await this.impactCategoryRecordRepository.findAll({
        componentId,
        supplierLinkedRole: roleSlug,
      });

    const uncoveredRecords = allComponentRecords.filter(
      (r: any) => !coveredCategories.has((r as any).impactCategory),
    );

    if (uncoveredRecords.length > 0) {
      const prevVersions: ImpactCategoryVersion[] =
        await this.impactCategoryVersionRepository.aggregate([
          {
            $match: {
              impactCategoryRecordId: {
                $in: uncoveredRecords.map((r: any) => r._id),
              },
              versionOwner,
              isSubmitted: true,
              quantity: { $ne: null },
              deletedAt: null,
            },
          },
          { $sort: { versionNumber: -1 } },
          {
            $group: {
              _id: '$impactCategoryRecordId',
              doc: { $first: '$$ROOT' },
            },
          },
          { $replaceRoot: { newRoot: '$doc' } },
        ]);

      const recordToCat = new Map<string, string>(
        uncoveredRecords.map((r: any) => [
          r._id.toString(),
          r.impactCategory as string,
        ]),
      );

      for (const prevVersion of prevVersions) {
        const cat = recordToCat.get(
          prevVersion.impactCategoryRecordId.toString(),
        );
        if (!cat) continue;
        if (prevVersion.quantity != null && prevVersion.lciaMethodology) {
          // Normalize to 'ReCiPe' to match CSV-imported records in the datahub
          const methodology =
            prevVersion.lciaMethodology === 'ReCIPe'
              ? 'ReCiPe'
              : prevVersion.lciaMethodology;
          if (!impactsByMethodology[methodology]) {
            impactsByMethodology[methodology] = {};
          }
          impactsByMethodology[methodology][cat] = prevVersion.quantity;
        }
      }
    }

    if (Object.keys(impactsByMethodology).length === 0) return;

    // All record IDs (current submission + component records) for UUID lookup
    const allRecordIds = [
      ...submittedVersionDocs.map((v) => v.impactCategoryRecordId),
      ...allComponentRecords.map((r: any) => r._id),
    ];

    // ─── Role-specific fields ─────────────────────────────────────────────────
    let denominator: number | null = null;
    let geography: string | null = null;
    let value: number = 1;
    let unit: string = 'kg';
    let activityName: string | null = null;
    let casNumber: string | undefined;
    let transportMethod: string | undefined;
    let referenceProductName: string = component.name;

    // ── rawMaterialSupplier / packagingManufacturer ───────────────────────────
    if (
      roleSlug === 'rawMaterialSupplier' ||
      roleSlug === 'packagingManufacturer'
    ) {
      const detailsField =
        roleSlug === 'rawMaterialSupplier'
          ? 'rawMaterialSupplierDetails'
          : 'packagingManufacturerDetails';
      const sectionField =
        roleSlug === 'rawMaterialSupplier'
          ? 'rawMaterialSupplier'
          : 'packagingManufacturer';

      const details = component[detailsField];
      const section = component[sectionField];

      if (!details?.netWeightUsedPerSku || !details?.netWeightUnit) return;

      if (this.unitConversions.isVolumeUnit(details.netWeightUnit)) {
        denominator = this.unitConversions.toL(
          details.netWeightUsedPerSku,
          details.netWeightUnit,
        );
        unit = 'l';
      } else {
        denominator = this.unitConversions.toKg(
          details.netWeightUsedPerSku,
          details.netWeightUnit,
        );
        unit = 'kg';
      }
      geography = details.supplierLocation ?? null;
      activityName = section?.activityDescription ?? null;
      value = 1;

      if (
        roleSlug === 'rawMaterialSupplier' &&
        (section as { casNumber?: string })?.casNumber
      ) {
        casNumber = (section as { casNumber?: string }).casNumber;
      }
    }

    // ── transportFreight ─────────────────────────────────────────────────────
    else if (roleSlug === 'transportFreight') {
      const details = component['transportFreightDetails'];
      const section = component['transportFreight'];

      if (!details?.netWeightPerUnit || !details?.netWeightUnit) return;
      if (!section?.calculatedDistanceKm) return;

      let distanceMetric: number;

      if (this.unitConversions.isVolumeUnit(details.netWeightUnit)) {
        // Volume units (ml, l, fl oz) → store as litre*km
        const litres = this.unitConversions.toL(
          details.netWeightPerUnit,
          details.netWeightUnit,
        );
        distanceMetric = litres * section.calculatedDistanceKm;
        unit = 'l*km';
      } else {
        // Weight units (g, kg, t, oz, lb) → store as metric ton*km
        const weightTonnes = this.unitConversions.toTonnes(
          details.netWeightPerUnit,
          details.netWeightUnit,
        );
        distanceMetric = weightTonnes * section.calculatedDistanceKm;
        unit = 'metric ton*km';
      }

      if (!distanceMetric || distanceMetric === 0) return;

      denominator = distanceMetric;
      geography = details.transportRegion ?? null;
      activityName = section?.activityDescription ?? null;
      transportMethod = section?.transportMethod ?? undefined;
      value = 1;

      const method = section?.transportMethod
        ? section.transportMethod.charAt(0).toUpperCase() +
          section.transportMethod.slice(1)
        : 'Transportation';
      referenceProductName =
        `${method} transportation of ${component.name} from ${section?.transportOrigin ?? ''} to ${section?.transportDestination ?? ''}`.trim();
    }

    // ── storageFulfilment ────────────────────────────────────────────────────
    else if (roleSlug === 'storageFulfilment') {
      const details = component['storageFulfilmentDetails'];
      const section = component['storageFulfilment'];

      if (!details?.storageDays || !section?.storageType) return;

      let totalKwh: number;
      const storageType: string = section.storageType;

      // Industry benchmark energy intensities for warehouse storage:
      //   ambient : 65  kWh / m²  / year
      //   chilled : 56  kWh / m³  / year
      //   frozen  : 69  kWh / m³  / year
      // Formula: (intensity / 365) * storageDays gives kWh for the storage period.
      if (storageType === 'ambient') {
        if (!details.floorAreaPerSku) return;
        totalKwh = ((details.floorAreaPerSku * 65) / 365) * details.storageDays;
      } else if (storageType === 'chilled') {
        if (!details.volumePerSku) return;
        totalKwh = ((details.volumePerSku * 56) / 365) * details.storageDays;
      } else if (storageType === 'frozen') {
        if (!details.volumePerSku) return;
        totalKwh = ((details.volumePerSku * 69) / 365) * details.storageDays;
      } else {
        return;
      }

      if (!totalKwh || totalKwh === 0) return;

      denominator = totalKwh;
      geography = 'Global';
      activityName = section?.activityDescription ?? null;
      value = 1;
      unit = 'kWh';
    }

    // ── cpgBrand / retailer ──────────────────────────────────────────────────
    else if (roleSlug === 'cpgBrand' || roleSlug === 'retailer') {
      const detailsField =
        roleSlug === 'cpgBrand' ? 'cpgBrandDetails' : 'retailerDetails';
      const sectionField = roleSlug === 'cpgBrand' ? 'cpgBrand' : 'retailer';

      const details = component[detailsField];
      const section = component[sectionField];

      if (!details?.storageDays || !section?.storageType) return;

      let totalKwh: number;
      const storageType: string = section.storageType;

      // Industry benchmark energy intensities for retail/CPG storage:
      //   ambient : 0.48 kWh / m²  / day
      //   chilled : 0.82 kWh / m³  / day
      //   frozen  : 1.1  kWh / m³  / day
      if (storageType === 'ambient') {
        if (!details.floorAreaPerSku) return;
        totalKwh = details.floorAreaPerSku * 0.48 * details.storageDays;
      } else if (storageType === 'chilled') {
        if (!details.volumePerSku) return;
        totalKwh = details.volumePerSku * 0.82 * details.storageDays;
      } else if (storageType === 'frozen') {
        if (!details.volumePerSku) return;
        totalKwh = details.volumePerSku * 1.1 * details.storageDays;
      } else {
        return;
      }

      if (!totalKwh || totalKwh === 0) return;

      denominator = totalKwh;
      geography = 'Global';
      activityName = section?.activityDescription ?? null;
      value = 1;
      unit = 'kWh';
    }

    // ── contractManufacturer ─────────────────────────────────────────────────
    else if (roleSlug === 'contractManufacturer') {
      const details = component['contractManufacturerDetails'];
      const section = component['contractManufacturer'];

      if (!details) return;

      let totalKwh = 0;

      // NOTE: "volumePerUnit" actually represents mass (kg/g) as per FE contract
      // No volume-to-mass conversion is happening here

      if (details.filling?.volumePerUnit && details.filling?.volumeUnit)
        totalKwh +=
          this.unitConversions.toKg(
            details.filling.volumePerUnit,
            details.filling.volumeUnit,
          ) * 0.035;

      if (details.mixing?.volumePerUnit && details.mixing?.volumeUnit)
        totalKwh +=
          this.unitConversions.toKg(
            details.mixing.volumePerUnit,
            details.mixing.volumeUnit,
          ) * 0.05;

      if (
        details.homogenising?.volumePerUnit &&
        details.homogenising?.volumeUnit
      )
        totalKwh +=
          this.unitConversions.toKg(
            details.homogenising.volumePerUnit,
            details.homogenising.volumeUnit,
          ) * 0.15;

      if (details.fermenting?.volumePerUnit && details.fermenting?.volumeUnit)
        totalKwh +=
          this.unitConversions.toKg(
            details.fermenting.volumePerUnit,
            details.fermenting.volumeUnit,
          ) * 0.1;

      if (details.packaging?.volumePerUnit && details.packaging?.volumeUnit)
        totalKwh +=
          this.unitConversions.toKg(
            details.packaging.volumePerUnit,
            details.packaging.volumeUnit,
          ) * 0.06;

      if (
        details.heating?.volumePerUnit &&
        details.heating?.volumeUnit &&
        details.heating?.currentTemperature != null &&
        details.heating?.targetTemperature != null
      ) {
        const tempDiff = Math.abs(
          details.heating.targetTemperature -
            details.heating.currentTemperature,
        );
        totalKwh +=
          this.unitConversions.toKg(
            details.heating.volumePerUnit,
            details.heating.volumeUnit,
          ) *
          0.004 *
          tempDiff;
      }

      if (
        details.cooling?.volumePerUnit &&
        details.cooling?.volumeUnit &&
        details.cooling?.currentTemperature != null &&
        details.cooling?.targetTemperature != null
      ) {
        const tempDiff = Math.abs(
          details.cooling.targetTemperature -
            details.cooling.currentTemperature,
        );
        totalKwh +=
          this.unitConversions.toKg(
            details.cooling.volumePerUnit,
            details.cooling.volumeUnit,
          ) *
          0.006 *
          tempDiff;
      }

      if (details.labelling?.numberOfLabels)
        totalKwh += details.labelling.numberOfLabels * 0.003;

      if (!totalKwh || totalKwh === 0) return;

      denominator = totalKwh;
      geography = 'Global';
      activityName = section?.activityDescription ?? null;
      value = 1;
      unit = 'kWh';
    }

    if (!denominator || denominator === 0) return;

    // ─── Normalise impacts per denominator (per methodology) ─────────────────
    const normalizedImpactsByMethodology: Record<
      string,
      Record<string, number>
    > = {};
    for (const [methodology, categoryMap] of Object.entries(
      impactsByMethodology,
    )) {
      normalizedImpactsByMethodology[methodology] = {};
      for (const [category, quantity] of Object.entries(categoryMap)) {
        normalizedImpactsByMethodology[methodology][category] =
          quantity / denominator;
      }
    }

    // Check if a previous submission for this component+role+owner already
    // has a masterDataUuid — if so, update the existing record (PUT) instead
    // of creating a new one (POST).
    const existingVersion: ImpactCategoryVersion | null =
      await this.impactCategoryVersionRepository.findOne({
        impactCategoryRecordId: { $in: allRecordIds },
        versionOwner,
        masterDataUuid: { $exists: true, $ne: null },
      });

    const isUpdate = !!existingVersion?.masterDataUuid;
    const uuid = isUpdate ? existingVersion.masterDataUuid : randomUUID();

    const payload: Record<string, any> = {
      uuid,
      referenceProductName,
      activityName,
      geography,
      unit,
      value,
      group: component.name,
      impacts: normalizedImpactsByMethodology,
      dataSource: 'bfe',
      status: 'active',
    };

    if (casNumber) payload.casNumber = casNumber;
    if (transportMethod) payload.transportMethod = transportMethod;

    if (isUpdate) {
      await axiosRequest({
        url: `${datahubBaseUrl}/master-data/${uuid}`,
        method: 'PUT',
        data: payload,
        headers: this.datahubHeaders.get(),
      });
    } else {
      await axiosRequest({
        url: `${datahubBaseUrl}/master-data`,
        method: 'POST',
        data: payload,
        headers: this.datahubHeaders.get(),
      });
    }

    // Store the UUID back on the newly submitted versions for traceability.
    // submittedVersionIds is guaranteed non-empty by the guard at Step 1.
    await this.impactCategoryVersionRepository.updateMany(
      { _id: { $in: submittedVersionIds } },
      { $set: { masterDataUuid: uuid } },
    );
  }
}

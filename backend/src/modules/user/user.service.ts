import { Injectable } from '@nestjs/common';
import { BaseError } from 'src/shared/errorResponse/base.error.response';
import { GetResponse } from 'src/shared/successResponse/get.response';
import { CompanyTypeRepository } from './repositories/companyType.repository';
import { CompanyType } from './schemas/companyType.schema';
import { IndustryTypeRepository } from './repositories/industryType.repository';
import { IndustryType } from './schemas/industryType.schema';
import { Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './repositories/user.repository';
import { WhitelistedEmailRepository } from './repositories/whitelistedEmail.repository';
import { InvitationRepository } from './repositories/invitation.repository';
import { RoleRepository } from './repositories/role.repository';
import { CheckUserEligibilityDto } from './dto/check-user-eligibility.dto';
import * as bcrypt from 'bcrypt';
import {
  EligibilityCheckFailedError,
  EmailAlreadyExistsError,
  IdRequiredError,
  InvalidResetLinkError,
  OldNewPasswordSameError,
  ResetLinkAlreadyUsedError,
  SubscriptionNotAllowedError,
  SubscriptionPlanNotFoundError,
  UserCreationFailedError,
  UserNotEligibleError,
  UserNotFoundError,
} from 'src/shared/errorResponse/user.errors';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtService } from '@nestjs/jwt';
import { UpdateCompanyDetailsDto } from './dto/update-company-details.dto';
import { ProfileDetailsResponseDto } from './dto/profile-details-response.dto';
import { ResetSessionsRepository } from './repositories/resetSessions.repository';
import { FetchCompanyDetailsDto } from './dto/fetch-company-details.dto';
import { SupplierRolesRepository } from './repositories/supplierRoles.repository';
import { ImpactCategoryDataRepository } from '../product/repositories/impact-category-repository';
import { ComponentRepository } from '../product/repositories/component.repository';
import { User } from './schemas/user.schema';
import { SubscriptionPlanRepository } from './repositories/subscription-plan.repository';
import { CompanySubscriptionRepository } from './repositories/company-subscription.repository';
import { SubscriptionTier } from './enums/subscription-tier.enums';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import { SubscriptionStatusResponseDto } from './dto/subscription-status-response.dto';
import { parseCsv } from 'src/utils/csv/csv-parser.util';

@Injectable()
export class UserService {
  private supplierRoleId: Types.ObjectId;
  private companyRoleId: Types.ObjectId;

  constructor(
    private readonly companyTypeRepo: CompanyTypeRepository,
    private readonly industryTypeRepo: IndustryTypeRepository,
    private readonly userRepository: UserRepository,
    private readonly whitelistedEmailRepo: WhitelistedEmailRepository,
    private readonly invitationRepo: InvitationRepository,
    private readonly roleRepository: RoleRepository,
    private readonly jwtService: JwtService,
    private readonly resetSessionsRepo: ResetSessionsRepository,
    private readonly supplierRolesRepository: SupplierRolesRepository,
    private readonly impactCategoryRepository: ImpactCategoryDataRepository,
    private readonly componentRepository: ComponentRepository,
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
    private readonly companySubscriptionRepository: CompanySubscriptionRepository,
  ) {}

  async getAllCompanyTypes(): Promise<GetResponse<CompanyType[]>> {
    try {
      const { data } = await this.companyTypeRepo.findAll();

      if (!data.length) {
        throw new BaseError('No company types found', 404, 'NOT_FOUND');
      }

      return {
        success: true,
        statusCode: 200,
        data,
      };
    } catch (error) {
      if (error instanceof BaseError) throw error;

      throw new BaseError(
        'Failed to fetch company types',
        500,
        'DATABASE_ERROR',
        error.message,
      );
    }
  }

  async getAllIndustryTypes(): Promise<GetResponse<IndustryType[]>> {
    try {
      const { data } = await this.industryTypeRepo.findAll();

      if (!data.length) {
        throw new BaseError('No industry types found', 404, 'NOT_FOUND');
      }

      return {
        success: true,
        statusCode: 200,
        data,
      };
    } catch (error) {
      if (error instanceof BaseError) throw error;

      throw new BaseError(
        'Failed to fetch industry types',
        500,
        'DATABASE_ERROR',
        error.message,
      );
    }
  }

  async create(createUserDto: CreateUserDto) {
    try {
      // 1. Eligibility check
      const eligibilityResponse = await this.checkEligibility({
        email: createUserDto.email,
      });

      const eligibility = eligibilityResponse;

      if (!eligibility.isEligible || !eligibility.roleDetails?._id) {
        throw new UserNotEligibleError();
      }

      // 2. Check if email already exists
      const existingUser = await this.userRepository.findByEmail(
        createUserDto.email.toLowerCase(),
      );
      if (existingUser) {
        throw new EmailAlreadyExistsError();
      }

      // 3. Assign role from eligibility
      createUserDto.role = eligibility.roleDetails._id.toString();

      // 4. Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );
      createUserDto.password = hashedPassword;

      // 5. Normalize email
      createUserDto.email = createUserDto.email.trim().toLowerCase();

      // 6. Create user
      const payloadToCreate = {
        ...createUserDto,
        role: new Types.ObjectId(createUserDto.role),
      };
      const createdUser = await this.userRepository.create(payloadToCreate);

      // Link supplier email
      if (createdUser.role.equals(this.supplierRoleId)) {
        await this.linkSupplierToComponents(createdUser);
      }

      const { password, ...sanitizedUser } = createdUser.toObject();

      return {
        ...sanitizedUser,
      };
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      throw new UserCreationFailedError(error.message || error);
    }
  }

  async checkEligibility(dto: CheckUserEligibilityDto, flow?: string) {
    try {
      const normalizedEmail = dto.email.trim().toLowerCase();
      // NEW: If signup flow → Check if user already exists
      if (flow === 'signup') {
        const existingUser =
          await this.userRepository.findByEmail(normalizedEmail);
        if (existingUser) {
          throw new EmailAlreadyExistsError();
        }
      }
      // Check invited first
      const invited = await this.invitationRepo.findOne({
        invitedEmail: normalizedEmail,
      });

      if (invited) {
        const role = await this.roleRepository.findOne({
          roleName: 'supplier',
        });
        return {
          isEligible: true,
          roleDetails: role,
        };
      }

      // Check whitelisted or not
      const whitelisted = await this.whitelistedEmailRepo.findOne({
        email: normalizedEmail,
      });

      if (whitelisted) {
        const role = await this.roleRepository.findOne({ roleName: 'company' });
        return {
          isEligible: true,
          roleDetails: role,
        };
      }

      // Not eligible
      throw new UserNotEligibleError();
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new EligibilityCheckFailedError(error.message || error);
    }
  }

  async resetUserPassword(resetPasswordDto: ResetPasswordDto) {
    // Check if token is valid and not expired
    const decoded = this.jwtService.verify(resetPasswordDto.token, {
      secret: process.env.RESET_PASSWORD_SECRET,
    });

    // Check if user exists with the id extracted from token
    const existingUserDetails = await this.userRepository.findById(
      decoded.userId,
    );

    if (!existingUserDetails) throw new UserNotFoundError();

    // 3. Look up session by ID
    const session = await this.resetSessionsRepo.findById(
      decoded.resetSessionsId,
    );
    if (!session) throw new InvalidResetLinkError();

    // 4. Session must be valid
    if (!session.isValid) throw new ResetLinkAlreadyUsedError();

    // 5. Session must belong to same user
    if (session.userId !== decoded.userId) throw new InvalidResetLinkError();

    // Throw error if old and new password is same
    const passwordCheck = await bcrypt.compare(
      resetPasswordDto.newPassword,
      existingUserDetails.password,
    );

    if (passwordCheck == true) {
      throw new OldNewPasswordSameError();
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      resetPasswordDto.newPassword,
      saltRounds,
    );

    // Update user record with new password
    let result = await this.userRepository.update(
      { _id: decoded.userId },
      { password: hashedPassword },
    );

    // 8. Invalidate this session → One-time use only
    session.isValid = false;
    await session.save();

    return {
      success: true,
      statusCode: 200,
    };
  }

  /**
   * Load role ids once at startup. Keeps queries fast and environment-agnostic.
   */
  async onModuleInit() {
    const supplierRole = await this.roleRepository.findByName('supplier');
    const companyRole = await this.roleRepository.findByName('company');

    if (!supplierRole || !companyRole) {
      throw new Error('Roles not found in database');
    }

    this.supplierRoleId = supplierRole._id;
    this.companyRoleId = companyRole._id;
  }

  /**
   * Return suppliers in the shape the controller expects (raw business data).
   * Controller will wrap this in GetResponse.
   */
  async getSuppliers(limit: number, skip: number) {
    const users = await this.userRepository.findUsersByRole(
      this.supplierRoleId,
      limit,
      skip,
      {
        'companyDetails.name': 1,
        'companyDetails.registrationNumber': 1,
        name: 1,
        email: 1,
        createdAt: 1,
      },
      [],
      { createdAt: -1 },
    );

    const total = await this.userRepository.countUsersByRole(
      this.supplierRoleId,
    );

    const list = users.map((user: any) => ({
      id: user._id,
      supplierName: user.companyDetails?.name ?? null,
      supplierContactName: user.name ?? null,
      email: user.email ?? null,
      registrationNumber: user.companyDetails?.registrationNumber ?? null,
      dateJoined: user.createdAt ?? null,
    }));

    return { list, total };
  }

  /**
   * Return companies in the shape the controller expects (raw business data).
   * Controller will wrap this in GetResponse.
   */
  async getCompanies(limit: number, skip: number) {
    const companies = await this.userRepository.findUsersByRole(
      this.companyRoleId,
      limit,
      skip,
      {
        password: 0,
        invitedBy: 0,
        isEmailVerified: 0,
        role: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      },
      ['companyDetails.companyType'], // fields to populate
      { createdAt: -1 }, // FIXED SORT: latest on top
    );

    const total = await this.userRepository.countUsersByRole(
      this.companyRoleId,
    );

    // Format response for front-end requirement
    const formatted = companies.map((user: any) => ({
      userId: user._id,
      companyName: user.companyDetails?.name,
      contactName: user.name,
      email: user.email,
      registrationNumber: user.companyDetails?.registrationNumber,
      companyType: user.companyDetails?.companyType?.type || null,
    }));

    return { list: formatted, total };
  }

  async updateCompanyDetails(userId: string, dto: UpdateCompanyDetailsDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError();

    return this.userRepository.updateCompanyDetails(userId, dto);
  }

  async getMyProfileDetails(
    userId: string,
  ): Promise<ProfileDetailsResponseDto> {
    const user = await this.userRepository.findMyProfileByUserId(userId);
    if (!user) throw new UserNotFoundError();

    return {
      companyName: user.companyDetails.name,
      companyWebsite: user.companyDetails.website,
      industry: user.companyDetails.industryType,
      companyType: user.companyDetails.companyType,
      registrationNumber: user.companyDetails.registrationNumber,
      dunsNumber: user.companyDetails.dunsNumber,
      companyContactName: user.name,
      companyContactEmail: user.email,
      companyAddress: user.companyDetails.address,
      createdAt: user.createdAt,
    };
  }

  async fetchCompanyDetails(userId: string) {
    try {
      const user = await this.userRepository.findById(userId, [
        { path: 'companyDetails.industryType' },
        { path: 'companyDetails.companyType' },
      ]);

      if (!user) throw new UserNotFoundError();
      const industry = user.companyDetails.industryType as any;
      const company = user.companyDetails.companyType as any;

      const companyDetails: FetchCompanyDetailsDto = {
        name: user.companyDetails.name,
        website: user.companyDetails.website!,
        registrationNumber: user.companyDetails.registrationNumber,
        industryType: industry.type,
        companyType: company.type,
        dunsNumber: user.companyDetails.dunsNumber!,
        contactName: user.name,
        contactEmail: user.email,
        address: user.companyDetails.address,
        createdAt: user.createdAt,
      };
      return companyDetails;
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
    }
  }

  async fetchSupplierRoles() {
    const { data } = await this.supplierRolesRepository.findAll();
    if (!data.length) {
      throw new BaseError('No supplier roles found', 404, 'NOT_FOUND');
    }
    return data;
  }

  // Check registration no exist or not
  async isRegistrationNumberExists(registrationNumber: string) {
    const userExists = await this.userRepository.exists({
      'companyDetails.registrationNumber': registrationNumber,
      deletedAt: null,
    });

    return { isExists: Boolean(userExists) };
  }

  // Get components list for supplier
  async getComponentDataRequests(
    userId: string,
    userRoleSlug: string,
    limit: number,
    page: number,
    search?: string,
  ) {
    // Admin must provide supplierUserId
    if (userRoleSlug === 'admin_user' && !userId) {
      throw new IdRequiredError();
    }
    const supplierObjectId = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const matchComponent: any = {
      deletedAt: null,
      supplierId: supplierObjectId, // filter by supplier
    };

    if (search?.trim()) {
      matchComponent.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { internalSku: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const aggregation: any[] = [
      // Only supplier's components
      { $match: matchComponent },

      // Lookup ImpactCategoryRecord
      {
        $lookup: {
          from: 'impactCategoryRecord',
          localField: '_id',
          foreignField: 'componentId',
          as: 'records',
        },
      },
      { $unwind: '$records' },
      {
        $match: {
          'records.deletedAt': null,
          $expr: {
            $in: [
              '$records.supplierLinkedRole',
              { $ifNull: ['$supplierRoles', []] },
            ],
          },
        },
      },
      // Lookup ImpactCategoryRequest
      {
        $lookup: {
          from: 'impactCategoryRequest',
          localField: 'records._id',
          foreignField: 'impactCategoryRecordId',
          as: 'requests',
        },
      },
      { $unwind: '$requests' },

      // Only requested
      {
        $match: {
          'requests.isRequested': true,
        },
      },

      // Group by component + role (separate row per role)
      {
        $group: {
          _id: {
            componentId: '$_id',
            supplierLinkedRole: '$records.supplierLinkedRole',
          },

          componentName: { $first: '$name' },
          internalSku: { $first: '$internalSku' },
          productId: { $first: '$productId' },
          createdBy: { $first: '$createdBy' },
          dateOfRequest: { $min: '$requests.createdAt' },

          records: { $push: '$records' },
          requestedCategories: { $addToSet: '$requests.impactCategory' },

          rawMaterialSupplierDetails: { $first: '$rawMaterialSupplierDetails' },
          transportFreightDetails: { $first: '$transportFreightDetails' },
          storageFulfilmentDetails: { $first: '$storageFulfilmentDetails' },
          packagingManufacturerDetails: {
            $first: '$packagingManufacturerDetails',
          },
          cpgBrandDetails: { $first: '$cpgBrandDetails' },
          retailerDetails: { $first: '$retailerDetails' },
          contractManufacturerDetails: {
            $first: '$contractManufacturerDetails',
          },
          transportFreight: { $first: '$transportFreight' },
        },
      },

      // Fetch latest supplier versions (both submitted & draft)
      {
        $lookup: {
          from: 'impactCategoryVersion',
          let: {
            recordIds: '$records._id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$impactCategoryRecordId', '$$recordIds'] },
                    { $eq: ['$versionOwner', 'supplier'] },
                    // isLatest removed — company actions flip this flag
                    // and would hide supplier's own submitted data
                  ],
                },
              },
            },

            // Group per category, pick highest versionNumber as the latest
            {
              $group: {
                _id: {
                  recordId: '$impactCategoryRecordId',
                  impactCategory: '$impactCategory',
                },
                versions: { $push: '$$ROOT' },
              },
            },

            {
              $addFields: {
                selectedVersion: {
                  $arrayElemAt: [
                    {
                      $sortArray: {
                        input: '$versions',
                        sortBy: { versionNumber: -1, createdAt: -1 },
                      },
                    },
                    0,
                  ],
                },
              },
            },

            { $replaceRoot: { newRoot: '$selectedVersion' } },
          ],
          as: 'versions',
        },
      },
      // SubmittedCount counts only submitted versions
      {
        $addFields: {
          requestedCategoryCount: { $size: '$requestedCategories' },

          submittedCount: {
            $size: {
              $filter: {
                input: '$versions',
                as: 'v',
                cond: { $eq: ['$$v.isSubmitted', true] },
              },
            },
          },

          filledCount: {
            $size: {
              $filter: {
                input: '$versions',
                as: 'v',
                cond: {
                  $or: [
                    { $ne: ['$$v.quantity', null] },
                    { $eq: ['$$v.isImpactPresent', false] },
                  ],
                },
              },
            },
          },
        },
      },

      {
        $addFields: {
          submissionStatus: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$filledCount', 0] },
                  then: 'pending',
                },
                {
                  case: {
                    $and: [
                      { $gt: ['$filledCount', 0] },
                      { $eq: ['$submittedCount', 0] },
                    ],
                  },
                  then: 'ready',
                },
                {
                  case: {
                    $eq: ['$submittedCount', '$requestedCategoryCount'],
                  },
                  then: 'submitted',
                },
              ],
              default: 'partial',
            },
          },
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

    const result = await this.componentRepository.aggregate(aggregation);

    const total = result[0]?.metadata[0]?.total ?? 0;
    const rows = result[0]?.data ?? [];

    // Fetch requester company names
    const creatorIds = [
      ...new Set(rows.map((r) => r.createdBy?.toString()).filter(Boolean)),
    ];

    const creators = await this.userRepository.find({
      _id: { $in: creatorIds },
    });

    const creatorMap = new Map(
      creators.map((c) => [c._id.toString(), c.companyDetails?.name]),
    );

    const results = rows.map((row) => {
      const role = row._id.supplierLinkedRole;
      const detailFieldName = `${role}Details`;
      const benchmarkingData = row[detailFieldName]?.benchmarkingData ?? null;

      const impacts: any = {};

      row.requestedCategories.forEach((category: string) => {
        const version = row.versions.find((v) => v.impactCategory === category);

        impacts[category] = {
          quantity: version?.quantity ?? null,
          unit: version?.unit ?? null,
          lciaMethodology: version?.lciaMethodology ?? null,
          isSubmitted: version?.isSubmitted ?? false,
          isImpactPresent: version?.isImpactPresent ?? true,
        };
      });

      return {
        _id: row._id.componentId.toString(),
        supplierName: creatorMap.get(row.createdBy?.toString()) ?? null,
        submissionStatus: row.submissionStatus,
        impacts,
        productId: row.productId?.toString(),
        componentId: row._id.componentId.toString(),
        componentName: row.componentName,
        supplierRole: role,
        supplierRoleSlug: role,
        createdAt: row.dateOfRequest,
        benchmarkingData,
        ...(role === 'transportFreight' && {
          transportFreight: row.transportFreight ?? null,
        }),
        ...(role === 'contractManufacturer' && {
          contractManufacturerDetails: row.contractManufacturerDetails ?? null,
        }),
      };
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      results,
    };
  }

  /**
   * Group impact data records by supplier role
   */
  private groupRecordsByRole(records: any[]): Map<string, any[]> {
    const recordsByRole = new Map<string, any[]>();

    records.forEach((record) => {
      const role = record.supplierLinkedRole;
      if (!recordsByRole.has(role)) {
        recordsByRole.set(role, []);
      }
      recordsByRole.get(role)!.push(record);
    });

    return recordsByRole;
  }

  /**
   * Calculate submission status based on isSubmitted flag and data presence
   *
   * Status Logic:
   * - pending: No data exists in any category
   * - ready: Data exists (quantity + unit from supplier) but isSubmitted = false (saved and exited)
   * - partial: Mix of submitted, ready, or pending categories
   * - submitted: All requested categories have isSubmitted = true
   */
  private calculateStatus(impactDataRecords: any[]): string {
    if (!impactDataRecords || impactDataRecords.length === 0) {
      return 'pending';
    }

    const categoryStatuses: { hasData: boolean; isSubmitted: boolean }[] = [];

    // Check each impact category in each record
    impactDataRecords.forEach((record) => {
      // Check Carbon
      if (record.carbon && record.carbon.isImpactPresent !== false) {
        categoryStatuses.push({
          hasData: this.hasData(record.carbon),
          isSubmitted: record.carbon.isSubmitted === true,
        });
      }

      // Check Water
      if (record.water) {
        categoryStatuses.push({
          hasData: this.hasData(record.water),
          isSubmitted: record.water.isSubmitted === true,
        });
      }

      // Check Land
      if (record.land) {
        categoryStatuses.push({
          hasData: this.hasData(record.land),
          isSubmitted: record.land.isSubmitted === true,
        });
      }
    });

    // No categories requested
    if (categoryStatuses.length === 0) {
      return 'pending';
    }

    const submittedCount = categoryStatuses.filter((s) => s.isSubmitted).length;
    const readyCount = categoryStatuses.filter(
      (s) => !s.isSubmitted && s.hasData,
    ).length;
    const totalRequested = categoryStatuses.length;

    // All categories submitted
    if (submittedCount === totalRequested) {
      return 'submitted';
    }

    // All categories ready (data saved but not submitted)
    if (readyCount === totalRequested) {
      return 'ready';
    }

    // Mix of submitted, ready, or pending
    if (submittedCount > 0 || readyCount > 0) {
      return 'partial';
    }

    // No data at all
    return 'pending';
  }

  /**
   * Check if impact category has valid data from supplier
   * Valid data means: quantity, unit, and dataSource='supplier'
   */
  private hasData(categoryData: any): boolean {
    if (!categoryData) {
      return false;
    }

    const hasQuantity =
      categoryData.quantity !== undefined && categoryData.quantity !== null;
    const hasUnit =
      categoryData.unit !== undefined && categoryData.unit !== null;
    const isSupplierData = categoryData.dataSource === 'supplier';
    return hasQuantity && hasUnit && isSupplierData;
  }

  // Link supplier ID for existing component
  private async linkSupplierToComponents(user: User) {
    const email = user.email.toLowerCase();

    await this.componentRepository.updateMany(
      {
        supplierContactEmail: email,
        supplierId: { $exists: false },
        deletedAt: null,
      },
      {
        $set: {
          supplierId: user._id,

          // override fields from user schema
          supplierContactName: user.name,
          supplierContactEmail: email,
          companyRegistrationNumber: user.companyDetails?.registrationNumber,
          supplierName: user.companyDetails?.name,
        },
      },
    );
  }

  // Upgrade user subcription
  async assignOrUpgradeSubscription(userId: string, slug: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Find plan
    const plan = await this.subscriptionPlanRepository.findOne({ slug });
    if (!plan) {
      throw new SubscriptionPlanNotFoundError();
    }

    // Check existing active subscription
    const existingSubscription =
      await this.companySubscriptionRepository.findOne({
        userId: user._id,
        status: SubscriptionStatus.ACTIVE,
      });

    // If exists → mark inactive
    if (existingSubscription) {
      await this.companySubscriptionRepository.update(
        { _id: existingSubscription._id },
        {
          status: SubscriptionStatus.INACTIVE,
          endDate: new Date(),
        },
      );
    }

    // Create new subscription
    const newSubscription = await this.companySubscriptionRepository.create({
      userId: user._id,
      planId: plan._id,
      planSlug: plan.slug,
      startDate: new Date(),
      endDate: null,
      status: SubscriptionStatus.ACTIVE,
    });

    return newSubscription;
  }

  async exportCompaniesSubscriptionCsv(): Promise<string> {
    const now = new Date();
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const rows = await this.userRepository.getCompaniesForCsvExport(
      this.companyRoleId,
      endOfMonth,
    );

    const headers = [
      'Company Name',
      'Company Email Address',
      'Subscription Tier',
      'Number of Products Added',
      'isActive',
    ];

    const escape = (value: any): string => {
      const str = value == null ? '' : String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [
      headers.join(','),
      ...rows.map((row) =>
        [
          escape(row.companyName),
          escape(row.email),
          escape(row.subscriptionTier),
          escape(row.numberOfProducts),
          escape(row.isActive),
        ].join(','),
      ),
    ];

    return lines.join('\n');
  }

  /**
   * Parse an uploaded CSV (from the companies/export-csv format) and update
   * each user's isActive status based on the "isActive" column.
   *
   * Expected CSV headers: "Company Email Address", "isActive"
   * Additional columns (Company Name, Subscription Tier, etc.) are ignored.
   */
  async importCompaniesIsActiveFromCsv(fileBuffer: Buffer): Promise<{
    updated: number;
    skipped: number;
    errors: string[];
  }> {
    const REQUIRED_HEADERS = ['Company Email Address', 'isActive'];

    const { rows, errors } = parseCsv<{ email: string; isActive: boolean }>(
      fileBuffer,
      {
        requiredHeaders: REQUIRED_HEADERS,
        transform: (row, rowIndex) => {
          const email = row['Company Email Address']?.trim().toLowerCase();
          const isActiveRaw = row['isActive']?.trim().toLowerCase();

          if (!email) {
            throw new Error('Company Email Address is required');
          }

          if (!['true', 'false'].includes(isActiveRaw)) {
            throw new Error(
              `isActive must be "true" or "false", got "${row['isActive']}"`,
            );
          }

          return { email, isActive: isActiveRaw === 'true' };
        },
      },
    );

    // Header-level errors (missing columns) — abort early
    if (errors.length > 0 && rows.length === 0) {
      throw new BaseError(errors.join('; '), 400, 'INVALID_CSV');
    }

    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const result = await this.userRepository.updateIsActiveByEmail(
        row.email,
        row.isActive,
      );
      if (result) {
        updated++;
      } else {
        skipped++;
        errors.push(`No user found with email: ${row.email}`);
      }
    }

    return { updated, skipped, errors };
  }

  // Get user's current subscription with all other plans
  async getSubscriptions(
    userId: string,
  ): Promise<SubscriptionStatusResponseDto> {
    // Get active subscription
    const subscription = await this.companySubscriptionRepository.findOne({
      userId: new Types.ObjectId(userId),
      status: SubscriptionStatus.ACTIVE,
    });

    // Get all plans
    const allPlans = await this.subscriptionPlanRepository.find({});

    // Map plans and mark current plan
    const mappedPlans = allPlans.map((plan) => ({
      id: plan._id.toString(),
      tier: plan.tier,
      slug: plan.slug,
      maxProducts: plan.maxProducts,
      isSelectable: plan.isSelectable,
      sortOrder: plan.sortOrder,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      currency: plan.currency,
      isCurrentPlan: subscription ? plan.slug === subscription.planSlug : false,
    }));

    // Sort by sortOrder
    mappedPlans.sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      userId: userId,
      allPlans: mappedPlans,
    };
  }
}

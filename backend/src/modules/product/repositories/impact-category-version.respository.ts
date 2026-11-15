import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { ImpactCategoryVersion } from '../schemas/impact-category-version.schema';

@Injectable()
export class ImpactCategoryVersionRepository extends BaseRepository<ImpactCategoryVersion> {
  constructor(
    @InjectModel(ImpactCategoryVersion.name)
    private readonly ImpactCategoryVersionModel: Model<ImpactCategoryVersion>,
  ) {
    super(ImpactCategoryVersionModel);
  }

  async findLatestVersion(
    impactCategoryRecordId,
    versionOwner: string,
  ): Promise<ImpactCategoryVersion | null> {
    return this.ImpactCategoryVersionModel.findOne({
      impactCategoryRecordId,
      versionOwner,
      deletedAt: null,
    })
      .sort({ versionNumber: -1 })
      .exec();
  }

  async findLatestSubmittedVersion(
    impactCategoryRecordId,
    versionOwner: string,
  ): Promise<ImpactCategoryVersion | null> {
    return this.ImpactCategoryVersionModel.findOne({
      impactCategoryRecordId,
      versionOwner,
      isSubmitted: true,
      deletedAt: null,
    })
      .sort({ versionNumber: -1 })
      .exec();
  }

  async countDocuments(filter: any): Promise<number> {
    return this.model.countDocuments(filter);
  }

  async findAllSubmittedVersions(
    impactCategoryRecordId,
    versionOwner: string,
  ): Promise<ImpactCategoryVersion[]> {
    return this.ImpactCategoryVersionModel.find({
      impactCategoryRecordId,
      versionOwner,
      isSubmitted: true,
      deletedAt: null,
    })
      .sort({ versionNumber: 1 }) // ascending order
      .exec();
  }

  async findOneAndUpdate(filter: any, update: any, options: any = {}) {
    return this.ImpactCategoryVersionModel.findOneAndUpdate(filter, update, {
      new: true, // return updated document
      runValidators: true, // ensure schema validation
      ...options,
    }).exec();
  }

  /**
   * Finds the supplier's latest submitted version that is pending company review.
   * Returned when: isSubmitted: true, isApproved: false, isRejected: false, isLatest: true
   */
  async findPendingSupplierSubmissionWithSession(recordId: any, session?) {
    const query = this.model.findOne({
      impactCategoryRecordId: recordId,
      versionOwner: 'supplier',
      isSubmitted: true,
      isApproved: { $ne: true },
      isRejected: { $ne: true },
      isProspective: true,
      deletedAt: null,
    }).sort({ createdAt: -1 });

    if (session) query.session(session);

    return query.exec();
  }

  async findHighestVersion(recordId: any, owner: string, session) {
    const query = this.model
      .findOne({
        impactCategoryRecordId: recordId,
        versionOwner: owner,
      })
      .sort({ versionNumber: -1 });

    if (session) query.session(session);

    return query.exec();
  }

  async findOneWithSession(filter, populate?: any, session?) {
    const query = this.model.findOne({ ...filter, deletedAt: null });

    if (populate) query.populate(populate);
    if (session) query.session(session);

    return query.exec();
  }

  async findLatestSubmittedVersionWithSession(
    recordId: any,
    owner: string,
    session?,
  ) {
    const query = this.model
      .findOne({
        impactCategoryRecordId: recordId,
        versionOwner: owner,
        isSubmitted: true,
        deletedAt: null,
      })
      .sort({ versionNumber: -1 });

    if (session) query.session(session);

    return query.exec();
  }

  async findPreviousCompanySubmittedVersion(impactCategoryRecordId, session?) {
    return this.model
      .findOne({
        impactCategoryRecordId,
        versionOwner: 'company',
        isSubmitted: true,
        dataSource: { $ne: 'supplier' },
        deletedAt: null,
      })
      .sort({ versionNumber: -1 }) // latest among original company versions
      .session(session || null)
      .exec();
  }

  async findLatestNonEmptyDraftVersion(
    impactCategoryRecordId,
    versionOwner: string,
  ): Promise<ImpactCategoryVersion | null> {
    return this.ImpactCategoryVersionModel.findOne({
      impactCategoryRecordId,
      versionOwner,
      isSubmitted: false,
      deletedAt: null,
      $or: [{ quantity: { $ne: null } }, { tempQuantity: { $ne: null } }],
    })
      .sort({ versionNumber: -1 })
      .exec();
  }

  async findPendingSupplierSubmission(recordId) {
  return this.model.findOne({
    impactCategoryRecordId: recordId,
    versionOwner: 'supplier',
    isSubmitted: true,

    isApproved: { $ne: true },
    isRejected: { $ne: true },
    isProspective: true,
  }).sort({ createdAt: -1 });
}

  async findSecondLatestSubmittedVersion(
    impactCategoryRecordId,
    versionOwner: string,
  ) {
    return this.model
      .find({
        impactCategoryRecordId,
        versionOwner,
        isSubmitted: true,
        deletedAt: null,
      })
      .sort({ versionNumber: -1 })
      .skip(1) //  skip latest
      .limit(1)
      .exec()
      .then((res) => res[0] || null);
  }

  findSecondLatestCompanyOriginalVersion(recordId) {
    return this.model
      .find({
        impactCategoryRecordId: recordId,
        versionOwner: 'company',
        isSubmitted: true,
        dataSource: { $ne: 'supplier' },
      })
      .sort({ versionNumber: -1 })
      .skip(1)
      .limit(1)
      .lean();
  }

  async countSubmittedVersions(recordId, owner) {
    return this.model.countDocuments({
      impactCategoryRecordId: recordId,
      versionOwner: owner,
      isSubmitted: true,
      isDeleted: { $ne: true },
    });
  }

  async findSecondLatestSubmittedVersionExcludingSupplier(recordId) {
    const versions = await this.model
      .find({
        impactCategoryRecordId: recordId,
        versionOwner: 'company',
        isSubmitted: true,
        isDeleted: { $ne: true },
      })
      .sort({ versionNumber: -1 })
      .limit(2);

    return versions.length >= 2 ? versions[1] : null;
  }

  async findLatestSubmittedVersionByDataSource(
    recordId,
    owner: 'company' | 'supplier',
    allowedDataSources: string[], // ['manual', 'database']
  ) {
    return this.ImpactCategoryVersionModel.findOne({
      impactCategoryRecordId: recordId,
      versionOwner: owner,
      isSubmitted: true,
      dataSource: { $in: allowedDataSources }, //  filter here
    })
      .sort({ versionNumber: -1 }) // latest version
      .lean();
  }

  async findLatestApprovedSupplierVersion(impactCategoryRecordId) {
    return this.model
      .findOne({
        impactCategoryRecordId,
        versionOwner: 'supplier',
        isApproved: true,
      })
      .sort({ approvedAt: -1 })
      .lean();
  }

  async findLatestOriginalCompanySubmittedVersion(
  impactCategoryRecordId
) {
  return this.model
    .findOne({
      impactCategoryRecordId,
      versionOwner: 'company',
      isSubmitted: true,
    })
    .sort({ versionNumber: -1 })
    .lean();
}
}

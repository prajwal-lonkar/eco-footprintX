import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { GetUploadUrlDto } from './dto/upload-image.dto';
import {
  CompanyIdRequiredError,
  InvalidImageKeyError,
} from 'src/shared/errorResponse/product.errors';
import { CreateResponse } from 'src/shared/successResponse/create.response';
import { JwtAuthGuard } from '../auth/jwt-helper/jwt-auth.guard';
import { RolesGuard } from '../auth/jwt-helper/roles.guard';
import { Roles, RoleSlug } from '../auth/jwt-helper/roles.decorator';
import { UpdateRecycleProductInfoDto } from './dto/update-recycle-product-info';
import { UpdateResponse } from 'src/shared/successResponse/update.response';
import { CreateProductDto } from './dto/add-product.dto';
import { DeleteResponse } from 'src/shared/successResponse/delete.response';
import { GetResponse } from 'src/shared/successResponse/get.response';
import { AddComponentDto } from './dto/add-component.dto';
import { IdParamDto } from '../../shared/dto/id-param.dto';
import {
  BadRequestError,
  ForbiddenError,
} from 'src/shared/errorResponse/common.errors';
import { AddSupplier } from './dto/add-supplier.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateSupplierDetailsDto } from './dto/update-supplier-details.dto';
import { ProductComponentParamsDto } from './dto/product-component-params.dto';
import { CompleteSupplierDetailsDto } from './dto/update-environmental-profile.dto';
import { AddSupplierWithDetailsDto } from './dto/add-supplier-with-details.dto';
import { ComponentRoleDetailsParamsDto } from './dto/component-roleDetails-params.dto';
import { AddImpactCategoryDto } from './dto/add-impact-category.dto';
import { ComponentRoleSlugParamsDto } from './dto/component-roleSlug-params.dto';
import { axiosRequest } from 'src/utils/axios/axios.util';
import { DatahubHeadersService } from 'src/utils/datahub/datahub-headers.util';
import { ImpactCategory } from './constants/impact-category.constants';
import { UpdateBenchmarkingDataDto } from './dto/add-benchmarking.dto';
import { CheckEmailQueryDto } from './dto/check-email.dto';
import { SubmitImpactCategoryDto } from './dto/submit-impact-category.dto';
import { CalculateDistanceQueryDto } from './dto/calculate-distance-query.dto';
import { ApproveRejectImpactCategoryDto } from './dto/approve-reject-impact-category.dto';
import { RequestWithUser } from './dto/request.dto';

@Controller({ path: 'products', version: '1' })
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly datahubHeaders: DatahubHeadersService,
  ) {}

  @Post('image/upload-url')
  @UseGuards(JwtAuthGuard)
  async generateImageUploadUrl(
    @Body() body: GetUploadUrlDto & { key: string; contentType: string },
  ) {
    if (!body.key || !body.contentType) {
      throw new InvalidImageKeyError('key and contentType are required');
    }
    const result = await this.productService.generateImageUploadUrl(
      body.key,
      body.contentType,
    );
    return new CreateResponse(result);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY)
  async createProduct(@Req() req, @Body() dto: CreateProductDto) {
    const companyId = req.user.payload.userId;
    const product = await this.productService.createProduct(dto, companyId);
    return new CreateResponse(product);
  }

  @Patch('product/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY)
  async updateProductImageOrRecycleInfo(
    @Param() params: IdParamDto,
    @Body() recycleProductInfo: UpdateRecycleProductInfoDto,
  ) {
    const productId = params.id;
    const result = await this.productService.updateProductImageOrRecycleInfo(
      productId,
      recycleProductInfo,
    );
    return new UpdateResponse(result);
  }

  @Delete('product/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY)
  async deleteProduct(@Req() req, @Param() params: IdParamDto) {
    const productId = params.id;
    const userId = req.user.payload.userId;
    const result = await this.productService.deleteProductById(
      productId,
      userId,
    );
    return new DeleteResponse(result);
  }

  // Add component for the product
  @Post(':productId/component')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY)
  async addComponent(
    @Param('productId') productId: string,
    @Body() dto: AddComponentDto,
    @Req() req,
  ) {
    const companyId = req.user.payload.userId;

    const componentDetails = await this.productService.addComponent(
      productId,
      dto,
      companyId,
      dto.isNewComponent,
    );
    return new CreateResponse(componentDetails);
  }

  @Get('view-product/:gtin')
  async viewProductsEnvironmentalProfilePage(
    @Req() req,
    @Param('gtin') gtin: string,
  ) {
    const result =
      await this.productService.viewProductsEnvironmentalProfilePage(gtin);
    return new GetResponse(result);
  }

  // Get all products for authenticated company
  @Get('list')
  async getProducts(
    @Query('companyId') companyId: string,
    @Query('limit') limit = 10,
    @Query('skip') skip = 0,
  ) {
    if (!companyId) {
      throw new CompanyIdRequiredError('companyId is required');
    }

    const data = await this.productService.getProductsByCompany(
      companyId,
      +limit,
      +skip,
    );

    return new GetResponse(data, 'Products fetched successfully');
  }

  // Get specific product details
  @Get('product/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY, RoleSlug.ADMIN)
  async getProduct(@Req() req, @Param('id') productId: string) {
    const data = await this.productService.getProductDetails(productId);
    return new GetResponse(data);
  }

  // Search component by name or sku
  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchComponents(@Query('query') query: string, @Req() req) {
    const companyId = req.user.payload.userId;

    if (!query) {
      throw new BadRequestError('query is required');
    }

    const data = await this.productService.searchComponents(query, companyId);
    return new GetResponse(data);
  }

  // Add supplier for component
  @Patch('component/:id/supplier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY)
  async addSupplierWithDetailsForComponent(
    @Param('id') id: string,
    @Body() dto: AddSupplierWithDetailsDto,
    @Req() req,
  ) {
    const companyId = req.user.payload.userId;
    const supplierDetails =
      await this.productService.addSupplierWithDetailsForComponent(
        id,
        companyId,
        dto,
      );
    return new UpdateResponse(supplierDetails);
  }

  @Put('product/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY)
  async updateProductDetails(
    @Req() req,
    @Param() params: IdParamDto,
    @Body() updateProductDetails: UpdateProductDto,
  ) {
    const productId = params.id;
    const companyId = req.user.payload.userId;
    const result = await this.productService.updateProductDetails(
      productId,
      updateProductDetails,
      companyId,
    );
    return new UpdateResponse(result);
  }

  // Search supplier by name
  @Get('suppliers/search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY)
  async searchSuppliers(@Query('query') query: string, @Req() req) {
    const companyId = req.user.payload.userId;
    if (!query) {
      throw new BadRequestError('query is required');
    }

    const data = await this.productService.searchSuppliers(query, companyId);
    return new GetResponse(data);
  }

  // Add supplier role details
  // @Patch('component/:id/complete-role-details')
  // @UseGuards(JwtAuthGuard)
  // async updateSupplierRoles(
  //   @Param('id') componentId: string,
  //   @Body() updateDto: UpdateSupplierDetailsDto,
  //   @Req() req,
  // ) {
  //   const companyId = req.user.payload.userId;
  //   const supplierRoleDetails = await this.productService.updateSupplierRoles(
  //     componentId,
  //     updateDto,
  //     companyId,
  //   );
  //   return new UpdateResponse(supplierRoleDetails);
  // }

  // Delete specific supplier role of component of a product
  @Delete(':productId/component/:componentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY)
  async deleteComponentsSupplierRole(
    @Req() req,
    @Param() params: ProductComponentParamsDto,
    @Query('supplierRoleSlug') supplierRoleSlug,
  ) {
    const { productId, componentId } = params;
    const userId = req.user.payload.userId;
    const result = await this.productService.removeSupplierRoleFromComponent(
      productId,
      componentId,
      userId,
      supplierRoleSlug,
    );
    return new DeleteResponse(result);
  }

  // Get Suppliers List for components of a given product
  @Get(':id/components/suppliers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY, RoleSlug.ADMIN)
  async suppliersList(
    @Req() req,
    @Param() params: IdParamDto,
    @Query('limit') limit,
    @Query('page') page,
  ) {
    const userId = req.user.payload.userId;
    const userRoleSlug = req.user.payload.userRoleSlug;
    const productId = params.id;
    const result = await this.productService.fetchSuppliersListForComponent(
      userId,
      userRoleSlug,
      productId,
      +limit,
      +page,
    );
    return new GetResponse(result);
  }

  // Fetch component detail page for a particular product
  @Get(':productId/component/:componentId')
  @UseGuards(JwtAuthGuard)
  async componentDetails(
    @Req() req,
    @Param() params: ProductComponentParamsDto,
    @Query('supplierRoleSlug') supplierRoleSlug?: string,
    @Query('roleSlug') roleSlug?,
  ) {
    const { productId, componentId } = params;
    const { userId, userRoleSlug } = req.user.payload;
    const result = await this.productService.fetchComponentDetailsById(
      productId,
      componentId,
      userId,
      supplierRoleSlug,
      roleSlug,
      userRoleSlug,
    );
    return new GetResponse(result);
  }

  // Complete supplier details
  @Patch('component/:id/complete-supplier-details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY)
  async completeSupplierDetails(
    @Param('id') componentId: string,
    @Body() updateDto: CompleteSupplierDetailsDto,
    @Req() req,
  ) {
    const companyId = req.user.payload.userId;

    const result = await this.productService.completeSupplierDetails(
      componentId,
      updateDto,
      companyId,
    );

    return new UpdateResponse(result);
  }

  // Fetch supplier details for component
  // @Get(':productId/components/:componentId')
  @UseGuards(JwtAuthGuard)
  async supplierDetails(
    @Req() req,
    @Param() params: ProductComponentParamsDto,
    @Query('supplierRoleSlug') supplierRoleSlug,
  ) {
    const { productId, componentId } = params;
    const userId = req.user.payload.userId;

    const result = await this.productService.fetchSupplierDetails(
      productId,
      componentId,
      userId,
      supplierRoleSlug,
    );
    return new GetResponse(result);
  }

  @Post('/components/:componentId/impact-category/:roleDetailsId')
  @UseGuards(JwtAuthGuard)
  async addImpactCategory(
    @Req() req,
    @Param() params: ComponentRoleDetailsParamsDto,
    @Body() dto: AddImpactCategoryDto,
    @Query('productRequested') productRequested,
  ) {
    const userId = req.user.payload.userId;

    const result = await this.productService.saveImpactCategories(
      params,
      dto,
      userId,
      productRequested,
    );
    return new CreateResponse(result);
  }

  // Fetching impact category data on summary page
  @Get('/components/:componentId/impact-category/:roleSlug')
  @UseGuards(JwtAuthGuard)
  async getImpactCategorySummary(
    @Req() req,
    @Param() params: ComponentRoleSlugParamsDto,
    @Query('productRequested') productRequested,
  ) {
    const userId = req.user.payload.userId;
    const userRoleSlug = req.user.payload.userRoleSlug;
    const result =
      await this.productService.fetchImpactCategorySummaryOnSummaryPage(
        params,
        userId,
        userRoleSlug,
        productRequested,
      );
    return new GetResponse(result);
  }

  @Get('/geography/search')
  async searchLocationFromGeographyColumn(@Query('query') query: string) {
    const response = await axiosRequest({
      url: `${process.env.DATAHUB_BACKEND_BASE_URL}/geography/search`,
      method: 'GET',
      params: {
        query: query,
      },
      headers: this.datahubHeaders.get(),
    });
    return response;
  }

  // Search impact category data
  @Get('/master-data/search')
  async searchMasterData(
    @Query('supplierRoleSlug') supplierRoleSlug: string,
    @Query() filters: Record<string, any>,
  ) {
    // Remove supplierRoleSlug from filters if it exists to avoid duplication
    const { supplierRoleSlug: _, ...queryParams } = filters;

    try {
      const response = await axiosRequest({
        url: `${process.env.DATAHUB_BACKEND_BASE_URL}/master-data/search`,
        method: 'GET',
        params: {
          ...queryParams,
          supplierRoleSlug,
        },
        headers: this.datahubHeaders.get(),
      });
      return response;
    } catch (error: any) {
      // Proper HTTP error from Datahub
      if (error?.response?.statusCode) {
        throw new HttpException(
          error.response.message,
          error.response.statusCode,
        );
      }

      // Axios error without HTTP response (timeout, network, wrapper)
      throw new HttpException(
        error?.message || 'Datahub service unavailable',
        HttpStatus.BAD_GATEWAY, // 502
      );
    }
  }

  @Patch('product/:id/impact-category')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY, RoleSlug.ADMIN)
  async updateImpactCategoryStatus(
    @Param('id') productId: string,
    @Query('category') category: ImpactCategory,
    @Body('isPublished') isPublished: boolean,
    @Req() req,
  ) {
    const userId = req.user.payload.userId;

    const result = await this.productService.updateImpactCategoryStatus(
      productId,
      category,
      isPublished,
      userId,
    );
    return new UpdateResponse(result);
  }

  // Get total impact for all categories
  @Get('product/:id/impact-summary')
  @UseGuards(JwtAuthGuard)
  async getImpactSummary(@Param('id') productId: string, @Req() req) {
    const { userId, userRoleSlug } = req.user.payload;
    const result = await this.productService.getProductImpactSummary(
      productId,
      userId,
      userRoleSlug,
    );

    return new GetResponse(result);
  }

  // Add benchmarking data for component
  @Patch('/component/:componentId/bench-marking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY)
  async benchmarkingDataForCompany(
    @Req() req,
    @Param('componentId') componentId: string,
    @Body() dto,
    @Query() query: Record<string, any>,
  ) {
    const userId = req.user.payload.userId;
    const { supplierRoleSlug, ...dynamicQueryParams } = query;
    const result = await this.productService.addBenchmarkingDataForCompany(
      userId,
      componentId,
      dto,
      supplierRoleSlug,
      dynamicQueryParams,
    );

    return new UpdateResponse(result);
  }

  // Get benchmarking data for component
  @Get('/component/:componentId/bench-marking')
  @UseGuards(JwtAuthGuard)
  async getBenchmarkingDataForComponent(
    @Req() req,
    @Param('componentId') componentId: string,
    @Query('supplierRoleSlug') supplierRoleSlug: string,
  ) {
    const userId = req.user.payload.userId;
    const userRole = req.user.payload.userRoleSlug;

    const result = await this.productService.fetchBenchmarkingDataForComponent(
      userId,
      componentId,
      supplierRoleSlug,
      userRole,
    );

    return new GetResponse(result);
  }

  @Get('check-email')
  @UseGuards(JwtAuthGuard)
  async checkEmailExists(@Query() query: CheckEmailQueryDto) {
    const result = await this.productService.checkEmailExistsForProduct(
      query.email,
      query.componentName,
    );
    return new GetResponse(result);
  }

  // Get product requests
  @Get('product/:id/requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY, RoleSlug.ADMIN)
  async getIncomingRequestsForProduct(
    @Req() req,
    @Param() params: IdParamDto,
    @Query('skip') skip = 0,
    @Query('limit') limit = 10,
  ) {
    const productId = params.id;

    const { userId, userRoleSlug } = req.user.payload;

    const result = await this.productService.getIncomingRequestsForProduct(
      productId,
      userId,
      userRoleSlug,
      Number(skip),
      Number(limit),
    );

    return new GetResponse(result);
  }

  // Submit impact category data (when submit button on cards is clicked)
  @Patch('/component/:componentId/impact-category/:roleSlug')
  @UseGuards(JwtAuthGuard)
  async submitImpactCategory(
    @Param('componentId') componentId: string,
    @Param('roleSlug') roleSlug: string,
    @Body() dto: SubmitImpactCategoryDto,
    @Req() req: any,
    @Query('productRequested') productRequested,
  ) {
    const { userId, userRoleSlug } = req.user.payload;

    const result = await this.productService.submitImpactCategory(
      componentId,
      roleSlug,
      dto.categories,
      userId,
      userRoleSlug,
      productRequested,
    );
    return new UpdateResponse(result);
  }

  // Fetching impact category data on components detail page
  @Get('/components/:componentId/impact-summary/:roleSlug')
  @UseGuards(JwtAuthGuard)
  async getImpactCategorySummaryOnComponentDetailPage(
    @Req() req,
    @Param() params: ComponentRoleSlugParamsDto,
    @Query('productRequested') productRequested,
    @Query('isAdminViewCompany') isAdminViewCompany,
  ) {
    const userId = req.user.payload.userId;
    const userRoleSlug = req.user.payload.userRoleSlug;
    const result =
      await this.productService.getImpactCategorySummaryOnComponentDetailPage(
        params,
        userId,
        userRoleSlug,
        productRequested,
        isAdminViewCompany,
      );
    return new GetResponse(result);
  }

  // Calculate distance between two coordinates using OpenAI
  @Get('/component/:id/calculate-distance')
  @UseGuards(JwtAuthGuard)
  async calculateDistance(
    @Param('id') componentId: string,
    @Query() query: CalculateDistanceQueryDto,
  ) {
    const result = await this.productService.calculateDistance(
      componentId,
      query.roleSlug,
      { latitude: query.originLatitude, longitude: query.originLongitude },
      {
        latitude: query.destinationLatitude,
        longitude: query.destinationLongitude,
      },
      query.transportMethod,
    );
    return new GetResponse(result);
  }

  @Post(
    '/components/:componentId/impact-category/database-value/:roleDetailsId',
  )
  @UseGuards(JwtAuthGuard)
  async valueFieldCalculation(
    @Req() req,
    @Param() params: ComponentRoleDetailsParamsDto,
    @Body() dto,
  ) {
    const userId = req.user.payload.userId;
    const result =
      await this.productService.valueFieldCalculationForUseOurDatabase(
        params,
        dto,
        userId,
      );

    return new CreateResponse(result);
  }

  // Approve or reject a supplier's submitted impact category data (company users only)
  @Patch('/components/:componentId/impact-category/:roleSlug/approve-reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleSlug.COMPANY)
  async approveRejectSupplierImpactCategory(
    @Param() params: ComponentRoleSlugParamsDto,
    @Body() dto: ApproveRejectImpactCategoryDto,
    @Req() req: RequestWithUser,
  ) {
    const { userId, userRoleSlug } = req.user.payload;

    if (userRoleSlug !== 'company_user') {
      throw new ForbiddenError(
        'Only company users can approve or reject supplier submissions',
      );
    }

    const result =
      await this.productService.approveRejectSupplierImpactCategory(
        params.componentId,
        params.roleSlug,
        dto.approvedCategories,
        userId,
      );
    return new UpdateResponse(result);
  }
}

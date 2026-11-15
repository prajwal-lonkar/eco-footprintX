import type { AxiosError } from 'axios';
import axiosInstance from './api.service';
import { ENDPOINTS } from '@constants/endpoint';

//   Generate the S3 object key

export const generateS3Key = (productId: string, file: File) => {
  const timestamp = Date.now();
  const ext = file.name.split('.').pop();
  return `products/images/${productId}_${timestamp}.${ext}`;
};

//   Request a signed upload URL

export const getSignedUrl = async (key: string, contentType: string) => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.PRODUCTS.UPLOAD_IMAGE, {
      key,
      contentType,
    });

    return response.data.data;
  } catch (error) {
    const err = error as AxiosError<any>;

    throw new Error(
      err?.response?.data?.message || 'Failed to fetch signed URL'
    );
  }
};

//   Upload file to S3 using the signed URL

export const uploadToS3 = async (file: File, signedUrl: string) => {
  try {
    const res = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!res.ok) {
      console.error(await res.text());
      throw new Error('Failed to upload to S3');
    }
  } catch (error) {
    throw new Error('Error uploading file to S3');
  }
};

//upload image file
export const uploadImageFile = async (file: File, productId: string) => {
  try {
    const key = generateS3Key(productId, file);

    const { uploadUrl, fileUrl } = await getSignedUrl(key, file.type);

    await uploadToS3(file, uploadUrl);

    return { key, fileUrl };
  } catch (error) {
    throw new Error('Failed to upload image');
  }
};

import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './ImageUpload.module.scss';
import uploadImg from '@assets/icons/upload.svg';
import deleteIcon from '@assets/icons/trash.svg';
import { useAlertStore } from '@store/useAlertStore';
import { ERROR_MESSAGES } from '@constants/messages';

interface ImageUploadProps {
  maxFiles?: number;
  maxSize?: number; // bytes
  previewWidth?: number;
  previewHeight?: number;
  dropzoneText?: string;
  maxFileMessage?: string;
  onUpload: (files: File[]) => void;
  className: string;
  onError?: (hasError: boolean) => void;
  existingImageUrl?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB

  onUpload,

  onError,
  existingImageUrl,
}) => {
  const BaseUrl = import.meta.env.VITE_AWS_BUCKET_BASE_URL;
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [previewUrls, setPreviewUrls] = useState<string[]>(
    existingImageUrl ? [`${BaseUrl}/${existingImageUrl}`] : []
  );

  const extractFileName = (url: string) => {
    if (!url) return '';
    return url.split('/').pop() || ''; // gets last part after '/'
  };

  const existingFileName = existingImageUrl
    ? extractFileName(existingImageUrl)
    : '';

  const [fileNames, setFileNames] = useState<string[]>(
    existingImageUrl ? [existingFileName] : []
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const { showAlert, visible } = useAlertStore();
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpeg'];

  const onDrop = (acceptedFiles: File[]) => {
    setHasError(false);
    onError?.(false);

    const validFiles: File[] = [];

    acceptedFiles.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        showAlert(ERROR_MESSAGES.IMAGE_INVALID_FORMAT, 'danger');
        setHasError(true);
        onError?.(true);
        setHasError(true);
        onError?.(true);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      if (file.size > maxSize) {
        showAlert(ERROR_MESSAGES.IMAGE_INVALID_FORMAT, 'danger');
        setHasError(true);
        onError?.(true);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setUploadedFiles(validFiles);
      onUpload(validFiles);
      setPreviewUrls(validFiles.map((file) => URL.createObjectURL(file)));
      setFileNames(validFiles.map((file) => file.name));
      setHasError(false);
      onError?.(false);
    }
  };
  const handleRejectedFiles = (rejectedFiles: any[]) => {
    setHasError(false);
    onError?.(false);

    rejectedFiles.forEach((file) => {
      file.errors.forEach((err: any) => {
        if (err.code === 'file-too-large') {
          showAlert(ERROR_MESSAGES.IMAGE_INVALID_FORMAT, 'danger');
          setHasError(true);
          onError?.(true);
          return;
        }
      });
    });

    setHasError(true);
    onError?.(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDropRejected: handleRejectedFiles,
    accept: {
      'image/*': [],
    },
    maxSize,
    multiple: false,
  });

  const handleRemoveFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    const newNames = fileNames.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setPreviewUrls(newPreviews);
    setFileNames(newNames);
    onUpload(newFiles);
    if (newFiles.length === 0) setHasError(false);
    onError?.(false);
  };
  useEffect(() => {
    if (!visible) {
      setHasError(false);
      onError?.(false);
    }
  }, [visible, onError]);
  return (
    <div
      {...getRootProps()}
      className={`${styles.imageUplaodWrapper} ${hasError ? styles.errorBack : ''} ${previewUrls.length > 0 ? styles.previewExists : ''} `}
    >
      {previewUrls.length === 0 && (
        <>
          <button
            type="button"
            onClick={handleBrowseClick}
            className={`${styles.uploadImgBtn} ${hasError ? styles.error : ''}`}
          >
            <img src={uploadImg} alt="upload" /> Upload Image
          </button>

          <div>
            <input {...getInputProps()} ref={fileInputRef} />
            <p className={styles.uploadImgInfo}>
              Only JPG, JPEG, PNG, or WEBP files are allowed
              <br />
              Files can't be larger than 5 MB
              <br />
              Only {maxFiles} image{maxFiles > 1 ? 's' : ''} can be uploaded
            </p>
          </div>
        </>
      )}

      {previewUrls.length > 0 && (
        <div className={styles.imagePreview}>
          {previewUrls.map((url, index) => (
            <div key={index} className={styles.imagePreviewItem}>
              <div className={styles.imageWrapper}>
                <img
                  src={url}
                  alt={`preview-${index}`}
                  className={styles.image}
                />

                <span>{fileNames[index]}</span>
              </div>

              <button
                onClick={() => handleRemoveFile(index)}
                className={styles.removeImgBtn}
              >
                <img src={deleteIcon} alt="delete" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

import api from "../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Avatar interfaces
export interface AvatarUploadResponse {
    success: boolean;
    message: string;
    data: {
        userId: string;
        avatarUrl: string;
    };
}

export interface AvatarErrorResponse {
    success: false;
    message: string;
    error?: string;
}

export interface AvatarUploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

/**
 * Upload avatar for a specific user
 * @param userId - User ID to upload avatar for
 * @param file - Image file to upload
 * @param onProgress - Optional progress callback
 * @returns Promise<AvatarUploadResponse>
 */
export const uploadAvatar = async (
    userId: string,
    file: File,
    onProgress?: (progress: AvatarUploadProgress) => void
): Promise<AvatarUploadResponse> => {
    // Validate inputs
    if (!userId) {
        throw new Error('User ID is required');
    }

    if (!file) {
        throw new Error('Avatar file is required');
    }

    // Validate file type
    if (!isValidImageFile(file)) {
        throw new Error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('Avatar file size must be less than 5MB');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('avatar', file);

    const response: AxiosResponse<AvatarUploadResponse> = await api.patch(
        `${baseUrl}users/avatar/${userId}`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress: AvatarUploadProgress = {
                        loaded: progressEvent.loaded,
                        total: progressEvent.total,
                        percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    };
                    onProgress(progress);
                }
            }
        }
    );

    return response.data;
};

/**
 * Upload avatar for the current logged-in user
 * @param file - Image file to upload
 * @param currentUserId - Current user's ID
 * @param onProgress - Optional progress callback
 * @returns Promise<AvatarUploadResponse>
 */
export const uploadCurrentUserAvatar = async (
    file: File,
    currentUserId: string,
    onProgress?: (progress: AvatarUploadProgress) => void
): Promise<AvatarUploadResponse> => {
    return uploadAvatar(currentUserId, file, onProgress);
};

/**
 * Validate if file is a valid image
 * @param file - File to validate
 * @returns boolean indicating if file is valid image
 */
export const isValidImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type.toLowerCase());
};

/**
 * Get file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate file before upload
 * @param file - File to validate
 * @returns Object with validation result and error message
 */
export const validateAvatarFile = (file: File): {
    isValid: boolean;
    error?: string;
} => {
    if (!file) {
        return {
            isValid: false,
            error: 'Please select a file'
        };
    }

    if (!isValidImageFile(file)) {
        return {
            isValid: false,
            error: 'Please select a valid image file (JPEG, PNG, GIF, WebP)'
        };
    }

    if (file.size > 5 * 1024 * 1024) {
        return {
            isValid: false,
            error: `File size (${formatFileSize(file.size)}) exceeds 5MB limit`
        };
    }

    return {
        isValid: true
    };
};

/**
 * Create preview URL for selected image file
 * @param file - Image file
 * @returns Promise<string> - Data URL for preview
 */
export const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!isValidImageFile(file)) {
            reject(new Error('Invalid image file'));
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            if (event.target?.result) {
                resolve(event.target.result as string);
            } else {
                reject(new Error('Failed to read file'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };

        reader.readAsDataURL(file);
    });
};

/**
 * Compress image file before upload
 * @param file - Original image file
 * @param maxWidth - Maximum width (default: 400px)
 * @param quality - Image quality 0-1 (default: 0.8)
 * @returns Promise<File> - Compressed image file
 */
export const compressImage = (
    file: File,
    maxWidth: number = 400,
    quality: number = 0.8
): Promise<File> => {
    return new Promise((resolve, reject) => {
        if (!isValidImageFile(file)) {
            reject(new Error('Invalid image file'));
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calculate new dimensions
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            const width = img.width * ratio;
            const height = img.height * ratio;

            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('Failed to compress image'));
                    }
                },
                file.type,
                quality
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        img.src = URL.createObjectURL(file);
    });
};

/**
 * Upload avatar with automatic compression
 * @param userId - User ID
 * @param file - Original image file
 * @param options - Upload options
 * @returns Promise<AvatarUploadResponse>
 */
export const uploadAvatarWithCompression = async (
    userId: string,
    file: File,
    options: {
        compress?: boolean;
        maxWidth?: number;
        quality?: number;
        onProgress?: (progress: AvatarUploadProgress) => void;
    } = {}
): Promise<AvatarUploadResponse> => {
    const {
        compress = true,
        maxWidth = 400,
        quality = 0.8,
        onProgress
    } = options;

    try {
        let fileToUpload = file;

        // Compress image if enabled and file is large
        if (compress && file.size > 500 * 1024) { // Compress files larger than 500KB
            console.log('🗜️ Compressing image...');
            fileToUpload = await compressImage(file, maxWidth, quality);
            console.log(`📉 Original: ${formatFileSize(file.size)} → Compressed: ${formatFileSize(fileToUpload.size)}`);
        }

        return await uploadAvatar(userId, fileToUpload, onProgress);
    } catch (error) {
        console.error('Error uploading avatar with compression:', error);
        throw error;
    }
};

/**
 * Get supported image file extensions
 * @returns Array of supported file extensions
 */
export const getSupportedImageExtensions = (): string[] => {
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
};

/**
 * Get supported MIME types for images
 * @returns Array of supported MIME types
 */
export const getSupportedImageMimeTypes = (): string[] => {
    return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
};

/**
 * Create file input accept attribute value
 * @returns String for HTML input accept attribute
 */
export const getImageInputAccept = (): string => {
    return getSupportedImageMimeTypes().join(',');
};

/**
 * Handle avatar upload with complete error handling
 * @param userId - User ID
 * @param file - Image file
 * @param options - Upload options with callbacks
 * @returns Promise<AvatarUploadResponse>
 */
export const handleAvatarUpload = async (
    userId: string,
    file: File,
    options: {
        onProgress?: (progress: AvatarUploadProgress) => void;
        onSuccess?: (response: AvatarUploadResponse) => void;
        onError?: (error: string) => void;
        compress?: boolean;
    } = {}
): Promise<AvatarUploadResponse | null> => {
    const { onProgress, onSuccess, onError, compress = true } = options;

    try {
        // Validate file
        const validation = validateAvatarFile(file);
        if (!validation.isValid) {
            if (onError) onError(validation.error || 'Invalid file');
            throw new Error(validation.error);
        }

        // Upload with or without compression
        const response = compress
            ? await uploadAvatarWithCompression(userId, file, { onProgress })
            : await uploadAvatar(userId, file, onProgress);

        if (onSuccess) onSuccess(response);
        return response;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar';
        if (onError) onError(errorMessage);
        console.error('Avatar upload error:', error);
        return null;
    }
};

// Export all types for use in components
export type {
    // AvatarUploadResponse,
    // AvatarErrorResponse,
    // AvatarUploadProgress
};

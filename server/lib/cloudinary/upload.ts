import { cloudinary } from './client';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  bytes: number;
  format: string;
}

/**
 * Upload a PDF file buffer to Cloudinary using authenticated server-side credentials.
 */
export async function uploadPdfToCloudinary(
  buffer: Buffer,
  userId: string,
  materialId: string,
  materialType: 'teacher_material' | 'personal_material'
): Promise<CloudinaryUploadResult> {
  const folder =
    materialType === 'teacher_material'
      ? `teacher-materials/${userId}`
      : `personal-materials/${userId}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: materialId,
        resource_type: 'raw', // Use raw for PDF files to preserve byte integrity
        format: 'pdf',
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new Error(error?.message || 'Cloudinary PDF upload failed.')
          );
        }
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          bytes: result.bytes,
          format: result.format || 'pdf',
        });
      }
    );

    uploadStream.end(buffer);
  });
}

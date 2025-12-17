import { apiService } from "./api";

export interface UploadResponse {
  url: string;
  key: string;
  size: number;
  bucket: string;
}

export interface DocumentDownloadResponse {
  url: string;
  key: string;
}

// Upload service for handling file uploads
export const uploadService = {
  // Upload payment reference document
  async uploadPaymentDocument(
    file: File,
    paymentId?: string,
    folder: string = "reference-documents"
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    // Don't append paymentId - upload without it

    const response = await apiService.post<UploadResponse>(
      "/uploads/payments",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  // Download payment document
  async downloadPaymentDocument(
    paymentId: string
  ): Promise<DocumentDownloadResponse> {
    const response = await apiService.get<DocumentDownloadResponse>(
      `/payments/${paymentId}/document`
    );
    return response.data;
  },
};

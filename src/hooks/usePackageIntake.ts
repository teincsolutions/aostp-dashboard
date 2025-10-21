// src/hooks/usePackageIntake.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPackage,
  uploadPackagePhoto,
  uploadPackageFiles,
  getRecentIntakes,
  getPackage,
  updatePackageIntake,
  deletePackage,
  generateReceipt,
} from "@/services/packageService";
import { CreatePackagePayload, UpdatePackagePayload } from "@/types/package";

export function useGetPackage(id: string) {
  return useQuery({
    queryKey: ["package", id],
    queryFn: () => getPackage(id),
    enabled: !!id,
  });
}

export function usePackageIntake() {
  const queryClient = useQueryClient();

  // Recent intakes query
  const {
    data: recentIntakesData,
    isLoading: recentIntakesLoading,
    error: recentIntakesError,
    refetch: refetchRecentIntakes,
  } = useQuery({
    queryKey: ["recentIntakes"],
    queryFn: () =>
      getRecentIntakes({
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    placeholderData: { data: [], total: 0 },
  });

  // Create package mutation
  const {
    mutateAsync: createPackageMutation,
    status: createPackageStatus,
    error: createPackageError,
  } = useMutation({
    mutationFn: (payload: CreatePackagePayload) => createPackage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentIntakes"] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package"] });
    },
  });

  // Upload photo mutation
  const {
    mutateAsync: uploadPhotoMutation,
    status: uploadPhotoStatus,
    error: uploadPhotoError,
  } = useMutation({
    mutationFn: ({ packageId, file }: { packageId: string; file: File }) =>
      uploadPackagePhoto(packageId, file),
  });

  // Upload files mutation
  const {
    mutateAsync: uploadFileMutation,
    status: uploadFileStatus,
    error: uploadFileError,
  } = useMutation({
    mutationFn: ({
      folder,
      files,
      bucketType,
    }: {
      folder?: "pictures" | "videos";
      files: File[];
      bucketType?: "packages" | "users" | "logs";
    }) => uploadPackageFiles(files, folder, bucketType),
  });

  // Update package mutation
  const {
    mutateAsync: updatePackageMutation,
    status: updatePackageStatus,
    error: updatePackageError,
  } = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePackagePayload;
    }) => updatePackageIntake(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentIntakes"] });
      queryClient.invalidateQueries({ queryKey: ["package"] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });

  // Delete package mutation
  const {
    mutateAsync: deletePackageMutation,
    status: deletePackageStatus,
    error: deletePackageError,
  } = useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentIntakes"] });
    },
  });

  // Generate receipt mutation
  const {
    mutateAsync: generateReceiptMutation,
    status: generateReceiptStatus,
    error: generateReceiptError,
  } = useMutation({
    mutationFn: (packageId: string) => generateReceipt(packageId),
  });

  return {
    recentIntakes: recentIntakesData?.data ?? [],
    recentIntakesTotal: recentIntakesData?.total ?? 0,
    recentIntakesLoading,
    recentIntakesError,
    refetchRecentIntakes,

    createPackage: createPackageMutation,
    createPackagePending: createPackageStatus === "pending",
    createPackageError,

    updatePackage: updatePackageMutation,
    updatePackagePending: updatePackageStatus === "pending",
    updatePackageError,

    deletePackage: deletePackageMutation,
    deletePackagePending: deletePackageStatus === "pending",
    deletePackageError,

    uploadPackagePhoto: uploadPhotoMutation,
    uploadPhotoPending: uploadPhotoStatus === "pending",
    uploadPhotoError,

    uploadPackageFile: uploadFileMutation,
    uploadFilePending: uploadFileStatus === "pending",
    uploadFileError,

    generateReceipt: generateReceiptMutation,
    generateReceiptPending: generateReceiptStatus === "pending",
    generateReceiptError,
  };
}

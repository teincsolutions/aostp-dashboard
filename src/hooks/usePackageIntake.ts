// src/hooks/usePackageIntake.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPackage,
  uploadPackagePhoto,
  getRecentIntakes,
  generateReceipt,
} from "@/services/packageService";
import {
  PackageIntakePayload,
  PackageIntake,
  PackagePhoto,
  Receipt,
} from "@/types/package";

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
    queryFn: () => getRecentIntakes({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" }),
    placeholderData: { data: [], total: 0 },
  });

  // Create package mutation
  const {
    mutateAsync: createPackageMutation,
    status: createPackageStatus,
    error: createPackageError,
  } = useMutation({
    mutationFn: (payload: PackageIntakePayload) => createPackage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentIntakes"] });
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

    uploadPackagePhoto: uploadPhotoMutation,
    uploadPhotoPending: uploadPhotoStatus === "pending",
    uploadPhotoError,

    generateReceipt: generateReceiptMutation,
    generateReceiptPending: generateReceiptStatus === "pending",
    generateReceiptError,
  };
}

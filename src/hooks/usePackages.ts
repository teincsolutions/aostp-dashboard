// src/hooks/usePackages.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPackage,
  uploadPackagePhoto,
  updatePackage,
  getPackageReceipt,
} from "../services/packageService";
import { CreatePackagePayload, Package } from "../types/package";
import { packingListKeys } from "./usePackingLists";

export const usePackages = () => {
  const queryClient = useQueryClient();

  // Mutation: Create package
  const createMutation = useMutation({
    mutationFn: (payload: CreatePackagePayload) => createPackage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });

  // Mutation: Upload package photo
  const uploadPhotoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      uploadPackagePhoto(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package"] });
    },
  });

  // Mutation: Update package
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Package>;
      packingListId?: string;
    }) => updatePackage(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package"] });
      if (variables.packingListId) {
        queryClient.invalidateQueries({
          queryKey: packingListKeys.detail(variables.packingListId),
        });
      }
    },
  });

  return {
    createMutation,
    uploadPhotoMutation,
    updateMutation,
  };
};

export const usePackageReceipt = (packageId?: string) => {
  return useQuery({
    queryKey: ["package-receipt", packageId],
    queryFn: () => getPackageReceipt(packageId!),
    enabled: !!packageId,
  });
};

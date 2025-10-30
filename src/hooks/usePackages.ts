// src/hooks/usePackages.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPackage,
  uploadPackagePhoto,
  updatePackage,
  getPackageReceipt,
} from "../services/packageService";
import { CreatePackagePayload, Package } from "../types/package";

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

      // Update packing list cache if packingListId is provided in variables
      if (variables.packingListId) {
        queryClient.setQueryData(
          ["packingLists", variables.packingListId],
          (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              packages: oldData.packages?.map((pkg: Package) =>
                pkg.id === data.id ? data : pkg
              ),
            };
          }
        );
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

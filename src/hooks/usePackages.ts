// src/hooks/usePackages.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPackage, uploadPackagePhoto, getPackageReceipt } from '../services/packageService';
import { CreatePackagePayload } from '../types/package';

export const usePackages = () => {
  const queryClient = useQueryClient();

  // Mutation: Create package
  const createMutation = useMutation({
    mutationFn: (payload: CreatePackagePayload) => createPackage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });

  // Mutation: Upload package photo
  const uploadPhotoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadPackagePhoto(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package'] });
    },
  });

  return {
    createMutation,
    uploadPhotoMutation,
  };
};

export const usePackageReceipt = (packageId?: string) => {
  return useQuery({
    queryKey: ['package-receipt', packageId],
    queryFn: () => getPackageReceipt(packageId!),
    enabled: !!packageId,
  });
};

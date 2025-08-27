// src/hooks/usePackages.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPackage, uploadPackagePhoto } from '../services/packageService';
import { PackageIntakePayload } from '../types/package';

export const usePackages = () => {
  const queryClient = useQueryClient();

  // Mutation: Create package
  const createMutation = useMutation({
    mutationFn: (payload: PackageIntakePayload) => createPackage(payload),
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

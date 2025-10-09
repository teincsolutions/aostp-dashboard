import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPackages,
  getPackageDetails,
  updatePackage,
  deletePackageV2,
  consolidatePackages,
  generateTrackingCode,
  getPackageItems,
  getPackageItem,
  updatePackageItem,
} from '../services/packageService';
import { Package, PackageItem } from '../types/package';

export const usePackageManagement = () => {
  const queryClient = useQueryClient();

  // Package mutations
  const updatePackageMutation = useMutation({
    mutationFn: ({ packageId, payload }: { packageId: string; payload: Partial<Package> }) =>
      updatePackage(packageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package'] });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: (packageId: string) => deletePackageV2(packageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });

  const consolidatePackagesMutation = useMutation({
    mutationFn: consolidatePackages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package-items'] });
    },
  });

  const generateTrackingCodeMutation = useMutation({
    mutationFn: generateTrackingCode,
  });

  // Package Items mutations
  const updatePackageItemMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: Partial<PackageItem> }) =>
      updatePackageItem(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['package-items'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] }); // Invalidate packages too as totals may change
    },
  });

  return {
    // Package mutations
    updatePackageMutation,
    deletePackageMutation,
    consolidatePackagesMutation,
    generateTrackingCodeMutation,

    // Package Items mutations
    updatePackageItemMutation,
  };
};

// Separate hooks for queries (these must be used inside components)

export const usePackages = (params?: Parameters<typeof getPackages>[0]) => {
  return useQuery({
    queryKey: ['packages', params],
    queryFn: () => getPackages(params),
  });
};

export const usePackageDetails = (packageId: string) => {
  return useQuery({
    queryKey: ['package', packageId],
    queryFn: () => getPackageDetails(packageId),
    enabled: !!packageId,
  });
};

export const usePackageItems = (params?: Parameters<typeof getPackageItems>[0]) => {
  return useQuery({
    queryKey: ['package-items', params],
    queryFn: () => getPackageItems(params),
  });
};

export const usePackageItem = (itemId: string) => {
  return useQuery({
    queryKey: ['package-item', itemId],
    queryFn: () => getPackageItem(itemId),
    enabled: !!itemId,
  });
};

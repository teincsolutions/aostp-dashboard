import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { packingListService } from "@/services/packingListService";
import {
  PackingListCreatePayload,
  PackingListUpdatePayload,
  PackingListQueryParams,
  ExportFormat,
} from "@/types/packingList";

// Query keys for React Query
export const packingListKeys = {
  all: ["packing-lists"] as const,
  lists: () => [...packingListKeys.all, "list"] as const,
  list: (params: PackingListQueryParams) => [...packingListKeys.lists(), params] as const,
  details: () => [...packingListKeys.all, "detail"] as const,
  detail: (id: string) => [...packingListKeys.details(), id] as const,
  summary: (id: string) => [...packingListKeys.all, "summary", id] as const,
  unassignedPackages: (params: { search?: string; page?: number; limit?: number }) => [...packingListKeys.all, "unassigned-packages", params] as const,
  activeContainers: () => [...packingListKeys.all, "active-containers"] as const,
};

// Hook for fetching packing lists with pagination and filters
export const usePackingLists = (params: PackingListQueryParams = {}) => {
  return useQuery({
    queryKey: packingListKeys.list(params),
    queryFn: () => packingListService.getPackingLists(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching a single packing list by ID
export const usePackingList = (id: string) => {
  return useQuery({
    queryKey: packingListKeys.detail(id),
    queryFn: async () => await packingListService.getPackingListById(id).then(res => res.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for fetching packing list summary
export const usePackingListSummary = (id: string) => {
  return useQuery({
    queryKey: packingListKeys.summary(id),
    queryFn: () => packingListService.getPackingListSummary(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for fetching unassigned packages
export const useUnassignedPackages = (params: { search?: string; page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: packingListKeys.unassignedPackages(params),
    queryFn: () => packingListService.getUnassignedPackages(params),
    staleTime: 2 * 60 * 1000,
  });
};

// Hook for fetching active containers
export const useActiveContainers = () => {
  return useQuery({
    queryKey: packingListKeys.activeContainers(),
    queryFn: () => packingListService.getActiveContainers(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for packing list mutations
export const usePackingListMutations = () => {
  const queryClient = useQueryClient();

  // Create packing list mutation
  const createPackingList = useMutation({
    mutationFn: (payload: PackingListCreatePayload) =>
      packingListService.createPackingList(payload),
    onSuccess: () => {
      // Invalidate and refetch packing lists
      queryClient.invalidateQueries({ queryKey: packingListKeys.lists() });
      queryClient.invalidateQueries({ queryKey: packingListKeys.activeContainers() });
    },
  });

  // Update packing list mutation
  const updatePackingList = useMutation({
    mutationFn: ({ id, packingListData }: { id: string; packingListData: PackingListUpdatePayload }) =>
      packingListService.updatePackingList(id, packingListData),
    onSuccess: (data, variables) => {
      // Update the specific packing list in cache
      queryClient.setQueryData(packingListKeys.detail(variables.id), data);
      // Invalidate lists to refresh with updated data
      queryClient.invalidateQueries({ queryKey: packingListKeys.lists() });
      queryClient.invalidateQueries({ queryKey: packingListKeys.summary(variables.id) });
    },
  });

  // Delete packing list mutation
  const deletePackingList = useMutation({
    mutationFn: (id: string) => packingListService.deletePackingList(id),
    onSuccess: () => {
      // Invalidate all packing list queries
      queryClient.invalidateQueries({ queryKey: packingListKeys.all });
    },
  });

  // Add packages to packing list mutation
  const addPackagesToPackingList = useMutation({
    mutationFn: ({ id, packageIds }: { id: string; packageIds: string[] }) =>
      packingListService.addPackagesToPackingList(id, packageIds),
    onSuccess: (data, variables) => {
      // Update the specific packing list
      queryClient.setQueryData(packingListKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: packingListKeys.lists() });
      queryClient.invalidateQueries({ queryKey: packingListKeys.summary(variables.id) });
      queryClient.invalidateQueries({ queryKey: packingListKeys.unassignedPackages({}) });
    },
  });

  // Remove packages from packing list mutation
  const removePackagesFromPackingList = useMutation({
    mutationFn: ({ id, packageIds }: { id: string; packageIds: string[] }) =>
      packingListService.removePackagesFromPackingList(id, packageIds),
    onSuccess: (data, variables) => {
      // Update the specific packing list
      queryClient.setQueryData(packingListKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: packingListKeys.lists() });
      queryClient.invalidateQueries({ queryKey: packingListKeys.summary(variables.id) });
      queryClient.invalidateQueries({ queryKey: packingListKeys.unassignedPackages({}) });
    },
  });

  // Export packing list mutation
  const exportPackingList = useMutation({
    mutationFn: ({ id, format }: { id: string; format: ExportFormat }) =>
      packingListService.exportPackingList(id, format),
    onSuccess: (data, variables) => {
      // Handle file download
      if (data.data?.url) {
        const link = document.createElement('a');
        link.href = data.data.url;
        link.download = data.data.filename || `packing-list-${variables.id}.${variables.format.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
  });

  return {
    createPackingList,
    updatePackingList,
    deletePackingList,
    addPackagesToPackingList,
    removePackagesToPackingList: removePackagesFromPackingList,
    exportPackingList,
    // Loading states
    isCreating: createPackingList.isPending,
    isUpdating: updatePackingList.isPending,
    isDeleting: deletePackingList.isPending,
    isAddingPackages: addPackagesToPackingList.isPending,
    isRemovingPackages: removePackagesFromPackingList.isPending,
    isExporting: exportPackingList.isPending,
  };
};

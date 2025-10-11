import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { containerService } from "@/services/containerService";
import { GetContainersParams, ContainerCreatePayload, ContainerUpdatePayload, ExportFormat } from "@/types/container";
import { ContainerStatus } from "@/types/container";

// Query keys for React Query
export const containerKeys = {
  all: ["containers"] as const,
  lists: () => [...containerKeys.all, "list"] as const,
  list: (params: GetContainersParams) => [...containerKeys.lists(), params] as const,
  active: () => [...containerKeys.all, "active"] as const,
  dateRange: (startDate: string, endDate: string) => [...containerKeys.all, "dateRange", startDate, endDate] as const,
  details: () => [...containerKeys.all, "detail"] as const,
  detail: (id: string) => [...containerKeys.details(), id] as const,
  number: (containerNumber: string) => [...containerKeys.all, "number", containerNumber] as const,
  statistics: (id: string) => [...containerKeys.all, "statistics", id] as const,
  manifest: (id: string) => [...containerKeys.all, "manifest", id] as const,
} as const;

// Hook for fetching containers with pagination and filters
export const useContainers = (params: GetContainersParams = {}) => {
  return useQuery({
    queryKey: containerKeys.list(params),
    queryFn: async () => {
      return await containerService.getContainers(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching active containers
export const useActiveContainers = () => {
  return useQuery({
    queryKey: containerKeys.active(),
    queryFn: async () => {
      return await containerService.getActiveContainers();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching containers by date range
export const useContainersByDateRange = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: containerKeys.dateRange(startDate, endDate),
    queryFn: async () => {
      const response = await containerService.getContainersByDateRange(startDate, endDate);
      return response.data;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching a single container
export const useContainer = (id: string) => {
  return useQuery({
    queryKey: containerKeys.detail(id),
    queryFn: async () => {
      const response = await containerService.getContainerById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching container by container number
export const useContainerByNumber = (containerNumber: string) => {
  return useQuery({
    queryKey: containerKeys.number(containerNumber),
    queryFn: async () => {
      const response = await containerService.getContainerByNumber(containerNumber);
      return response.data;
    },
    enabled: !!containerNumber,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching container statistics
export const useContainerStatistics = (id: string) => {
  return useQuery({
    queryKey: containerKeys.statistics(id),
    queryFn: async () => {
      const response = await containerService.getContainerStatistics(id);
      // API returns { container, statistics, correlationId }, we only need statistics
      return response.statistics;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching container manifest
export const useContainerManifest = (id: string) => {
  return useQuery({
    queryKey: containerKeys.manifest(id),
    queryFn: async () => {
      const response = await containerService.getContainerManifest(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for container mutations (create, update, delete, etc.)
export const useContainerMutations = () => {
  const queryClient = useQueryClient();

  // Create container mutation
  const createContainerMutation = useMutation({
    mutationFn: async (containerData: ContainerCreatePayload) => {
      const response = await containerService.createContainer(containerData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch containers list
      queryClient.invalidateQueries({ queryKey: containerKeys.lists() });
      // Invalidate active containers
      queryClient.invalidateQueries({ queryKey: containerKeys.active() });
    },
  });

  // Update container mutation
  const updateContainerMutation = useMutation({
    mutationFn: async ({ id, containerData }: { id: string; containerData: ContainerUpdatePayload }) => {
      const response = await containerService.updateContainer(id, containerData);
      return response.data;
    },
    onSuccess: (data) => {
      // Update the container in cache
      queryClient.setQueryData(containerKeys.detail(data.id), data);
      // Invalidate and refetch containers list
      queryClient.invalidateQueries({ queryKey: containerKeys.lists() });
      // Invalidate active containers
      queryClient.invalidateQueries({ queryKey: containerKeys.active() });
      // Invalidate container number cache
      queryClient.invalidateQueries({ queryKey: containerKeys.number(data.containerNumber) });
    },
  });

  // Delete container mutation with status validation
  const deleteContainerMutation = useMutation({
    mutationFn: async (id: string) => {
      // First check the container status
      const container = queryClient.getQueryData(containerKeys.detail(id)) as { status: ContainerStatus } | undefined;
      if (container && (container.status === ContainerStatus.SHIPPED ||
                       container.status === ContainerStatus.ARRIVED ||
                       container.status === ContainerStatus.CLOSED)) {
        throw new Error(`Cannot delete container with status ${container.status}. Only PLANNED or LOADED containers can be deleted.`);
      }

      await containerService.deleteContainer(id);
      return id;
    },
    onSuccess: (id) => {
      // Remove the container from cache
      queryClient.removeQueries({ queryKey: containerKeys.detail(id) });
      // Invalidate and refetch containers list
      queryClient.invalidateQueries({ queryKey: containerKeys.lists() });
      // Invalidate active containers
      queryClient.invalidateQueries({ queryKey: containerKeys.active() });
    },
  });

  // Update container status mutation
  const updateContainerStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await containerService.updateContainerStatus(id, status);
      return response.data;
    },
    onSuccess: (data) => {
      // Update the container in cache
      queryClient.setQueryData(containerKeys.detail(data.id), data);
      // Invalidate and refetch containers list
      queryClient.invalidateQueries({ queryKey: containerKeys.lists() });
      // Invalidate active containers
      queryClient.invalidateQueries({ queryKey: containerKeys.active() });
      // Invalidate container number cache
      queryClient.invalidateQueries({ queryKey: containerKeys.number(data.containerNumber) });
    },
  });

  // Export container manifest mutation
  const exportContainerManifestMutation = useMutation({
    mutationFn: async ({ id, format }: { id: string; format: ExportFormat }) => {
      const response = await containerService.exportContainerManifest(id, format);
      return response.data;
    },
  });

  return {
    createContainer: createContainerMutation.mutateAsync,
    updateContainer: updateContainerMutation.mutateAsync,
    deleteContainer: deleteContainerMutation.mutateAsync,
    updateContainerStatus: updateContainerStatusMutation.mutateAsync,
    exportContainerManifest: exportContainerManifestMutation.mutateAsync,

    // Loading states
    isCreating: createContainerMutation.isPending,
    isUpdating: updateContainerMutation.isPending,
    isDeleting: deleteContainerMutation.isPending,
    isUpdatingStatus: updateContainerStatusMutation.isPending,
    isExporting: exportContainerManifestMutation.isPending,

    // Error states
    createError: createContainerMutation.error,
    updateError: updateContainerMutation.error,
    deleteError: deleteContainerMutation.error,
    updateStatusError: updateContainerStatusMutation.error,
    exportError: exportContainerManifestMutation.error,
  };
};

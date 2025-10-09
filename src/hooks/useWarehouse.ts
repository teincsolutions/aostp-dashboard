import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWarehousePackages,
  getWarehouseAgingSummary,
  updatePackageWarehouseLocation,
  updatePackageStatus,
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  updateWarehouseStatus,
  deleteWarehouse,
  updateWarehouseDays,
  GetWarehousePackagesParams,
} from "@/services/warehouseService";
import { WarehousePackage, WarehouseAgingSummary, WarehouseCreatePayload, WarehouseUpdatePayload, Warehouse } from "@/types/warehouse";

export const useWarehousePackages = (params: GetWarehousePackagesParams) => {
  return useQuery({
    queryKey: ["warehousePackages", params],
    queryFn: () => getWarehousePackages(params),
  });
};

export const useWarehouseAgingSummary = (params?: { location?: string }) => {
  return useQuery({
    queryKey: ["warehouseAgingSummary", params],
    queryFn: () => getWarehouseAgingSummary(params),
  });
};

export const useUpdatePackageWarehouseLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, warehouseLocation }: { id: string; warehouseLocation: string }) =>
      updatePackageWarehouseLocation(id, warehouseLocation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehousePackages"] });
    },
  });
};

export const useUpdatePackageStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updatePackageStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehousePackages"] });
    },
  });
};

// Warehouse CRUD hooks
export const useWarehouses = (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
  return useQuery({
    queryKey: ["warehouses", params],
    queryFn: () => getWarehouses(params),
  });
};

export const useWarehouseMutations = () => {
  const queryClient = useQueryClient();

  const createWarehouseMutation = useMutation({
    mutationFn: (payload: WarehouseCreatePayload) => createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WarehouseUpdatePayload }) =>
      updateWarehouse(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["warehouses", variables.id], data);
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });

  const updateWarehouseStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateWarehouseStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: (id: string) => deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });

  const updateWarehouseDaysMutation = useMutation({
    mutationFn: () => updateWarehouseDays(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehousePackages"] });
      queryClient.invalidateQueries({ queryKey: ["warehouseAgingSummary"] });
    },
  });

  return {
    createWarehouse: createWarehouseMutation.mutateAsync,
    updateWarehouse: updateWarehouseMutation.mutateAsync,
    updateWarehouseStatus: updateWarehouseStatusMutation.mutateAsync,
    deleteWarehouse: deleteWarehouseMutation.mutateAsync,
    updateWarehouseDays: updateWarehouseDaysMutation.mutateAsync,
    isCreating: createWarehouseMutation.isPending,
    isUpdating: updateWarehouseMutation.isPending,
    isUpdatingStatus: updateWarehouseStatusMutation.isPending,
    isDeleting: deleteWarehouseMutation.isPending,
    isUpdatingDays: updateWarehouseDaysMutation.isPending,
  };
};

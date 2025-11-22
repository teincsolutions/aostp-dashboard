import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWarehousePackages,
  updatePackageStatus,
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  updateWarehouseStatus,
  deleteWarehouse,
  updateWarehouseDays,
  GetWarehousePackagesParams,
  getWarehouseById,
} from "@/services/warehouseService";
import {
  WarehouseCreatePayload,
  WarehouseUpdatePayload,
} from "@/types/warehouse";

export const useWarehousePackages = (params: GetWarehousePackagesParams) => {
  return useQuery({
    queryKey: ["warehousePackages", params],
    queryFn: () => getWarehousePackages(params),
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
export const useWarehouses = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["warehouses", params],
    queryFn: () => getWarehouses(params),
  });
};

// get one warehouse by id
export const useWarehouse = (id: string) => {
  return useQuery({
    queryKey: ["warehouses", id],
    queryFn: async () => {
      return await getWarehouseById(id);
    },
    enabled: !!id,
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWarehousePackages,
  getWarehouseAgingSummary,
  updatePackageWarehouseLocation,
  updatePackageStatus,
  GetWarehousePackagesParams,
} from "@/services/warehouseService";
import { WarehousePackage, WarehouseAgingSummary } from "@/types/warehouse";

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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { consolidatePackages } from "../services/consolidationService";

export const useConsolidation = () => {
  const queryClient = useQueryClient();

  const consolidatePackagesMutation = useMutation({
    mutationFn: consolidatePackages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package-items"] });
    },
  });

  return {
    consolidatePackagesMutation,
  };
};

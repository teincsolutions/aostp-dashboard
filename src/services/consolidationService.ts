import { apiService } from "@/services/api";
import { Package } from "@/types/package";

export const consolidatePackages = async (payload: {
  sourceTrackingCodes: string[];
  targetTrackingCode: string;
}): Promise<Package> => {
  const res = await apiService.post("/consolidation/consolidate", payload);
  return res.data;
};

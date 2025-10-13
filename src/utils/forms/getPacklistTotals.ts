import { ShippingMode, ShippingRate } from "@/types/exchangeRate";
import { Package } from "@/types/package";
import { PackingList } from "@/types/packingList";
interface PackageWithCalculations extends Package {
  calculatedAmount?: number;
}

export function getPacklistTotals(
  packingList?: PackingList,
  currentShippingRates?: ShippingRate[]
) {
  // Calculate totals for selected packages
  const totals = packingList?.packages.reduce(
    (acc, pkg) => {
      const pkgWithCalc = getPackageWithCalculations(
        pkg,
        pkg.shippingMode,
        currentShippingRates || []
      );
      acc.packageCount += 1;
      acc.weightTotal += pkg.weight || 0;
      acc.cbmTotal += pkg.cbm || 0;
      acc.usdTotal += pkgWithCalc.calculatedAmount || 0;
      return acc;
    },
    {
      packageCount: 0,
      weightTotal: 0,
      cbmTotal: 0,
      usdTotal: 0,
      ghsTotal: 0,
    }
  );

  return totals;
}

export function getPackageWithCalculations(
  pkg: Package,
  shippingMode: ShippingMode,
  currentShippingRates: ShippingRate[]
): PackageWithCalculations {

  if(currentShippingRates.length === 0) return {...pkg, calculatedAmount: 0};

  let rate = currentShippingRates[0]?.ratePerUnit;

  if (shippingMode === ShippingMode.AIR) {
    rate = currentShippingRates?.find(
      (r) => r.airShippingType === pkg.airShippingType
    )?.ratePerUnit;
  }

  let calculatedAmount: number;
  if (shippingMode === ShippingMode.SEA) {
    calculatedAmount = (pkg.cbm || 0) * (rate || 0);
  } else {
    calculatedAmount = (pkg.weight || 0) * (rate || 0);
  }
  return { ...pkg, calculatedAmount };
}

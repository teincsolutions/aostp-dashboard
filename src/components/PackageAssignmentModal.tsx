import React, { useState } from "react";
import { Modal, Button, Typography } from "antd";
import { Package } from "@/types/package";
import { handleError } from "@/utils/forms/errorUtils";
import { toast } from "sonner";
import { PackingListStatus } from "@/types/packingList";
import {
  usePackingList,
  usePackingListMutations,
} from "@/hooks/usePackingLists";
import { PackageAssignmentPanel } from "./PackageAssignmentPanel";

interface PackageAssignmentModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  packingListId: string;
}

export const PackageAssignmentModal: React.FC<PackageAssignmentModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  packingListId,
}) => {
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const {
    addPackagesToPackingList,
    isAddingPackages,
    finalizePackingList,
    isRemovingPackages,
    isFinalizing,
    removePackagesFromPackingList,
  } = usePackingListMutations();

  const { data: packingList } = usePackingList(packingListId);

  const handleAssignPackages = async () => {
    try {
      await addPackagesToPackingList.mutateAsync({
        id: packingListId,
        packageIds: selectedPackageIds,
      });
      toast.success(`${selectedPackageIds.length} packages added successfully`);
      setSelectedPackageIds([]);
    } catch (error) {
      handleError(error);
    }
  };

  const handleFinalize = async () => {
    try {
      await finalizePackingList.mutateAsync(packingListId);
      toast.success(`Packing list finalized successfully`);
      setSelectedPackageIds([]);
      onConfirm();
    } catch (error) {
      handleError(error);
    }
  };

  const handleAddPackage = (packageId: string) => {
    if (!selectedPackageIds.includes(packageId)) {
      setSelectedPackageIds((prev) => [...prev, packageId]);
    }
  };

  const handleRemovePackage = async (packageId: string) => {
    try {
      await removePackagesFromPackingList.mutateAsync({
        id: packingListId,
        packageIds: packageId,
      });
      setSelectedPackageIds((prev) => prev.filter((id) => id !== packageId));
      toast.success("Package removed successfully");
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Modal
      title={`Manage Packages ${packingList?.name || ""}`}
      open={visible}
      onCancel={onCancel}
      width={1400}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleAssignPackages}
          loading={isAddingPackages}
          disabled={selectedPackageIds.length === 0}
        >
          Add Selected Packages ({selectedPackageIds.length})
        </Button>,
        // finalized
        <Button
          key="finalize"
          type="primary"
          onClick={handleFinalize}
          loading={isFinalizing}
          disabled={
            packingList?.packages.length === 0 ||
            packingList?.status !== PackingListStatus.DRAFT
          }
        >
          Finalize Selection ({packingList?.packages.length || 0} packages)
        </Button>,
      ]}
    >
      <PackageAssignmentPanel
        packingListId={packingList?.id || ""}
        selectedPackageIds={selectedPackageIds}
        isRemovingPackages={isRemovingPackages}
        handleAddPackage={handleAddPackage}
        handleRemovePackage={handleRemovePackage}
      />
    </Modal>
  );
};

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

  const handleAssignPackages = () => {
    try {
      addPackagesToPackingList.mutateAsync({
        id: packingListId,
        packageIds: selectedPackageIds,
      });
      toast.success(`${selectedPackageIds.length} packages added successfully`);
      setSelectedPackageIds([]);
      onConfirm();
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

  const handleRemovePackage = (packageId: string) => {
    try {
      removePackagesFromPackingList.mutateAsync({
        id: packingListId,
        packageIds: packageId,
      });
      setSelectedPackageIds((prev) => prev.filter((id) => id !== packageId));
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
            packingList?.totalPackages === 0 ||
            packingList?.status !== PackingListStatus.DRAFT
          }
        >
          Finalize Selection ({packingList?.totalPackages})
        </Button>,
      ]}
    >
      <PackageAssignmentPanel
        packingList={packingList}
        selectedPackageIds={selectedPackageIds}
        isRemovingPackages={isRemovingPackages}
        handleAddPackage={handleAddPackage}
        handleRemovePackage={handleRemovePackage}
      />
    </Modal>
  );
};

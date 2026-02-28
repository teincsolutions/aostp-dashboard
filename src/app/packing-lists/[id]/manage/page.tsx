"use client";

import React, { useState } from "react";
import {
  Button,
  Typography,
  Space,
  Breadcrumb,
  Card,
  Spin,
  Tag,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Role } from "@/types/user";
import {
  usePackingList,
  usePackingListMutations,
} from "@/hooks/usePackingLists";
import { PackingListStatus } from "@/types/packingList";
import { PackageAssignmentPanel } from "@/components/PackageAssignmentPanel";
import { handleError } from "@/utils/forms/errorUtils";
import Link from "next/link";

const { Title, Text } = Typography;

const packingListStatusColors: Record<string, string> = {
  DRAFT: "blue",
  POSTED: "orange",
  FINALIZED: "green",
};

export default function ManagePackingListPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const packingListId = params.id;

  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);

  const { data: packingList, isLoading } = usePackingList(packingListId);

  const {
    addPackagesToPackingList,
    isAddingPackages,
    finalizePackingList,
    isRemovingPackages,
    isFinalizing,
    removePackagesFromPackingList,
  } = usePackingListMutations();

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
      toast.success("Packing list finalized successfully");
      setSelectedPackageIds([]);
      router.push("/packing-lists");
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
    <AuthGuard
      requiredRoles={[
        Role.SUPER_ADMIN,
        Role.OPERATIONS_CLERK,
        Role.FINANCE_MANAGER,
      ]}
    >
      <AppLayout>
        <div className="p-6">
          {/* Breadcrumb */}
          <Breadcrumb
            className="mb-4"
            items={[
              { title: <Link href="/packing-lists">Packing Lists</Link> },
              {
                title: isLoading
                  ? "Loading..."
                  : (packingList?.name ?? packingListId),
              },
              { title: "Manage Packages" },
            ]}
          />

          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start mb-6">
            <div className="flex items-center gap-3">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/packing-lists")}
              >
                Back
              </Button>
              <div>
                <Title level={3} className="!mb-0">
                  {isLoading ? (
                    <Spin size="small" />
                  ) : (
                    `Manage Packages — ${packingList?.name ?? ""}`
                  )}
                </Title>
                {packingList && (
                  <Space className="mt-1">
                    <Tag color={packingListStatusColors[packingList.status]}>
                      {packingList.status.replace("_", " ")}
                    </Tag>
                    <Text type="secondary">
                      {packingList.packages?.length ?? 0} packages assigned
                    </Text>
                  </Space>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <Space wrap>
              {packingList?.status === PackingListStatus.DRAFT && (
                <>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAssignPackages}
                    loading={isAddingPackages}
                    disabled={selectedPackageIds.length === 0}
                  >
                    Add Selected Packages ({selectedPackageIds.length})
                  </Button>

                  <Popconfirm
                    title="Finalize Packing List"
                    description={`This will finalize the packing list with ${
                      packingList?.packages?.length ?? 0
                    } packages. This action cannot be undone by regular users.`}
                    onConfirm={handleFinalize}
                    okText="Finalize"
                    cancelText="Cancel"
                    okButtonProps={{ danger: false }}
                    disabled={
                      (packingList?.packages?.length ?? 0) === 0 ||
                      packingList?.status !== PackingListStatus.DRAFT
                    }
                  >
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      loading={isFinalizing}
                      disabled={
                        (packingList?.packages?.length ?? 0) === 0 ||
                        packingList?.status !== PackingListStatus.DRAFT
                      }
                    >
                      Finalize ({packingList?.packages?.length ?? 0} packages)
                    </Button>
                  </Popconfirm>
                </>
              )}
            </Space>
          </div>

          {/* Package Assignment Panel */}
          <Card>
            <PackageAssignmentPanel
              packingListId={packingListId}
              selectedPackageIds={selectedPackageIds}
              isRemovingPackages={isRemovingPackages}
              handleAddPackage={handleAddPackage}
              handleRemovePackage={handleRemovePackage}
            />
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

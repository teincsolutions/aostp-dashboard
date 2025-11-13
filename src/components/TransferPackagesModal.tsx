"use client";

import React, { useState } from "react";
import { Modal, Table, Select, Button, Row, Col, Tag, Spin, Empty } from "antd";
import { toast } from "sonner";
import { usePackingList } from "@/hooks/usePackingLists";
import { useWarehouses } from "@/hooks/useWarehouse";
import { usePackageManagement } from "@/hooks/usePackageManagement";
import { PackageStatusPackages, ShippingMode } from "@/types/package";

interface TransferPackagesModalProps {
  visible: boolean;
  onCancel: () => void;
  packingListId: string;
}

export const TransferPackagesModal: React.FC<TransferPackagesModalProps> = ({
  visible,
  onCancel,
  packingListId,
}) => {
  const [selectedPackageIds, setSelectedPackageIds] = useState<React.Key[]>([]);
  const [targetWarehouse, setTargetWarehouse] = useState<string>("");

  const { data: packingList, isLoading: packingListLoading } =
    usePackingList(packingListId);
  const { data: warehousesData } = useWarehouses();
  const { updatePackageMutation } = usePackageManagement();

  const packages = packingList?.packages || [];

  // Filter packages that are in warehouse (can be transferred)
  const transferablePackages = packages.filter(
    (pkg) => pkg.status !== PackageStatusPackages.RELEASED
  );

  const handleTransfer = async () => {
    if (!targetWarehouse) {
      toast.error("Please select a target warehouse");
      return;
    }
    if (selectedPackageIds.length === 0) {
      toast.error("Please select packages to transfer");
      return;
    }

    try {
      // Update each selected package
      const updatePromises = selectedPackageIds.map((packageId) =>
        updatePackageMutation.mutateAsync({
          packageId: packageId as string,
          payload: { warehouseId: targetWarehouse },
        })
      );

      await Promise.all(updatePromises);
      toast.success(
        `Successfully transferred ${selectedPackageIds.length} package(s)`
      );
      setSelectedPackageIds([]);
      setTargetWarehouse("");
      onCancel();
    } catch (error) {
      console.error("Transfer failed:", error);
      toast.error("Failed to transfer packages");
    }
  };

  const handleCancel = () => {
    setSelectedPackageIds([]);
    setTargetWarehouse("");
    onCancel();
  };

  const columns = [
    {
      title: "Tracking Code",
      dataIndex: "trackingCode",
      key: "trackingCode",
      width: 160,
    },
    {
      title: "Customer",
      key: "customer",
      render: (record: any) =>
        `${record.customer?.firstName} ${record.customer?.lastName} (${record.customer?.customerCode})`,
      width: 180,
    },
    {
      title: "Ship. Mode",
      dataIndex: "shippingMode",
      key: "shippingMode",
      ellipsis: true,
      width: 60,
      render: (mode: string) => (
        <Tag color={mode === "AIR" ? "lime" : "blue"}>{mode}</Tag>
      ),
    },
    {
      title: "Weight/CBM",
      key: "weight",
      sorter: true,
      width: 100,
      render: (record: any) =>
        record.shippingMode === ShippingMode.AIR
          ? `${record.weight ? `${record.weight} kg` : "N/A"}`
          : `${record.cbm ? `${record.cbm} cbm` : "N/A"}`,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 50,
    },
    {
      title: "Current Warehouse",
      key: "warehouse",
      width: 180,
      render: (record: any) => record.warehouse?.name || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: PackageStatusPackages) => {
        return (
          <Tag
            color={
              status === PackageStatusPackages.RECEIVED
                ? "gold"
                : status === PackageStatusPackages.ASSIGNED
                ? "blue"
                : status === PackageStatusPackages.SHIPPED
                ? "purple"
                : status === PackageStatusPackages.ARRIVED
                ? "yellowgreen"
                : status === PackageStatusPackages.RELEASED
                ? "green"
                : "default"
            }
          >
            {status.replace("_", " ")}
          </Tag>
        );
      },
    },
  ];

  return (
    <Modal
      title={`Transfer Packages - ${packingList?.name || "Loading..."}`}
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="transfer"
          type="primary"
          onClick={handleTransfer}
          disabled={!targetWarehouse || selectedPackageIds.length === 0}
          loading={updatePackageMutation.isPending}
        >
          Transfer ({selectedPackageIds.length} packages)
        </Button>,
      ]}
      width={1200}
    >
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <div style={{ marginBottom: 8 }}>
              <label
                style={{ display: "block", fontWeight: "500", marginBottom: 4 }}
              >
                Target Warehouse
              </label>
            </div>
            <Select
              placeholder="Select Target Warehouse"
              style={{ width: "100%" }}
              value={targetWarehouse || undefined}
              onChange={setTargetWarehouse}
              allowClear
            >
              {warehousesData?.data?.map((warehouse) => (
                <Select.Option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.location})
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
      </div>

      {packingListLoading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      ) : transferablePackages.length === 0 ? (
        <Empty description="No transferable packages found in this packing list" />
      ) : (
        <Table
          columns={columns}
          dataSource={transferablePackages}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selectedPackageIds,
            onChange: setSelectedPackageIds,
          }}
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ x: true }}
        />
      )}
    </Modal>
  );
};

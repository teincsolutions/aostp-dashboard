"use client";

import React, { useState } from "react";
import { Table, Input, Select, Spin, Empty, Modal, Descriptions, Tooltip, Button, message } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { columns } from "@/app/packages/columns";
import { usePackageIntake } from "@/hooks/usePackageIntake";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { PackageStatus, ShipmentType, Package } from "@/types/package";
import { useRouter } from "next/navigation";

const { Search } = Input;

const statusOptions = Object.values(PackageStatus).map((status) => ({
  label: status,
  value: status,
}));

const shipmentTypeOptions = [
  { label: "Air", value: ShipmentType.AIR },
  { label: "Sea", value: ShipmentType.SEA },
];

export default function PackagesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [shipmentType, setShipmentType] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  const params = {
    page,
    limit: pageSize,
    search,
    status,
    shipmentType,
  };

  const {
    recentIntakes,
    recentIntakesTotal,
    recentIntakesLoading,
    deletePackage: deletePackageMutation,
  } = usePackageIntake();

  // Map PackageIntake[] to Package[]
  const mappedPackages = recentIntakes.map((pkg) => ({
    id: pkg.id,
    trackingNumber: pkg.trackingCode,
    customer: pkg.customer,
    description: pkg.description,
    weight: pkg.weight,
    cbm: pkg.cbm,
    shipmentType: pkg.shippingMode === "AIR" ? ShipmentType.AIR : ShipmentType.SEA,
    status: pkg.status as PackageStatus,
    createdAt: pkg.createdAt,
  }));

  // Action handlers
  const handleView = (record: Package) => {
    setSelectedPackage(record);
    setViewModalVisible(true);
  };

  const handleEdit = (record: Package) => {
    router.push(`/packages/edit/${record.id}`);
  };

  const handleUploadPhoto = (record: Package) => {
    // Placeholder for upload photo functionality
    console.log("Upload photo for package:", record.id);
  };

  const handleUpdateStatus = (record: Package) => {
    // Placeholder for status update functionality
    console.log("Update status for package:", record.id);
  };

  const handleDelete = (record: Package) => {
    Modal.confirm({
      title: "Confirm Delete",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete package "${record.trackingNumber}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deletePackageMutation(record.id);
          message.success("Package deleted successfully");
        } catch (error) {
          console.error("Delete failed:", error);
          message.error("Failed to delete package");
        }
      },
    });
  };

  const handleExportExcel = (record: Package) => {
    // Placeholder for Excel export
    console.log("Export to Excel:", record.id);
  };

  const handleExportPdf = (record: Package) => {
    // Placeholder for PDF export
    console.log("Export to PDF:", record.id);
  };

  // Create columns with action handlers
  const columnsWithActions = [
    ...columns.slice(0, -1), // All columns except actions
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 220,
      render: (record: Package) => (
        <div className="flex gap-2">
          {/* View Button */}
          <Tooltip title="View">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleView(record)}
            />
          </Tooltip>

          {/* Edit Button */}
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
              disabled={record.status !== PackageStatus.RECEIVED}
            />
          </Tooltip>

          {/* Upload Photo Button */}
          <Tooltip title="Upload/Edit Photo">
            <Button
              icon={<UploadOutlined />}
              size="small"
              onClick={() => handleUploadPhoto(record)}
            />
          </Tooltip>

          {/* Update Status Button */}
          <Tooltip title="Update Status">
            <Button
              icon={<SwapOutlined />}
              size="small"
              onClick={() => handleUpdateStatus(record)}
            />
          </Tooltip>

          {/* Delete Button */}
          <Tooltip title="Delete">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDelete(record)}
              disabled={record.status !== PackageStatus.RECEIVED}
            />
          </Tooltip>

          {/* Export Excel Button */}
          <Tooltip title="Export Excel">
            <Button
              icon={<FileExcelOutlined />}
              size="small"
              onClick={() => handleExportExcel(record)}
            />
          </Tooltip>

          {/* Export PDF Button */}
          <Tooltip title="Export PDF">
            <Button
              icon={<FilePdfOutlined />}
              size="small"
              onClick={() => handleExportPdf(record)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold">Packages</h1>
            <div className="flex gap-4">
              <Search
                placeholder="Search Tracking Number"
                allowClear
                onSearch={setSearch}
                style={{ width: 220 }}
              />
              <Select
                placeholder="Status"
                allowClear
                options={statusOptions}
                onChange={setStatus}
                style={{ width: 160 }}
              />
              <Select
                placeholder="Shipment Type"
                allowClear
                options={shipmentTypeOptions}
                onChange={setShipmentType}
                style={{ width: 160 }}
              />
            </div>
          </div>
          <div>
            <Table
              columns={columnsWithActions}
              dataSource={mappedPackages}
              rowKey="id"
              loading={recentIntakesLoading}
              pagination={{
                current: page,
                pageSize,
                total: recentIntakesTotal,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
              locale={{
                emptyText: recentIntakesLoading ? (
                  <Spin />
                ) : (
                  <Empty description="No packages found" />
                ),
              }}
              scroll={{ x: true }}
            />
          </div>

          {/* View Package Modal */}
          <Modal
            title="Package Details"
            open={viewModalVisible}
            onCancel={() => {
              setViewModalVisible(false);
              setSelectedPackage(null);
            }}
            footer={[
              <Button key="close" onClick={() => setViewModalVisible(false)}>
                Close
              </Button>,
            ]}
            width={800}
          >
            {selectedPackage && (
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Tracking Number">
                  {selectedPackage.trackingNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Customer">
                  {selectedPackage.customer
                    ? `${selectedPackage.customer.firstName} ${selectedPackage.customer.lastName}`
                    : "N/A"
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  {selectedPackage.description || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Weight">
                  {selectedPackage.weight} kg
                </Descriptions.Item>
                <Descriptions.Item label="CBM">
                  {selectedPackage.cbm}
                </Descriptions.Item>
                <Descriptions.Item label="Shipment Type">
                  {selectedPackage.shipmentType}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {selectedPackage.status}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {new Date(selectedPackage.createdAt).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Modal>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

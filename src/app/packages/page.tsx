"use client";

import React, { useState } from "react";
import { Table, Input, Select, Spin, Empty, Modal, Descriptions, Tooltip, Button, message, Row, Col, Tag, Collapse, Space, Badge } from "antd";
import { ExclamationCircleOutlined, FolderOpenOutlined } from "@ant-design/icons";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  SwapOutlined,
  MergeCellsOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { PackageStatusPackages, ShipmentType, Package as NewPackageType } from "@/types/package";

// Display type for table that combines both old and new interface fields
type DisplayPackage = NewPackageType & {
  id: string;
  trackingNumber: string;
  customer: { firstName: string; lastName: string; id: string };
  description: string;
  weight: number | null;
  cbm: number | null;
  shipmentType: ShipmentType;
  status: PackageStatusPackages;
  createdAt: string;
};
import { useRouter } from "next/navigation";

import { usePackages } from "@/hooks/usePackageManagement";
import { usePackageItems } from "@/hooks/usePackageManagement";
import { usePackageManagement } from "@/hooks/usePackageManagement";
import { Form } from "antd";

const { Search } = Input;
const { useForm } = Form;

const statusOptions = Object.values(PackageStatusPackages).map((status) => ({
  label: status.replace('_', ' '),
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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isConsolidateModalVisible, setIsConsolidateModalVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<DisplayPackage | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<DisplayPackage | null>(null);

  // Consolidation states
  const [consCustomer, setConsCustomer] = useState<string>("");
  const [consMode, setConsMode] = useState<string>("");
  const [selectedForConsolidate, setSelectedForConsolidate] = useState<React.Key[]>([]);
  const [consForm] = useForm();

  const params = {
    page,
    limit: pageSize,
    search,
    status,
    mode: shipmentType,
  };

  // Use new package management hooks
  const { data: packagesData, isLoading: packagesLoading } = usePackages(params);
  const { updatePackageMutation, deletePackageMutation, consolidatePackagesMutation, generateTrackingCodeMutation } = usePackageManagement();

  const packages = packagesData?.data || [];
  const total = packagesData?.total || 0;

  // Transform data for display
  const displayPackages = packages.map((pkg) => ({
    ...pkg,
    // Add legacy fields for compatibility with existing components
    id: pkg.package_id,
    trackingNumber: pkg.tracking_code,
    customer: { firstName: pkg.customer_code, lastName: '', id: pkg.customer_code },
    description: '',
    weight: pkg.weight,
    cbm: pkg.cbm,
    shipmentType: pkg.mode,
    status: pkg.status,
    createdAt: pkg.created_at,
  }));

  // Action handlers
  const handleView = (record: DisplayPackage) => {
    setSelectedPackage(record);
    setViewModalVisible(true);
  };

  const handleEdit = (record: DisplayPackage) => {
    router.push(`/packages/edit/${record.id}`);
  };

  const handleUploadPhoto = (record: DisplayPackage) => {
    // Placeholder for upload photo functionality
    console.log("Upload photo for package:", record.id);
  };

  const handleUpdateStatus = (record: DisplayPackage) => {
    // Placeholder for status update functionality
    console.log("Update status for package:", record.id);
  };

  const handleDelete = (record: DisplayPackage) => {
    setPackageToDelete(record);
    setDeleteModalVisible(true);
  };

  const onConfirmDelete = async () => {
    if (!packageToDelete) return;

    try {
      await deletePackageMutation.mutateAsync(packageToDelete.id);
      message.success("Package deleted successfully");
      setDeleteModalVisible(false);
      setPackageToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      message.error("Failed to delete package");
    }
  };

  const handleExportExcel = (record: DisplayPackage) => {
    // Placeholder for Excel export
    console.log("Export to Excel:", record.id);
  };

  const handleExportPdf = (record: DisplayPackage) => {
    // Placeholder for PDF export
    console.log("Export to PDF:", record.id);
  };

  // Create columns with action handlers - new column structure for DisplayPackage
  const columnsWithActions = [
    {
      title: "Tracking Number",
      dataIndex: "trackingNumber",
      key: "trackingNumber",
      sorter: true,
      width: 160,
    },
    {
      title: "Customer",
      key: "customer",
      render: (record: DisplayPackage) =>
        record.customer
          ? `${record.customer.firstName} ${record.customer.lastName}`
          : "N/A",
      width: 180,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      width: 200,
    },
    {
      title: "Weight",
      dataIndex: "weight",
      key: "weight",
      sorter: true,
      width: 100,
      render: (value: number | null) => value ? `${value} kg` : "N/A",
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      sorter: true,
      width: 100,
      render: (value:any) => value || "N/A",
    },
    {
      title: "Shipment Type",
      dataIndex: "shipmentType",
      key: "shipmentType",
      filters: [
        { text: "Air", value: ShipmentType.AIR },
        { text: "Sea", value: ShipmentType.SEA },
      ],
      width: 140,
      render: (type: ShipmentType) => (
        <Tag color={type === ShipmentType.AIR ? "blue" : "green"}>{type}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: Object.values(PackageStatusPackages).map((status) => ({
        text: status.replace('_', ' '),
        value: status,
      })),
      width: 140,
      render: (status: PackageStatusPackages) => {
        const colorMap = {
          [PackageStatusPackages.IN_WAREHOUSE]: "gold",
          [PackageStatusPackages.ASSIGNED]: "blue",
          [PackageStatusPackages.SHIPPED]: "purple",
          [PackageStatusPackages.ARRIVED]: "green",
          [PackageStatusPackages.RELEASED]: "green",
        };
        return (
          <Tag color={colorMap[status] || "default"}>
            {status.replace('_', ' ')}
          </Tag>
        );
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      width: 180,
      render: (date:any) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 220,
      render: (record: DisplayPackage) => (
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
              disabled={record.status !== PackageStatusPackages.IN_WAREHOUSE}
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
              disabled={record.status !== PackageStatusPackages.IN_WAREHOUSE}
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
            <div className="flex gap-4 items-center">
              <Button
                type="primary"
                icon={<SwapOutlined />}
                onClick={() => setIsConsolidateModalVisible(true)}
              >
                Consolidate Packages
              </Button>
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
              dataSource={displayPackages}
              rowKey="id"
              loading={packagesLoading}
              pagination={{
                current: page,
                pageSize,
                total: total,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
              locale={{
                emptyText: packagesLoading ? (
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

          {/* Delete Confirmation Modal */}
          <Modal
            title={
              <span>
                <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                Confirm Delete
              </span>
            }
            open={deleteModalVisible}
            onOk={onConfirmDelete}
            onCancel={() => {
              setDeleteModalVisible(false);
              setPackageToDelete(null);
            }}
            okText="Delete"
            okType="danger"
            confirmLoading={false}
          >
            <p>
              Are you sure you want to delete package &ldquo;{packageToDelete?.trackingNumber}&rdquo;?
              This action cannot be undone.
            </p>
          </Modal>

          {/* Consolidate Packages Modal */}
          <Modal
            title="Consolidate Packages"
            open={isConsolidateModalVisible}
            onCancel={() => {
              setIsConsolidateModalVisible(false);
              setConsCustomer("");
              setConsMode("");
              setSelectedForConsolidate([]);
              consForm.resetFields();
            }}
            footer={null}
            width={1200}
          >
            <div style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Select
                    placeholder="Select Customer"
                    style={{ width: '100%' }}
                    value={consCustomer}
                    onChange={setConsCustomer}
                    allowClear
                  >
                    {/* Assume dynamic options from customers hook or static */}
                    <Select.Option value="customer1">Cust 1</Select.Option>
                    <Select.Option value="customer2">Cust 2</Select.Option>
                  </Select>
                </Col>
                <Col span={12}>
                  <Select
                    placeholder="Shipment Mode"
                    style={{ width: '100%' }}
                    value={consMode}
                    onChange={setConsMode}
                    allowClear
                  >
                    <Select.Option value="SEA">Sea</Select.Option>
                    <Select.Option value="AIR">Air</Select.Option>
                  </Select>
                </Col>
              </Row>
            </div>

            {consCustomer && consMode && (
              <Table
                dataSource={displayPackages.filter(pkg =>
                  pkg.customer?.id === consCustomer &&
                  pkg.shipmentType === consMode &&
                  pkg.status === PackageStatusPackages.IN_WAREHOUSE
                )}
                rowKey="id"
                columns={[
                  { title: 'Tracking Code', dataIndex: 'trackingNumber', key: 'trackingNumber' },
                  { title: 'Description', dataIndex: 'description', key: 'description' },
                  { title: 'Weight', dataIndex: 'weight', key: 'weight' },
                  { title: 'CBM', dataIndex: 'cbm', key: 'cbm' },
                ]}
                rowSelection={{
                  selectedRowKeys: selectedForConsolidate,
                  onChange: setSelectedForConsolidate,
                }}
                pagination={{ pageSize: 5 }}
                size="small"
              />
            )}

            <Form
              form={consForm}
              layout="inline"
              onFinish={async (values) => {
                if (selectedForConsolidate.length < 2) {
                  message.error("Select at least 2 packages");
                  return;
                }
                try {
                  await consolidatePackagesMutation.mutateAsync({
                    items: selectedForConsolidate as string[],
                    tracking_code: values.newTrackingCode,
                    mode: consMode,
                    customer_code: consCustomer,
                    warehouse_id: "1", // TODO: Get from package
                  });
                  message.success("Packages consolidated successfully");
                  setIsConsolidateModalVisible(false);
                  setSelectedForConsolidate([]);
                  consForm.resetFields();
                } catch (error) {
                  console.error("Consolidation failed:", error);
                  message.error("Failed to consolidate packages");
                }
              }}
              style={{ marginTop: 16 }}
            >
              <Form.Item
                name="newTrackingCode"
                label="New Tracking Code"
                rules={[{ required: true }]}
              >
                <Input placeholder="Enter new tracking code" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Consolidate ({selectedForConsolidate.length} packages)
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

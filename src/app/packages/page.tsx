"use client";

import React, { useState } from "react";
import {
  Table,
  Input,
  Select,
  Spin,
  Empty,
  Modal,
  Descriptions,
  Tooltip,
  Button,
  Row,
  Col,
  Tag,
  Image,
} from "antd";
import { toast } from "sonner";
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
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { CustomerSearchSelect } from "@/components/CustomerSearchSelect";
import { PackageStatusPackages, ShippingMode, Package } from "@/types/package";

// Display type for table that uses the new Package structure
type DisplayPackage = Package & {
  customerName: string;
  createdByName?: string;
};
import { useRouter } from "next/navigation";

import { usePackages } from "@/hooks/usePackageManagement";
import { usePackageManagement } from "@/hooks/usePackageManagement";
import { Form } from "antd";
import { ReceiptModal } from "@/components/ReceiptModal";

const { Search } = Input;
const { useForm } = Form;

const statusOptions = Object.values(PackageStatusPackages).map((status) => ({
  label: status.replace("_", " "),
  value: status,
}));

const shipmentTypeOptions = [
  { label: "Air", value: ShippingMode.AIR },
  { label: "Sea", value: ShippingMode.SEA },
];

export const packageStatusColors = {
  [PackageStatusPackages.IN_WAREHOUSE]: "gold",
  [PackageStatusPackages.ASSIGNED]: "blue",
  [PackageStatusPackages.SHIPPED]: "purple",
  [PackageStatusPackages.ARRIVED]: "yellowgreen",
  [PackageStatusPackages.RELEASED]: "green",
};

export default function PackagesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [shipmentType, setShippingMode] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isConsolidateModalVisible, setIsConsolidateModalVisible] =
    useState(false);
  const [selectedPackage, setSelectedPackage] = useState<DisplayPackage | null>(
    null
  );
  const [packageToDelete, setPackageToDelete] = useState<DisplayPackage | null>(
    null
  );

  // Consolidation states
  const [consCustomer, setConsCustomer] = useState<string>("");
  const [consMode, setConsMode] = useState<string>("");
  const [selectedForConsolidate, setSelectedForConsolidate] = useState<
    React.Key[]
  >([]);
  const [consForm] = useForm();

  // Receipt modal state
  const [receiptModalPackageId, setReceiptModalPackageId] = useState<
    string | null
  >(null);

  // Table selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const params = {
    page,
    limit: pageSize,
    search,
    status,
    mode: shipmentType,
  };

  // Use new package management hooks
  const { data: packagesData, isLoading: packagesLoading } =
    usePackages(params);
  const { deletePackageMutation, consolidatePackagesMutation } =
    usePackageManagement();

  const packages = packagesData?.data || [];
  const total = packagesData?.total || 0;

  // Transform data for display
  const displayPackages: DisplayPackage[] = packages.map((pkg) => ({
    ...pkg,
    // Add display fields for compatibility
    customerName: pkg.customer
      ? `${pkg.customer.firstName} ${pkg.customer.lastName}`
      : pkg.customerId,
    shipmentType: pkg.shippingMode,
    createdByName: pkg.createdBy
      ? `${pkg.createdBy.firstName} ${pkg.createdBy.lastName}`
      : undefined,
  }));

  // Action handlers
  const handleView = (record: DisplayPackage) => {
    setSelectedPackage(record);
    setViewModalVisible(true);
  };

  const handleEdit = (record: DisplayPackage) => {
    router.push(`/packages/edit/${record.id}`);
  };

  const handleDelete = (record: DisplayPackage) => {
    setPackageToDelete(record);
    setDeleteModalVisible(true);
  };

  const onConfirmDelete = async () => {
    if (!packageToDelete) return;

    try {
      await deletePackageMutation.mutateAsync(packageToDelete.id);
      toast.success("Package deleted successfully");
      setDeleteModalVisible(false);
      setPackageToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete package");
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

  const handleExportExcelAll = (ids: React.Key[] | null) => {
    const toExport = ids
      ? displayPackages.filter((pkg) => ids.includes(pkg.id))
      : displayPackages;
    console.log(
      "Export Excel for:",
      toExport.map((p) => p.trackingCode)
    );
  };

  const handleExportPdfAll = (ids: React.Key[] | null) => {
    const toExport = ids
      ? displayPackages.filter((pkg) => ids.includes(pkg.id))
      : displayPackages;
    console.log(
      "Export PDF for:",
      toExport.map((p) => p.trackingCode)
    );
  };

  // shipping mode color map
  const modeColorMap: { [key: string]: string } = {
    AIR: "lime",
    SEA: "blue",
  };

  // Create columns with action handlers - new column structure for DisplayPackage
  const columnsWithActions = [
    {
      title: "Tracking Number",
      dataIndex: "trackingCode",
      key: "trackingCode",
      sorter: true,
      width: 160,
    },
    {
      title: "Customer",
      key: "customer",
      render: (record: DisplayPackage) =>
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
        <Tag color={modeColorMap[mode] || "default"}>{mode}</Tag>
      ),
    },
    {
      title: "Weight/CBM",
      key: "weight",
      sorter: true,
      width: 100,
      render: (record: DisplayPackage) =>
        record.shippingMode === ShippingMode.AIR
          ? `${record.weight ? `${record.weight} kg` : "N/A"}`
          : `${record.cbm ? `${record.cbm} cbm` : "N/A"}`,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      sorter: true,
      width: 50,
    },
    {
      title: "Cons.d",
      dataIndex: "isConsolidated",
      key: "isConsolidated",
      width: 80,
      render: (value: boolean) =>
        value ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>,
    },
    {
      title: "Payment Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 100,
      render: (status: string) => {
        const colorMap: { [key: string]: string } = {
          PENDING: "orange",
          PAID: "green",
          OVERDUE: "red",
        };
        return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Days in Warehouse",
      dataIndex: "daysInWarehouse",
      key: "daysInWarehouse",
      sorter: true,
      width: 80,
      render: (value: number) => `${value} days`,
    },
    {
      title: "Warehouse",
      key: "warehouse",
      sorter: true,
      width: 180,
      render: (record: DisplayPackage) => record.warehouse?.name || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: Object.values(PackageStatusPackages).map((status) => ({
        text: status.replace("_", " "),
        value: status,
      })),
      width: 100,
      render: (status: PackageStatusPackages) => {
        return (
          <Tag color={packageStatusColors[status] || "default"}>
            {status.replace("_", " ")}
          </Tag>
        );
      },
    },
    {
      title: "Pickup Code",
      dataIndex: "pickupCode",
      key: "pickupCode",
      width: 120,
      render: (code: string) => code || "N/A",
    },
    {
      title: "Received Date",
      dataIndex: "receivedDate",
      key: "receivedDate",
      render: (date: string) => new Date(date).toLocaleString(),
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

          {/* View Receipt Button */}
          <Tooltip title="View Receipt">
            <Button
              icon={<FilePdfOutlined />}
              size="small"
              onClick={() => setReceiptModalPackageId(record.id)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard>
      <AppLayout>
        <div className="py-4 max-w-8xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold">Packages</h1>
            <div className="flex gap-4 items-center flex-wrap">
              <Button
                type="primary"
                icon={<SwapOutlined />}
                onClick={() => setIsConsolidateModalVisible(true)}
              >
                Consolidate Packages
              </Button>
              <div className="ml-auto flex gap-2">
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={() =>
                    handleExportExcelAll(
                      selectedRowKeys.length > 0 ? selectedRowKeys : null
                    )
                  }
                >
                  Export Excel{" "}
                  {selectedRowKeys.length > 0
                    ? `(${selectedRowKeys.length})`
                    : "(All)"}
                </Button>
                <Button
                  icon={<FilePdfOutlined />}
                  onClick={() =>
                    handleExportPdfAll(
                      selectedRowKeys.length > 0 ? selectedRowKeys : null
                    )
                  }
                >
                  Export PDF{" "}
                  {selectedRowKeys.length > 0
                    ? `(${selectedRowKeys.length})`
                    : "(All)"}
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 md:max-w-4xl gap-2 flex-grow flex">
            <Search
              placeholder="Search Tracking Number"
              allowClear
              onSearch={setSearch}
              className="cols-span-1 md:col-span-2"
            />
            <Select
              placeholder="Status"
              allowClear
              options={statusOptions}
              onChange={setStatus}
              className="cols-span-1 sm:col-span-1"
            />
            <Select
              placeholder="Shipment Type"
              allowClear
              options={shipmentTypeOptions}
              onChange={setShippingMode}
              className="cols-span-1 sm:col-span-1"
            />
          </div>

          <div>
            <Table
              columns={columnsWithActions}
              dataSource={displayPackages}
              rowKey="id"
              loading={packagesLoading}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
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
              <Button
                key="edit"
                onClick={() => {
                  setViewModalVisible(false);
                  handleEdit(selectedPackage!);
                }}
                disabled={
                  selectedPackage?.status !== PackageStatusPackages.IN_WAREHOUSE
                }
              >
                Edit
              </Button>,
              <Button
                key="delete"
                danger
                onClick={() => {
                  setViewModalVisible(false);
                  handleDelete(selectedPackage!);
                }}
                disabled={
                  selectedPackage?.status !== PackageStatusPackages.IN_WAREHOUSE
                }
              >
                Delete
              </Button>,
              <Button
                key="receipt"
                onClick={() => setReceiptModalPackageId(selectedPackage!.id)}
              >
                View Receipt
              </Button>,
              <Button
                key="excel"
                onClick={() => handleExportExcel(selectedPackage!)}
              >
                Export Excel
              </Button>,
              <Button
                key="pdf"
                onClick={() => handleExportPdf(selectedPackage!)}
              >
                Export PDF
              </Button>,
              <Button key="close" onClick={() => setViewModalVisible(false)}>
                Close
              </Button>,
            ]}
            width={800}
          >
            {selectedPackage && (
              <div>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Tracking Number">
                    {selectedPackage.trackingCode}
                  </Descriptions.Item>
                  <Descriptions.Item label="Customer">
                    {selectedPackage.customerName}
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
                  <Descriptions.Item label="Quantity">
                    {selectedPackage.quantity}
                  </Descriptions.Item>
                  <Descriptions.Item label="Shipment Type">
                    <Tag
                      color={
                        selectedPackage.shippingMode === "AIR"
                          ? "blue"
                          : "green"
                      }
                    >
                      {selectedPackage.shippingMode}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Consolidated">
                    <Tag
                      color={
                        selectedPackage.isConsolidated ? "green" : "orange"
                      }
                    >
                      {selectedPackage.isConsolidated ? "Yes" : "No"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag
                      color={
                        packageStatusColors[selectedPackage?.status] ||
                        "default"
                      }
                    >
                      {selectedPackage?.status.replace("_", " ")}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Status">
                    <Tag
                      color={
                        selectedPackage.paymentStatus === "PAID"
                          ? "green"
                          : selectedPackage.paymentStatus === "PENDING"
                          ? "orange"
                          : "red"
                      }
                    >
                      {selectedPackage.paymentStatus}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Pickup Code">
                    {selectedPackage.pickupCode || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Days in Warehouse">
                    {selectedPackage.daysInWarehouse} days
                  </Descriptions.Item>
                  <Descriptions.Item label="Received Date">
                    {new Date(selectedPackage.receivedDate).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created By">
                    {selectedPackage.createdByName || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created At">
                    {new Date(selectedPackage.createdAt).toLocaleString()}
                  </Descriptions.Item>
                </Descriptions>
                {selectedPackage.notes && (
                  <Descriptions
                    bordered
                    column={1}
                    size="small"
                    style={{ marginTop: 16 }}
                  >
                    <Descriptions.Item label="Notes">
                      {selectedPackage.notes}
                    </Descriptions.Item>
                  </Descriptions>
                )}
                {selectedPackage.items && selectedPackage.items.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h3>Items ({selectedPackage.items.length})</h3>
                    <Table
                      columns={[
                        {
                          title: "Tracking Code",
                          dataIndex: "intakeTrackingCode",
                          key: "intakeTrackingCode",
                        },
                        {
                          title: "Description",
                          dataIndex: "description",
                          key: "description",
                        },
                        {
                          title: "Quantity",
                          dataIndex: "quantity",
                          key: "quantity",
                        },
                        { title: "Weight", dataIndex: "weight", key: "weight" },
                        { title: "CBM", dataIndex: "cbm", key: "cbm" },
                        { title: "Status", dataIndex: "status", key: "status" },
                      ]}
                      dataSource={selectedPackage.items}
                      rowKey="id"
                      size="small"
                      pagination={false}
                    />
                  </div>
                )}
                {selectedPackage.photos &&
                  selectedPackage.photos.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h3>Photos ({selectedPackage.photos.length})</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedPackage.photos.map((photo, index) => (
                          <Image
                            key={index}
                            src={photo.url}
                            alt={`Photo ${index + 1}`}
                            style={{
                              width: "100%",
                              height: 200,
                              objectFit: "cover",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            title={
              <span>
                <ExclamationCircleOutlined
                  style={{ color: "#ff4d4f", marginRight: 8 }}
                />
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
              Are you sure you want to delete package &ldquo;
              {packageToDelete?.trackingCode}&rdquo;? This action cannot be
              undone.
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
                  <CustomerSearchSelect
                    value={consCustomer}
                    onChange={setConsCustomer}
                    placeholder="Select Customer"
                    showAddNew={false}
                  />
                </Col>
                <Col span={12}>
                  <Select
                    placeholder="Shipment Mode"
                    style={{ width: "100%" }}
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
                dataSource={displayPackages.filter(
                  (pkg) =>
                    pkg.customer?.id === consCustomer &&
                    pkg.shippingMode === consMode &&
                    pkg.status === PackageStatusPackages.IN_WAREHOUSE
                )}
                rowKey="id"
                columns={[
                  {
                    title: "Tracking Code",
                    dataIndex: "trackingCode",
                    key: "trackingCode",
                  },
                  {
                    title: "Description",
                    dataIndex: "description",
                    key: "description",
                  },
                  { title: "Weight", dataIndex: "weight", key: "weight" },
                  { title: "CBM", dataIndex: "cbm", key: "cbm" },
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
                  toast.error("Select at least 2 packages");
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
                  toast.success("Packages consolidated successfully");
                  setIsConsolidateModalVisible(false);
                  setSelectedForConsolidate([]);
                  consForm.resetFields();
                } catch (error) {
                  console.error("Consolidation failed:", error);
                  toast.error("Failed to consolidate packages");
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
          <ReceiptModal
            visible={!!receiptModalPackageId}
            onClose={() => setReceiptModalPackageId(null)}
            packageId={receiptModalPackageId}
          />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

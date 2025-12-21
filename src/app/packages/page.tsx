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
  Popconfirm,
  Checkbox,
  Divider,
  Space,
} from "antd";
import { toast } from "sonner";
import { ExclamationCircleOutlined, DownloadOutlined } from "@ant-design/icons";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  SwapOutlined,
  ReloadOutlined,
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
import { useConsolidation } from "@/hooks/useConsolidation";
import { useWarehouses } from "@/hooks/useWarehouse";
import { useRegenerateInvoicePdf } from "@/hooks/useInvoices";
import { usePackage } from "@/hooks/usePackages";

import { Form } from "antd";
import { ReceiptModal } from "@/components/ReceiptModal";
import { TransferPackagesModal } from "@/components/TransferPackagesModal";
import { PackingListSearchSelect } from "@/components/PackingListSearchSelect";
import { Role } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";

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

const paymentStatusOptions = [
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Partially Paid", value: "PARTIALLY_PAID" },
];

export const packageStatusColors = {
  [PackageStatusPackages.RECEIVED]: "gold",
  [PackageStatusPackages.ASSIGNED]: "blue",
  [PackageStatusPackages.SHIPPED]: "purple",
  [PackageStatusPackages.ARRIVED]: "yellowgreen",
  [PackageStatusPackages.RELEASED]: "green",
};

export default function PackagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [shipmentType, setShippingMode] = useState<"SEA" | "AIR" | undefined>();
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [packingListId, setPackingListId] = useState<string | undefined>();
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isConsolidateModalVisible, setIsConsolidateModalVisible] =
    useState(false);
  const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null
  );
  const [selectedPackage, setSelectedPackage] = useState<DisplayPackage | null>(
    null
  );
  const [packageToDelete, setPackageToDelete] = useState<DisplayPackage | null>(
    null
  );

  // Fetch package details when viewing
  const { data: packageDetails, isLoading: isLoadingPackageDetails } =
    usePackage(selectedPackageId || undefined);

  // Consolidation states
  const [consCustomer, setConsCustomer] = useState<string>("");
  const [consMode, setConsMode] = useState<string>("");
  const [selectedForConsolidate, setSelectedForConsolidate] = useState<
    React.Key[]
  >([]);
  const [consForm] = useForm();

  // Transfer states
  const [selectedPackingListId, setSelectedPackingListId] =
    useState<string>("");

  // Receipt modal state
  const [receiptModalPackageId, setReceiptModalPackageId] = useState<
    string | null
  >(null);

  // Table selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Export states
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([
    "trackingCode",
    "customerName",
    "description",
    "weight",
    "cbm",
    "status",
    "shipmentMode",
    "warehouseName",
  ]);

  const params = {
    page,
    limit: pageSize,
    search,
    status,
    shippingMode: shipmentType,
    customerId,
    packingListId,
    paymentStatus,
  };

  // Use new package management hooks
  const { data: packagesData, isLoading: packagesLoading } =
    usePackages(params);
  const { deletePackageMutation, updatePackageMutation } =
    usePackageManagement();
  const { consolidatePackagesMutation } = useConsolidation();
  const { data: warehousesData } = useWarehouses();
  const { mutateAsync: regenerateInvoicePdfMutation } =
    useRegenerateInvoicePdf();

  const packages = packagesData?.data || [];
  const total = packagesData?.meta?.total || 0;

  // Transform data for display
  const displayPackages: DisplayPackage[] = packages.map((pkg) => ({
    ...pkg,
    // Add display fields for compatibility
    customerName: pkg.customer
      ? `${pkg.customer.firstName} ${pkg.customer.lastName || ""}`
      : pkg.customerId,
    shipmentType: pkg.shippingMode,
    createdByName: pkg.createdBy
      ? `${pkg.createdBy.firstName} ${pkg.createdBy.lastName}`
      : undefined,
  }));

  // Action handlers
  const handleView = (record: DisplayPackage) => {
    setSelectedPackageId(record.id);
    setSelectedPackage(record); // Keep for backward compatibility
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

  // Export column options
  const exportColumnOptions = [
    { label: "Tracking Code", value: "trackingCode" },
    { label: "Customer Name", value: "customerName" },
    { label: "Description", value: "description" },
    { label: "Weight (kg)", value: "weight" },
    { label: "CBM", value: "cbm" },
    { label: "Status", value: "status" },
    { label: "Shipment Mode", value: "shipmentMode" },
    { label: "Warehouse", value: "warehouseName" },
    { label: "Packing List", value: "packingListName" },
    { label: "Invoice Number", value: "invoiceNumber" },
    { label: "Created At", value: "createdAt" },
  ];

  const handleBulkExport = (format: "csv" | "excel" | "pdf") => {
    if (selectedExportColumns.length === 0) {
      toast.error("Please select at least one column to export");
      return;
    }

    // Get data to export based on selected columns
    const dataToExport = displayPackages?.map((pkg: DisplayPackage) => {
      const row: any = {};
      selectedExportColumns.forEach((col) => {
        switch (col) {
          case "trackingCode":
            row["Tracking Code"] = pkg.trackingCode;
            break;
          case "customerName":
            row["Customer Name"] = pkg.customerName;
            break;
          case "description":
            row["Description"] = pkg.description || "N/A";
            break;
          case "weight":
            row["Weight (kg)"] = pkg.weight || 0;
            break;
          case "cbm":
            row["CBM"] = pkg.cbm || 0;
            break;
          case "status":
            row["Status"] = pkg.status.replace("_", " ");
            break;
          case "shipmentMode":
            row["Shipment Mode"] = pkg.shippingMode || "N/A";
            break;
          case "warehouseName":
            row["Warehouse"] = pkg.warehouse?.name || "N/A";
            break;
          case "packingListName":
            row["Packing List"] = pkg.packingList?.name || "N/A";
            break;
          case "invoiceNumber":
            row["Invoice Number"] = pkg.invoice?.invoiceNumber || "N/A";
            break;
          case "createdAt":
            row["Created At"] = new Date(pkg.createdAt).toLocaleDateString();
            break;
        }
      });
      return row;
    });

    // Export based on format
    if (format === "csv") {
      exportToCSV(dataToExport || []);
    } else if (format === "excel") {
      exportToExcel(dataToExport || []);
    } else if (format === "pdf") {
      exportToPDF(dataToExport || []);
    }

    setIsExportModalVisible(false);
    toast.success(`Data exported as ${format.toUpperCase()} successfully`);
  };

  const exportToCSV = (data: any[]) => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `packages-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportToExcel = (data: any[]) => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `packages-${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
  };

  const exportToPDF = (data: any[]) => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packages Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Packages - ${new Date().toLocaleDateString()}</h1>
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) =>
                    `<tr>${headers
                      .map((h) => `<td>${row[h] || ""}</td>`)
                      .join("")}</tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportExcel = (record: DisplayPackage) => {
    const data = [
      {
        "Tracking Code": record.trackingCode,
        "Customer Name": record.customerName,
        Description: record.description || "N/A",
        "Weight (kg)": record.weight || 0,
        CBM: record.cbm || 0,
        Status: record.status.replace("_", " "),
        "Shipment Mode": record.shippingMode || "N/A",
        Warehouse: record.warehouse?.name || "N/A",
      },
    ];
    exportToExcel(data);
  };

  const handleExportPdf = (record: DisplayPackage) => {
    const data = [
      {
        "Tracking Code": record.trackingCode,
        "Customer Name": record.customerName,
        Description: record.description || "N/A",
        "Weight (kg)": record.weight || 0,
        CBM: record.cbm || 0,
        Status: record.status.replace("_", " "),
        "Shipment Mode": record.shippingMode || "N/A",
        Warehouse: record.warehouse?.name || "N/A",
      },
    ];
    exportToPDF(data);
  };

  const handleExportExcelAll = (ids: React.Key[] | null) => {
    const toExport = ids
      ? displayPackages.filter((pkg) => ids.includes(pkg.id))
      : displayPackages;

    if (toExport.length === 0) {
      toast.error("No packages to export");
      return;
    }

    const data = toExport.map((pkg) => ({
      "Tracking Code": pkg.trackingCode,
      "Customer Name": pkg.customerName,
      Description: pkg.description || "N/A",
      "Weight (kg)": pkg.weight || 0,
      CBM: pkg.cbm || 0,
      Status: pkg.status.replace("_", " "),
      "Shipment Mode": pkg.shippingMode || "N/A",
      Warehouse: pkg.warehouse?.name || "N/A",
    }));
    exportToExcel(data);
  };

  const handleExportPdfAll = (ids: React.Key[] | null) => {
    const toExport = ids
      ? displayPackages.filter((pkg) => ids.includes(pkg.id))
      : displayPackages;

    if (toExport.length === 0) {
      toast.error("No packages to export");
      return;
    }

    const data = toExport.map((pkg) => ({
      "Tracking Code": pkg.trackingCode,
      "Customer Name": pkg.customerName,
      Description: pkg.description || "N/A",
      "Weight (kg)": pkg.weight || 0,
      CBM: pkg.cbm || 0,
      Status: pkg.status.replace("_", " "),
      "Shipment Mode": pkg.shippingMode || "N/A",
      Warehouse: pkg.warehouse?.name || "N/A",
    }));
    exportToPDF(data);
  };

  const handleRegenerateInvoice = async (record: DisplayPackage) => {
    if (!record.invoiceId) {
      toast.error("No invoice associated with this package");
      return;
    }
    try {
      await regenerateInvoicePdfMutation(record.invoiceId);
      toast.success("Invoice PDF regenerated successfully");
    } catch (error) {
      console.error("Regenerate invoice failed:", error);
      toast.error("Failed to regenerate invoice PDF");
    }
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
      render: (text: string, record: DisplayPackage) => (
        <div>
          <span>{text}</span>
          <br />
          {record.isConsolidated && (
            <span>
              <b>Sub Packages:</b>
              {record.items?.map((item) => (
                <Tag key={item.id}>{item.intakeTrackingCode}</Tag>
              ))}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (record: DisplayPackage) =>
        `${record.customer?.firstName} ${record.customer?.lastName || ""} (${
          record.customer?.customerCode
        })`,
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
              disabled={
                user?.role !== Role.SUPER_ADMIN &&
                record.status !== PackageStatusPackages.RECEIVED
              }
            />
          </Tooltip>

          {/* Delete Button */}
          <Tooltip title="Delete">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDelete(record)}
              disabled={record.status !== PackageStatusPackages.RECEIVED}
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

          {/* Regenerate Invoice Button */}
          {record.invoiceId && (
            <Tooltip title="Regenerate Invoice PDF">
              <Popconfirm
                title="Regenerate Invoice PDF"
                description="Are you sure you want to regenerate the invoice PDF?"
                onConfirm={() => handleRegenerateInvoice(record)}
                okText="Yes"
                cancelText="No"
              >
                <Button icon={<ReloadOutlined />} size="small" />
              </Popconfirm>
            </Tooltip>
          )}
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
              <Button
                type="default"
                icon={<UploadOutlined />}
                onClick={() => setIsTransferModalVisible(true)}
              >
                Transfer Packages
              </Button>
              <div className="ml-auto flex gap-2">
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => setIsExportModalVisible(true)}
                >
                  Export Data
                </Button>
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={() =>
                    handleExportExcelAll(
                      selectedRowKeys.length > 0 ? selectedRowKeys : null
                    )
                  }
                >
                  Quick Export Excel{" "}
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Search</label>
              <Search
                placeholder="Search Customer Name, Tracking Number, Pickup Code..."
                allowClear
                onSearch={setSearch}
                className="w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Status</label>
              <Select
                placeholder="Select Status"
                allowClear
                options={statusOptions}
                value={status || undefined}
                onChange={setStatus}
                className="w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Shipment Mode</label>
              <Select
                placeholder="Select Mode"
                allowClear
                options={shipmentTypeOptions}
                value={shipmentType || undefined}
                onChange={setShippingMode}
                className="w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Payment Status</label>
              <Select
                placeholder="Select Payment Status"
                allowClear
                options={paymentStatusOptions}
                value={paymentStatus || undefined}
                onChange={setPaymentStatus}
                className="w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Customer</label>
              <CustomerSearchSelect
                placeholder="Select Customer"
                value={customerId}
                onChange={setCustomerId}
                showAddNew={false}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Packing List</label>
              <PackingListSearchSelect
                placeholder="Select Packing List"
                value={packingListId}
                onChange={setPackingListId}
                showAddNew={false}
              />
            </div>
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
              setSelectedPackageId(null);
              setSelectedPackage(null);
            }}
            footer={[
              <Button
                key="edit"
                onClick={() => {
                  setViewModalVisible(false);
                  if (packageDetails) {
                    router.push(`/packages/edit/${packageDetails.id}`);
                  }
                }}
                disabled={
                  packageDetails?.status !== PackageStatusPackages.RECEIVED
                }
              >
                Edit
              </Button>,
              <Button
                key="delete"
                danger
                onClick={() => {
                  setViewModalVisible(false);
                  if (packageDetails) {
                    handleDelete(packageDetails as DisplayPackage);
                  }
                }}
                disabled={
                  packageDetails?.status !== PackageStatusPackages.RECEIVED
                }
              >
                Delete
              </Button>,
              <Button
                key="receipt"
                onClick={() =>
                  setReceiptModalPackageId(packageDetails?.id || null)
                }
                disabled={!packageDetails}
              >
                View Receipt
              </Button>,
              <Button
                key="excel"
                onClick={() =>
                  packageDetails &&
                  handleExportExcel(packageDetails as DisplayPackage)
                }
                disabled={!packageDetails}
              >
                Export Excel
              </Button>,
              <Button
                key="pdf"
                onClick={() =>
                  packageDetails &&
                  handleExportPdf(packageDetails as DisplayPackage)
                }
                disabled={!packageDetails}
              >
                Export PDF
              </Button>,
              <Button key="close" onClick={() => setViewModalVisible(false)}>
                Close
              </Button>,
            ]}
            width={800}
          >
            {isLoadingPackageDetails ? (
              <div className="flex justify-center items-center py-12">
                <Spin size="large" tip="Loading package details..." />
              </div>
            ) : packageDetails ? (
              <div>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Tracking Number">
                    {packageDetails.trackingCode}
                  </Descriptions.Item>
                  <Descriptions.Item label="Customer">
                    {packageDetails.customer
                      ? `${packageDetails.customer.firstName} ${
                          packageDetails.customer.lastName || ""
                        } (${packageDetails.customer.customerCode})`
                      : packageDetails.customerId}
                  </Descriptions.Item>
                  <Descriptions.Item label="Description">
                    {packageDetails.description || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Weight">
                    {packageDetails.weight
                      ? `${packageDetails.weight} kg`
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="CBM">
                    {packageDetails.cbm || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Quantity">
                    {packageDetails.quantity}
                  </Descriptions.Item>
                  <Descriptions.Item label="Shipment Type">
                    <Tag
                      color={
                        packageDetails.shippingMode === "AIR" ? "blue" : "green"
                      }
                    >
                      {packageDetails.shippingMode}
                    </Tag>
                  </Descriptions.Item>
                  {packageDetails.airShippingType && (
                    <Descriptions.Item label="Air Shipping Type">
                      <Tag color="cyan">
                        {packageDetails.airShippingType.replace("_", " ")}
                      </Tag>
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Warehouse">
                    {packageDetails.warehouse?.name || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Destination City">
                    {packageDetails.destinationCity
                      ? `${packageDetails.destinationCity.name}, ${packageDetails.destinationCity.country}`
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Shipping Currency">
                    {packageDetails.shippingCurrency || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Shipping Rate">
                    {packageDetails.shippingRate
                      ? `${packageDetails.shippingRate}`
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Shipping Cost">
                    {packageDetails.shippingCost
                      ? `${packageDetails.shippingCurrency || ""} ${
                          packageDetails.shippingCost
                        }`
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Consolidated">
                    <Tag
                      color={packageDetails.isConsolidated ? "green" : "orange"}
                    >
                      {packageDetails.isConsolidated ? "Yes" : "No"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag
                      color={
                        packageStatusColors[packageDetails.status] || "default"
                      }
                    >
                      {packageDetails.status.replace("_", " ")}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Status">
                    <Tag
                      color={
                        packageDetails.paymentStatus === "PAID"
                          ? "green"
                          : packageDetails.paymentStatus === "PENDING"
                          ? "orange"
                          : "red"
                      }
                    >
                      {packageDetails.paymentStatus}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Packing List">
                    {packageDetails.packingList?.name || "Not Assigned"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Invoice Number">
                    {packageDetails.invoice?.invoiceNumber || "Not Generated"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Pickup Code">
                    {packageDetails.pickupCode || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Days in Warehouse">
                    {packageDetails.daysInWarehouse} days
                  </Descriptions.Item>
                  <Descriptions.Item label="Received Date">
                    {new Date(packageDetails.receivedDate).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created By">
                    {packageDetails.createdBy
                      ? `${packageDetails.createdBy.firstName} ${packageDetails.createdBy.lastName}`
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created At">
                    {new Date(packageDetails.createdAt).toLocaleString()}
                  </Descriptions.Item>
                  {packageDetails.updatedAt && (
                    <Descriptions.Item label="Last Updated">
                      {new Date(packageDetails.updatedAt).toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {packageDetails.correlationId && (
                    <Descriptions.Item label="Correlation ID">
                      {packageDetails.correlationId}
                    </Descriptions.Item>
                  )}
                </Descriptions>
                {packageDetails.notes && (
                  <Descriptions
                    bordered
                    column={1}
                    size="small"
                    style={{ marginTop: 16 }}
                  >
                    <Descriptions.Item label="Notes">
                      {packageDetails.notes}
                    </Descriptions.Item>
                  </Descriptions>
                )}
                {packageDetails.isConsolidated &&
                  packageDetails.items &&
                  packageDetails.items.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h3>Sub Packages ({packageDetails.items.length})</h3>
                      <Table
                        columns={[
                          {
                            title: "Tracking Code",
                            dataIndex: "intakeTrackingCode",
                            key: "intakeTrackingCode",
                          },
                        ]}
                        dataSource={packageDetails.items}
                        rowKey="id"
                        size="small"
                        pagination={false}
                      />
                    </div>
                  )}
                {packageDetails.photos && packageDetails.photos.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h3>Photos ({packageDetails.photos.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {packageDetails.photos.map((photo, index) => (
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
            ) : null}
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
                  <div style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "500",
                        marginBottom: 4,
                      }}
                    >
                      Customer
                    </label>
                  </div>
                  <CustomerSearchSelect
                    value={consCustomer}
                    onChange={setConsCustomer}
                    placeholder="Select Customer"
                    showAddNew={false}
                  />
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "500",
                        marginBottom: 4,
                      }}
                    >
                      Shipment Mode
                    </label>
                  </div>
                  <Select
                    placeholder="Select Shipment Mode"
                    style={{ width: "100%" }}
                    value={consMode || undefined}
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
                    pkg.status === PackageStatusPackages.RECEIVED
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
              onFinish={async (values) => {
                if (selectedForConsolidate.length < 2) {
                  toast.error("Select at least 2 packages");
                  return;
                }
                try {
                  // Get tracking codes from selected packages
                  const sourceTrackingCodes = displayPackages
                    .filter((pkg) => selectedForConsolidate.includes(pkg.id))
                    .map((pkg) => pkg.trackingCode);

                  await consolidatePackagesMutation.mutateAsync({
                    sourceTrackingCodes,
                    targetTrackingCode: values.newTrackingCode || undefined,
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
              <Row gutter={16}>
                <Col span={16}>
                  <div style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "500",
                        marginBottom: 4,
                      }}
                    >
                      New Tracking Code (Optional)
                    </label>
                  </div>
                  <Form.Item name="newTrackingCode" style={{ marginBottom: 0 }}>
                    <Input placeholder="Enter new tracking code (optional)" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <div style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "500",
                        marginBottom: 4,
                        visibility: "hidden",
                      }}
                    >
                      Action
                    </label>
                  </div>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      style={{ width: "100%" }}
                    >
                      Consolidate ({selectedForConsolidate.length} packages)
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Modal>

          {/* Transfer Packages Modal */}
          <Modal
            title="Transfer Packages"
            open={isTransferModalVisible}
            onCancel={() => {
              setIsTransferModalVisible(false);
              setSelectedPackingListId("");
            }}
            footer={null}
            width={600}
          >
            <div style={{ marginBottom: 16 }}>
              <PackingListSearchSelect
                placeholder="Select Packing List"
                value={selectedPackingListId}
                onChange={setSelectedPackingListId}
                showAddNew={false}
              />
            </div>

            <div style={{ textAlign: "right" }}>
              <Button
                type="primary"
                onClick={() => {
                  if (!selectedPackingListId) {
                    toast.error("Please select a packing list");
                    return;
                  }
                  setIsTransferModalVisible(false);
                }}
                disabled={!selectedPackingListId}
              >
                Open Transfer Modal
              </Button>
            </div>
          </Modal>

          <TransferPackagesModal
            visible={!!selectedPackingListId}
            onCancel={() => setSelectedPackingListId("")}
            packingListId={selectedPackingListId}
          />

          <ReceiptModal
            visible={!!receiptModalPackageId}
            onClose={() => setReceiptModalPackageId(null)}
            packageId={receiptModalPackageId}
          />

          {/* Export Data Modal */}
          <Modal
            title="Export Packages"
            open={isExportModalVisible}
            onCancel={() => setIsExportModalVisible(false)}
            footer={null}
            width={600}
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Select Columns to Export:</h4>
                <Checkbox.Group
                  options={exportColumnOptions}
                  value={selectedExportColumns}
                  onChange={(values) =>
                    setSelectedExportColumns(values as string[])
                  }
                  className="flex flex-col gap-2"
                />
              </div>

              <Divider />

              <div>
                <h4 className="font-medium mb-3">Select Export Format:</h4>
                <Space size="middle" className="w-full" direction="vertical">
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={() => handleBulkExport("csv")}
                    disabled={selectedExportColumns.length === 0}
                  >
                    Export as CSV
                  </Button>
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={() => handleBulkExport("excel")}
                    disabled={selectedExportColumns.length === 0}
                  >
                    Export as Excel
                  </Button>
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={() => handleBulkExport("pdf")}
                    disabled={selectedExportColumns.length === 0}
                  >
                    Export as PDF (Print)
                  </Button>
                </Space>
              </div>

              <div className="text-xs text-gray-500 mt-4">
                * {displayPackages?.length || 0} rows will be exported based on
                current filters
              </div>
            </div>
          </Modal>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

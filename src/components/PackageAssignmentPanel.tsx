import React, { useMemo, useState } from "react";
import {
  Table,
  Button,
  Alert,
  Space,
  Typography,
  Row,
  Col,
  Input,
  InputNumber,
  Select,
  Tag,
  Popconfirm,
  Modal,
  Checkbox,
  Divider,
} from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  EditOutlined,
  ReloadOutlined,
  DownloadOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import dayjs from "dayjs";
import { Package, Currency, PackageStatusPackages } from "@/types/package";
import { ShippingMode } from "@/types/exchangeRate";
import {
  usePackingList,
  useUnassignedPackages,
  usePackingListMutations,
} from "@/hooks/usePackingLists";
import { Customer } from "@/types/customer";
import { useCities } from "@/hooks/useCities";
import { usePackages } from "@/hooks/usePackages";
import { PackingListStatus } from "@/types/packingList";
import { packageStatusColors } from "@/app/packages/page";
import { useRegenerateInvoicePdf } from "@/hooks/useInvoices";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types/user";

const { Text } = Typography;

interface PackageAssignmentProps {
  packingListId: string;
  selectedPackageIds: string[];
  handleAddPackage: (id: string) => void;
  handleRemovePackage: (id: string) => void;
  isRemovingPackages: boolean;
}
const containerTypeMap = {
  CONTAINER: ShippingMode.SEA,
  BAG: ShippingMode.AIR,
};

export const PackageAssignmentPanel: React.FC<PackageAssignmentProps> = ({
  packingListId,
  selectedPackageIds,
  handleAddPackage,
  handleRemovePackage,
  isRemovingPackages,
}) => {
  const { data: packingListData } = usePackingList(packingListId || "");
  const { user } = useAuth();

  const [unassignedPage, setUnassignedPage] = useState(1);
  const shippingMode =
    containerTypeMap[packingListData?.container?.containerType || "BAG"];

  const { data: paginatedUnassignedPackages } = useUnassignedPackages({
    page: unassignedPage,
    shippingMode,
  });
  const { data: cities } = useCities();
  const { updateMutation } = usePackages();
  const { mutateAsync: regenerateInvoicePdfMutation } =
    useRegenerateInvoicePdf();
  const { unfinalizePackingList, isUnfinalizing } = usePackingListMutations();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempPackage, setTempPackage] = useState<Partial<Package> | null>(null);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([
    "trackingCode",
    "customer",
    "description",
    "quantity",
    "weightOrCbm",
    "destinationCity",
    "shippingRate",
    "shippingCost",
    "currency",
    "status",
    "paymentStatus",
    "pickupCode",
  ]);

  // Search states
  const [assignedSearch, setAssignedSearch] = useState({
    trackingCode: "",
    customerCode: "",
    pickupCode: "",
    name: "",
  });
  const [availableSearch, setAvailableSearch] = useState({
    trackingCode: "",
    customerCode: "",
    pickupCode: "",
    name: "",
  });

  const selectedPackages = useMemo(() => {
    return (
      paginatedUnassignedPackages?.filter((pkg) =>
        selectedPackageIds.includes(pkg.id)
      ) || []
    );
  }, [paginatedUnassignedPackages, selectedPackageIds]);

  // Filtered assigned packages
  const filteredAssignedPackages = useMemo(() => {
    if (!packingListData?.packages) return [];

    return packingListData.packages.filter((pkg) => {
      const matchesTrackingCode =
        !assignedSearch.trackingCode ||
        pkg.trackingCode
          ?.toLowerCase()
          .includes(assignedSearch.trackingCode.toLowerCase());

      const matchesCustomerCode =
        !assignedSearch.customerCode ||
        pkg.customer?.phoneNumber
          ?.toLowerCase()
          .includes(assignedSearch.customerCode.toLowerCase());

      const matchesPickupCode =
        !assignedSearch.pickupCode ||
        pkg.pickupCode
          ?.toLowerCase()
          .includes(assignedSearch.pickupCode.toLowerCase());

      const matchesName =
        !assignedSearch.name ||
        `${pkg.customer?.firstName || ""} ${pkg.customer?.lastName || ""}`
          .toLowerCase()
          .includes(assignedSearch.name.toLowerCase());

      return (
        matchesTrackingCode &&
        matchesCustomerCode &&
        matchesPickupCode &&
        matchesName
      );
    });
  }, [packingListData?.packages, assignedSearch]);

  // Filtered available packages
  const filteredAvailablePackages = useMemo(() => {
    if (!paginatedUnassignedPackages) return [];

    return paginatedUnassignedPackages.filter((pkg) => {
      const matchesTrackingCode =
        !availableSearch.trackingCode ||
        pkg.trackingCode
          ?.toLowerCase()
          .includes(availableSearch.trackingCode.toLowerCase());

      const matchesCustomerCode =
        !availableSearch.customerCode ||
        pkg.customer?.phoneNumber
          ?.toLowerCase()
          .includes(availableSearch.customerCode.toLowerCase());

      const matchesPickupCode =
        !availableSearch.pickupCode ||
        pkg.pickupCode
          ?.toLowerCase()
          .includes(availableSearch.pickupCode.toLowerCase());

      const matchesName =
        !availableSearch.name ||
        `${pkg.customer?.firstName || ""} ${pkg.customer?.lastName || ""}`
          .toLowerCase()
          .includes(availableSearch.name.toLowerCase());

      return (
        matchesTrackingCode &&
        matchesCustomerCode &&
        matchesPickupCode &&
        matchesName
      );
    });
  }, [paginatedUnassignedPackages, availableSearch]);

  const handleRegenerateInvoice = async (record: Package) => {
    if (!record.invoiceId) {
      // Handle error - no invoice associated
      return;
    }
    try {
      await regenerateInvoicePdfMutation(record.invoiceId);
      // Handle success
    } catch (error) {
      console.error("Regenerate invoice failed:", error);
      // Handle error
    }
  };

  // Unfinalize packing list (SUPER_ADMIN only)
  const handleUnfinalizePackingList = async () => {
    if (!packingListId) return;

    try {
      await unfinalizePackingList.mutateAsync(packingListId);
      toast.success(
        "Packing list unfinalized successfully. You can now add more packages."
      );
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to unfinalize packing list"
      );
    }
  };

  // Export column options
  const exportColumnOptions = [
    { label: "Tracking Code", value: "trackingCode" },
    { label: "Customer", value: "customer" },
    { label: "Description", value: "description" },
    { label: "Quantity", value: "quantity" },
    {
      label: shippingMode === ShippingMode.AIR ? "Weight (kg)" : "CBM",
      value: "weightOrCbm",
    },
    { label: "Destination City", value: "destinationCity" },
    { label: "Shipping Rate", value: "shippingRate" },
    { label: "Shipping Cost", value: "shippingCost" },
    { label: "Currency", value: "currency" },
    { label: "Mode", value: "shippingMode" },
    { label: "Status", value: "status" },
    { label: "Payment Status", value: "paymentStatus" },
    { label: "Pickup Code", value: "pickupCode" },
  ];

  // Export functions
  const handleExport = (format: "csv" | "excel" | "pdf") => {
    if (selectedExportColumns.length === 0) {
      toast.error("Please select at least one column to export");
      return;
    }

    const assignedPackages = packingListData?.packages || [];
    if (assignedPackages.length === 0) {
      toast.error("No packages to export");
      return;
    }

    // Prepare data based on selected columns
    const dataToExport = assignedPackages.map((pkg: Package) => {
      const row: any = {};

      selectedExportColumns.forEach((col) => {
        switch (col) {
          case "trackingCode":
            row["Tracking Code"] = pkg.trackingCode;
            break;
          case "customer":
            row["Customer"] = pkg.customer
              ? `${pkg.customer.firstName} ${pkg.customer.lastName || ""}`
              : "N/A";
            row["Contact"] = pkg.customer?.phoneNumber || "N/A";
            break;
          case "description":
            row["Description"] = pkg.description || "N/A";
            break;
          case "quantity":
            row["Quantity"] = pkg.quantity || 1;
            break;
          case "weightOrCbm":
            const isWeight = shippingMode === ShippingMode.AIR;
            row[isWeight ? "Weight (kg)" : "CBM"] = isWeight
              ? pkg.weight
                ? pkg.weight.toFixed(2)
                : "0.00"
              : pkg.cbm
              ? pkg.cbm.toFixed(3)
              : "0.000";
            break;
          case "destinationCity":
            const city = cities?.data?.find(
              (c) => c.id === pkg.destinationCityId
            );
            row["Destination City"] = city ? city.name : "N/A";
            break;
          case "shippingRate":
            row["Shipping Rate"] = pkg.shippingRate
              ? pkg.shippingRate.toFixed(2)
              : "0.00";
            break;
          case "shippingCost":
            row["Shipping Cost"] = pkg.shippingCost
              ? pkg.shippingCost.toFixed(2)
              : "0.00";
            break;
          case "currency":
            row["Currency"] = pkg.shippingCurrency || Currency.USD;
            break;
          case "shippingMode":
            row["Mode"] = pkg.shippingMode || "N/A";
            break;
          case "status":
            row["Status"] = pkg.status ? pkg.status.replace("_", " ") : "N/A";
            break;
          case "paymentStatus":
            row["Payment Status"] = pkg.paymentStatus || "N/A";
            break;
          case "pickupCode":
            row["Pickup Code"] = pkg.pickupCode || "N/A";
            break;
        }
      });

      return row;
    });

    // Export based on format
    if (format === "csv") {
      exportToCSV(dataToExport);
    } else if (format === "excel") {
      exportToExcel(dataToExport);
    } else if (format === "pdf") {
      exportToPDF(dataToExport);
    }

    setIsExportModalVisible(false);
    toast.success(
      `Assigned packages exported as ${format.toUpperCase()} successfully`
    );
  };

  const exportToCSV = (data: any[]) => {
    if (!data || data.length === 0) return;

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
    link.download = `packing-list-${
      packingListData?.name || "packages"
    }-${dayjs().format("YYYY-MM-DD")}.csv`;
    link.click();
  };

  const exportToExcel = (data: any[]) => {
    if (!data || data.length === 0) return;

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
    link.download = `packing-list-${
      packingListData?.name || "packages"
    }-${dayjs().format("YYYY-MM-DD")}.xlsx`;
    link.click();
  };

  const exportToPDF = (data: any[]) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packing List Packages - ${
            packingListData?.name || "Export"
          }</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 10px; }
            .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Assigned Packages - ${
            packingListData?.name || "Packing List"
          }</h1>
          <div class="subtitle">${dayjs().format("DD MMM, YYYY HH:mm")}</div>
          <div class="subtitle">Total Packages: ${data.length}</div>
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

  // Assigned packages table columns
  const assignedPackageColumns = [
    {
      title: "Tracking Code",
      dataIndex: "trackingCode",
      key: "trackingCode",
      width: 120,
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer: Customer) =>
        customer ? (
          <div>
            <div>{`${customer.firstName} ${
              customer.lastName || "" || ""
            }`}</div>
            {customer.phoneNumber && (
              <div className="text-xs text-gray-500">
                Contact: {customer.phoneNumber}
              </div>
            )}
          </div>
        ) : (
          "N/A"
        ),
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
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 70,
      render: (quantity: number, record: Package) => {
        if (editingKey === record.id) {
          return (
            <InputNumber
              value={tempPackage?.quantity ?? quantity ?? 1}
              onChange={(v) =>
                setTempPackage((prev) =>
                  prev ? { ...prev, quantity: v ?? 1 } : null
                )
              }
              min={1}
              style={{ width: "100%" }}
            />
          );
        } else {
          return quantity || 1;
        }
      },
    },
    {
      title: shippingMode === ShippingMode.AIR ? "Weight (kg)" : "CBM",
      dataIndex: shippingMode === ShippingMode.AIR ? "weight" : "cbm",
      key: "weightOrCbm",
      width: 80,
      render: (value: number | null, record: Package) => {
        const isWeight = shippingMode === ShippingMode.AIR;
        const displayValue = isWeight
          ? value
            ? value.toFixed(2)
            : "0.00"
          : value
          ? value.toFixed(3)
          : "0.000";
        const tempValue = isWeight ? tempPackage?.weight : tempPackage?.cbm;

        if (editingKey === record.id) {
          return (
            <InputNumber
              value={tempValue ?? value ?? 0}
              onChange={(v) =>
                setTempPackage((prev) =>
                  prev ? { ...prev, [isWeight ? "weight" : "cbm"]: v } : null
                )
              }
              min={0}
              step={0.01}
              style={{ width: "100%" }}
            />
          );
        } else {
          return displayValue;
        }
      },
    },
    {
      title: "Destination City",
      dataIndex: "destinationCityId",
      key: "destinationCityId",
      width: 150,
      render: (destinationCityId: string, record: Package) => {
        if (editingKey === record.id) {
          return (
            <Select
              placeholder="Select city"
              style={{ width: "100%" }}
              value={
                tempPackage?.destinationCityId ?? destinationCityId ?? undefined
              }
              onChange={(value) =>
                setTempPackage((prev) =>
                  prev ? { ...prev, destinationCityId: value } : null
                )
              }
              allowClear
            >
              {cities?.data?.map((city) => (
                <Select.Option key={city.id} value={city.id}>
                  {city.name}
                </Select.Option>
              ))}
            </Select>
          );
        } else {
          const city = cities?.data?.find((c) => c.id === destinationCityId);
          return city ? city.name : "N/A";
        }
      },
    },
    {
      title: "Shipping Rate",
      dataIndex: "shippingRate",
      key: "shippingRate",
      width: 120,
      render: (shippingRate: number, record: Package) => {
        if (editingKey === record.id) {
          return (
            <InputNumber
              value={tempPackage?.shippingRate ?? shippingRate ?? 0}
              onChange={(v) =>
                setTempPackage((prev) =>
                  prev ? { ...prev, shippingRate: v } : null
                )
              }
              min={0}
              step={0.01}
              style={{ width: "100%" }}
              placeholder="0.00"
            />
          );
        } else {
          return shippingRate ? shippingRate.toFixed(2) : "0.00";
        }
      },
    },
    {
      title: "Shipping Cost",
      dataIndex: "shippingCost",
      key: "shippingCost",
      width: 120,
      render: (shippingCost: number) =>
        shippingCost ? shippingCost.toFixed(2) : "0.00",
    },
    {
      title: "Currency",
      dataIndex: "shippingCurrency",
      key: "shippingCurrency",
      width: 80,
      render: (shippingCurrency: Currency, record: Package) => {
        if (editingKey === record.id) {
          return (
            <Select
              value={
                tempPackage?.shippingCurrency ??
                shippingCurrency ??
                Currency.USD
              }
              onChange={(value) =>
                setTempPackage((prev) =>
                  prev ? { ...prev, shippingCurrency: value } : null
                )
              }
              style={{ width: "100%" }}
            >
              <Select.Option value={Currency.USD}>USD</Select.Option>
              <Select.Option value={Currency.GHS}>GHS</Select.Option>
            </Select>
          );
        } else {
          return shippingCurrency || Currency.USD;
        }
      },
    },
    {
      title: "Mode",
      dataIndex: "shippingMode",
      key: "shippingMode",
      width: 80,
      render: (mode: string) => mode,
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
      title: "Payment Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 120,
      render: (paymentStatus: string) => {
        const colorMap: { [key: string]: string } = {
          PENDING: "orange",
          PAID: "green",
          OVERDUE: "red",
        };
        return (
          <Tag color={colorMap[paymentStatus] || "default"}>
            {paymentStatus || "N/A"}
          </Tag>
        );
      },
    },
    {
      title: "Pickup Code",
      dataIndex: "pickupCode",
      key: "pickupCode",
      width: 120,
      render: (pickupCode: string, record: Package) => {
        if (editingKey === record.id) {
          return (
            <Input
              value={tempPackage?.pickupCode ?? pickupCode ?? ""}
              onChange={(e) =>
                setTempPackage((prev) =>
                  prev ? { ...prev, pickupCode: e.target.value } : null
                )
              }
              style={{ width: "100%" }}
              placeholder="Pickup Code"
            />
          );
        } else {
          return pickupCode || "N/A";
        }
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: any, record: Package) => {
        if (editingKey === record.id) {
          const isLoading = updateMutation.isPending;
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                loading={isLoading}
                onClick={() => {
                  if (editingKey && tempPackage) {
                    updateMutation.mutate(
                      { id: editingKey, payload: tempPackage, packingListId },
                      {
                        onSuccess: () => {
                          setEditingKey(null);
                          setTempPackage(null);
                        },
                        onError: () => {
                          // handle error if needed
                        },
                      }
                    );
                  }
                }}
              >
                Save
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setEditingKey(null);
                  setTempPackage(null);
                }}
              >
                Cancel
              </Button>
            </Space>
          );
        } else {
          return (
            <Space>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingKey(record.id);
                  setTempPackage({
                    quantity: record.quantity,
                    weight: record.weight,
                    cbm: record.cbm,
                    destinationCityId: record.destinationCityId,
                    shippingCurrency: record.shippingCurrency || Currency.USD,
                    shippingRate: record.shippingRate,
                    pickupCode: record.pickupCode,
                  });
                }}
                size="small"
              >
                Edit
              </Button>
              <Button
                type="link"
                danger
                icon={<MinusOutlined />}
                loading={isRemovingPackages}
                onClick={() => handleRemovePackage(record.id)}
                disabled={
                  packingListData?.status === PackingListStatus.FINALIZED
                }
                size="small"
              >
                Remove
              </Button>
              {record.invoiceId && (
                <Popconfirm
                  title="Regenerate Invoice PDF"
                  description="Are you sure you want to regenerate the invoice PDF?"
                  onConfirm={() => handleRegenerateInvoice(record)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="link" icon={<ReloadOutlined />} size="small" />
                </Popconfirm>
              )}
            </Space>
          );
        }
      },
    },
  ];

  // Package table columns for available packages
  const availablePackageColumns = [
    {
      title: "Tracking Code",
      dataIndex: "trackingCode",
      key: "trackingCode",
      width: 120,
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer: any) =>
        customer ? (
          <div>
            <div>{`${customer.firstName} ${
              customer.lastName || "" || ""
            }`}</div>
            {customer.phoneNumber && (
              <div className="text-xs text-gray-500">
                Contact: {customer.phoneNumber}
              </div>
            )}
          </div>
        ) : (
          "N/A"
        ),
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
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 60,
      render: (quantity: number) => quantity || 1,
    },
    {
      title: shippingMode === ShippingMode.AIR ? "Weight (kg)" : "CBM",
      dataIndex: shippingMode === ShippingMode.AIR ? "weight" : "cbm",
      key: "weightOrCbm",
      width: 80,
      render: (value: number) => {
        return shippingMode === ShippingMode.AIR
          ? value
            ? value.toFixed(2)
            : "0.00"
          : value
          ? value.toFixed(3)
          : "0.000";
      },
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
      title: "Payment Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 120,
      render: (paymentStatus: string) => {
        const colorMap: { [key: string]: string } = {
          PENDING: "orange",
          PAID: "green",
          OVERDUE: "red",
        };
        return (
          <Tag color={colorMap[paymentStatus] || "default"}>
            {paymentStatus || "N/A"}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: Package) => (
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={() => handleAddPackage(record.id)}
          size="small"
          disabled={selectedPackageIds.includes(record.id)}
        >
          Add
        </Button>
      ),
    },
  ];

  // Selected packages table columns
  const selectedPackageColumns = [
    {
      title: "Tracking Code",
      dataIndex: "trackingCode",
      key: "trackingCode",
      width: 120,
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer: Customer) =>
        customer ? (
          <div>
            <div>{`${customer.firstName} ${
              customer.lastName || "" || ""
            }`}</div>
            {customer.phoneNumber && (
              <div className="text-xs text-gray-500">
                Contact: {customer.phoneNumber}
              </div>
            )}
          </div>
        ) : (
          "N/A"
        ),
      width: 180,
    },
    {
      title: shippingMode === ShippingMode.AIR ? "Weight (kg)" : "CBM",
      dataIndex: shippingMode === ShippingMode.AIR ? "weight" : "cbm",
      key: "weightOrCbm",
      width: 80,
      render: (value: number) => {
        return shippingMode === ShippingMode.AIR
          ? value
            ? value.toFixed(2)
            : "N/A"
          : value
          ? value.toFixed(3)
          : "N/A";
      },
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 60,
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
      title: "Payment Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 120,
      render: (paymentStatus: string) => {
        const colorMap: { [key: string]: string } = {
          PENDING: "orange",
          PAID: "green",
          OVERDUE: "red",
        };
        return (
          <Tag color={colorMap[paymentStatus] || "default"}>
            {paymentStatus || "N/A"}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: Package) => (
        <Button
          type="link"
          danger
          icon={<MinusOutlined />}
          onClick={() => handleRemovePackage(record.id)}
          size="small"
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6">
        {/* Assigned Packages */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Text strong className="text-lg">
              Assigned Packages ({filteredAssignedPackages.length})
            </Text>
            {packingListData?.packages &&
              packingListData.packages.length > 0 && (
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => setIsExportModalVisible(true)}
                  size="small"
                >
                  Export
                </Button>
              )}
          </div>

          {/* Assigned Packages Search */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by Tracking Code"
              value={assignedSearch.trackingCode}
              onChange={(e) =>
                setAssignedSearch((prev) => ({
                  ...prev,
                  trackingCode: e.target.value,
                }))
              }
              allowClear
            />
            <Input
              placeholder="Search by Customer Code"
              value={assignedSearch.customerCode}
              onChange={(e) =>
                setAssignedSearch((prev) => ({
                  ...prev,
                  customerCode: e.target.value,
                }))
              }
              allowClear
            />
            <Input
              placeholder="Search by Pickup Code"
              value={assignedSearch.pickupCode}
              onChange={(e) =>
                setAssignedSearch((prev) => ({
                  ...prev,
                  pickupCode: e.target.value,
                }))
              }
              allowClear
            />
            <Input
              placeholder="Search by Name"
              value={assignedSearch.name}
              onChange={(e) =>
                setAssignedSearch((prev) => ({ ...prev, name: e.target.value }))
              }
              allowClear
            />
          </div>
          {packingListData?.status === "FINALIZED" && (
            <>
              {user?.role === Role.SUPER_ADMIN ? (
                <Alert
                  message="Packing List is Finalized"
                  description={
                    <div className="flex items-center justify-between">
                      <span>
                        This packing list is finalized. As SUPER ADMIN, you can
                        unfinalize it to add more packages.
                      </span>
                      <Popconfirm
                        title="Unfinalize Packing List?"
                        description="This will change the status back to DRAFT. Existing invoices will remain unchanged."
                        onConfirm={handleUnfinalizePackingList}
                        okText="Yes, Unfinalize"
                        cancelText="Cancel"
                      >
                        <Button
                          type="primary"
                          icon={<RollbackOutlined />}
                          loading={isUnfinalizing}
                          danger
                          size="small"
                        >
                          Unfinalize
                        </Button>
                      </Popconfirm>
                    </div>
                  }
                  type="warning"
                  showIcon
                  className="mb-2"
                />
              ) : (
                <Alert
                  message="This packing list is finalized. You cannot modify assigned packages."
                  type="warning"
                  showIcon
                  className="mb-2"
                />
              )}
            </>
          )}
          {packingListData?.packages && packingListData.packages.length > 0 ? (
            <Table
              columns={assignedPackageColumns}
              dataSource={filteredAssignedPackages}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: false,
              }}
              scroll={{ y: 400 }}
              size="small"
            />
          ) : (
            <Text>No packages assigned to this packing list.</Text>
          )}
        </div>

        {/* Available Packages */}
        {packingListData?.status === PackingListStatus.DRAFT && (
          <div>
            <Text strong className="text-lg mb-2 block">
              Available Packages ({filteredAvailablePackages.length})
            </Text>

            {/* Available Packages Search */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by Tracking Code"
                value={availableSearch.trackingCode}
                onChange={(e) =>
                  setAvailableSearch((prev) => ({
                    ...prev,
                    trackingCode: e.target.value,
                  }))
                }
                allowClear
              />
              <Input
                placeholder="Search by Customer Code"
                value={availableSearch.customerCode}
                onChange={(e) =>
                  setAvailableSearch((prev) => ({
                    ...prev,
                    customerCode: e.target.value,
                  }))
                }
                allowClear
              />
              <Input
                placeholder="Search by Pickup Code"
                value={availableSearch.pickupCode}
                onChange={(e) =>
                  setAvailableSearch((prev) => ({
                    ...prev,
                    pickupCode: e.target.value,
                  }))
                }
                allowClear
              />
              <Input
                placeholder="Search by Name"
                value={availableSearch.name}
                onChange={(e) =>
                  setAvailableSearch((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                allowClear
              />
            </div>

            <Table
              columns={availablePackageColumns}
              dataSource={filteredAvailablePackages}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: false,
                onChange: (page) => {
                  setUnassignedPage(page);
                },
              }}
              scroll={{ y: 400 }}
              size="small"
            />
          </div>
        )}

        {/* Selected Packages */}
        {packingListData?.status === PackingListStatus.DRAFT && (
          <div>
            <Text strong className="text-lg mb-2 block">
              Selected Packages ({selectedPackageIds.length})
            </Text>
            <Table
              columns={selectedPackageColumns}
              dataSource={selectedPackages}
              rowKey="id"
              pagination={false}
              scroll={{ y: 400 }}
              size="small"
            />
          </div>
        )}
      </div>

      {/* Export Modal */}
      <Modal
        title="Export Assigned Packages"
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
                onClick={() => handleExport("csv")}
                disabled={selectedExportColumns.length === 0}
              >
                Export as CSV
              </Button>
              <Button
                block
                icon={<DownloadOutlined />}
                onClick={() => handleExport("excel")}
                disabled={selectedExportColumns.length === 0}
              >
                Export as Excel
              </Button>
              <Button
                block
                icon={<DownloadOutlined />}
                onClick={() => handleExport("pdf")}
                disabled={selectedExportColumns.length === 0}
              >
                Export as PDF (Print)
              </Button>
            </Space>
          </div>

          <div className="text-xs text-gray-500 mt-4">
            * {packingListData?.packages?.length || 0} packages will be exported
          </div>
        </div>
      </Modal>
    </div>
  );
};

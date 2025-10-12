// src/app/cities/page.tsx

"use client";

import React, { useState } from "react";
import { Table, Button, Input, Card } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useCities, useCityMutations } from "@/hooks/useCities";
import { City } from "@/types/exchangeRate";
import { getCityColumns } from "@/app/cities/columns";
import { CityModal } from "@/components/CityModal";
import { toast } from "sonner";
import { handleError } from "@/utils/forms/errorUtils";

export default function CitiesPage() {
  // State for UI
  const [searchText, setSearchText] = useState("");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // React Query hooks
  const { data: cities, isLoading } = useCities({
    page: currentPage,
    limit: pageSize,
    search: searchText,
  });

  const { createCity, updateCity, deleteCity, isCreating, isUpdating, isDeleting } = useCityMutations();

  // Handlers
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleCreateCity = async (values: { name: string; country: string }) => {
    try {
      await createCity(values);
      toast.success("City created successfully");
      setIsCreateModalVisible(false);
    } catch (err) {
      handleError(err);
    }
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setIsEditModalVisible(true);
  };

  const handleUpdateCity = async (values: { name: string; country: string }) => {
    if (!editingCity) return;
    try {
      await updateCity({ id: editingCity.id, payload: values });
      toast.success("City updated successfully");
      setIsEditModalVisible(false);
      setEditingCity(null);
    } catch (error) {
      handleError(error);
    }
  };

  const handleDeleteCity = async (id: string) => {
    try {
      await deleteCity(id);
      toast.success("City deleted successfully");
    } catch (error) {
      handleError(error);
    }
  };

  // Table columns
  const columns = getCityColumns({
    onEdit: handleEditCity,
    onDelete: handleDeleteCity,
    loading: {
      deleting: isDeleting,
    },
  });

  return (
    <AuthGuard>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 w-full mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h1 className="text-2xl font-bold">City Management</h1>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
            >
              Add City
            </Button>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <Input
              placeholder="Search cities..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              className="max-w-sm"
            />
          </Card>

          {/* Cities Table */}
          <Card className="flex-1">
            <Table
              columns={columns}
              dataSource={cities?.data || []}
              loading={isLoading}
              rowKey="id"
              scroll={{ x: true }}
              pagination={{
                current: currentPage,
                pageSize,
                total: cities?.meta.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} cities`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
              }}
            />
          </Card>

          {/* Create City Modal */}
          <CityModal
            visible={isCreateModalVisible}
            onCancel={() => setIsCreateModalVisible(false)}
            onSubmit={handleCreateCity}
            loading={isCreating}
            mode="create"
          />

          {/* Edit City Modal */}
          <CityModal
            visible={isEditModalVisible}
            onCancel={() => {
              setIsEditModalVisible(false);
              setEditingCity(null);
            }}
            onSubmit={handleUpdateCity}
            loading={isUpdating}
            mode="edit"
            initialValues={editingCity ? { name: editingCity.name, country: editingCity.country } : undefined}
          />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

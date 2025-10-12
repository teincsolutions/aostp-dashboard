// src/components/CityModal.tsx

"use client";

import React from "react";
import { Modal, Row, Col, Input, Button } from "antd";
import { Formik, FormikProps } from "formik";
import * as Yup from "yup";
import { getServerValidationErrors } from "@/utils/forms/errorUtils";
import { toast } from "sonner";

interface CityFormikValues {
  name: string;
  country: string;
}

interface CityModalProps {
  visible: boolean;
  onCancel: () => void;
  loading?: boolean;
  mode: "create" | "edit";
  initialValues?: Partial<CityFormikValues>;
  onSubmit: (values: CityFormikValues) => Promise<void>;
}

const citySchema = Yup.object().shape({
  name: Yup.string().required("City name is required").min(2, "City name must be at least 2 characters"),
  country: Yup.string().required("Country is required").min(2, "Country must be at least 2 characters"),
});

export const CityModal: React.FC<CityModalProps> = ({
  visible,
  onCancel,
  loading,
  mode,
  initialValues = {},
  onSubmit,
}) => {
  return (
    <Modal
      title={mode === "create" ? "Create New City" : "Edit City"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      <Formik<CityFormikValues>
        initialValues={{
          name: "",
          country: "",
          ...initialValues,
        }}
        validationSchema={citySchema}
        enableReinitialize={true}
        onSubmit={async (values, { setErrors, resetForm }) => {
          try {
            await onSubmit(values);
            resetForm();
          } catch (error: any) {
            const fieldErrors = getServerValidationErrors(error);
            if (fieldErrors) {
              setErrors(fieldErrors);
            } else {
              toast.error(
                error.response?.data?.message || "Something went wrong"
              );
            }
          }
        }}
      >
        {(formik) => (
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <Row gutter={16}>
              <Col xs={24}>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    City Name *
                  </label>
                  <Input
                    placeholder="Enter city name"
                    value={formik.values.name}
                    onChange={(e) =>
                      formik.setFieldValue("name", e.target.value)
                    }
                    onBlur={() => formik.setFieldTouched("name", true)}
                    status={
                      formik.touched.name && formik.errors.name ? "error" : ""
                    }
                  />
                  {formik.touched.name && formik.errors.name && (
                    <div className="text-red-500 text-xs">
                      {formik.errors.name}
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24}>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Country *
                  </label>
                  <Input
                    placeholder="Enter country"
                    value={formik.values.country}
                    onChange={(e) =>
                      formik.setFieldValue("country", e.target.value)
                    }
                    onBlur={() => formik.setFieldTouched("country", true)}
                    status={
                      formik.touched.country && formik.errors.country
                        ? "error"
                        : ""
                    }
                  />
                  {formik.touched.country && formik.errors.country && (
                    <div className="text-red-500 text-xs">
                      {formik.errors.country}
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button onClick={onCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {mode === "create" ? "Create City" : "Update City"}
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </Modal>
  );
};

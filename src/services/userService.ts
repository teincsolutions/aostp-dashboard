
import { User, UserCreatePayload, UserUpdatePayload, Role } from "@/types/user";
import { apiService } from "./api";

export interface GetUsersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  role?: Role;
  isActive?: boolean;
  search?: string;
}

export interface GetUsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

const userService = {
  getUsers: async (params: GetUsersParams): Promise<GetUsersResponse> => {
    const res = await apiService.get("/api/v1/users", { params });
    return res.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const res = await apiService.get(`/api/v1/users/${id}`);
    return res.data;
  },

  createUser: async (payload: UserCreatePayload): Promise<User> => {
    const res = await apiService.post("/api/v1/users", payload);
    return res.data;
  },

  updateUser: async (id: string, payload: UserUpdatePayload): Promise<User> => {
    const res = await apiService.patch(`/api/v1/users/${id}`, payload);
    return res.data;
  },

  toggleUserStatus: async (id: string, isActive: boolean): Promise<User> => {
    const endpoint = isActive
      ? `/api/v1/users/${id}/activate`
      : `/api/v1/users/${id}/deactivate`;
    const res = await apiService.patch(endpoint);
    return res.data;
  },

  resetUserPassword: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiService.post(`/api/v1/users/${id}/reset-password`);
    return res.data;
  },

  setUserRoles: async (id: string, roles: Role[]): Promise<User> => {
    const res = await apiService.patch(`/api/v1/users/${id}/roles`, { roles });
    return res.data;
  },

  enable2FA: async (id: string): Promise<User> => {
    const res = await apiService.post(`/api/v1/users/${id}/2fa/enable`);
    return res.data;
  },

  disable2FA: async (id: string): Promise<User> => {
    const res = await apiService.post(`/api/v1/users/${id}/2fa/disable`);
    return res.data;  
  },
};

export default userService;

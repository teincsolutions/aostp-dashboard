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
    const res = await apiService.get("/users", { params });
    return res.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const res = await apiService.get(`/users/${id}`);
    return res.data;
  },

  createUser: async (payload: UserCreatePayload): Promise<User> => {
    const res = await apiService.post("/users", payload);
    return res.data;
  },

  updateUser: async (id: string, payload: UserUpdatePayload): Promise<User> => {
    const res = await apiService.patch(`/users/${id}`, payload);
    return res.data;
  },

  toggleUserStatus: async (id: string, isActive: boolean): Promise<User> => {
    const endpoint = isActive
      ? `/users/${id}/activate`
      : `/users/${id}/deactivate`;
    const res = await apiService.patch(endpoint);
    return res.data;
  },

  resetUserPassword: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiService.post(`/users/${id}/reset-password`);
    return res.data;
  },

  resetPasswordWithToken: async (
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiService.post(`/users/reset-password`, {
      token,
      newPassword,
    });
    return res.data;
  },

  setUserRoles: async (id: string, roles: Role[]): Promise<User> => {
    const res = await apiService.patch(`/users/${id}/roles`, { roles });
    return res.data;
  },

  enable2FA: async (id: string): Promise<User> => {
    const res = await apiService.post(`/users/${id}/2fa/enable`);
    return res.data;
  },

  disable2FA: async (id: string): Promise<User> => {
    const res = await apiService.post(`/users/${id}/2fa/disable`);
    return res.data;
  },
};

export default userService;

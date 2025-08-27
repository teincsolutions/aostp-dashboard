// src/hooks/useUsers.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userService, {
  GetUsersParams,
  GetUsersResponse,
} from "@/services/userService";
import { User, UserCreatePayload, UserUpdatePayload, Role } from "@/types/user";

export function useUsers(params: GetUsersParams) {
  return useQuery<GetUsersResponse, Error>({
    queryKey: ["users", params],
    queryFn: () => userService.getUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery<User, Error>({
    queryKey: ["user", id],
    queryFn: () => userService.getUserById(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, UserCreatePayload>({
    mutationFn: (payload) => userService.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { id: string; payload: UserUpdatePayload }>({
    mutationFn: ({ id, payload }) => userService.updateUser(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { id: string; isActive: boolean }>({
    mutationFn: ({ id, isActive }) => userService.toggleUserStatus(id, isActive),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
  });
}

// Optional hooks for endpoints not implemented
export function useResetUserPassword() {
  return useMutation<{ success: boolean }, Error, { id: string }>({
    mutationFn: ({ id }) => userService.resetUserPassword(id),
  });
}

export function useSetUserRoles() {
  return useMutation<User, Error, { id: string; roles: Role[] }>({
    mutationFn: ({ id, roles }) => userService.setUserRoles(id, roles),
  });
}

export function useEnable2FA() {
  return useMutation<User, Error, { id: string }>({
    mutationFn: ({ id }) => userService.enable2FA(id),
  });
}

export function useDisable2FA() {
  return useMutation<User, Error, { id: string }>({
    mutationFn: ({ id }) => userService.disable2FA(id),
  });
}

// src/hooks/useProfile.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyProfile,
  updateMyProfile,
  enable2FA,
  verify2FA,
  disable2FA,
  getSessions,
} from "@/services/profileService";
import { MyProfile, UpdateMyProfilePayload, SessionInfo } from "@/types/profile";

export const useProfile = () => {
  const queryClient = useQueryClient();

  // Fetch profile
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery<MyProfile>({
    queryKey: ["myProfile"],
    queryFn: getMyProfile,
  });

  // Update profile
  const {
    mutate: updateProfile,
    isPending: updateLoading,
    error: updateError,
    isSuccess: updateSuccess,
  } = useMutation<MyProfile, Error, UpdateMyProfilePayload>({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });

  // Enable 2FA
  const {
    mutate: enable2FAMutate,
    isPending: enable2FALoading,
    error: enable2FAError,
    data: enable2FAData,
  } = useMutation<{ qrCode: string; secret: string }, Error, void>({
    mutationFn: enable2FA,
  });

  // Verify 2FA
  const {
    mutate: verify2FAMutate,
    isPending: verify2FALoading,
    error: verify2FAError,
    isSuccess: verify2FASuccess,
  } = useMutation<MyProfile, Error, string>({
    mutationFn: verify2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });

  // Disable 2FA
  const {
    mutate: disable2FAMutate,
    isPending: disable2FALoading,
    error: disable2FAError,
    isSuccess: disable2FASuccess,
  } = useMutation<MyProfile, Error, string>({
    mutationFn: disable2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });

  // Fetch sessions
  const {
    data: sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useQuery<SessionInfo[]>({
    queryKey: ["sessions"],
    queryFn: getSessions,
    enabled: !!profile,
  });

  return {
    profile,
    profileLoading,
    profileError,
    updateProfile,
    updateLoading,
    updateError,
    updateSuccess,
    enable2FAMutate,
    enable2FALoading,
    enable2FAError,
    enable2FAData,
    verify2FAMutate,
    verify2FALoading,
    verify2FAError,
    verify2FASuccess,
    disable2FAMutate,
    disable2FALoading,
    disable2FAError,
    disable2FASuccess,
    sessions,
    sessionsLoading,
    sessionsError,
  };
};

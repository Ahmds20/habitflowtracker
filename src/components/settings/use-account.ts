"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export type Me = {
  id: string;
  email: string;
  name: string;
  timezone: string;
  isDemo: boolean;
  onboarded: boolean;
};

export const meKey = ["me"] as const;

export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: () => apiFetch<{ user: Me }>("/me").then((res) => res.user),
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; timezone?: string }) =>
      apiFetch<{ user: Me }>("/me", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    // The timezone changes what "today" is for habits and the dashboard.
    onSuccess: () => client.invalidateQueries(),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      apiFetch("/me/password", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (password?: string) =>
      apiFetch("/me", {
        method: "DELETE",
        body: JSON.stringify(password ? { password } : {}),
      }),
  });
}

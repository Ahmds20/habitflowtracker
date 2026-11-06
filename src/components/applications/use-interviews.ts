"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type {
  Interview,
  InterviewWithApplication,
} from "@/modules/applications/types";
import { applicationKeys } from "./use-applications";

export const interviewKeys = {
  all: ["interviews"] as const,
  list: (range: "upcoming" | "past") => ["interviews", range] as const,
};

export function useInterviews(range: "upcoming" | "past") {
  return useQuery({
    queryKey: interviewKeys.list(range),
    queryFn: () =>
      apiFetch<{ interviews: InterviewWithApplication[] }>(
        `/interviews?range=${range}`,
      ).then((res) => res.interviews),
  });
}

// Interview changes affect the application detail page and the interviews list.
function useInvalidate(applicationId: string) {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({
        queryKey: applicationKeys.detail(applicationId),
      }),
      client.invalidateQueries({ queryKey: interviewKeys.all }),
    ]);
}

export function useSaveInterview(applicationId: string) {
  const invalidate = useInvalidate(applicationId);
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id?: string;
      body: Record<string, unknown>;
    }) =>
      apiFetch<{ interview: Interview }>(
        id ? `/interviews/${id}` : `/applications/${applicationId}/interviews`,
        { method: id ? "PATCH" : "POST", body: JSON.stringify(body) },
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteInterview(applicationId: string) {
  const invalidate = useInvalidate(applicationId);
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/interviews/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

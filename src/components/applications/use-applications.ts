"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { dashboardKey } from "@/components/dashboard/use-dashboard";
import { ApiError, apiFetch } from "@/lib/api-client";
import type {
  ApplicationOutcome,
  ApplicationStatus,
} from "@/modules/applications/applications.schema";
import { useI18n } from "@/i18n/client";
import { statusText } from "@/modules/applications/labels";
import type {
  ApplicationDetail,
  ApplicationSummary,
} from "@/modules/applications/types";

export const applicationKeys = {
  all: ["applications"] as const,
  list: () => ["applications", "list"] as const,
  detail: (id: string) => ["applications", "detail", id] as const,
};

// Turns any thrown value into a message in the current language. API errors
// are translated when the dictionary knows them (t.serverMessages).
export function useErrorMessage() {
  const { t } = useI18n();
  return (error: unknown) =>
    error instanceof ApiError
      ? (t.serverMessages[error.message] ?? error.message)
      : t.common.somethingWrong;
}

// The board loads every application once and filters on the client.
// Data per user is small (the API caps lists at 500).
export function useApplications() {
  return useQuery({
    queryKey: applicationKeys.list(),
    queryFn: () =>
      apiFetch<{ applications: ApplicationSummary[] }>("/applications").then(
        (res) => res.applications,
      ),
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () =>
      apiFetch<{ application: ApplicationDetail }>(`/applications/${id}`).then(
        (res) => res.application,
      ),
  });
}

// Applications also feed the dashboard (pipeline, weekly goal) and the linked
// "send applications" habit, so refresh those too. The habits key is written
// out here because importing it would create an import cycle with use-habits.
function invalidateAll(client: QueryClient) {
  return Promise.all([
    client.invalidateQueries({ queryKey: applicationKeys.all }),
    client.invalidateQueries({ queryKey: dashboardKey }),
    client.invalidateQueries({ queryKey: ["habits"] }),
  ]);
}

export function useCreateApplication() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<{ application: ApplicationDetail }>("/applications", {
        method: "POST",
        body: JSON.stringify(body),
      }).then((res) => res.application),
    onSuccess: () => invalidateAll(client),
  });
}

export function useUpdateApplication(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<{ application: ApplicationDetail }>(`/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }).then((res) => res.application),
    onSuccess: (application) => {
      client.setQueryData(applicationKeys.detail(id), application);
      return invalidateAll(client);
    },
  });
}

export function useDeleteApplication() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/applications/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: applicationKeys.detail(id) });
      return invalidateAll(client);
    },
  });
}

type StatusChange = {
  id: string;
  status: ApplicationStatus;
  outcome?: ApplicationOutcome;
};

function putStatus({ id, status, outcome }: StatusChange) {
  return apiFetch<{ application: ApplicationDetail }>(
    `/applications/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ status, outcome }) },
  );
}

// Moves a card immediately (optimistic), rolls back on error,
// and offers Undo, which is just another status change back.
export function useChangeStatus() {
  const client = useQueryClient();
  const { t } = useI18n();
  const errorMessage = useErrorMessage();

  const mutation = useMutation({
    mutationFn: putStatus,
    onMutate: async (change) => {
      await client.cancelQueries({ queryKey: applicationKeys.list() });
      const previous = client.getQueryData<ApplicationSummary[]>(
        applicationKeys.list(),
      );
      client.setQueryData<ApplicationSummary[]>(
        applicationKeys.list(),
        (list) =>
          list?.map((app) =>
            app.id === change.id
              ? {
                  ...app,
                  status: change.status,
                  outcome: change.outcome ?? null,
                  statusChangedAt: new Date().toISOString(),
                }
              : app,
          ),
      );
      return { previous };
    },
    onError: (error, _change, context) => {
      if (context?.previous) {
        client.setQueryData(applicationKeys.list(), context.previous);
      }
      toast.error(errorMessage(error));
    },
    onSettled: () => invalidateAll(client),
  });

  return (
    app: Pick<ApplicationSummary, "id" | "company" | "status" | "outcome">,
    status: ApplicationStatus,
    outcome?: ApplicationOutcome,
  ) => {
    if (app.status === status && (app.outcome ?? undefined) === outcome) return;
    const before = { status: app.status, outcome: app.outcome ?? undefined };
    mutation.mutate(
      { id: app.id, status, outcome },
      {
        onSuccess: () => {
          toast.success(
            t.applications.moved(app.company, statusText(t, status, outcome)),
            {
              action: {
                label: t.common.undo,
                onClick: () => mutation.mutate({ id: app.id, ...before }),
              },
            },
          );
        },
      },
    );
  };
}

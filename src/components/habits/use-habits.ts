"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import type { Habit, HabitDetail } from "@/modules/habits/types";
import { errorMessage } from "@/components/applications/use-applications";
import { dashboardKey } from "@/components/dashboard/use-dashboard";
import type { Dashboard } from "@/modules/dashboard/types";

export const habitKeys = {
  all: ["habits"] as const,
  list: (archived: boolean) => ["habits", "list", archived] as const,
  detail: (id: string) => ["habits", "detail", id] as const,
};

export function useHabits(archived = false) {
  return useQuery({
    queryKey: habitKeys.list(archived),
    queryFn: () =>
      apiFetch<{ habits: Habit[] }>(`/habits?archived=${archived}`).then(
        (res) => res.habits,
      ),
  });
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: habitKeys.detail(id),
    queryFn: () =>
      apiFetch<{ habit: HabitDetail }>(`/habits/${id}`).then(
        (res) => res.habit,
      ),
  });
}

function useInvalidateHabits() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: habitKeys.all });
}

export function useSaveHabit() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id?: string;
      body: Record<string, unknown>;
    }) =>
      apiFetch<{ habit: Habit }>(id ? `/habits/${id}` : "/habits", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(body),
      }).then((res) => res.habit),
    onSuccess: invalidate,
  });
}

export function useArchiveHabit() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      apiFetch<{ habit: Habit }>(
        `/habits/${id}/${archived ? "archive" : "unarchive"}`,
        { method: "POST" },
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteHabit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/habits/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: habitKeys.detail(id) });
      return client.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

type Toggle = { habit: Habit; date: string; done: boolean };

// One-click check-in. Updates the list immediately, rolls back on error,
// and offers Undo, which is just the opposite toggle.
export function useToggleCheckin() {
  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ habit, date, done }: Toggle) =>
      apiFetch<{ habit: Habit }>(`/habits/${habit.id}/checkins/${date}`, {
        method: done ? "PUT" : "DELETE",
      }).then((res) => res.habit),
    onMutate: async ({ habit, done }) => {
      const update = (h: Habit): Habit =>
        h.id === habit.id
          ? {
              ...h,
              today: { ...h.today, done },
              week: {
                ...h.week,
                done: Math.max(0, h.week.done + (done ? 1 : -1)),
              },
            }
          : h;

      // The same habit appears on the habits page and on the dashboard.
      const listKey = habitKeys.list(false);
      await Promise.all([
        client.cancelQueries({ queryKey: listKey }),
        client.cancelQueries({ queryKey: dashboardKey }),
      ]);
      const previousList = client.getQueryData<Habit[]>(listKey);
      const previousDashboard = client.getQueryData<Dashboard>(dashboardKey);
      client.setQueryData<Habit[]>(listKey, (list) => list?.map(update));
      client.setQueryData<Dashboard>(
        dashboardKey,
        (dashboard) =>
          dashboard && {
            ...dashboard,
            todayHabits: dashboard.todayHabits.map(update),
          },
      );
      return { previousList, previousDashboard };
    },
    onError: (error, _vars, context) => {
      if (context?.previousList) {
        client.setQueryData(habitKeys.list(false), context.previousList);
      }
      if (context?.previousDashboard) {
        client.setQueryData(dashboardKey, context.previousDashboard);
      }
      toast.error(errorMessage(error));
    },
    // Refetch both so streaks and the weekly consistency come from the server.
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: habitKeys.all }),
        client.invalidateQueries({ queryKey: dashboardKey }),
      ]),
  });

  return (habit: Habit, date: string, done: boolean) =>
    mutation.mutate(
      { habit, date, done },
      {
        onSuccess: () =>
          toast.success(
            done ? `${habit.name}: done` : `${habit.name}: check-in removed`,
            {
              action: {
                label: "Undo",
                onClick: () => mutation.mutate({ habit, date, done: !done }),
              },
            },
          ),
      },
    );
}

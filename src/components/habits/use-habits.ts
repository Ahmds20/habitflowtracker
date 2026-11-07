"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import type { Habit, HabitDetail } from "@/modules/habits/types";
import { errorMessage } from "@/components/applications/use-applications";

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
      const key = habitKeys.list(false);
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<Habit[]>(key);
      client.setQueryData<Habit[]>(key, (list) =>
        list?.map((h) =>
          h.id === habit.id
            ? {
                ...h,
                today: { ...h.today, done },
                week: {
                  ...h.week,
                  done: Math.max(0, h.week.done + (done ? 1 : -1)),
                },
              }
            : h,
        ),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        client.setQueryData(habitKeys.list(false), context.previous);
      }
      toast.error(errorMessage(error));
    },
    onSettled: () => client.invalidateQueries({ queryKey: habitKeys.all }),
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

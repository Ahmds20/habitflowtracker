// Client-side shape of GET /api/v1/dashboard.
import type { ApplicationStatus } from "@/modules/applications/applications.schema";
import type {
  ApplicationSummary,
  InterviewWithApplication,
} from "@/modules/applications/types";
import type { Habit } from "@/modules/habits/types";

export type Dashboard = {
  today: string;
  week: {
    start: string;
    end: string;
    applications: { done: number; target: number } | null;
    habitConsistency: number | null;
  };
  todayHabits: Habit[];
  pipeline: Record<ApplicationStatus, number>;
  upcomingInterviews: InterviewWithApplication[];
  followUps: ApplicationSummary[];
};

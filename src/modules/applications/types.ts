// Client-side shapes of the applications API (dates arrive as strings over JSON).
import type {
  ApplicationOutcome,
  ApplicationStatus,
  EmploymentType,
} from "./applications.schema";
import type { InterviewType } from "@/modules/interviews/interviews.schema";

export type ApplicationSummary = {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  outcome: ApplicationOutcome | null;
  appliedDate: string | null;
  followUpDate: string | null;
  location: string | null;
  statusChangedAt: string;
};

export type StatusEvent = {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  outcome: ApplicationOutcome | null;
  changedAt: string;
};

export type Interview = {
  id: string;
  scheduledAt: string;
  type: InterviewType;
  title: string | null;
  meetingUrl: string | null;
  notes: string | null;
};

export type ApplicationDetail = ApplicationSummary & {
  jobUrl: string | null;
  employmentType: EmploymentType | null;
  salaryExpectation: string | null;
  description: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusEvent[];
  interviews: Interview[];
};

export type InterviewWithApplication = Interview & {
  applicationId: string;
  application: { company: string; position: string };
};

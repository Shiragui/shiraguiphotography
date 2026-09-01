export const PROJECT_STATUSES = [
  "inquiry",
  "booked",
  "shooting",
  "editing",
  "delivered",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  client_id: string;
  name: string;
  project_type: string | null;
  session_date: string | null;
  status: ProjectStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  clients?: Pick<Client, "id" | "name" | "email"> | null;
};

export type Inquiry = {
  id: string;
  source: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  message: string | null;
  how_found: string | null;
  how_found_detail: string | null;
  status: "new" | "converted" | "archived";
  client_id: string | null;
  project_id: string | null;
  created_at: string;
};

export function formatProjectStatus(status: ProjectStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

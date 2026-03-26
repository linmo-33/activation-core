export interface AdminUserExportRecord {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface ActivationCodeExportRecord {
  id: number;
  code: string;
  status: "unused" | "used";
  expires_at: string | null;
  used_at: string | null;
  used_by_device_id: string | null;
  validity_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface ActivationCoreExportPayload {
  version: 1;
  exported_at: string;
  admin_users: AdminUserExportRecord[];
  activation_codes: ActivationCodeExportRecord[];
}

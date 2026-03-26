export interface AuthUserInfo {
  id: number;
  username: string;
  role: string;
}

export type AuthSessionState =
  | {
      status: "authenticated";
      user: AuthUserInfo;
    }
  | {
      status: "unauthenticated";
    }
  | {
      status: "error";
    };

interface AuthStatusResponse {
  success: boolean;
  data?: {
    user?: AuthUserInfo;
  };
}

/**
 * 从服务端获取当前管理员会话信息
 */
export async function fetchCurrentUser(): Promise<AuthSessionState> {
  try {
    const response = await fetch("/api/admin/login", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (response.status === 401) {
      return { status: "unauthenticated" };
    }

    if (!response.ok) {
      return { status: "error" };
    }

    const result = (await response.json()) as AuthStatusResponse;
    if (!result.success || !result.data?.user) {
      return { status: "unauthenticated" };
    }

    return {
      status: "authenticated",
      user: result.data.user,
    };
  } catch (error) {
    console.error("获取当前管理员信息失败:", error);
    return { status: "error" };
  }
}

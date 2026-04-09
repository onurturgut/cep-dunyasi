import type { AuthSession, AuthSignUpResult, AuthUser } from "@/types/auth";

type QueryResult<T = any> = {
  data: T;
  error: { message: string } | null;
  count?: number | null;
};

type QueryFilter = {
  operator: "eq" | "ilike" | "lt";
  field: string;
  value: unknown;
};

type QueryOrder = {
  field: string;
  ascending: boolean;
};

const SESSION_STORAGE_KEY = "mongo_auth_session";

function createErrorResult(message: string): QueryResult<any> {
  return { data: null, error: { message } };
}

function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function saveSession(session: AuthSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

type AuthEvent = "INITIAL_SESSION" | "SIGNED_IN" | "SIGNED_OUT";
type AuthStateChangeCallback = (event: AuthEvent, session: AuthSession | null) => void;

const listeners = new Set<AuthStateChangeCallback>();

function notifyAuthListeners(event: AuthEvent, session: AuthSession | null) {
  for (const callback of listeners) {
    callback(event, session);
  }
}

class MongoQueryBuilder<T = any> implements PromiseLike<QueryResult<T>> {
  private action: "select" | "insert" | "update" | "delete" = "select";
  private selectClause = "*";
  private shouldReturnCount = false;
  private headOnly = false;
  private singleResult = false;
  private returning = false;
  private filters: QueryFilter[] = [];
  private orderBy: QueryOrder | null = null;
  private limitBy: number | undefined;
  private payload: any;
  private executedPromise: Promise<QueryResult<T>> | null = null;

  constructor(private table: string) {}

  select(columns = "*", options?: { count?: "exact"; head?: boolean }) {
    if (this.action !== "select") {
      this.returning = true;
      return this;
    }

    this.selectClause = columns;
    this.shouldReturnCount = options?.count === "exact";
    this.headOnly = Boolean(options?.head);
    return this;
  }

  insert(data: any) {
    this.action = "insert";
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = "update";
    this.payload = data;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(field: string, value: unknown) {
    this.filters.push({ operator: "eq", field, value });
    return this;
  }

  ilike(field: string, value: unknown) {
    this.filters.push({ operator: "ilike", field, value });
    return this;
  }

  lt(field: string, value: unknown) {
    this.filters.push({ operator: "lt", field, value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderBy = {
      field,
      ascending: options?.ascending !== false,
    };
    return this;
  }

  limit(value: number) {
    this.limitBy = value;
    return this;
  }

  single() {
    this.singleResult = true;
    return this.execute();
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }

  private execute() {
    if (!this.executedPromise) {
      this.executedPromise = this.request();
    }

    return this.executedPromise;
  }

  private async request(): Promise<QueryResult<T>> {
    try {
      const response = await fetch("/api/db/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: this.table,
          action: this.action,
          select: this.selectClause,
          count: this.shouldReturnCount ? "exact" : undefined,
          head: this.headOnly,
          single: this.singleResult,
          returning: this.returning,
          filters: this.filters,
          order: this.orderBy,
          limit: this.limitBy,
          data: this.payload,
        }),
      });

      const body = (await response.json()) as QueryResult<T>;

      if (!response.ok) {
        return body?.error ? body : createErrorResult("Mongo sorgusu başarısız");
      }

      return body;
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : "Ag hatasi");
    }
  }
}

const db = {
  from(table: string) {
    return new MongoQueryBuilder(table);
  },
  rpc: async (name: string, args: Record<string, unknown>) => {
    try {
      const response = await fetch("/api/rpc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, args }),
      });

      const body = await response.json();

      if (!response.ok) {
        return { data: null, error: body?.error ?? { message: "RPC çağrısı başarısız" } };
      }

      return body;
    } catch (error) {
      return { data: null, error: { message: error instanceof Error ? error.message : "RPC hatasi" } };
    }
  },
  auth: {
    onAuthStateChange(callback: AuthStateChangeCallback) {
      listeners.add(callback);
      callback("INITIAL_SESSION", null);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              listeners.delete(callback);
            },
          },
        },
      };
    },
    async getSession() {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          saveSession(null);
          return { data: { session: null } };
        }

        const body = await response.json();
        const session = (body?.session ?? null) as AuthSession | null;
        saveSession(session);
        return { data: { session } };
      } catch {
        const localSession = getStoredSession();
        return { data: { session: localSession } };
      }
    },
    async signUp({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: { data?: { full_name?: string; referral_code?: string } };
    }) {
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            fullName: options?.data?.full_name ?? "",
            referralCode: options?.data?.referral_code ?? null,
          }),
        });

        const body = await response.json();

        if (!response.ok) {
          return {
            data: { user: null, session: null, verificationRequired: false },
            error: body?.error ?? { message: "Kayıt başarısız" },
          };
        }

        const result = {
          user: (body.user ?? null) as AuthUser | null,
          session: body.user ? ({ user: body.user as AuthUser } satisfies AuthSession) : null,
          verificationRequired: body.verificationRequired === true,
          email: typeof body.email === "string" ? body.email : undefined,
          message: typeof body.message === "string" ? body.message : undefined,
        } satisfies AuthSignUpResult;

        if (result.session) {
          saveSession(result.session);
          notifyAuthListeners("SIGNED_IN", result.session);
        } else {
          saveSession(null);
          notifyAuthListeners("SIGNED_OUT", null);
        }

        return { data: result, error: null };
      } catch (error) {
        return {
          data: { user: null, session: null, verificationRequired: false },
          error: { message: error instanceof Error ? error.message : "Kayit hatasi" },
        };
      }
    },
    async signInWithPassword({ email, password, rememberMe = true }: { email: string; password: string; rememberMe?: boolean }) {
      try {
        const response = await fetch("/api/auth/signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, rememberMe }),
        });

        const body = await response.json();

        if (!response.ok) {
          return { data: { user: null }, error: body?.error ?? { message: "Giriş başarısız" } };
        }

        const user = body.user as AuthUser;
        const session: AuthSession = { user };
        saveSession(session);
        notifyAuthListeners("SIGNED_IN", session);

        return { data: { user, session }, error: null };
      } catch (error) {
        return {
          data: { user: null },
          error: { message: error instanceof Error ? error.message : "Giris hatasi" },
        };
      }
    },
    async verifyEmail({ email, code }: { email: string; code: string }) {
      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code }),
        });

        const body = await response.json();

        if (!response.ok) {
          return { data: null, error: body?.error ?? { message: "Doğrulama başarısız" } };
        }

        return { data: body, error: null };
      } catch (error) {
        return { data: null, error: { message: error instanceof Error ? error.message : "Dogrulama hatasi" } };
      }
    },
    async resendVerification({ email }: { email: string }) {
      try {
        const response = await fetch("/api/auth/resend-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const body = await response.json();

        if (!response.ok) {
          return { data: null, error: body?.error ?? { message: "Doğrulama e-postası gönderilemedi" } };
        }

        return { data: body, error: null };
      } catch (error) {
        return {
          data: null,
          error: { message: error instanceof Error ? error.message : "Doğrulama e-postası gönderilemedi" },
        };
      }
    },
    async signOut() {
      try {
        await fetch("/api/auth/signout", { method: "POST" });
      } finally {
        saveSession(null);
        notifyAuthListeners("SIGNED_OUT", null);
      }

      return { error: null };
    },
  },
};

export { db };


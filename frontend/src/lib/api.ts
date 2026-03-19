const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchWithCookies(url: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res;
}

export const api = {
  auth: {
    register: async (email: string, password: string) => {
      const res = await fetchWithCookies("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return res.json();
    },
    login: async (email: string, password: string) => {
      const res = await fetchWithCookies("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return res.json();
    },
    logout: async () => {
      const res = await fetchWithCookies("/auth/logout", { method: "POST" });
      return res.json();
    },
    me: async () => {
      const res = await fetchWithCookies("/auth/me");
      if (!res.ok) return null;
      return res.json();
    },
  },

  documents: {
    list: async () => {
      const res = await fetchWithCookies("/documents");
      return res.json();
    },
    get: async (id: string) => {
      const res = await fetchWithCookies(`/documents/${id}`);
      return res.json();
    },
    create: async (data: { title?: string; prompt: string; latex: string }) => {
      const res = await fetchWithCookies("/documents", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetchWithCookies(`/documents/${id}`, { method: "DELETE" });
      return res.json();
    },
    getVersions: async (docId: string) => {
      const res = await fetchWithCookies(`/documents/${docId}/versions`);
      return res.json();
    },
    getVersion: async (docId: string, versionId: string) => {
      const res = await fetchWithCookies(`/documents/${docId}/versions/${versionId}`);
      return res.json();
    },
  },

  agent: {
    stream: async (
      prompt: string,
      onChunk: (data: AgentEvent) => void
    ): Promise<AgentEvent | null> => {
      const res = await fetchWithCookies("/v2/agent/stream", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });

      const reader = res.body?.getReader();
      if (!reader) return null;

      const decoder = new TextDecoder();
      let buffer = "";
      let lastEvent: AgentEvent | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              lastEvent = data;
              onChunk(data);
            } catch {
              onChunk({ status: "raw", raw: line.slice(6) });
            }
          }
        }
      }

      if (buffer.startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.slice(6));
          lastEvent = data;
          return data;
        } catch {
          return lastEvent;
        }
      }
      return lastEvent;
    },

    submitAsync: async (prompt: string) => {
      const res = await fetchWithCookies("/v2/agent/async", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      return res.json();
    },

    getStatus: async (jobId: string) => {
      const res = await fetchWithCookies(`/status/${jobId}`);
      return res.json();
    },
  },
};

export interface AgentEvent {
  status?: string;
  latex?: string;
  error?: string;
  pdf_path?: string;
  pdf_url?: string;
  retries?: number;
  raw?: string;
  version_id?: string;
  version_number?: number;
}

export interface JobStatus {
  job_id: string;
  status: string;
  pdf_url?: string;
  latex?: string;
  error?: string;
  attempts?: number;
  meta?: { step: string };
}

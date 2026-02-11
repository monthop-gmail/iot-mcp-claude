import { BaseConnector } from './base-connector.js';

export abstract class RESTConnector extends BaseConnector {
  protected baseUrl: string;
  protected headers: Record<string, string> = {};
  protected token: string | null = null;

  constructor(config: import('../types.js').DeviceConfig) {
    super(config);
    this.baseUrl = config.apiUrl || `https://${config.host}`;
  }

  protected async apiFetch<T = unknown>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
        ...(options.headers as Record<string, string> || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API ${response.status} ${response.statusText}: ${text}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }
    return response.text() as unknown as T;
  }

  protected async apiGet<T = unknown>(path: string): Promise<T> {
    return this.apiFetch<T>(path, { method: 'GET' });
  }

  protected async apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.apiFetch<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  protected async apiPut<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.apiFetch<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  protected async apiDelete<T = unknown>(path: string): Promise<T> {
    return this.apiFetch<T>(path, { method: 'DELETE' });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      return true;
    } catch {
      return false;
    }
  }
}

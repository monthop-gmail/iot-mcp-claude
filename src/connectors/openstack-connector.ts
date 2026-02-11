import { RESTConnector } from './rest-connector.js';
import { DeviceConfig, DeviceStatus } from '../types.js';

interface ServiceEndpoint {
  interface: string;
  url: string;
  region_id?: string;
}

interface CatalogEntry {
  type: string;
  name: string;
  endpoints: ServiceEndpoint[];
}

export class OpenStackConnector extends RESTConnector {
  private authToken: string | null = null;
  private computeUrl: string | null = null;
  private networkUrl: string | null = null;
  private volumeUrl: string | null = null;
  private imageUrl: string | null = null;
  private identityUrl: string;
  private projectId: string | null = null;

  constructor(config: DeviceConfig) {
    super(config);
    this.identityUrl = config.apiUrl || `https://${config.host}:5000`;
  }

  async connect(): Promise<void> {
    const projectName = (this.config.extra?.project as string) || 'admin';
    const domainName = (this.config.extra?.domain as string) || 'Default';

    const response = await fetch(`${this.identityUrl}/v3/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth: {
          identity: {
            methods: ['password'],
            password: {
              user: {
                name: this.config.username,
                domain: { name: domainName },
                password: this.config.password,
              },
            },
          },
          scope: {
            project: {
              name: projectName,
              domain: { name: domainName },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenStack auth failed (${response.status}): ${text}`);
    }

    this.authToken = response.headers.get('x-subject-token');
    if (!this.authToken) {
      throw new Error('OpenStack auth: no X-Subject-Token in response');
    }

    const body = await response.json() as {
      token: {
        catalog?: CatalogEntry[];
        project?: { id: string };
      };
    };

    this.projectId = body.token.project?.id || null;

    // Parse service catalog
    const catalog = body.token.catalog || [];
    for (const entry of catalog) {
      const endpoint = entry.endpoints.find(e => e.interface === 'public')
        || entry.endpoints.find(e => e.interface === 'internal')
        || entry.endpoints[0];
      if (!endpoint) continue;

      switch (entry.type) {
        case 'compute':
          this.computeUrl = endpoint.url;
          break;
        case 'network':
          this.networkUrl = endpoint.url;
          break;
        case 'volumev3':
        case 'volumev2':
        case 'block-storage':
          if (!this.volumeUrl) this.volumeUrl = endpoint.url;
          break;
        case 'image':
          this.imageUrl = endpoint.url;
          break;
      }
    }

    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    this.authToken = null;
    this._status = 'disconnected';
  }

  private async osGet<T = unknown>(serviceUrl: string, path: string): Promise<T> {
    if (!this.authToken) await this.connect();
    const url = `${serviceUrl}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Auth-Token': this.authToken!,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Token expired, retry
      this.authToken = null;
      await this.connect();
      return this.osGet<T>(serviceUrl, path);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenStack API ${response.status}: ${text}`);
    }

    return response.json() as Promise<T>;
  }

  private async osPost<T = unknown>(serviceUrl: string, path: string, body?: unknown): Promise<T> {
    if (!this.authToken) await this.connect();
    const url = `${serviceUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Auth-Token': this.authToken!,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      this.authToken = null;
      await this.connect();
      return this.osPost<T>(serviceUrl, path, body);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenStack API ${response.status}: ${text}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }
    return { success: true } as T;
  }

  private requireCompute(): string {
    if (!this.computeUrl) throw new Error('Nova compute endpoint not found in service catalog');
    return this.computeUrl;
  }

  private requireNetwork(): string {
    if (!this.networkUrl) throw new Error('Neutron network endpoint not found in service catalog');
    return this.networkUrl;
  }

  private requireVolume(): string {
    if (!this.volumeUrl) throw new Error('Cinder volume endpoint not found in service catalog');
    return this.volumeUrl;
  }

  private requireImage(): string {
    if (!this.imageUrl) throw new Error('Glance image endpoint not found in service catalog');
    return this.imageUrl;
  }

  // ── Status ──

  async getStatus(): Promise<DeviceStatus> {
    try {
      await this.connect();
      const services: string[] = [];
      if (this.computeUrl) services.push('compute');
      if (this.networkUrl) services.push('network');
      if (this.volumeUrl) services.push('volume');
      if (this.imageUrl) services.push('image');
      return this.buildStatus({
        status: 'connected',
        details: {
          keystoneUrl: this.identityUrl,
          projectId: this.projectId,
          services,
        },
      });
    } catch (error) {
      return this.buildStatus({
        status: 'error',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  // ── Nova (Compute) ──

  async listServers(): Promise<unknown> {
    const data = await this.osGet<{ servers: unknown[] }>(this.requireCompute(), '/servers/detail');
    return data.servers;
  }

  async getServerDetail(serverId: string): Promise<unknown> {
    const data = await this.osGet<{ server: unknown }>(this.requireCompute(), `/servers/${serverId}`);
    return data.server;
  }

  async serverAction(serverId: string, action: string): Promise<unknown> {
    const actionMap: Record<string, unknown> = {
      start: { 'os-start': null },
      stop: { 'os-stop': null },
      reboot: { reboot: { type: 'SOFT' } },
      'hard-reboot': { reboot: { type: 'HARD' } },
      pause: { pause: null },
      unpause: { unpause: null },
      suspend: { suspend: null },
      resume: { resume: null },
    };
    const body = actionMap[action];
    if (!body) throw new Error(`Unknown server action: ${action}. Valid: ${Object.keys(actionMap).join(', ')}`);
    return this.osPost(this.requireCompute(), `/servers/${serverId}/action`, body);
  }

  async listFlavors(): Promise<unknown> {
    const data = await this.osGet<{ flavors: unknown[] }>(this.requireCompute(), '/flavors/detail');
    return data.flavors;
  }

  async listHypervisors(): Promise<unknown> {
    const data = await this.osGet<{ hypervisors: unknown[] }>(this.requireCompute(), '/os-hypervisors/detail');
    return data.hypervisors;
  }

  // ── Glance (Image) ──

  async listImages(): Promise<unknown> {
    const data = await this.osGet<{ images: unknown[] }>(this.requireImage(), '/v2/images');
    return data.images;
  }

  // ── Neutron (Network) ──

  async listNetworks(): Promise<unknown> {
    const data = await this.osGet<{ networks: unknown[] }>(this.requireNetwork(), '/v2.0/networks');
    return data.networks;
  }

  async listSubnets(): Promise<unknown> {
    const data = await this.osGet<{ subnets: unknown[] }>(this.requireNetwork(), '/v2.0/subnets');
    return data.subnets;
  }

  async listRouters(): Promise<unknown> {
    const data = await this.osGet<{ routers: unknown[] }>(this.requireNetwork(), '/v2.0/routers');
    return data.routers;
  }

  async listFloatingIps(): Promise<unknown> {
    const data = await this.osGet<{ floatingips: unknown[] }>(this.requireNetwork(), '/v2.0/floatingips');
    return data.floatingips;
  }

  // ── Cinder (Volume) ──

  async listVolumes(): Promise<unknown> {
    const data = await this.osGet<{ volumes: unknown[] }>(this.requireVolume(), '/volumes/detail');
    return data.volumes;
  }

  // ── Keystone (Identity) ──

  async listProjects(): Promise<unknown> {
    const data = await this.osGet<{ projects: unknown[] }>(this.identityUrl, '/v3/projects');
    return data.projects;
  }

  // ── Required overrides ──

  async executeCommand(command: string): Promise<import('../types.js').CommandResult> {
    return {
      success: false,
      device: this.config.id,
      command,
      output: '',
      error: 'Direct CLI not supported via OpenStack API.',
    };
  }

  async getConfig(section?: string): Promise<string> {
    const status = await this.getStatus();
    return JSON.stringify(status, null, 2);
  }
}

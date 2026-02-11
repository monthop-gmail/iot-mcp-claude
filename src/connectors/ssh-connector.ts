import { Client, ConnectConfig } from 'ssh2';
import { BaseConnector } from './base-connector.js';
import { CommandResult } from '../types.js';

export abstract class SSHConnector extends BaseConnector {
  protected sshClient: Client | null = null;
  protected defaultTimeout = 30000;

  async connect(): Promise<void> {
    if (this.sshClient) return;

    return new Promise((resolve, reject) => {
      const client = new Client();
      const connectConfig: ConnectConfig = {
        host: this.config.host,
        port: this.config.port || 22,
        username: this.config.username,
        password: this.config.password,
        readyTimeout: this.defaultTimeout,
        algorithms: {
          kex: [
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384',
            'ecdh-sha2-nistp521',
            'diffie-hellman-group-exchange-sha256',
            'diffie-hellman-group14-sha256',
            'diffie-hellman-group14-sha1',
            'diffie-hellman-group1-sha1',
          ],
          cipher: [
            'aes128-ctr',
            'aes192-ctr',
            'aes256-ctr',
            'aes128-gcm',
            'aes256-gcm',
            'aes128-cbc',
            'aes256-cbc',
            '3des-cbc',
          ],
          serverHostKey: [
            'ssh-ed25519',
            'ecdsa-sha2-nistp256',
            'ecdsa-sha2-nistp384',
            'ecdsa-sha2-nistp521',
            'rsa-sha2-512',
            'rsa-sha2-256',
            'ssh-rsa',
          ],
          hmac: [
            'hmac-sha2-256',
            'hmac-sha2-512',
            'hmac-sha1',
          ],
        },
      };

      client.on('ready', () => {
        this.sshClient = client;
        this._status = 'connected';
        resolve();
      });

      client.on('error', (err) => {
        this._status = 'error';
        reject(err);
      });

      client.on('close', () => {
        this.sshClient = null;
        this._status = 'disconnected';
      });

      client.connect(connectConfig);
    });
  }

  async disconnect(): Promise<void> {
    if (this.sshClient) {
      this.sshClient.end();
      this.sshClient = null;
    }
    this._status = 'disconnected';
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      await this.disconnect();
      return true;
    } catch {
      return false;
    }
  }

  protected async sshExec(command: string, timeout = this.defaultTimeout): Promise<string> {
    if (!this.sshClient) await this.connect();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
      }, timeout);

      this.sshClient!.exec(command, { pty: false }, (err, stream) => {
        if (err) {
          clearTimeout(timer);
          return reject(err);
        }

        let output = '';
        let stderr = '';

        stream.on('data', (data: Buffer) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        stream.on('close', () => {
          clearTimeout(timer);
          resolve(output || stderr);
        });
      });
    });
  }

  protected async sshShell(command: string, timeout = this.defaultTimeout): Promise<string> {
    if (!this.sshClient) await this.connect();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Shell command timed out after ${timeout}ms: ${command}`));
      }, timeout);

      this.sshClient!.shell((err, stream) => {
        if (err) {
          clearTimeout(timer);
          return reject(err);
        }

        let output = '';
        let collecting = false;

        stream.on('data', (data: Buffer) => {
          const chunk = data.toString();
          output += chunk;

          // Detect prompt patterns indicating command completion
          if (collecting && (
            chunk.includes('#') ||
            chunk.includes('>') ||
            chunk.includes('$')
          )) {
            clearTimeout(timer);
            stream.end();
            resolve(output);
          }
        });

        stream.on('close', () => {
          clearTimeout(timer);
          resolve(output);
        });

        // Wait for initial prompt, then send command
        setTimeout(() => {
          collecting = true;
          stream.write(command + '\n');
        }, 500);

        // Send terminal length 0 to disable paging
        stream.write('terminal length 0\n');
      });
    });
  }

  async executeCommand(command: string): Promise<CommandResult> {
    const start = Date.now();
    try {
      const output = await this.sshExec(command);
      return {
        success: true,
        device: this.deviceId,
        command,
        output: output.trim(),
        executionTime: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        device: this.deviceId,
        command,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - start,
      };
    }
  }
}

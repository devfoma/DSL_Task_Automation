export interface LogMessage {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface VirtualFile {
  name: string;
  content: string;
  updatedAt: string;
  size: number;
}

export interface ScheduledTask {
  id: string;
  interval: number; // in seconds
  code: string;
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
  name: string;
}

export class DSLInterpreter {
  private files: Record<string, string>;
  private onLog: (log: LogMessage) => void;
  private onFileChange: (files: Record<string, string>) => void;
  private onScheduleCreated: (task: Omit<ScheduledTask, 'id' | 'isActive'>) => void;

  constructor(
    files: Record<string, string>,
    onLog: (log: LogMessage) => void,
    onFileChange: (files: Record<string, string>) => void,
    onScheduleCreated: (task: Omit<ScheduledTask, 'id' | 'isActive'>) => void
  ) {
    this.files = { ...files };
    this.onLog = onLog;
    this.onFileChange = onFileChange;
    this.onScheduleCreated = onScheduleCreated;
  }

  private log(type: LogMessage['type'], message: string) {
    this.onLog({
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    });
  }

  public async run(code: string): Promise<void> {
    const lines = code.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#') || line.startsWith('//')) {
        i++;
        continue;
      }

      // Check for 'every X seconds do {'
      const scheduleMatch = line.match(/^every\s+(\d+)\s+seconds?\s+do\s*\{/i);
      if (scheduleMatch) {
        const interval = parseInt(scheduleMatch[1], 10);
        let blockContent = '';
        let braceCount = 1;
        i++;

        while (i < lines.length && braceCount > 0) {
          const blockLine = lines[i];
          if (blockLine.includes('{')) braceCount++;
          if (blockLine.includes('}')) braceCount--;
          if (braceCount > 0) {
            blockContent += blockLine + '\n';
          }
          i++;
        }

        const taskName = `Schedule Job (${interval}s)`;
        this.log('info', `Scheduling job: "${taskName}" to run every ${interval}s.`);
        this.onScheduleCreated({
          name: taskName,
          interval,
          code: blockContent.trim(),
        });
        continue;
      }

      // Single statements
      try {
        await this.executeStatement(line);
      } catch (err: any) {
        this.log('error', `Error on line ${i + 1}: ${err.message || err}`);
      }
      i++;
    }
  }

  private async executeStatement(statement: string): Promise<void> {
    // 1. create file "name" with content "content"
    const createMatch = statement.match(/^create\s+file\s+"([^"]+)"\s+with\s+content\s+"([^"]*)"/i);
    if (createMatch) {
      const filename = createMatch[1];
      const content = createMatch[2];
      this.files[filename] = content;
      this.onFileChange({ ...this.files });
      this.log('success', `Created file "${filename}" (${content.length} bytes)`);
      return;
    }

    // 2. append file "name" with content "content"
    const appendMatch = statement.match(/^append\s+file\s+"([^"]+)"\s+with\s+content\s+"([^"]*)"/i);
    if (appendMatch) {
      const filename = appendMatch[1];
      const content = appendMatch[2];
      const existing = this.files[filename] || '';
      const updated = existing + content;
      this.files[filename] = updated;
      this.onFileChange({ ...this.files });
      this.log('success', `Appended content to file "${filename}"`);
      return;
    }

    // 3. read file "name"
    const readMatch = statement.match(/^read\s+file\s+"([^"]+)"/i);
    if (readMatch) {
      const filename = readMatch[1];
      if (filename in this.files) {
        const content = this.files[filename];
        this.log('info', `Read file "${filename}": "${content}"`);
      } else {
        throw new Error(`File "${filename}" not found in virtual workspace.`);
      }
      return;
    }

    // 4. delete file "name"
    const deleteMatch = statement.match(/^delete\s+file\s+"([^"]+)"/i);
    if (deleteMatch) {
      const filename = deleteMatch[1];
      if (filename in this.files) {
        delete this.files[filename];
        this.onFileChange({ ...this.files });
        this.log('warn', `Deleted file "${filename}"`);
      } else {
        throw new Error(`File "${filename}" does not exist.`);
      }
      return;
    }

    // 5. log "message"
    const logMatch = statement.match(/^log\s+"([^"]*)"/i);
    if (logMatch) {
      const msg = logMatch[1];
      this.log('info', msg);
      return;
    }

    // 6. wait/sleep X seconds
    const sleepMatch = statement.match(/^(?:wait|sleep)\s+(\d+)\s+seconds?/i);
    if (sleepMatch) {
      const seconds = parseInt(sleepMatch[1], 10);
      this.log('info', `Sleeping for ${seconds} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
      this.log('info', `Resuming execution.`);
      return;
    }

    // 7. http get "url"
    const httpGetMatch = statement.match(/^http\s+get\s+"([^"]+)"/i);
    if (httpGetMatch) {
      const url = httpGetMatch[1];
      this.log('info', `Sending HTTP GET request to ${url}`);
      try {
        const res = await fetch(url);
        const text = await res.text();
        this.log('success', `HTTP Response (${res.status}): ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      } catch (err: any) {
        this.log('error', `HTTP request failed: ${err.message}`);
      }
      return;
    }

    // If we reach here, it's an unrecognized command
    throw new Error(`Unknown statement: "${statement}"`);
  }
}

import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TerrariaService, ModuleStatus, ModuleDefinition, ModuleField, FieldOption } from '../services/terraria.service';

@Component({
  selector: 'app-terraria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './terraria.component.html',
  styleUrl: './terraria.component.scss'
})
export class TerrariaComponent implements OnInit, OnDestroy {
  @ViewChild('logsContainer') logsContainer!: ElementRef<HTMLDivElement>;

  moduleDefinition: ModuleDefinition | null = null;
  moduleStatus: ModuleStatus | null = null;
  fieldValues: Record<string, string> = {};
  loading = false;
  error = '';
  waitingForService = false;
  serviceStatusMessage = '';

  // Tabs
  activeTab: 'status' | 'logs' = 'status';

  // Logs
  logs: string[] = [];
  logsLoading = false;
  logsError = '';
  private logsPollingInterval: ReturnType<typeof setInterval> | null = null;
  private isInitialLoad = true;
  autoScroll = true;

  constructor(private terrariaService: TerrariaService) {}

  ngOnInit(): void {
    this.loadModuleInfo();
  }

  ngOnDestroy(): void {
    this.stopLogsPolling();
  }

  loadModuleInfo(): void {
    this.loading = true;

    // Load module definition and status in parallel
    this.terrariaService.getModuleDefinition().subscribe({
      next: (definition) => {
        this.moduleDefinition = definition;

        // Initialize field values with defaults
        for (const field of definition.fields) {
          this.fieldValues[field.name] = field.defaultValue || '';
        }

        // Then load status
        this.loadStatus();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to load module definition';
      }
    });
  }

  loadStatus(): void {
    this.terrariaService.getStatus().subscribe({
      next: (status) => {
        this.moduleStatus = status;
        this.loading = false;

        // If deployed, use the deployed field values
        if (status.isDeployed && status.fieldValues) {
          this.fieldValues = { ...this.fieldValues, ...status.fieldValues };
        }
      },
      error: () => {
        this.moduleStatus = null;
        this.loading = false;
      }
    });
  }

  deploy(): void {
    this.loading = true;
    this.error = '';

    this.terrariaService.deploy(this.fieldValues).subscribe({
      next: (status) => {
        this.moduleStatus = status;
        if (!status.serviceDeployed) {
          // Deployment failed
          this.loading = false;
          this.error = status.message || 'Failed to deploy service';
        } else {
          // Deployment succeeded - start polling for service readiness
          this.waitingForService = true;
          this.serviceStatusMessage = 'Starting server...';
          this.pollServiceReady();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to deploy module';
      }
    });
  }

  private pollServiceReady(attempts = 0): void {
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      this.loading = false;
      this.waitingForService = false;
      this.error = 'Server startup timed out. Check the status and try again.';
      return;
    }

    this.terrariaService.checkServiceReady().subscribe({
      next: (response) => {
        this.serviceStatusMessage = response.podStatus
          ? `Pod status: ${response.podStatus}`
          : 'Waiting for pod...';

        if (response.ready && response.nodePort) {
          // Update the module status with the node port
          if (this.moduleStatus) {
            this.moduleStatus.serviceRunning = true;
            this.moduleStatus.serviceNodePort = response.nodePort;
            this.moduleStatus.podStatus = response.podStatus;
          }
          this.loading = false;
          this.waitingForService = false;
        } else {
          // Keep polling
          setTimeout(() => this.pollServiceReady(attempts + 1), pollInterval);
        }
      },
      error: () => {
        // Keep polling on error
        setTimeout(() => this.pollServiceReady(attempts + 1), pollInterval);
      }
    });
  }

  remove(): void {
    this.loading = true;
    this.error = '';

    this.terrariaService.remove().subscribe({
      next: () => {
        this.moduleStatus = {
          moduleName: 'terraria',
          isDeployed: false,
          isRunning: false,
          serviceDeployed: false,
          serviceRunning: false
        };
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to remove module';
      }
    });
  }

  getOptionValue(option: string | FieldOption): string {
    return typeof option === 'string' ? option : option.value;
  }

  getOptionLabel(option: string | FieldOption, fieldName?: string): string {
    const value = typeof option === 'string' ? option : option.label;

    // Apply friendly labels for known fields
    if (fieldName === 'difficulty') {
      return this.getDifficultyLabel(value);
    }
    if (fieldName === 'worldSize') {
      return this.getWorldSizeLabel(value);
    }
    return value;
  }

  getDifficultyLabel(value: string): string {
    const labels: Record<string, string> = {
      '0': 'Classic',
      '1': 'Expert',
      '2': 'Master',
      '3': 'Journey'
    };
    return labels[value] || value;
  }

  getWorldSizeLabel(value: string): string {
    const labels: Record<string, string> = {
      '1': 'Small',
      '2': 'Medium',
      '3': 'Large'
    };
    return labels[value] || value;
  }

  getFieldDisplayValue(field: ModuleField, value: string): string {
    if (field.name === 'difficulty') {
      return this.getDifficultyLabel(value);
    }
    if (field.name === 'worldSize') {
      return this.getWorldSizeLabel(value);
    }
    if (field.name === 'password' && value) {
      return '********';
    }
    return value;
  }

  getConnectionString(): string {
    const host = window.location.hostname;
    const port = this.moduleStatus?.serviceNodePort;
    return port ? `${host}:${port}` : 'Unavailable';
  }

  // Tab management
  switchTab(tab: 'status' | 'logs'): void {
    this.activeTab = tab;
    if (tab === 'logs') {
      this.startLogsPolling();
    } else {
      this.stopLogsPolling();
    }
  }

  // Logs management
  private startLogsPolling(): void {
    // Initial load - get last 100 lines
    this.loadLogs(true);

    // Poll every 3 seconds
    this.logsPollingInterval = setInterval(() => {
      this.loadLogs(false);
    }, 3000);
  }

  private stopLogsPolling(): void {
    if (this.logsPollingInterval) {
      clearInterval(this.logsPollingInterval);
      this.logsPollingInterval = null;
    }
  }

  private loadLogs(initial: boolean): void {
    if (initial) {
      this.logsLoading = true;
      this.logs = [];
      this.isInitialLoad = true;
    }

    // For initial load, get last 100 lines
    // For subsequent polls, get logs from last 5 seconds (polling interval is 3s, add buffer)
    const sinceSeconds = initial ? undefined : 5;
    const tailLines = initial ? 100 : undefined;

    this.terrariaService.getLogs(sinceSeconds, tailLines).subscribe({
      next: (response) => {
        this.logsLoading = false;
        if (response.success && response.logs) {
          const newLines = response.logs.split('\n').filter(line => line.trim());
          if (newLines.length > 0) {
            if (initial) {
              this.logs = newLines;
              this.isInitialLoad = false;
            } else {
              // Avoid duplicates by checking if lines already exist
              const existingSet = new Set(this.logs.slice(-50)); // Check last 50 for performance
              const uniqueNewLines = newLines.filter(line => !existingSet.has(line));
              if (uniqueNewLines.length > 0) {
                this.logs = [...this.logs, ...uniqueNewLines];
                // Keep only last 500 lines to prevent memory issues
                if (this.logs.length > 500) {
                  this.logs = this.logs.slice(-500);
                }
                this.scrollToBottom();
              }
            }
            if (initial) {
              this.scrollToBottom();
            }
          }
        } else if (response.error) {
          this.logsError = response.error;
        }
      },
      error: (err) => {
        this.logsLoading = false;
        this.logsError = err.error?.message || 'Failed to load logs';
      }
    });
  }

  private scrollToBottom(): void {
    if (this.autoScroll && this.logsContainer) {
      setTimeout(() => {
        const container = this.logsContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }, 0);
    }
  }

  toggleAutoScroll(): void {
    this.autoScroll = !this.autoScroll;
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }

  clearLogs(): void {
    this.logs = [];
    this.isInitialLoad = true;
    // Reload with initial settings
    this.loadLogs(true);
  }
}

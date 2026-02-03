import { Component, OnInit } from '@angular/core';
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
export class TerrariaComponent implements OnInit {
  moduleDefinition: ModuleDefinition | null = null;
  moduleStatus: ModuleStatus | null = null;
  fieldValues: Record<string, string> = {};
  loading = false;
  error = '';

  constructor(private terrariaService: TerrariaService) {}

  ngOnInit(): void {
    this.loadModuleInfo();
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
        this.loading = false;
        if (status.message && !status.isDeployed) {
          this.error = status.message;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to deploy module';
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
}

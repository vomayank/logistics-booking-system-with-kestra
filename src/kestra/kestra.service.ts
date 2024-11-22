import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { KestraExecutionRequest, KestraExecutionResponse } from './interfaces/kestra.interfaces';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KestraService {
  private readonly logger = new Logger(KestraService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async triggerWorkflow(
    workflowId: string,
    namespace: string = 'logistics',
    inputs: Record<string, any>
  ): Promise<KestraExecutionResponse> {
    const kestraApiUrl = this.configService.get('KESTRA_API_URL');
    if (!kestraApiUrl) {
      throw new Error('KESTRA_API_URL is not configured');
    }

    try {
      const formData = new FormData();
      
      // Add each input as a separate form field
      Object.entries(inputs).forEach(([key, value]) => {
        formData.append(key, 
          value instanceof Date ? value.toISOString() : 
          typeof value === 'object' ? JSON.stringify(value) : 
          String(value)
        );
      });

      const response = await firstValueFrom(
        this.httpService.post(
          `${kestraApiUrl}/api/v1/executions/${namespace}/${workflowId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )
      );
      
      return {
        executionId: response.data.id,
        state: response.data.state.current
      };
    } catch (error) {
      this.logger.error(`Failed to trigger Kestra workflow: ${error?.response?.data?.message || error.message}`);
      throw new Error(`Workflow trigger failed: ${error?.response?.data?.message || error.message}`);
    }
  }

  async getWorkflowStatus(executionId: string): Promise<any> {
    const kestraApiUrl = this.configService.get('KESTRA_API_URL');
    if (!kestraApiUrl) {
      throw new Error('KESTRA_API_URL is not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${kestraApiUrl}/api/v1/executions/${executionId}`)
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get workflow status: ${error?.response?.data?.message || error.message}`);
      throw new Error(`Status check failed: ${error?.response?.data?.message || error.message}`);
    }
  }
} 
export interface KestraExecutionRequest {
  namespace: string;
  flowId: string;
  inputs: Array<{
    name: string;
    value: string;
  }>;
}
  
  export interface KestraExecutionResponse {
    executionId: string;
    state: string;
  }
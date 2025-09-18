import { pipe } from '../shared/utils';
import { ServiceConfig } from '../shared/config';
import {
  GenerateTestDataRequest,
  GenerateTestDataResponse,
  validateGenerateTestDataResponse
} from '../shared/schemas/admin';

// Pure function - single responsibility: create request options
const createRequestOptions = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: {
    'Content-Type': 'application/json',
  },
  ...(body && { body: JSON.stringify(body) }),
});

// Pure function - single responsibility: handle HTTP errors
const handleHttpError = async (response: Response): Promise<Response> => {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`API Error ${response.status}: ${errorBody.error || response.statusText}`);
  }
  return response;
};

// Pure function - single responsibility: parse and validate JSON response
const parseAndValidateJson = <T>(validator: (data: unknown) => T) =>
  async (response: Response): Promise<T> => {
    const data = await response.json();
    return validator(data);
  };

// Pure function - single responsibility: make HTTP request
const makeRequest = async (url: string, options: RequestInit): Promise<Response> => {
  const response = await fetch(url, options);
  return handleHttpError(response);
};

// Composable API request flow using functional programming
const createApiRequest = <TResponse>(
  endpoint: string,
  method: string,
  validator: (data: unknown) => TResponse
) =>
  (body?: unknown): Promise<TResponse> => {
    const url = `${ServiceConfig.getApiUrl()}${endpoint}`;
    const options = createRequestOptions(method, body);

    return pipe(
      () => makeRequest(url, options),
      (responsePromise) => responsePromise.then(parseAndValidateJson(validator))
    )();
  };

// Admin API methods - each with single responsibility
export const adminApi = {
  generateTestData: (params: GenerateTestDataRequest): Promise<GenerateTestDataResponse> => {
    const queryParams = new URLSearchParams({
      userCount: params.userCount.toString(),
      postsPerUser: params.postsPerUser.toString(),
    });

    const endpoint = `/admin/test-data?${queryParams}`;
    const request = createApiRequest(endpoint, 'POST', validateGenerateTestDataResponse);

    return request({});
  },
};

// Main typed API client - follows DRY principles
export class TypedApiClient {
  readonly admin = adminApi;
}

// Single instance for DRY usage across the app
export const typedApiClient = new TypedApiClient();
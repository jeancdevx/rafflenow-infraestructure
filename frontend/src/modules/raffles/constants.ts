const API_BASE_URL = import.meta.env.PUBLIC_API_URL;
const API_VERSION = import.meta.env.PUBLIC_API_VERSION || 'v1';

if (!API_BASE_URL) {
  throw new Error('PUBLIC_API_URL environment variable is not set');
}

export const RAFFLES_API = {
  LIST: `${API_BASE_URL}/api/${API_VERSION}/raffles`,
  DETAIL: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/raffles/${id}`,
  PARTICIPATE: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/raffles/${id}/participate`,
  CREATE: `${API_BASE_URL}/api/${API_VERSION}/raffles`,
  CLOSE: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/raffles/${id}/close`,
  UPLOAD_IMAGE: `${API_BASE_URL}/api/${API_VERSION}/assets/upload`,
} as const;

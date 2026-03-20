import type {
  IAllExecuteFunctions,
  IOAuth2Options,
  IRequestOptions,
} from 'n8n-workflow';

const DEFAULT_ZOHO_DESK_DATACENTER = 'com';
const ZOHO_DESK_API_VERSION = 'v1';

const ZOHO_DESK_OAUTH2_OPTIONS: IOAuth2Options = {
  tokenType: 'Zoho-oauthtoken',
  keepBearer: false,
};

export function getZohoDeskApiBaseUrl(credentials: Record<string, unknown>): string {
  const configuredBaseUrl =
    typeof credentials.baseUrl === 'string' ? credentials.baseUrl.trim() : '';

  if (
    configuredBaseUrl !== '' &&
    !configuredBaseUrl.startsWith('=') &&
    !configuredBaseUrl.includes('{{$')
  ) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  const datacenter =
    typeof credentials.datacenter === 'string' && credentials.datacenter.trim() !== ''
      ? credentials.datacenter.trim()
      : DEFAULT_ZOHO_DESK_DATACENTER;

  return `https://desk.zoho.${datacenter}/api/${ZOHO_DESK_API_VERSION}`;
}

export async function zohoDeskApiRequest(
  context: IAllExecuteFunctions,
  requestOptions: IRequestOptions,
): Promise<any> {
  return await context.helpers.requestOAuth2.call(
    context,
    'zohoDeskOAuth2Api',
    requestOptions,
    ZOHO_DESK_OAUTH2_OPTIONS,
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function getZohoDeskLoadOptionsErrorMessage(
  error: unknown,
  resourceName: string,
): string {
  const errorMessage = getErrorMessage(error);
  const normalizedError = errorMessage.toLowerCase();

  if (normalizedError.includes('oauth_org_mismatch')) {
    return (
      `Cannot load ${resourceName}: the Organization ID does not match the Zoho Desk portal ` +
      'bound to the OAuth token.'
    );
  }

  if (
    (normalizedError.includes('401') || normalizedError.includes('unauthorized')) &&
    normalizedError.includes('<!doctype html')
  ) {
    return (
      `Cannot load ${resourceName}: Zoho Desk returned an HTML auth error page. ` +
      'Reconnect the credential and verify the selected data center and Organization ID.'
    );
  }

  if (normalizedError.includes('401') || normalizedError.includes('unauthorized')) {
    return (
      `Cannot load ${resourceName}: unauthorized. Reconnect the credential and verify the ` +
      'Organization ID and OAuth scopes.'
    );
  }

  return errorMessage;
}

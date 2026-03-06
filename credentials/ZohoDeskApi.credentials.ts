import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ZohoDeskApi implements ICredentialType {
	name = 'zohoDeskApi';

	displayName = 'Zoho Desk API';

	documentationUrl = 'https://desk.zoho.com/DeskAPIDocument#Introduction';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://desk.zoho.com',
			required: true,
			description:
				'Zoho Desk domain for your region, for example https://desk.zoho.com or https://desk.zoho.eu',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
			required: true,
			description: 'OAuth access token used in the Authorization header',
		},
		{
			displayName: 'Organization ID',
			name: 'orgId',
			type: 'string',
			default: '',
			required: true,
			description: 'Zoho Desk organization ID used in the orgId header',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Zoho-oauthtoken {{$credentials.accessToken}}',
				orgId: '={{$credentials.orgId}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/v1/tickets',
			method: 'GET',
			qs: {
				limit: 1,
			},
		},
	};
}

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
		{
			displayName: 'Scopes',
			name: 'scopes',
			type: 'multiOptions',
			required: true,
			default: [
				'Desk.tickets.READ',
				'Desk.tickets.CREATE',
				'Desk.tickets.UPDATE',
				'Desk.contacts.READ',
				'Desk.contacts.CREATE',
				'Desk.contacts.UPDATE',
			],
			description:
				'Select the OAuth scopes configured for your token. The node validates selected scopes before executing operations',
			options: [
				{
					name: 'Desk.tickets.ALL',
					value: 'Desk.tickets.ALL',
				},
				{
					name: 'Desk.tickets.READ',
					value: 'Desk.tickets.READ',
				},
				{
					name: 'Desk.tickets.WRITE',
					value: 'Desk.tickets.WRITE',
				},
				{
					name: 'Desk.tickets.UPDATE',
					value: 'Desk.tickets.UPDATE',
				},
				{
					name: 'Desk.tickets.CREATE',
					value: 'Desk.tickets.CREATE',
				},
				{
					name: 'Desk.tickets.DELETE',
					value: 'Desk.tickets.DELETE',
				},
				{
					name: 'Desk.contacts.READ',
					value: 'Desk.contacts.READ',
				},
				{
					name: 'Desk.contacts.WRITE',
					value: 'Desk.contacts.WRITE',
				},
				{
					name: 'Desk.contacts.UPDATE',
					value: 'Desk.contacts.UPDATE',
				},
				{
					name: 'Desk.contacts.CREATE',
					value: 'Desk.contacts.CREATE',
				},
				{
					name: 'Desk.tasks.ALL',
					value: 'Desk.tasks.ALL',
				},
				{
					name: 'Desk.tasks.WRITE',
					value: 'Desk.tasks.WRITE',
				},
				{
					name: 'Desk.tasks.READ',
					value: 'Desk.tasks.READ',
				},
				{
					name: 'Desk.tasks.CREATE',
					value: 'Desk.tasks.CREATE',
				},
				{
					name: 'Desk.tasks.UPDATE',
					value: 'Desk.tasks.UPDATE',
				},
				{
					name: 'Desk.tasks.DELETE',
					value: 'Desk.tasks.DELETE',
				},
				{
					name: 'Desk.basic.READ',
					value: 'Desk.basic.READ',
				},
				{
					name: 'Desk.basic.CREATE',
					value: 'Desk.basic.CREATE',
				},
				{
					name: 'Desk.settings.ALL',
					value: 'Desk.settings.ALL',
				},
				{
					name: 'Desk.settings.WRITE',
					value: 'Desk.settings.WRITE',
				},
				{
					name: 'Desk.settings.READ',
					value: 'Desk.settings.READ',
				},
				{
					name: 'Desk.settings.CREATE',
					value: 'Desk.settings.CREATE',
				},
				{
					name: 'Desk.settings.UPDATE',
					value: 'Desk.settings.UPDATE',
				},
				{
					name: 'Desk.settings.DELETE',
					value: 'Desk.settings.DELETE',
				},
				{
					name: 'Desk.search.READ',
					value: 'Desk.search.READ',
				},
				{
					name: 'Desk.events.ALL',
					value: 'Desk.events.ALL',
				},
				{
					name: 'Desk.events.READ',
					value: 'Desk.events.READ',
				},
				{
					name: 'Desk.events.WRITE',
					value: 'Desk.events.WRITE',
				},
				{
					name: 'Desk.events.CREATE',
					value: 'Desk.events.CREATE',
				},
				{
					name: 'Desk.events.UPDATE',
					value: 'Desk.events.UPDATE',
				},
				{
					name: 'Desk.events.DELETE',
					value: 'Desk.events.DELETE',
				},
				{
					name: 'Desk.articles.READ',
					value: 'Desk.articles.READ',
				},
				{
					name: 'Desk.articles.CREATE',
					value: 'Desk.articles.CREATE',
				},
				{
					name: 'Desk.articles.UPDATE',
					value: 'Desk.articles.UPDATE',
				},
				{
					name: 'Desk.articles.DELETE',
					value: 'Desk.articles.DELETE',
				},
			],
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

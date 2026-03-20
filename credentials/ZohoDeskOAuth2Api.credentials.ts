import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ZohoDeskOAuth2Api implements ICredentialType {
	name = 'zohoDeskOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Zoho Desk OAuth2 API';

	documentationUrl = 'https://desk.zoho.com/DeskAPIDocument#Introduction';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Zoho Data Center',
			name: 'datacenter',
			type: 'options',
			default: 'com',
			description: 'The data center where your Zoho Desk account is hosted',
			options: [
				{
					name: 'zoho.com (US)',
					value: 'com',
				},
				{
					name: 'zoho.com.au (Australia)',
					value: 'com.au',
				},
				{
					name: 'zoho.com.cn (China)',
					value: 'com.cn',
				},
				{
					name: 'zoho.eu (EU)',
					value: 'eu',
				},
				{
					name: 'zoho.in (India)',
					value: 'in',
				},
				{
					name: 'zoho.jp (Japan)',
					value: 'jp',
				},
			],
		},
		{
			displayName: 'Organization ID',
			name: 'orgId',
			type: 'string',
			default: '',
			required: true,
			description:
				'Your Zoho Desk Organization ID. You can find this in Setup > Developer Space > API.',
		},
		{
			displayName: 'Scopes',
			name: 'scopes',
			type: 'multiOptions',
			required: true,
			default: [
				'Desk.tickets.ALL',
				'Desk.contacts.READ',
				'Desk.contacts.WRITE',
				'Desk.search.READ',
				'Desk.basic.READ',
				'Desk.settings.READ',
				'Desk.activities.READ',
				'Desk.activities.CREATE',
				'Desk.activities.UPDATE',
				'Desk.activities.tasks.READ',
				'Desk.activities.tasks.CREATE',
				'Desk.activities.tasks.UPDATE',
				'Desk.activities.events.READ',
				'Desk.activities.events.CREATE',
				'Desk.activities.events.UPDATE',
			],
			description:
				'Select the OAuth scopes required by your workflows. Include Desk.basic.READ or Desk.settings.READ to load departments and teams. Include Desk.activities.*, Desk.activities.tasks.*, and Desk.activities.events.* for task and event operations.',
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
					name: 'Desk.activities.READ',
					value: 'Desk.activities.READ',
				},
				{
					name: 'Desk.activities.CREATE',
					value: 'Desk.activities.CREATE',
				},
				{
					name: 'Desk.activities.UPDATE',
					value: 'Desk.activities.UPDATE',
				},
				{
					name: 'Desk.activities.tasks.READ',
					value: 'Desk.activities.tasks.READ',
				},
				{
					name: 'Desk.activities.tasks.CREATE',
					value: 'Desk.activities.tasks.CREATE',
				},
				{
					name: 'Desk.activities.tasks.UPDATE',
					value: 'Desk.activities.tasks.UPDATE',
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
					name: 'Desk.activities.events.READ',
					value: 'Desk.activities.events.READ',
				},
				{
					name: 'Desk.activities.events.CREATE',
					value: 'Desk.activities.events.CREATE',
				},
				{
					name: 'Desk.activities.events.UPDATE',
					value: 'Desk.activities.events.UPDATE',
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
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: '=https://accounts.zoho.{{$self["datacenter"]}}/oauth/v2/auth',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: '=https://accounts.zoho.{{$self["datacenter"]}}/oauth/v2/token',
			required: true,
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'hidden',
			default: '=https://desk.zoho.{{$self["datacenter"]}}/api/v1',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: '={{($self["scopes"] || []).join(" ")}}',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: 'access_type=offline&prompt=consent',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '=https://desk.zoho.{{$credentials["datacenter"]}}/api/v1',
			url: '/tickets?limit=1',
			headers: {
				orgId: '={{$credentials["orgId"]}}',
			},
		},
	};

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.oauthTokenData.access_token}}',
			},
		},
	};
}

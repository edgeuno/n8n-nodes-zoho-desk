import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

function removeTrailingSlash(url: string): string {
	return url.replace(/\/+$/, '');
}

function setIfDefined(target: IDataObject, key: string, value: unknown): void {
	if (value === undefined || value === null) {
		return;
	}

	if (typeof value === 'string' && value.trim() === '') {
		return;
	}

	if (Array.isArray(value) && value.length === 0) {
		return;
	}

	target[key] = value;
}

function isPlainObject(value: unknown): value is IDataObject {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toJsonObject(
	context: IExecuteFunctions,
	itemIndex: number,
	value: unknown,
	fieldName: string,
): IDataObject {
	if (isPlainObject(value)) {
		return value;
	}

	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			if (isPlainObject(parsed)) {
				return parsed;
			}
		} catch (error) {
			throw new NodeOperationError(
				context.getNode(),
				`${fieldName} must be a valid JSON object: ${(error as Error).message}`,
				{ itemIndex },
			);
		}
	}

	throw new NodeOperationError(context.getNode(), `${fieldName} must be a valid JSON object`, {
		itemIndex,
	});
}

function extractItems(responseData: IDataObject | IDataObject[]): IDataObject[] {
	if (Array.isArray(responseData)) {
		return responseData;
	}

	if (Array.isArray((responseData as { data?: IDataObject[] }).data)) {
		return (responseData as { data: IDataObject[] }).data;
	}

	return [];
}

async function zohoDeskApiRequest(
	this: IExecuteFunctions,
	method: 'GET' | 'POST' | 'PATCH',
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
	const credentials = await this.getCredentials('zohoDeskApi');
	const baseUrl = removeTrailingSlash(credentials.baseUrl as string);

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		json: true,
	};

	if (Object.keys(body).length > 0) {
		options.body = body;
	}

	if (Object.keys(qs).length > 0) {
		options.qs = qs;
	}

	return (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'zohoDeskApi',
		options,
	)) as IDataObject | IDataObject[];
}

async function zohoDeskApiRequestAllItems(
	this: IExecuteFunctions,
	endpoint: string,
	pageSize: number,
	qs: IDataObject = {},
): Promise<IDataObject[]> {
	const returnData: IDataObject[] = [];
	const baseQuery: IDataObject = { ...qs };

	let from = 0;

	if (typeof baseQuery.from === 'number') {
		from = baseQuery.from;
	}

	delete baseQuery.from;
	delete baseQuery.limit;

	while (true) {
		const response = await zohoDeskApiRequest.call(this, 'GET', endpoint, {}, { ...baseQuery, from, limit: pageSize });
		const pageItems = extractItems(response);

		returnData.push(...pageItems);

		if (pageItems.length < pageSize) {
			break;
		}

		from += pageItems.length;
	}

	return returnData;
}

const ticketIncludeOptions: INodeProperties = {
	displayName: 'Include',
	name: 'ticketInclude',
	type: 'multiOptions',
	default: [],
	description: 'Extra related data to include in the response',
	displayOptions: {
		show: {
			resource: ['ticket'],
			operation: ['get', 'getAll'],
		},
	},
	options: [
		{
			name: 'Assignee',
			value: 'assignee',
		},
		{
			name: 'Contact',
			value: 'contacts',
		},
		{
			name: 'Contract',
			value: 'contract',
		},
		{
			name: 'Departments',
			value: 'departments',
		},
		{
			name: 'Products',
			value: 'products',
		},
		{
			name: 'Skills',
			value: 'skills',
		},
		{
			name: 'Team',
			value: 'team',
		},
	],
};

const contactIncludeOptions: INodeProperties = {
	displayName: 'Include',
	name: 'contactInclude',
	type: 'multiOptions',
	default: [],
	description: 'Extra related data to include in the response',
	displayOptions: {
		show: {
			resource: ['contact'],
			operation: ['get', 'getAll'],
		},
	},
	options: [
		{
			name: 'Accounts',
			value: 'accounts',
		},
		{
			name: 'Owner',
			value: 'owner',
		},
	],
};

export class ZohoDesk implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zoho Desk',
		name: 'zohoDesk',
		icon: 'file:zohoDesk.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Consume the Zoho Desk API',
		defaults: {
			name: 'Zoho Desk',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'zohoDeskApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'ticket',
				options: [
					{
						name: 'Contact',
						value: 'contact',
					},
					{
						name: 'Ticket',
						value: 'ticket',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'getAll',
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a resource',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a resource',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many resources',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a resource',
					},
				],
			},
			{
				displayName: 'Ticket ID',
				name: 'ticketId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['ticket'],
						operation: ['get', 'update'],
					},
				},
			},
			ticketIncludeOptions,
			{
				displayName: 'Return All',
				name: 'ticketReturnAll',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['ticket'],
						operation: ['getAll'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'ticketLimit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				displayOptions: {
					show: {
						resource: ['ticket'],
						operation: ['getAll'],
						ticketReturnAll: [false],
					},
				},
			},
			{
				displayName: 'From',
				name: 'ticketFrom',
				type: 'number',
				default: 0,
				typeOptions: {
					minValue: 0,
				},
				displayOptions: {
					show: {
						resource: ['ticket'],
						operation: ['getAll'],
						ticketReturnAll: [false],
					},
				},
				description: 'Index to start listing tickets from',
			},
			{
				displayName: 'Additional Fields',
				name: 'ticketGetAllAdditionalFields',
				type: 'collection',
				default: {},
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['ticket'],
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Assignee',
						name: 'assignee',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Channel',
						name: 'channel',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Department IDs',
						name: 'departmentIds',
						type: 'string',
						default: '',
						description: 'Comma-separated list of department IDs',
					},
					{
						displayName: 'Fields',
						name: 'fields',
						type: 'string',
						default: '',
						description: 'Comma-separated list of fields to return',
					},
					{
						displayName: 'Priority',
						name: 'priority',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Sort By',
						name: 'sortBy',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'string',
						default: '',
					},
					{
						displayName: 'View ID',
						name: 'viewId',
						type: 'string',
						default: '',
					},
				],
			},
			{
				displayName: 'Subject',
				name: 'ticketSubject',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['ticket'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Department ID',
				name: 'ticketDepartmentId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['ticket'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Contact ID',
				name: 'ticketContactId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['ticket'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'ticketCreateAdditionalFields',
				type: 'collection',
				default: {},
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['ticket'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Assignee ID',
						name: 'assigneeId',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Category',
						name: 'category',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Channel',
						name: 'channel',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Contact',
						name: 'contact',
						type: 'json',
						default: '{}',
						description: 'Contact object payload when Contact ID is not provided',
					},
					{
						displayName: 'Custom Fields (CF)',
						name: 'cf',
						type: 'json',
						default: '{}',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						typeOptions: {
							rows: 3,
						},
						default: '',
					},
					{
						displayName: 'Due Date',
						name: 'dueDate',
						type: 'dateTime',
						default: '',
					},
						{
							displayName: 'Email',
							name: 'email',
							type: 'string',
							default: '',
							placeholder: 'name@email.com',
						},
					{
						displayName: 'Entity Skills',
						name: 'entitySkills',
						type: 'string',
						default: '',
						description: 'Comma-separated list of skills',
					},
					{
						displayName: 'Phone',
						name: 'phone',
						type: 'string',
						default: '',
					},
						{
							displayName: 'Priority',
							name: 'priority',
							type: 'options',
							default: 'Medium',
							options: [
							{
								name: 'High',
								value: 'High',
							},
							{
								name: 'Low',
								value: 'Low',
							},
							{
								name: 'Medium',
								value: 'Medium',
							},
							{
								name: 'Urgent',
								value: 'Urgent',
							},
						],
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Sub Category',
						name: 'subCategory',
						type: 'string',
						default: '',
					},
				],
			},
			{
				displayName: 'Update Fields',
				name: 'ticketUpdateFields',
				type: 'collection',
				default: {},
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['ticket'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Assignee ID',
						name: 'assigneeId',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Category',
						name: 'category',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Channel',
						name: 'channel',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Contact ID',
						name: 'contactId',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Custom Fields (CF)',
						name: 'cf',
						type: 'json',
						default: '{}',
					},
					{
						displayName: 'Department ID',
						name: 'departmentId',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						typeOptions: {
							rows: 3,
						},
						default: '',
					},
					{
						displayName: 'Disable Closure Notification',
						name: 'disableClosureNotification',
						type: 'boolean',
						default: false,
						description: 'Whether to disable closure notification',
					},
					{
						displayName: 'Due Date',
						name: 'dueDate',
						type: 'dateTime',
						default: '',
					},
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						default: '',
						placeholder: 'name@email.com',
					},
					{
						displayName: 'Entity Skills',
						name: 'entitySkills',
						type: 'string',
						default: '',
						description: 'Comma-separated list of skills',
					},
					{
						displayName: 'Phone',
						name: 'phone',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Priority',
						name: 'priority',
						type: 'options',
						default: 'Medium',
						options: [
							{
								name: 'High',
								value: 'High',
							},
							{
								name: 'Low',
								value: 'Low',
							},
							{
								name: 'Medium',
								value: 'Medium',
							},
							{
								name: 'Urgent',
								value: 'Urgent',
							},
						],
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Sub Category',
						name: 'subCategory',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Subject',
						name: 'subject',
						type: 'string',
						default: '',
					},
				],
			},
			{
				displayName: 'Contact ID',
				name: 'contactId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['get', 'update'],
					},
				},
			},
			contactIncludeOptions,
			{
				displayName: 'Return All',
				name: 'contactReturnAll',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['getAll'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'contactLimit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['getAll'],
						contactReturnAll: [false],
					},
				},
			},
			{
				displayName: 'From',
				name: 'contactFrom',
				type: 'number',
				default: 0,
				typeOptions: {
					minValue: 0,
				},
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['getAll'],
						contactReturnAll: [false],
					},
				},
				description: 'Index to start listing contacts from',
			},
			{
				displayName: 'Additional Fields',
				name: 'contactGetAllAdditionalFields',
				type: 'collection',
				default: {},
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Fields',
						name: 'fields',
						type: 'string',
						default: '',
						description: 'Comma-separated list of fields to return',
					},
					{
						displayName: 'Sort By',
						name: 'sortBy',
						type: 'string',
						default: '',
					},
					{
						displayName: 'View ID',
						name: 'viewId',
						type: 'string',
						default: '',
					},
				],
			},
			{
				displayName: 'Last Name',
				name: 'contactLastName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'First Name',
				name: 'contactFirstName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'contactCreateAdditionalFields',
				type: 'collection',
				default: {},
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Account ID',
						name: 'accountId',
						type: 'string',
						default: '',
					},
					{
						displayName: 'City',
						name: 'city',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Country',
						name: 'country',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Custom Fields (CF)',
						name: 'cf',
						type: 'json',
						default: '{}',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
					},
						{
							displayName: 'Email',
							name: 'email',
							type: 'string',
							default: '',
							placeholder: 'name@email.com',
						},
					{
						displayName: 'Facebook',
						name: 'facebook',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Mobile',
						name: 'mobile',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Phone',
						name: 'phone',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Secondary Email',
						name: 'secondaryEmail',
						type: 'string',
						default: '',
					},
					{
						displayName: 'State',
						name: 'state',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Twitter',
						name: 'twitter',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Zip',
						name: 'zip',
						type: 'string',
						default: '',
					},
				],
			},
			{
				displayName: 'Update Fields',
				name: 'contactUpdateFields',
				type: 'collection',
				default: {},
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Account ID',
						name: 'accountId',
						type: 'string',
						default: '',
					},
					{
						displayName: 'City',
						name: 'city',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Country',
						name: 'country',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Custom Fields (CF)',
						name: 'cf',
						type: 'json',
						default: '{}',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
					},
						{
							displayName: 'Email',
							name: 'email',
							type: 'string',
							default: '',
							placeholder: 'name@email.com',
						},
					{
						displayName: 'Facebook',
						name: 'facebook',
						type: 'string',
						default: '',
					},
					{
						displayName: 'First Name',
						name: 'firstName',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Last Name',
						name: 'lastName',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Mobile',
						name: 'mobile',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Phone',
						name: 'phone',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Secondary Email',
						name: 'secondaryEmail',
						type: 'string',
						default: '',
					},
					{
						displayName: 'State',
						name: 'state',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Twitter',
						name: 'twitter',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Zip',
						name: 'zip',
						type: 'string',
						default: '',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let responseData: IDataObject | IDataObject[] = {};

				if (resource === 'ticket') {
					if (operation === 'get') {
						const ticketId = this.getNodeParameter('ticketId', i) as string;
						const include = this.getNodeParameter('ticketInclude', i, []) as string[];
						const qs: IDataObject = {};

						if (include.length > 0) {
							qs.include = include.join(',');
						}

						responseData = await zohoDeskApiRequest.call(this, 'GET', `/api/v1/tickets/${ticketId}`, {}, qs);
					}

					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('ticketReturnAll', i) as boolean;
						const include = this.getNodeParameter('ticketInclude', i, []) as string[];
						const additionalFields = this.getNodeParameter(
							'ticketGetAllAdditionalFields',
							i,
							{},
						) as IDataObject;

						const qs: IDataObject = {};
						if (include.length > 0) {
							qs.include = include.join(',');
						}

						setIfDefined(qs, 'assignee', additionalFields.assignee);
						setIfDefined(qs, 'channel', additionalFields.channel);
						setIfDefined(qs, 'departmentIds', additionalFields.departmentIds);
						setIfDefined(qs, 'fields', additionalFields.fields);
						setIfDefined(qs, 'priority', additionalFields.priority);
						setIfDefined(qs, 'sortBy', additionalFields.sortBy);
						setIfDefined(qs, 'status', additionalFields.status);
						setIfDefined(qs, 'viewId', additionalFields.viewId);

						if (returnAll) {
							responseData = await zohoDeskApiRequestAllItems.call(this, '/api/v1/tickets', 100, qs);
						} else {
							qs.limit = this.getNodeParameter('ticketLimit', i) as number;
							qs.from = this.getNodeParameter('ticketFrom', i) as number;
							responseData = extractItems(
								await zohoDeskApiRequest.call(this, 'GET', '/api/v1/tickets', {}, qs),
							);
						}
					}

					if (operation === 'create') {
						const subject = this.getNodeParameter('ticketSubject', i) as string;
						const departmentId = this.getNodeParameter('ticketDepartmentId', i) as string;
						const contactId = this.getNodeParameter('ticketContactId', i, '') as string;
						const additionalFields = this.getNodeParameter(
							'ticketCreateAdditionalFields',
							i,
							{},
						) as IDataObject;

						const body: IDataObject = {
							subject,
							departmentId,
						};

						setIfDefined(body, 'contactId', contactId);
						setIfDefined(body, 'assigneeId', additionalFields.assigneeId);
						setIfDefined(body, 'category', additionalFields.category);
						setIfDefined(body, 'channel', additionalFields.channel);
						setIfDefined(body, 'description', additionalFields.description);
						setIfDefined(body, 'dueDate', additionalFields.dueDate);
						setIfDefined(body, 'email', additionalFields.email);
						setIfDefined(body, 'phone', additionalFields.phone);
						setIfDefined(body, 'priority', additionalFields.priority);
						setIfDefined(body, 'status', additionalFields.status);
						setIfDefined(body, 'subCategory', additionalFields.subCategory);

						if (typeof additionalFields.entitySkills === 'string' && additionalFields.entitySkills.trim() !== '') {
							body.entitySkills = additionalFields.entitySkills
								.split(',')
								.map((skill) => skill.trim())
								.filter((skill) => skill !== '');
						}

						if (additionalFields.cf !== undefined && additionalFields.cf !== '') {
							body.cf = toJsonObject(this, i, additionalFields.cf, 'Custom Fields (CF)');
						}

						if (additionalFields.contact !== undefined && additionalFields.contact !== '') {
							body.contact = toJsonObject(this, i, additionalFields.contact, 'Contact');
						}

						responseData = await zohoDeskApiRequest.call(this, 'POST', '/api/v1/tickets', body);
					}

					if (operation === 'update') {
						const ticketId = this.getNodeParameter('ticketId', i) as string;
						const updateFields = this.getNodeParameter('ticketUpdateFields', i, {}) as IDataObject;

						const body: IDataObject = {};
						const qs: IDataObject = {};

						setIfDefined(body, 'assigneeId', updateFields.assigneeId);
						setIfDefined(body, 'category', updateFields.category);
						setIfDefined(body, 'channel', updateFields.channel);
						setIfDefined(body, 'contactId', updateFields.contactId);
						setIfDefined(body, 'departmentId', updateFields.departmentId);
						setIfDefined(body, 'description', updateFields.description);
						setIfDefined(body, 'dueDate', updateFields.dueDate);
						setIfDefined(body, 'email', updateFields.email);
						setIfDefined(body, 'phone', updateFields.phone);
						setIfDefined(body, 'priority', updateFields.priority);
						setIfDefined(body, 'status', updateFields.status);
						setIfDefined(body, 'subject', updateFields.subject);
						setIfDefined(body, 'subCategory', updateFields.subCategory);

						if (typeof updateFields.entitySkills === 'string' && updateFields.entitySkills.trim() !== '') {
							body.entitySkills = updateFields.entitySkills
								.split(',')
								.map((skill) => skill.trim())
								.filter((skill) => skill !== '');
						}

						if (updateFields.cf !== undefined && updateFields.cf !== '') {
							body.cf = toJsonObject(this, i, updateFields.cf, 'Custom Fields (CF)');
						}

						if (typeof updateFields.disableClosureNotification === 'boolean') {
							qs.disableClosureNotification = updateFields.disableClosureNotification;
						}

						if (Object.keys(body).length === 0 && Object.keys(qs).length === 0) {
							throw new NodeOperationError(
								this.getNode(),
								'Select at least one field to update.',
								{ itemIndex: i },
							);
						}

						responseData = await zohoDeskApiRequest.call(
							this,
							'PATCH',
							`/api/v1/tickets/${ticketId}`,
							body,
							qs,
						);
					}
				}

				if (resource === 'contact') {
					if (operation === 'get') {
						const contactId = this.getNodeParameter('contactId', i) as string;
						const include = this.getNodeParameter('contactInclude', i, []) as string[];
						const qs: IDataObject = {};

						if (include.length > 0) {
							qs.include = include.join(',');
						}

						responseData = await zohoDeskApiRequest.call(this, 'GET', `/api/v1/contacts/${contactId}`, {}, qs);
					}

					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('contactReturnAll', i) as boolean;
						const include = this.getNodeParameter('contactInclude', i, []) as string[];
						const additionalFields = this.getNodeParameter(
							'contactGetAllAdditionalFields',
							i,
							{},
						) as IDataObject;

						const qs: IDataObject = {};
						if (include.length > 0) {
							qs.include = include.join(',');
						}

						setIfDefined(qs, 'fields', additionalFields.fields);
						setIfDefined(qs, 'sortBy', additionalFields.sortBy);
						setIfDefined(qs, 'viewId', additionalFields.viewId);

						if (returnAll) {
							responseData = await zohoDeskApiRequestAllItems.call(this, '/api/v1/contacts', 100, qs);
						} else {
							qs.limit = this.getNodeParameter('contactLimit', i) as number;
							qs.from = this.getNodeParameter('contactFrom', i) as number;
							responseData = extractItems(
								await zohoDeskApiRequest.call(this, 'GET', '/api/v1/contacts', {}, qs),
							);
						}
					}

					if (operation === 'create') {
						const lastName = this.getNodeParameter('contactLastName', i) as string;
						const firstName = this.getNodeParameter('contactFirstName', i, '') as string;
						const additionalFields = this.getNodeParameter(
							'contactCreateAdditionalFields',
							i,
							{},
						) as IDataObject;

						const body: IDataObject = { lastName };

						setIfDefined(body, 'firstName', firstName);
						setIfDefined(body, 'accountId', additionalFields.accountId);
						setIfDefined(body, 'city', additionalFields.city);
						setIfDefined(body, 'country', additionalFields.country);
						setIfDefined(body, 'description', additionalFields.description);
						setIfDefined(body, 'email', additionalFields.email);
						setIfDefined(body, 'facebook', additionalFields.facebook);
						setIfDefined(body, 'mobile', additionalFields.mobile);
						setIfDefined(body, 'phone', additionalFields.phone);
						setIfDefined(body, 'secondaryEmail', additionalFields.secondaryEmail);
						setIfDefined(body, 'state', additionalFields.state);
						setIfDefined(body, 'twitter', additionalFields.twitter);
						setIfDefined(body, 'type', additionalFields.type);
						setIfDefined(body, 'zip', additionalFields.zip);

						if (additionalFields.cf !== undefined && additionalFields.cf !== '') {
							body.cf = toJsonObject(this, i, additionalFields.cf, 'Custom Fields (CF)');
						}

						responseData = await zohoDeskApiRequest.call(this, 'POST', '/api/v1/contacts', body);
					}

					if (operation === 'update') {
						const contactId = this.getNodeParameter('contactId', i) as string;
						const updateFields = this.getNodeParameter('contactUpdateFields', i, {}) as IDataObject;

						const body: IDataObject = {};

						setIfDefined(body, 'accountId', updateFields.accountId);
						setIfDefined(body, 'city', updateFields.city);
						setIfDefined(body, 'country', updateFields.country);
						setIfDefined(body, 'description', updateFields.description);
						setIfDefined(body, 'email', updateFields.email);
						setIfDefined(body, 'facebook', updateFields.facebook);
						setIfDefined(body, 'firstName', updateFields.firstName);
						setIfDefined(body, 'lastName', updateFields.lastName);
						setIfDefined(body, 'mobile', updateFields.mobile);
						setIfDefined(body, 'phone', updateFields.phone);
						setIfDefined(body, 'secondaryEmail', updateFields.secondaryEmail);
						setIfDefined(body, 'state', updateFields.state);
						setIfDefined(body, 'twitter', updateFields.twitter);
						setIfDefined(body, 'type', updateFields.type);
						setIfDefined(body, 'zip', updateFields.zip);

						if (updateFields.cf !== undefined && updateFields.cf !== '') {
							body.cf = toJsonObject(this, i, updateFields.cf, 'Custom Fields (CF)');
						}

						if (Object.keys(body).length === 0) {
							throw new NodeOperationError(
								this.getNode(),
								'Select at least one field to update.',
								{ itemIndex: i },
							);
						}

						responseData = await zohoDeskApiRequest.call(
							this,
							'PATCH',
							`/api/v1/contacts/${contactId}`,
							body,
						);
					}
				}

				const normalizedData = Array.isArray(responseData) ? responseData : [responseData];
				returnData.push(...this.helpers.returnJsonArray(normalizedData));
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}

				if (error instanceof Error) {
					throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
				}

				throw error;
			}
		}

		return [returnData];
	}
}

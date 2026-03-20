import type {
  IPollFunctions,
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  IDataObject,
  ILoadOptionsFunctions,
  INodePropertyOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
  getZohoDeskApiBaseUrl,
  getZohoDeskLoadOptionsErrorMessage,
  zohoDeskApiRequest,
  zohoDeskLoadOptionsRequest,
} from './GenericFunctions';

/**
 * Interface for tracking poll state between executions
 */
interface ZohoDeskPollState {
  /** Timestamp of last successful poll */
  lastPollTime?: number;
  /** IDs of items seen in last poll to prevent duplicates */
  lastSeenIds?: string[];
}

/**
 * Zoho Desk Trigger Node
 * Polls Zoho Desk API for new or updated tickets, contacts, and accounts
 */
export class ZohoDeskTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Zoho Desk Trigger',
    name: 'zohoDeskTrigger',
    icon: 'file:zohoDesk.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["event"]}}',
    description: 'Triggers when tickets, contacts, or accounts are created or updated in Zoho Desk',
    defaults: {
      name: 'Zoho Desk Trigger',
    },
    credentials: [
      {
        name: 'zohoDeskOAuth2Api',
        required: true,
      },
    ],
    polling: true,
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Event',
        name: 'event',
        type: 'options',
        options: [
          {
            name: 'Account Updated',
            value: 'accountUpdated',
            description: 'Triggers when an existing account is updated',
          },
          {
            name: 'Contact Updated',
            value: 'contactUpdated',
            description: 'Triggers when an existing contact is updated',
          },
          {
            name: 'New Account',
            value: 'newAccount',
            description: 'Triggers when a new account is created',
          },
          {
            name: 'New Contact',
            value: 'newContact',
            description: 'Triggers when a new contact is created',
          },
          {
            name: 'New Ticket',
            value: 'newTicket',
            description: 'Triggers when a new ticket is created',
          },
          {
            name: 'Ticket Updated',
            value: 'ticketUpdated',
            description: 'Triggers when an existing ticket is updated',
          },
        ],
        default: 'newTicket',
        required: true,
      },
      {
        displayName: 'Department Name or ID',
        name: 'departmentId',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getDepartments',
        },
        default: '',
        description:
          'Filter tickets by department. Leave empty to get tickets from all departments. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        displayOptions: {
          show: {
            event: ['newTicket', 'ticketUpdated'],
          },
        },
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Include',
            name: 'include',
            type: 'multiOptions',
            options: [
              {
                name: 'Contacts',
                value: 'contacts',
                description: 'Include contact details in the response',
              },
              {
                name: 'Products',
                value: 'products',
                description: 'Include product details in the response',
              },
              {
                name: 'Departments',
                value: 'departments',
                description: 'Include department details in the response',
              },
              {
                name: 'Assignee',
                value: 'assignee',
                description: 'Include assignee details in the response',
              },
            ],
            default: [],
            description: 'Additional data to include in the response',
            displayOptions: {
              show: {
                '/event': ['newTicket', 'ticketUpdated'],
              },
            },
          },
          {
            displayName: 'Limit',
            name: 'limit',
            type: 'number',
            default: 50,
            description: 'Max number of results to return',
            typeOptions: {
              minValue: 1,
            },
          },
        ],
      },
    ],
  };

  methods = {
    loadOptions: {
      /**
       * Load departments from Zoho Desk for dropdown selection
       */
      async getDepartments(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        try {
          const credentials = await this.getCredentials('zohoDeskOAuth2Api');
          const orgId = credentials.orgId as string;
          const baseUrl = getZohoDeskApiBaseUrl(credentials);

          const options = {
            method: 'GET' as const,
            headers: {
              orgId: orgId,
            },
            url: `${baseUrl}/departments`,
            json: true,
          };

          const response = await zohoDeskLoadOptionsRequest(this, credentials, options);

          if (
            !response ||
            typeof response !== 'object' ||
            !('data' in response) ||
            !Array.isArray(response.data)
          ) {
            return [];
          }

          return (response.data as Array<{ id: string; name: string }>).map((dept) => ({
            name: dept.name,
            value: dept.id,
          }));
        } catch (error) {
          const errorMessage = getZohoDeskLoadOptionsErrorMessage(error, 'departments');
          return [
            {
              name: `⚠️ Error loading departments: ${errorMessage}`,
              value: '',
            },
          ];
        }
      },
    },
  };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    const event = this.getNodeParameter('event') as string;
    const options = this.getNodeParameter('options', {}) as IDataObject;
    const limit = (options.limit as number) || 50;

    // Get credentials
    const credentials = await this.getCredentials('zohoDeskOAuth2Api');
    const orgId = credentials.orgId as string;
    const baseUrl = getZohoDeskApiBaseUrl(credentials);

    // Get workflow static data for state tracking
    const staticData = this.getWorkflowStaticData('node') as ZohoDeskPollState;

    // Check if this is the first run (no lastPollTime set)
    // Note: n8n's "Fetch Test Event" uses mode='trigger', not 'manual'
    // So we use isFirstRun to detect both test and first production poll
    const isFirstRun = staticData.lastPollTime === undefined;

    // Determine endpoint and time field based on event type
    let endpoint: string;
    let timeField: string;
    let sortField: string;

    switch (event) {
      case 'newTicket':
        endpoint = '/tickets';
        timeField = 'createdTime';
        sortField = 'createdTime';
        break;
      case 'ticketUpdated':
        endpoint = '/tickets';
        timeField = 'modifiedTime';
        sortField = 'modifiedTime';
        break;
      case 'newContact':
        endpoint = '/contacts';
        timeField = 'createdTime';
        sortField = 'createdTime';
        break;
      case 'contactUpdated':
        endpoint = '/contacts';
        timeField = 'modifiedTime';
        sortField = 'modifiedTime';
        break;
      case 'newAccount':
        endpoint = '/accounts';
        timeField = 'createdTime';
        sortField = 'createdTime';
        break;
      case 'accountUpdated':
        endpoint = '/accounts';
        timeField = 'modifiedTime';
        sortField = 'modifiedTime';
        break;
      default:
        endpoint = '/tickets';
        timeField = 'createdTime';
        sortField = 'createdTime';
    }

    // Build query parameters - sort by the relevant time field descending to get newest first
    const queryParams: IDataObject = {
      limit: isFirstRun ? 10 : limit, // Limit to 10 for first run/test
      sortBy: `-${sortField}`, // Descending order (newest first)
    };

    // Add department filter for ticket events
    if (
      (event === 'newTicket' || event === 'ticketUpdated') &&
      this.getNodeParameter('departmentId', '') !== ''
    ) {
      queryParams.departmentId = this.getNodeParameter('departmentId') as string;
    }

    // Add include parameter for tickets
    if ((event === 'newTicket' || event === 'ticketUpdated') && options.include) {
      const includes = options.include as string[];
      if (includes.length > 0) {
        queryParams.include = includes.join(',');
      }
    }

    try {
      // Build query string
      const queryString = Object.entries(queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');

      const requestOptions = {
        method: 'GET' as const,
        headers: {
          orgId: orgId,
        },
        uri: `${baseUrl}${endpoint}?${queryString}`,
        json: true,
      };

      const response = await zohoDeskApiRequest(this, requestOptions);

      // Check for Zoho API error response
      if (response && typeof response === 'object') {
        const resp = response as IDataObject;
        if (resp.errorCode) {
          throw new NodeOperationError(
            this.getNode(),
            `Zoho Desk API Error: ${resp.errorCode} - ${resp.message || 'Unknown error'}`,
          );
        }
      }

      // Parse response - Zoho returns { data: [...] }
      const items: IDataObject[] = [];
      if (
        response &&
        typeof response === 'object' &&
        'data' in response &&
        Array.isArray((response as IDataObject).data)
      ) {
        items.push(...((response as IDataObject).data as IDataObject[]));
      }

      // Handle different execution modes
      // Note: n8n's "Fetch Test Event" uses mode='trigger', not 'manual'
      // So we detect test mode by checking if this is the first run (no state)

      if (isFirstRun) {
        // FIRST RUN (includes "Fetch Test Event"): Return items for testing
        // Then initialize state for subsequent polls
        staticData.lastPollTime = Date.now();
        staticData.lastSeenIds = items.map((item) => item.id as string);

        if (items.length === 0) {
          return null;
        }

        // Return items so "Fetch Test Event" shows sample data
        const returnData: INodeExecutionData[] = items.map((item) => ({
          json: item,
        }));
        return [returnData];
      }

      // SUBSEQUENT PRODUCTION RUNS: Filter for new items since last poll
      const lastPollTime = staticData.lastPollTime as number;
      const lastSeenIds = staticData.lastSeenIds || [];

      const newItems = items.filter((item) => {
        const itemId = item.id as string;
        const itemTime = new Date(item[timeField] as string).getTime();

        // Skip if we've already seen this item (prevents duplicates at boundaries)
        if (lastSeenIds.includes(itemId)) {
          return false;
        }

        // Only include items newer than last poll time
        return itemTime > lastPollTime;
      });

      // Update state for next poll
      staticData.lastPollTime = Date.now();
      staticData.lastSeenIds =
        newItems.length > 0 ? newItems.map((item) => item.id as string) : lastSeenIds;

      // Return null if no new items (n8n convention for empty polls)
      if (newItems.length === 0) {
        return null;
      }

      // Format items for n8n output
      const returnData: INodeExecutionData[] = newItems.map((item) => ({
        json: item,
      }));

      return [returnData];
    } catch (error) {
      // On first run, initialize state even if there's an error
      if (isFirstRun) {
        staticData.lastPollTime = Date.now();
        staticData.lastSeenIds = [];
      }
      throw error;
    }
  }
}

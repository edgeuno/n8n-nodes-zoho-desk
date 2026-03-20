# n8n-nodes-zoho-desk-edgeuno

Community n8n package for working with Zoho Desk over OAuth2.

It includes a regular node for operational actions and a polling trigger node for change detection.

## Features

- OAuth2 credential with Zoho data center selection
- Required `orgId` header handling for Zoho Desk requests
- Ticket, Contact, Account, Task, and Event resources in the main node
- Ticket activity history support
- Trigger node for new and updated tickets, contacts, and accounts
- Pagination support with `Return All`
- Support for Zoho Desk custom fields through `cf`
- Department and team load options for ticket operations

## Resources And Operations

### Zoho Desk

- Ticket
  - `create`
  - `get`
  - `list`
  - `update`
  - `delete`
  - `addComment`
  - `listThreads`
  - `listActivities`
- Contact
  - `create`
  - `get`
  - `list`
  - `update`
  - `delete`
- Account
  - `create`
  - `get`
  - `list`
  - `update`
  - `delete`
- Task
  - `create`
  - `get`
  - `list`
  - `update`
- Event
  - `create`
  - `get`
  - `list`
  - `update`

### Zoho Desk Trigger

- Poll for new and updated:
  - Tickets
  - Contacts
  - Accounts

## Task And Event Support

The node now supports Zoho Desk activity management through Tasks and Events.

### Tasks

You can:

- Create tasks with fields like `departmentId`, `subject`, `ticketId`, `dueDate`, `ownerId`, `priority`, `status`, `contactId`, `teamId`, `reminder`, and `cf`
- Get a task by ID with optional related data in `include`
- List tasks with filters such as `departmentId`, `departmentIds`, `viewId`, `assignee`, `dueDate`, `isCompleted`, `isSpam`, and `sortBy`
- Update existing tasks

### Events

You can:

- Create events with fields like `departmentId`, `contactId`, `subject`, `startTime`, `duration`, `ticketId`, `ownerId`, `priority`, `status`, `teamId`, `reminder`, and `cf`
- Get an event by ID with optional related data in `include`
- List events with filters such as `departmentId`, `departmentIds`, `viewId`, `assignee`, `startTime`, `isCompleted`, and `sortBy`
- Update existing events

### Ticket Activities

Use `Ticket > List Activities` to fetch ticket history from Zoho Desk.

Supported filters include:

- `agentId`
- `fieldName`
- `eventFilter`

## Credentials

Use the `Zoho Desk OAuth2 API` credential.

Required setup values:

- `Client ID`
- `Client Secret`
- `Zoho Data Center`
  - `com`
  - `eu`
  - `in`
  - `jp`
  - `com.au`
  - `com.cn`
- `Organization ID`
- `Scopes`

Recommended scopes by feature:

- Base node usage:
  - `Desk.tickets.ALL`
  - `Desk.contacts.READ`
  - `Desk.contacts.WRITE`
  - `Desk.search.READ`
  - `Desk.basic.READ`
  - `Desk.settings.READ`
- Tasks:
  - `Desk.activities.READ`
  - `Desk.activities.CREATE`
  - `Desk.activities.UPDATE`
  - `Desk.activities.tasks.READ`
  - `Desk.activities.tasks.CREATE`
  - `Desk.activities.tasks.UPDATE`
- Events:
  - `Desk.activities.events.READ`
  - `Desk.activities.events.CREATE`
  - `Desk.activities.events.UPDATE`

If you created credentials before task and event support was added, reconnect or update the credential so the new scopes are included.

## Notes

- Ticket department and team fields support dropdown loading.
- Task and event operations accept manual IDs directly for fields like `departmentId`, `contactId`, `teamId`, `ownerId`, and `ticketId`.
- Custom fields should be sent as a JSON object in `cf`.
- Reminder values for tasks and events should be sent as a JSON array.

## Installation

### In n8n

Install the community package:

```bash
npm install n8n-nodes-zoho-desk-edgeuno
```

Restart n8n after installation or upgrade.

### Local Development

```bash
npm install
npm run lint
npm run build
```

Link into a local n8n installation:

```bash
npm link
# in your n8n installation
npm link n8n-nodes-zoho-desk-edgeuno
```

## Publishing

This package is configured for npm publishing through `prepack` and `prepublishOnly`.

Typical flow:

```bash
npm run lint
npm run build
npm publish
```

## Documentation

- Zoho Desk API docs: https://desk.zoho.com/DeskAPIDocument#Introduction
- Tasks: https://desk.zoho.com/DeskAPIDocument#Tasks
- Events: https://desk.zoho.com/DeskAPIDocument#Events
- Activities: https://desk.zoho.com/DeskAPIDocument#Activities
- n8n node development docs: https://docs.n8n.io/integrations/creating-nodes/build/

# n8n-nodes-zoho-desk-edgeuno

Community n8n node for Zoho Desk automation with OAuth2 authentication, dynamic load options, and trigger support.

## Features

- OAuth2 credential for Zoho Desk with data center selection
- Required multi-select OAuth scopes in credential setup
- Ticket, Contact, and Account resources
- Trigger node for new/updated tickets, contacts, and accounts
- Dynamic Department and Team dropdowns
- Support for pagination (`Return All`) and custom fields (`cf`)

## Supported Operations

- Ticket: `create`, `get`, `list`, `update`, `delete`, `addComment`, `listThreads`
- Contact: `create`, `get`, `list`, `update`, `delete`
- Account: `create`, `get`, `list`, `update`, `delete`

## Credentials

Use `Zoho Desk OAuth2 API` credentials:

- `Client ID` and `Client Secret` from Zoho API Console
- `Zoho Data Center` (`com`, `eu`, `in`, `jp`, `com.au`, `com.cn`)
- `Organization ID` (Zoho Desk Setup > Developer Space > API)
- `Scopes` (multi-select, required)

This node requests OAuth scopes from your selected list and sends `orgId` in API headers.

## Nodes Included

- `Zoho Desk` (regular node)
- `Zoho Desk Trigger` (polling trigger)

## Local Development

```bash
npm install
npm run lint
npm run build
```

Link in local n8n:

```bash
npm link
# in your n8n installation
npm link n8n-nodes-zoho-desk-edgeuno
```

## Source Documentation

- n8n node build docs: https://docs.n8n.io/integrations/creating-nodes/build/
- Zoho Desk API docs: https://desk.zoho.com/DeskAPIDocument#Introduction

# n8n-nodes-zoho-desk-edgeuno

Community n8n node for Zoho Desk API operations on tickets and contacts.

## Supported Resources

- Ticket
  - Create
  - Get
  - Get Many
  - Update
- Contact
  - Create
  - Get
  - Get Many
  - Update

## Credentials

Use `Zoho Desk API` credentials with:

- `Base URL` (for example `https://desk.zoho.com`)
- `Access Token` (OAuth token)
- `Organization ID` (`orgId` header required by Zoho Desk APIs)
- `Scopes` (select only scopes needed for the operations you run)

The node sends:

- `Authorization: Zoho-oauthtoken <token>`
- `orgId: <organization_id>`

## Local Development

```bash
npm install
npm run build
```

Link into local n8n:

```bash
npm link
# in your n8n installation
npm link n8n-nodes-zoho-desk-edgeuno
```

## Notes

- Pagination uses Zoho Desk `from` + `limit`.
- `Get Many` supports `Return All`.
- JSON fields such as `cf` are passed directly to the API.
- The node validates selected credential scopes before each operation.

## Source Documentation

- n8n custom node build docs: https://docs.n8n.io/integrations/creating-nodes/build/
- Zoho Desk API docs: https://desk.zoho.com/DeskAPIDocument#Introduction

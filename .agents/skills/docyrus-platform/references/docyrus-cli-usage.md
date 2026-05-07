# Docyrus CLI Usage

Complete command reference for the Docyrus CLI (`@docyrus/docyrus`).

## Global Flags

- `-g, --global` — Use global `~/.docyrus` settings instead of local project settings

---

## auth — Authentication

### `docyrus auth login`

Authorize CLI using OAuth2 device flow or manual token entry.

| Option           | Type   | Default        | Description                                     |
| ---------------- | ------ | -------------- | ----------------------------------------------- |
| `--clientId`     | string | auto-resolved  | OAuth2 client id                                |
| `--scope`        | string | default scopes | OAuth2 scopes                                   |
| `--accessToken`  | string | —              | Manual access token; skips device flow          |
| `--refreshToken` | string | —              | Manual refresh token (requires `--accessToken`) |

**Client ID resolution order:** explicit `--clientId` > `DOCYRUS_API_CLIENT_ID` env var > local config > global config > `manual-token` fallback.

**Default scopes:** `openid email profile offline_access ReadWrite.All User.ReadWrite Users.ReadWrite.All Tenant.Read Teams.Read.All DS.ReadWrite.All Docs.ReadWrite.All Architect.ReadWrite.All AI.ReadWrite.All`

### `docyrus auth set-tokens`

Set custom access and refresh tokens for the active environment.

| Option           | Type   | Required | Description          |
| ---------------- | ------ | -------- | -------------------- |
| `--clientId`     | string | no       | OAuth2 client id     |
| `--scope`        | string | no       | OAuth2 scopes        |
| `--accessToken`  | string | yes      | Custom access token  |
| `--refreshToken` | string | no       | Custom refresh token |

### `docyrus auth accounts list`

List saved user accounts for the current API base URL.

### `docyrus auth accounts use`

Switch active account by user ID.

| Option     | Type   | Required | Description         |
| ---------- | ------ | -------- | ------------------- |
| `--userId` | string | yes      | User ID to activate |

### `docyrus auth tenants list`

List available tenants for an account.

| Option     | Type   | Required | Description                         |
| ---------- | ------ | -------- | ----------------------------------- |
| `--userId` | string | no       | User ID; defaults to active account |

### `docyrus auth tenants use <tenantSelector>`

Switch active tenant for an account.

| Argument         | Type   | Required | Description                            |
| ---------------- | ------ | -------- | -------------------------------------- |
| `tenantSelector` | string | yes      | Tenant number (numeric) or tenant UUID |

| Option     | Type   | Required | Description                                  |
| ---------- | ------ | -------- | -------------------------------------------- |
| `--userId` | string | no       | User ID; defaults to active account          |
| `--scope`  | string | no       | Scope for tenant bootstrap login if required |

**Note:** Numeric selector = tenant number, non-numeric = UUID.

### `docyrus auth logout`

Revoke and clear all tenant sessions for the active account.

| Option       | Type   | Required | Description               |
| ------------ | ------ | -------- | ------------------------- |
| `--clientId` | string | no       | OAuth2 client id override |

### `docyrus auth who`

Return current authenticated user (`/v1/users/me`).

---

## ai — AI Agent Chat

### `docyrus ai "<prompt>"`

Send a prompt to a Docyrus AI agent.

| Argument | Type   | Required | Description                                   |
| -------- | ------ | -------- | --------------------------------------------- |
| `prompt` | string | yes      | Prompt string (quote when it contains spaces) |

| Option           | Type   | Default       | Description         |
| ---------------- | ------ | ------------- | ------------------- |
| `--agentId`      | string | default agent | Agent ID to use     |
| `--deploymentId` | string | —             | Agent deployment ID |

**Output behavior:**

- TTY mode: renders markdown for human readability
- `--json`, `--verbose`, or `--format`: preserves structured output

**Response fields:** `agentId`, `deploymentId`, `prompt`, `text`, `reasoning` (optional), `data` (optional).

---

## browser — Browser Automation

Browser automation commands (local Chrome or remote Cloudflare Browser Rendering). All commands return JSON with a `mode` field (`"local"` or `"remote"`).

### `docyrus browser start`

Start a browser session. Local mode launches Chrome on `:9222`. Sandbox mode creates a Cloudflare session.

| Option      | Type    | Description                                       |
| ----------- | ------- | ------------------------------------------------- |
| `--profile` | boolean | Copy the default Chrome profile (local mode only) |

### `docyrus browser nav <url>`

Navigate the active tab or open the URL in a new tab.

| Option     | Type    | Description                     |
| ---------- | ------- | ------------------------------- |
| `--new`    | boolean | Open the URL in a new tab       |
| `--reload` | boolean | Force a reload after navigation |

### `docyrus browser eval <code>`

Execute JavaScript in the active tab and print the result.

### `docyrus browser screenshot`

Capture the current viewport and return the temporary screenshot file path.

### `docyrus browser pick <message>`

Open an interactive element picker in the active tab and return information about the selected element or elements.

### `docyrus browser cookies`

Print cookies for the active tab, including domain, path, `httpOnly`, and `secure` flags.

### `docyrus browser content <url>`

Navigate to a URL and extract readable content as markdown.

### `docyrus browser run-script <script>`

Run a CDP script file on the active browser session.

| Option        | Type   | Description                             |
| ------------- | ------ | --------------------------------------- |
| `--appId`     | string | App ID for browser session resolution   |
| `--appSlug`   | string | App slug for browser session resolution |
| `--keepAlive` | number | Session keep-alive in milliseconds      |

---

## ds — Data Source Item Operations

### `docyrus ds get <appSlug> <dataSourceSlug>`

Get data source metadata, including its `fields`.

| Argument         | Type   | Required | Description      |
| ---------------- | ------ | -------- | ---------------- |
| `appSlug`        | string | yes      | App slug         |
| `dataSourceSlug` | string | yes      | Data source slug |

### `docyrus ds list <appSlug> <dataSourceSlug>`

List data source items with the supported query parameters.

| Argument         | Type   | Required | Description      |
| ---------------- | ------ | -------- | ---------------- |
| `appSlug`        | string | yes      | App slug         |
| `dataSourceSlug` | string | yes      | Data source slug |

Most frequently used options:

| Option            | Type   | Description        |
| ----------------- | ------ | ------------------ |
| `--columns`       | string | Column selection   |
| `--filters`       | string | JSON filter object |
| `--filterKeyword` | string | Keyword filter     |
| `--orderBy`       | string | Sort order         |
| `--limit`         | number | Result limit       |
| `--offset`        | number | Result offset      |

Advanced options:

| Option              | Type    | Description                                           |
| ------------------- | ------- | ----------------------------------------------------- |
| `--collapseRows`    | boolean | Collapse rows into a single aggregated array          |
| `--distinctColumns` | string  | Distinct columns; comma-separated or JSON array       |
| `--formulas`        | string  | JSON formulas object                                  |
| `--calculations`    | string  | JSON calculations array                               |
| `--groupSummaries`  | boolean | Return per-group summaries when calculations are used |
| `--fullCount`       | boolean | Include total count                                   |
| `--expand`          | string  | Expand columns; comma-separated or JSON array         |
| `--pivot`           | string  | JSON pivot configuration                              |
| `--childQueries`    | string  | JSON child query array                                |

### `docyrus ds create <appSlug> <dataSourceSlug>`

Create data source item(s).

| Argument         | Type   | Required | Description      |
| ---------------- | ------ | -------- | ---------------- |
| `appSlug`        | string | yes      | App slug         |
| `dataSourceSlug` | string | yes      | Data source slug |

| Option       | Type   | Description                    |
| ------------ | ------ | ------------------------------ |
| `--data`     | string | JSON payload for record fields |
| `--fromFile` | string | Path to JSON or CSV file       |

**Notes:**

- Array payloads trigger bulk create (max 50 items per batch)
- Supports JSON and CSV input files

### `docyrus ds update <appSlug> <dataSourceSlug> [recordId]`

Update data source item(s).

| Argument         | Type   | Required           | Description      |
| ---------------- | ------ | ------------------ | ---------------- |
| `appSlug`        | string | yes                | App slug         |
| `dataSourceSlug` | string | yes                | Data source slug |
| `recordId`       | string | for single updates | Record ID        |

| Option       | Type   | Description                    |
| ------------ | ------ | ------------------------------ |
| `--data`     | string | JSON payload for record fields |
| `--fromFile` | string | Path to JSON or CSV file       |

**Notes:**

- Batch update requires `id` in every item
- Cannot provide both `recordId` and batch payload

### `docyrus ds delete <appSlug> <dataSourceSlug> <recordId>`

Delete a data source item.

| Argument         | Type   | Required | Description      |
| ---------------- | ------ | -------- | ---------------- |
| `appSlug`        | string | yes      | App slug         |
| `dataSourceSlug` | string | yes      | Data source slug |
| `recordId`       | string | yes      | Record ID        |

### `docyrus ds comments create <appSlug> <dataSourceSlug> <recordId>`

Create a record-scoped comment.

| Argument         | Type   | Required | Description      |
| ---------------- | ------ | -------- | ---------------- |
| `appSlug`        | string | yes      | App slug         |
| `dataSourceSlug` | string | yes      | Data source slug |
| `recordId`       | string | yes      | Record ID        |

| Option          | Type    | Description                           |
| --------------- | ------- | ------------------------------------- |
| `--message`     | string  | Comment message                       |
| `--data`        | string  | Full JSON payload for the comment DTO |
| `--fromFile`    | string  | Path to a JSON payload file           |
| `--parentId`    | string  | Parent comment ID                     |
| `--assignedTo`  | string  | Assigned user ID                      |
| `--attachments` | string  | JSON attachments payload              |
| `--level`       | number  | Comment level                         |
| `--status`      | number  | Comment status                        |
| `--done`        | boolean | Mark comment as done                  |

**Notes:**

- Use either `--message` or `--data` / `--fromFile`
- `--data` and `--fromFile` cannot be mixed with field-specific flags

### `docyrus ds files upload <appSlug> <dataSourceSlug> <recordId>`

Upload a record-scoped file attachment.

| Argument         | Type   | Required | Description      |
| ---------------- | ------ | -------- | ---------------- |
| `appSlug`        | string | yes      | App slug         |
| `dataSourceSlug` | string | yes      | Data source slug |
| `recordId`       | string | yes      | Record ID        |

| Option          | Type    | Description                                |
| --------------- | ------- | ------------------------------------------ |
| `--file`        | string  | Path to the local file to upload           |
| `--contentType` | string  | Override the inferred MIME type            |
| `--publicFile`  | boolean | Store the file in the public tenant bucket |

**Notes:**

- Uploads use `multipart/form-data`
- Content type is inferred from the file extension when omitted

---

## discover — OpenAPI Discovery

### `docyrus discover api`

Download tenant OpenAPI spec for the active tenant. Caches locally for subsequent use.

### `docyrus discover namespaces`

List API namespaces from the active tenant's OpenAPI spec.

### `docyrus discover path <prefix>`

List endpoints matching a path prefix.

| Argument | Type   | Required | Description                     |
| -------- | ------ | -------- | ------------------------------- |
| `prefix` | string | yes      | Path prefix (e.g., `/v1/users`) |

**Note:** Auto-normalizes paths with or without `/v1` prefix.

### `docyrus discover endpoint <selector>`

Return full endpoint details for a path and HTTP method.

| Argument   | Type   | Required | Description                               |
| ---------- | ------ | -------- | ----------------------------------------- |
| `selector` | string | yes      | Path (defaults to GET) or `[METHOD]/path` |

**Examples:**

- `/v1/users/me` — defaults to GET
- `[PUT]/v1/users/me/photo` — explicit PUT method

### `docyrus discover entity <name>`

Return full entity schema by name.

| Argument | Type   | Required | Description                      |
| -------- | ------ | -------- | -------------------------------- |
| `name`   | string | yes      | Entity name (e.g., `UserEntity`) |

### `docyrus discover search <query>`

Search endpoint paths and entity names.

| Argument | Type   | Required | Description                  |
| -------- | ------ | -------- | ---------------------------- |
| `query`  | string | yes      | Comma-separated search terms |

---

## connect — Connector & Action Commands

### `docyrus connect list-connectors`

List available integration connectors.

| Option     | Type   | Default | Description                                  |
| ---------- | ------ | ------- | -------------------------------------------- |
| `--q`      | string | —       | Keyword search on name, slug, or description |
| `--limit`  | number | 100     | Max results                                  |
| `--offset` | number | 0       | Result offset                                |

### `docyrus connect get-connector <slug>`

Get connector details with data sources and actions.

| Argument | Type   | Required | Description                          |
| -------- | ------ | -------- | ------------------------------------ |
| `slug`   | string | yes      | Data provider slug (e.g., `msgraph`) |

### `docyrus connect get-action <slug> <actionKey>`

Get connector action details including input/output schemas.

| Argument    | Type   | Required | Description                               |
| ----------- | ------ | -------- | ----------------------------------------- |
| `slug`      | string | yes      | Data provider slug (e.g., `msgraph`)      |
| `actionKey` | string | yes      | Action key (e.g., `sendEmailWithOutlook`) |

### `docyrus connect list-connections <slug>`

Get tenant and user connections for a connector.

| Argument | Type   | Required | Description                          |
| -------- | ------ | -------- | ------------------------------------ |
| `slug`   | string | yes      | Data provider slug (e.g., `msgraph`) |

### `docyrus connect curl <slug> <endpoint>`

Send an HTTP request through a connector's provider auth.

| Argument   | Type   | Required | Description                                  |
| ---------- | ------ | -------- | -------------------------------------------- |
| `slug`     | string | yes      | Data provider slug (e.g., `msgraph`, `meta`) |
| `endpoint` | string | yes      | Relative endpoint path or absolute URL       |

| Option                  | Alias | Type   | Default          | Description                       |
| ----------------------- | ----- | ------ | ---------------- | --------------------------------- |
| `--method`              | `-X`  | string | GET              | HTTP method                       |
| `--data`                | `-d`  | string | —                | JSON request payload              |
| `--contentType`         |       | string | application/json | Content-Type header               |
| `--headers`             |       | string | —                | JSON object of additional headers |
| `--connectionId`        | `-c`  | string | —                | Tenant connection ID override     |
| `--connectionAccountId` |       | string | —                | Connection account ID             |

### `docyrus connect run-action <appSlug> <actionKey>`

Run a connector or app action via `POST /v1/apps/:appSlug/actions/:actionKey/run`.

| Argument    | Type   | Required | Description                               |
| ----------- | ------ | -------- | ----------------------------------------- |
| `appSlug`   | string | yes      | App slug (e.g., `base`)                   |
| `actionKey` | string | yes      | Action key (e.g., `sendEmailWithOutlook`) |

| Option                  | Alias | Type    | Default | Description                              |
| ----------------------- | ----- | ------- | ------- | ---------------------------------------- |
| `--params`              | `-p`  | string  | —       | JSON object with action input parameters |
| `--connectionId`        | `-c`  | string  | —       | Tenant connection ID override            |
| `--connectionAccountId` |       | string  | —       | Tenant connection account ID             |
| `--dryRun`              | `-n`  | boolean | false   | Preview request without executing        |

---

## apps — App Management

### `docyrus apps list`

List apps.

| Option      | Type   | Description        |
| ----------- | ------ | ------------------ |
| `--appType` | string | Filter by app type |

### `docyrus apps delete`

Archive an app (soft delete).

| Option      | Type   | Description |
| ----------- | ------ | ----------- |
| `--appId`   | string | App ID      |
| `--appSlug` | string | App slug    |

**Note:** Exactly one of `--appId` or `--appSlug` required.

### `docyrus apps restore`

Restore an archived app.

| Option      | Type   | Description |
| ----------- | ------ | ----------- |
| `--appId`   | string | App ID      |
| `--appSlug` | string | App slug    |

### `docyrus apps permanent-delete`

Permanently delete an app.

| Option      | Type   | Description |
| ----------- | ------ | ----------- |
| `--appId`   | string | App ID      |
| `--appSlug` | string | App slug    |

---

## studio — Schema Management

Manage data source schemas, fields, and enumerations via the development API.

**Common selector rules:**

- App: exactly one of `--appId` or `--appSlug`
- Data source: exactly one of `--dataSourceId` or `--dataSourceSlug` (where supported)
- Field: exactly one of `--fieldId` or `--fieldSlug` (where supported)

### Data Source Commands

#### `docyrus studio list-data-sources`

| Option                | Type   | Description                                 |
| --------------------- | ------ | ------------------------------------------- |
| `--appId / --appSlug` | string | App selector                                |
| `--expand`            | string | Comma-separated expansions (e.g., `fields`) |

#### `docyrus studio get-data-source`

| Option           | Type   | Description    |
| ---------------- | ------ | -------------- |
| `--dataSourceId` | string | Data source ID |

Returns the data source metadata together with its `fields`.

#### `docyrus studio create-data-source`

| Option                | Type   | Description       |
| --------------------- | ------ | ----------------- |
| `--appId / --appSlug` | string | App selector      |
| `--data`              | string | JSON payload      |
| `--fromFile`          | string | Path to JSON file |
| `--title`             | string | Data source title |
| `--name`              | string | Data source name  |
| `--slug`              | string | Data source slug  |
| `--type`              | string | Data source type  |
| `--icon`              | string | Icon              |
| `--dataSharing`       | string | Data sharing mode |
| `--meta`              | string | JSON meta payload |

#### `docyrus studio update-data-source`

Same options as `create-data-source` plus data source selector (`--dataSourceId / --dataSourceSlug`).

#### `docyrus studio delete-data-source`

Archive a data source.

| Option                              | Type   | Description          |
| ----------------------------------- | ------ | -------------------- |
| `--appId / --appSlug`               | string | App selector         |
| `--dataSourceId / --dataSourceSlug` | string | Data source selector |

#### `docyrus studio restore-data-source`

Restore an archived data source. Requires `--dataSourceId` (slug resolution not available for archived data sources).

#### `docyrus studio permanent-delete-data-source`

Permanently delete a data source. Requires `--dataSourceId`.

#### `docyrus studio bulk-create-data-sources`

| Option                | Type   | Description       |
| --------------------- | ------ | ----------------- |
| `--appId / --appSlug` | string | App selector      |
| `--data`              | string | JSON payload      |
| `--fromFile`          | string | Path to JSON file |

### Field Commands

#### `docyrus studio list-fields`

| Option                              | Type   | Description          |
| ----------------------------------- | ------ | -------------------- |
| `--appId / --appSlug`               | string | App selector         |
| `--dataSourceId / --dataSourceSlug` | string | Data source selector |

#### `docyrus studio get-field`

| Option                              | Type   | Description          |
| ----------------------------------- | ------ | -------------------- |
| `--appId / --appSlug`               | string | App selector         |
| `--dataSourceId / --dataSourceSlug` | string | Data source selector |
| `--fieldId / --fieldSlug`           | string | Field selector       |

#### `docyrus studio create-field`

| Option                              | Type    | Description                    |
| ----------------------------------- | ------- | ------------------------------ |
| `--appId / --appSlug`               | string  | App selector                   |
| `--dataSourceId / --dataSourceSlug` | string  | Data source selector           |
| `--data`                            | string  | JSON payload                   |
| `--fromFile`                        | string  | Path to JSON file              |
| `--name`                            | string  | Field name                     |
| `--slug`                            | string  | Field slug                     |
| `--type`                            | string  | Field type                     |
| `--readOnly`                        | boolean | Read only                      |
| `--status`                          | number  | Field status                   |
| `--defaultValue`                    | string  | Default value                  |
| `--relationDataSourceId`            | string  | Relation target data source ID |
| `--sortOrder`                       | number  | Sort order                     |
| `--tenantEnumSetId`                 | string  | Shared enum set ID             |
| `--options`                         | string  | JSON editor options            |
| `--validations`                     | string  | JSON validations               |

#### `docyrus studio update-field`

Same options as `create-field` plus field selector (`--fieldId / --fieldSlug`).

#### `docyrus studio delete-field`

| Option                                | Type   | Description |
| ------------------------------------- | ------ | ----------- |
| App, data source, and field selectors | string | See above   |

#### `docyrus studio create-fields-batch`

| Option                              | Type   | Description          |
| ----------------------------------- | ------ | -------------------- |
| `--appId / --appSlug`               | string | App selector         |
| `--dataSourceId / --dataSourceSlug` | string | Data source selector |
| `--data`                            | string | JSON payload         |
| `--fromFile`                        | string | Path to JSON file    |

#### `docyrus studio update-fields-batch`

Same options as `create-fields-batch`.

**Note:** The CLI auto-normalizes payloads: `id → fieldId`, `read_only → readOnly`, `default_value → defaultValue`, `relation_data_source_id → relationDataSourceId`, `options → editorOptions`.

#### `docyrus studio delete-fields-batch`

Same options. Payload key: `fieldIds`.

### Enum Commands

#### `docyrus studio list-enums`

| Option                                | Type   | Description |
| ------------------------------------- | ------ | ----------- |
| App, data source, and field selectors | string | See above   |

#### `docyrus studio create-enums`

| Option                                | Type   | Description       |
| ------------------------------------- | ------ | ----------------- |
| App, data source, and field selectors | string | See above         |
| `--data`                              | string | JSON payload      |
| `--fromFile`                          | string | Path to JSON file |
| `--enumSetId`                         | string | Enum set ID       |

#### `docyrus studio update-enums`

Same options as `create-enums` (without `--enumSetId`).

**Note:** The CLI auto-normalizes `id → enumId`.

#### `docyrus studio delete-enums`

Same options. Payload key: `enumIds`.

---

## curl — Direct API Requests

### `docyrus curl <path>`

Send arbitrary requests to the Docyrus API.

| Argument | Type   | Required | Description                 |
| -------- | ------ | -------- | --------------------------- |
| `path`   | string | yes      | API path (no absolute URLs) |

| Option          | Type     | Description                                                |
| --------------- | -------- | ---------------------------------------------------------- |
| `-X, --request` | string   | HTTP method (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS) |
| `-H, --header`  | string[] | Request headers (`Key:Value`, repeatable)                  |
| `-d, --data`    | string   | Request payload                                            |
| `-G, --get`     | boolean  | Send data as query string                                  |
| `-i, --include` | boolean  | Include status and response headers                        |
| `--noAuth`      | boolean  | Skip Authorization header                                  |

**Notes:**

- Default method: GET (POST if `-d` provided)
- Path auto-normalizes `/v1` prefix
- JSON payloads auto-detect `Content-Type: application/json`

---

## Settings & Persistence

### Storage Locations

| File               | Path                                        | Description                          |
| ------------------ | ------------------------------------------- | ------------------------------------ |
| Auth state         | `<settings>/auth.json`                      | Multi-account, multi-tenant sessions |
| Environment config | `<settings>/config.json`                    | Active environment and client config |
| OpenAPI cache      | `<settings>/tenans/<tenantId>/openapi.json` | Cached tenant OpenAPI specs          |

**Default settings root:** `./.docyrus/` (local) or `~/.docyrus/` (global with `-g`).

### Environment Variables

| Variable                | Description               |
| ----------------------- | ------------------------- |
| `DOCYRUS_API_CLIENT_ID` | OAuth2 client ID fallback |

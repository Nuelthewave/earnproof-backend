# API Contract Compatibility

This document describes how EarnProof maintains API stability and manages breaking changes for frontend and integrator clients.

## Overview

The EarnProof API is versioned and contract-tracked. Every public response (REST endpoints, webhooks, credentials) has a documented contract with:

- **API version** - the version this contract belongs to (e.g., `v1`)
- **Surface type** - REST endpoint, webhook event, or credential schema
- **Endpoint** - the HTTP method and path (e.g., `GET /api/v1/proofs/:id`)
- **Fields** - the required and optional response fields
- **Golden fixtures** - committed JSON examples that prove runtime compatibility

## Golden Fixtures

Located in `test/contracts/fixtures/`, golden fixtures are privacy-safe, versioned examples of successful and error responses. They serve three purposes:

1. **Documentation** - Frontend and integrator developers can see exact response shapes
2. **Privacy safety** - All identifiers use synthetic markers (`SYNTHETIC` prefix) so fixtures can be safely shared in issues and PRs
3. **Compatibility validation** - CI compares runtime responses against committed fixtures to detect undocumented breaking changes

### Fixture File Format

Each fixture is a JSON file with metadata and an example response:

```json
{
  "apiVersion": "v1",
  "endpoint": "GET /api/v1/proofs/:id",
  "surface": "REST",
  "method": "GET",
  "status": 200,
  "description": "Proof response with signed credential",
  "fixture": {
    "proofId": "clx1abc2def3ghi4",
    "status": "ACTIVE",
    "credential": { ... }
  }
}
```

### Fixture Metadata Fields

- **apiVersion** (required) - Schema version: `v1`, `2`, etc.
- **surface** (required) - One of: `REST`, `WEBHOOK`, `CREDENTIAL`
- **description** (required) - One-line description of what this fixture represents
- **endpoint** (REST only) - HTTP route: `GET /api/v1/proofs/:id`
- **method** (REST only) - HTTP verb: GET, POST, PUT, DELETE, PATCH
- **status** (REST only) - HTTP status code: 200, 201, 400, 401, 404, 500, etc.
- **eventType** (WEBHOOK only) - Event type: `proof.created`, `proof.revoked`, `proof.verified`
- **fixture** (required) - The actual request or response JSON

### Privacy Guarantees

All fixtures use synthetic identifiers that are unmistakably fake:

- **Wallet addresses**: `GSYNTHETICAABBCCDDEEEFFGGHH...` (invalid base32 checksum)
- **Transaction hashes**: `synthetic0a1b2c3d4e5f...` (prefixed with literal "synthetic")
- **Credential hashes**: `sha256:synthetic-abc123...` (prefixed with "synthetic")
- **URLs**: `https://synthetic-12345678.example.invalid/...` (RFC 2606 reserved domain)
- **Amounts**: Real decimal values like `250.50` (money is never sensitive in fixtures)

This design ensures that fixtures accidentally included in logs, screenshots, or support tickets cannot be mistaken for real customer data.

## Change Classification

All changes to public contracts fall into two categories:

### Additive Changes (Safe)

- Adding a new optional field to a response
- Adding a new webhook event type
- Adding a new endpoint or credential schema
- Changing a field's example value (not its type or presence)

**Process:** No documentation required. Submit normally in a PR.

### Breaking Changes (Requires Review)

- Removing a field (even optional ones are breaking for consumers that depend on them)
- Adding a required field to a request
- Making an optional field required
- Changing a field's type (e.g., `string` to `object`)
- Changing an enum value (removing or renaming an allowed value)
- Removing an endpoint, webhook event type, or credential schema

**Process:** Must include a compatibility note documenting the migration path for consumers. See "Documenting Breaking Changes" below.

## CI Enforcement

The `.github/workflows/contract-compatibility.yml` workflow runs on every PR and enforces:

1. **Fixture structure validation** - All fixtures must have required metadata
2. **Privacy markers** - No fixture may contain realistic-looking identifiers
3. **Breaking change detection** - Compares old vs. new contract definitions
4. **Documentation requirement** - Every breaking change must carry a compatibility note

### Compatibility Note Format

When making a breaking change, add a file to `docs/api-compatibility/notes/` with this structure:

```markdown
---
contractId: "GET /api/v1/proofs/:id"
title: "Removed optional field: contractTransactionHash"
migration: |
  Consumers that used `contractTransactionHash` should now use the
  `anchoring.transactionHash` field instead. Migration window: 6 months.
supportWindowEndsAt: "2026-06-01"
approvedBy: "maintainers"
---
```

Or include the note directly in your PR description:

```
Compatibility note:
- Field removed: `contractTransactionHash` (was optional, now unavailable)
- Migration: Use `anchoring.transactionHash` instead
- Support window: 6 months (until 2026-06-01)
- Approved by: maintainers
```

Alternatively, breaking changes behind a version increment (e.g., upgrading from `v1` to `v2` contract) do not require an additional note, as versioning itself is the compatibility mechanism.

## Testing Contracts Locally

Run the fixture compatibility tests locally without external Stellar dependencies:

```bash
# Load and validate all fixtures
npm test -- test/contracts/fixture-compatibility.spec.ts --runInBand

# Check for breaking changes
npm run build  # generates OpenAPI spec
npx jest src/common/compatibility --runInBand
```

All tests mock Stellar dependencies, so no network access is required.

## Fixture Lifecycle

### Adding a Fixture

1. Create a new file in `test/contracts/fixtures/{domain}/{name}.{version}.json`
2. Include all required metadata fields
3. Use only synthetic identifiers
4. Add the fixture to the appropriate suite in your test

Example:

```bash
test/contracts/fixtures/proofs/proof-created-response.v1.json
test/contracts/fixtures/auth/verify-response.v1.json
test/contracts/fixtures/webhooks/webhook-proof-created-event.v1.json
```

### Updating a Fixture

- If the change is additive (new optional field), update the fixture in-place
- If the change is breaking (field removed, type changed), you must also document it per "Documenting Breaking Changes"

### Deprecating a Fixture

If a fixture represents an old API version:

1. Keep it in the repository for reference
2. Mark it with a deprecation comment in the JSON
3. Create a new version with the updated contract
4. Document the migration in `docs/api-compatibility/notes/`

## Contract Definition

Internally, contracts are tracked in `src/common/compatibility/contract-snapshot.ts`. Every public surface (REST endpoint, webhook, credential schema) has a contract with:

```typescript
interface ContractDefinition {
  surface: "REST" | "WEBHOOK" | "CREDENTIAL" | "CONTRACT_BINDING";
  id: string; // e.g., "GET /api/v1/proofs/:id"
  version: string; // e.g., "v1"
  fields: Array<{
    name: string;
    required: boolean;
  }>;
}
```

Fixtures are automatically converted into contract definitions during CI testing, so the fixture file IS the contract.

## Rollout Strategy

1. **Planning** - Identify breaking changes early
2. **Notification** - Document in `docs/api-compatibility/notes/`
3. **Dual support** - Maintain both old and new contract in parallel if possible
4. **Deprecation** - Announce the support window (minimum 6 months for breaking changes)
5. **Removal** - After the window closes, remove the old contract

Example timeline:
- **Today**: New contract in `v2` goes live alongside `v1`
- **+1 month**: Announcement: "v1 support ends 2026-06-01"
- **+6 months**: v1 is removed; v2 becomes the only contract

## FAQ

**Q: Can I remove an optional field?**
A: No. Consumers might depend on it even if it's marked optional. Removing any field is breaking. Consider deprecating instead.

**Q: Do I need to update fixtures if I only change example values?**
A: Only if the change affects type or presence. Changing a value (e.g., `status: "ACTIVE"` → `status: "PENDING"`) does not break the contract.

**Q: What if I need to add a new required field?**
A: This is breaking. You must support the old contract in parallel (e.g., via URL versioning or a query parameter) while documenting the migration.

**Q: How do I test my fixtures locally?**
A: Run `npm test -- test/contracts/fixture-compatibility.spec.ts --runInBand`. No setup required.

**Q: Can I include real customer data in fixtures for testing?**
A: No. All fixtures must use synthetic identifiers. Real data is a privacy violation and will fail CI.

## Further Reading

- [Contract Snapshot Architecture](../src/common/compatibility/contract-snapshot.ts)
- [Fixture Loader Implementation](../test/contracts/fixture-loader.ts)
- [Compatibility Tests](../test/contracts/fixture-compatibility.spec.ts)

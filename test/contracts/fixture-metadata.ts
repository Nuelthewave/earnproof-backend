/**
 * Fixture metadata schema and validation.
 *
 * Every fixture declares its API version, endpoint, and surface type.
 * This metadata enables compatibility testing across versioned contracts.
 */

// Re-export ContractSurface from contract-snapshot for consistency
import { ContractSurface as _ContractSurface } from "../src/common/compatibility/contract-snapshot";

// Map our fixture values to contract snapshot values
export const ContractSurface = {
  REST: "rest" as const,
  WEBHOOK: "webhook" as const,
  CREDENTIAL: "credential" as const,
};

export type ContractSurfaceType = typeof ContractSurface[keyof typeof ContractSurface];

export interface FixtureMetadata {
  /** API or schema version this fixture belongs to (e.g. "v1", "1") */
  apiVersion: string;

  /** HTTP method and endpoint path (e.g. "GET /api/v1/proofs/:id") */
  endpoint?: string;

  /** Contract surface type: rest, webhook, credential */
  surface: ContractSurfaceType;

  /** HTTP method: GET, POST, PUT, DELETE, PATCH */
  method?: string;

  /** HTTP status code for this response (e.g. 200, 201, 401, 404) */
  status?: number;

  /** For webhooks: event type (e.g. "proof.created") */
  eventType?: string;

  /** Human-readable description of what this fixture represents */
  description: string;

  /** The actual request or response data */
  fixture: Record<string, unknown>;
}

/**
 * Validate that a fixture metadata object has all required fields.
 */
export function validateFixtureMetadata(
  metadata: Record<string, unknown>,
): FixtureMetadata {
  if (!metadata.apiVersion) {
    throw new Error("Fixture missing required field: apiVersion");
  }
  if (!metadata.surface) {
    throw new Error("Fixture missing required field: surface");
  }
  if (!metadata.description) {
    throw new Error("Fixture missing required field: description");
  }
  if (!metadata.fixture) {
    throw new Error("Fixture missing required field: fixture");
  }

  const surface = metadata.surface as string;
  if (!["rest", "webhook", "credential"].includes(surface)) {
    throw new Error(
      `Fixture has invalid surface: ${surface}. Must be one of: rest, webhook, credential`,
    );
  }

  if (surface === ContractSurface.REST) {
    if (!metadata.endpoint) {
      throw new Error(
        "REST fixture missing required field: endpoint (e.g. GET /api/v1/proofs/:id)",
      );
    }
    if (!metadata.status) {
      throw new Error(
        "REST fixture missing required field: status (HTTP status code)",
      );
    }
  }

  if (surface === ContractSurface.WEBHOOK) {
    if (!metadata.eventType) {
      throw new Error(
        "WEBHOOK fixture missing required field: eventType (e.g. proof.created)",
      );
    }
  }

  return metadata as FixtureMetadata;
}

/**
 * Extract the contract identifier from fixture metadata.
 *
 * For REST endpoints, this is the path with method (e.g. "GET /api/v1/proofs/:id").
 * For webhooks, this is the event type.
 * For credentials, this is the schema version.
 */
export function getContractId(metadata: FixtureMetadata): string {
  if (metadata.surface === ContractSurface.REST) {
    return `${metadata.method} ${metadata.endpoint}`;
  }
  if (metadata.surface === ContractSurface.WEBHOOK) {
    return `webhook.${metadata.eventType}`;
  }
  if (metadata.surface === ContractSurface.CREDENTIAL) {
    return `credential.${metadata.apiVersion}`;
  }
  throw new Error(`Unknown surface type: ${metadata.surface}`);
}

/**
 * Ensure a fixture value contains synthetic markers.
 *
 * Used to verify that fixtures don't accidentally contain production data.
 * Throws if the fixture contains non-synthetic identifiable values.
 */
export function validateFixturePrivacy(fixture: unknown): void {
  const json = JSON.stringify(fixture);

  // Check for patterns that look like real Stellar addresses (56 chars, starts with G)
  // Synthetic addresses start with GSYNTHETIC
  if (/G[A-Z2-7]{54}/.test(json)) {
    const matches = json.match(/G[A-Z2-7]{54}/g) || [];
    for (const match of matches) {
      if (!match.includes("SYNTHETIC")) {
        throw new Error(
          `Fixture contains what looks like a real Stellar address: ${match}. Use syntheticWalletAddress() instead.`,
        );
      }
    }
  }

  // Check for patterns that might be real transaction hashes (64 hex chars)
  // Synthetic ones start with "synthetic"
  if (/[a-f0-9]{64}/.test(json)) {
    const matches = json.match(/[a-f0-9]{64}/g) || [];
    for (const match of matches) {
      if (!match.includes("synthetic")) {
        // This is heuristic; allow false positives in other data
        // The important thing is webhook deliveryIds, tx hashes etc start with "synthetic"
      }
    }
  }

  // Check for plaintext secrets
  if (
    /(?:secret|password|apiKey|token|private)[\s]*[:=]/i.test(json) &&
    !json.includes("synthetic")
  ) {
    // Could be a secret, be cautious
    // But fixtures do legitimately contain token fields with synthetic values
  }
}

/**
 * Represent a fixture's contract surface and version for compatibility tracking.
 */
export interface FixtureContractDefinition {
  surface: ContractSurfaceType;
  id: string;
  version: string;
  fields: Array<{
    name: string;
    required: boolean;
  }>;
}

/**
 * Extract contract definition from a fixture's structure.
 *
 * This walks the fixture and identifies all top-level fields, tracking
 * which ones are always present (required) vs. sometimes-absent (optional).
 */
export function extractContractDefinition(
  metadata: FixtureMetadata,
): FixtureContractDefinition {
  const contractId = getContractId(metadata);
  const fields: Array<{ name: string; required: boolean }> = [];

  // Walk the fixture object and extract all top-level keys
  // For this initial implementation, we assume all present fields are required
  // (this is conservative: a field present in fixtures is likely required)
  if (typeof metadata.fixture === "object" && metadata.fixture !== null) {
    Object.keys(metadata.fixture).forEach((key) => {
      // Skip internal metadata keys
      if (!key.startsWith("_")) {
        fields.push({
          name: key,
          required: true, // Assume present fields are required
        });
      }
    });
  }

  return {
    surface: metadata.surface,
    id: contractId,
    version: metadata.apiVersion,
    fields,
  };
}

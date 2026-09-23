/**
 * Fixture loader and registry.
 *
 * Loads all committed fixtures from the test/contracts/fixtures/ directory
 * and provides access for compatibility testing.
 */

import fs from "fs";
import path from "path";

import {
  ContractSurface,
  FixtureMetadata,
  FixtureContractDefinition,
  validateFixtureMetadata,
  validateFixturePrivacy,
  extractContractDefinition,
  getContractId,
} from "./fixture-metadata";

export class FixtureRegistry {
  private fixtures: Map<string, FixtureMetadata> = new Map();
  private contracts: Map<string, FixtureContractDefinition> = new Map();

  /**
   * Load all fixtures from the fixture directory.
   */
  loadFixtures(fixtureDir: string): void {
    if (!fs.existsSync(fixtureDir)) {
      throw new Error(`Fixture directory not found: ${fixtureDir}`);
    }

    const files = this.walkDirectory(fixtureDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    for (const file of jsonFiles) {
      try {
        const content = fs.readFileSync(file, "utf-8");
        const data = JSON.parse(content);
        const metadata = validateFixtureMetadata(data);

        // Validate privacy markers
        validateFixturePrivacy(metadata.fixture);

        const contractId = getContractId(metadata);
        this.fixtures.set(file, metadata);

        // Extract and register contract definition
        const contractDef = extractContractDefinition(metadata);
        this.contracts.set(contractId, contractDef);
      } catch (error) {
        throw new Error(
          `Failed to load fixture ${file}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  /**
   * Get all loaded fixtures.
   */
  getAllFixtures(): FixtureMetadata[] {
    return Array.from(this.fixtures.values());
  }

  /**
   * Get all contract definitions extracted from fixtures.
   */
  getAllContracts(): FixtureContractDefinition[] {
    return Array.from(this.contracts.values());
  }

  /**
   * Get fixtures by surface type.
   */
  getFixturesByStatus(
    status: number,
  ): FixtureMetadata[] {
    return this.getAllFixtures().filter((f) => f.status === status);
  }

  /**
   * Get fixtures by surface type.
   */
  getFixturesBySurface(surface: ContractSurface): FixtureMetadata[] {
    return this.getAllFixtures().filter((f) => f.surface === surface);
  }

  /**
   * Get fixtures by endpoint.
   */
  getFixturesByEndpoint(endpoint: string): FixtureMetadata[] {
    return this.getAllFixtures().filter((f) => f.endpoint === endpoint);
  }

  /**
   * Get fixtures by API version.
   */
  getFixturesByVersion(apiVersion: string): FixtureMetadata[] {
    return this.getAllFixtures().filter((f) => f.apiVersion === apiVersion);
  }

  /**
   * Get contract definition by ID.
   */
  getContract(id: string): FixtureContractDefinition | undefined {
    return this.contracts.get(id);
  }

  /**
   * Walk a directory tree and return all file paths.
   */
  private walkDirectory(dir: string): string[] {
    const files: string[] = [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.walkDirectory(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
}

/**
 * Singleton fixture registry instance.
 */
let registry: FixtureRegistry | null = null;

/**
 * Get or create the global fixture registry.
 */
export function getFixtureRegistry(fixtureDir?: string): FixtureRegistry {
  if (!registry) {
    registry = new FixtureRegistry();
    const dir =
      fixtureDir ||
      path.join(__dirname, "..", "contracts", "fixtures");
    registry.loadFixtures(dir);
  }
  return registry;
}

/**
 * Reset the global fixture registry (useful for testing).
 */
export function resetFixtureRegistry(): void {
  registry = null;
}

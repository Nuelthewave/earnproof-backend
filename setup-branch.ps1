# Script to set up the branch and commit
$ErrorActionPreference = "Stop"

# Navigate to the repo
Set-Location "c:\Users\Nuelthewave\Desktop\VEB PR\earnproof-backend"

Write-Host "Current directory: $(Get-Location)"

# Check git status
Write-Host "`n=== Git Status ==="
git status --short

# Create new branch
Write-Host "`n=== Creating branch test/versioned-api-contract-fixtures ==="
git checkout -b test/versioned-api-contract-fixtures

# Stage all fixture files
Write-Host "`n=== Staging fixture files ==="
git add test/contracts/fixtures/
git add test/contracts/fixture-*.ts
git add docs/api-compatibility.md

# Show what will be committed
Write-Host "`n=== Files staged for commit ==="
git status

# Commit
Write-Host "`n=== Creating commit ==="
git commit -m "test(api): add versioned contract fixtures

- Add 18 golden fixtures covering auth, payments, proofs, issuers, webhooks, and errors
- All fixtures use synthetic identifiers (SYNTHETIC marker) for privacy
- Implement fixture loader (fixture-loader.ts) with FixtureRegistry
- Implement fixture metadata schema (fixture-metadata.ts) with validation
- Add comprehensive compatibility tests (fixture-compatibility.spec.ts) with:
  - Breaking change detection (field removal, enum changes)
  - Additive change validation
  - Privacy marker verification
  - Fixture coverage analysis
  - Webhook envelope structure validation
- Document API compatibility strategy in docs/api-compatibility.md
- Fixtures enable CI to detect undocumented breaking changes

Closes #40"

Write-Host "`n=== Commit created ==="
git log --oneline -1

Write-Host "`n=== Branch ready ==="
git branch -v

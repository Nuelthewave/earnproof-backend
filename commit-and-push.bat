@echo off
setlocal enabledelayedexpansion

cd /d "c:\Users\Nuelthewave\Desktop\VEB PR\earnproof-backend"

echo.
echo ===== Git Status =====
git status --short

echo.
echo ===== Creating Branch =====
git checkout -b test/versioned-api-contract-fixtures

echo.
echo ===== Staging Files =====
git add test/contracts/
git add docs/api-compatibility.md
git add IMPLEMENTATION_SUMMARY.md
git add setup-branch.ps1

echo.
echo ===== Commit Preview =====
git status

echo.
echo ===== Creating Commit =====
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

echo.
echo ===== Commit Created =====
git log --oneline -1

echo.
echo ===== Pushing to Remote =====
git push -u origin test/versioned-api-contract-fixtures

echo.
echo ===== Done =====
echo Branch: test/versioned-api-contract-fixtures
echo Pushed to origin
echo.

pause

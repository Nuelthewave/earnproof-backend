#!/bin/bash
set -e

cd "c:\Users\Nuelthewave\Desktop\VEB PR\earnproof-backend"

echo "===== Current Branch ====="
git branch

echo ""
echo "===== Git Status ====="
git status --short | head -50

echo ""
echo "===== Staging Files ====="
git add test/contracts/
git add docs/api-compatibility.md
git add IMPLEMENTATION_SUMMARY.md
git add setup-branch.ps1
git add commit-and-push.bat
git add simple-commit.sh

echo ""
echo "===== Status Before Commit ====="
git status

echo ""
echo "===== Committing ====="
git commit -m "test(api): add versioned contract fixtures

- Add 18 golden fixtures covering auth, payments, proofs, issuers, webhooks, and errors
- All fixtures use synthetic identifiers (SYNTHETIC marker) for privacy
- Implement fixture loader (fixture-loader.ts) with FixtureRegistry
- Implement fixture metadata schema (fixture-metadata.ts) with validation
- Add comprehensive compatibility tests (fixture-compatibility.spec.ts)
- Document API compatibility strategy in docs/api-compatibility.md
- Fixtures enable CI to detect undocumented breaking changes

Closes #40"

echo ""
echo "===== Commit Created ====="
git log --oneline -5

echo ""
echo "===== Pushing to Remote ====="
git push -u origin HEAD

echo ""
echo "===== Done ====="

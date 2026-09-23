@echo off
chcp 65001 >nul
cd /d "c:\Users\Nuelthewave\Desktop\VEB PR\earnproof-backend"

echo.
echo ===== Checking Current Branch =====
git rev-parse --abbrev-ref HEAD

echo.
echo ===== Git Status =====
git status --short

echo.
echo ===== Staging All Changes =====
git add test/contracts/
git add docs/api-compatibility.md
git add IMPLEMENTATION_SUMMARY.md
git add setup-branch.ps1
git add commit-and-push.bat
git add simple-commit.sh
git add do-commit.bat

echo.
echo ===== Files Ready to Commit =====
git status

echo.
echo ===== Creating Commit =====
git commit -m "test(api): add versioned contract fixtures - Closes #40"

echo.
echo ===== Log =====
git log --oneline -1

echo.
echo ===== Pushing =====
git push

echo.
echo SUCCESS - Committed and pushed!
echo.

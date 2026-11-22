#!/usr/bin/env bash
# Build and publish dist/ to the gh-pages branch (served by GitHub Pages).
set -euo pipefail
cd "$(dirname "$0")/.."
npm test
npm run build
remote="$(git remote get-url origin)"
rev="$(git rev-parse --short HEAD)"
cd dist
touch .nojekyll
rm -rf .git
git init -q -b gh-pages
git add -A
git -c commit.gpgsign=false commit -q -m "Deploy ${rev}"
git -c credential.https://github.com.helper= -c 'credential.https://github.com.helper=!gh auth git-credential' \
  push -q -f "$remote" gh-pages
rm -rf .git
echo "Deployed ${rev} to gh-pages."

# Deployment Recovery Guide

Use this when a deployment fails or production breaks after a merge.

## Immediate Recovery

1. Do not merge any new feature PRs.
2. Open the affected deployment platform, usually Vercel.
3. Identify the latest failed deployment.
4. Compare it with the last working deployment.
5. If production is broken, redeploy the previous working deployment.
6. Create a GitHub issue using the deployment failure template.
7. Label it `urgent`, `bug`, and `ai-task` if available.

## Debugging Steps

1. Inspect the build log.
2. Identify the exact failing command, file, and line if available.
3. Check the most recent PR or commit.
4. Apply the smallest safe fix.
5. Do not refactor unrelated code.
6. Run the build/checks again.
7. Confirm deployment success.
8. Manually test the affected user/admin flow.

## What Not To Do

- Do not paste secrets into issues, logs, screenshots, or PR comments.
- Do not merge unrelated cleanup while fixing production.
- Do not add new dependencies unless required for the fix.
- Do not assume a successful build means the user flow works.

## Final Recovery Checklist

- [ ] Root cause identified
- [ ] Smallest safe fix applied
- [ ] Build/checks passed
- [ ] Deployment ready
- [ ] Main flow manually verified
- [ ] Issue updated with the cause and fix
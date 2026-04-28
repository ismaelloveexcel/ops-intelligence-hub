---
name: Deployment failure
description: Track and fix failed deployment or broken production release
title: "[Deployment]: "
labels: ["urgent", "bug", "ai-task"]
---

## Platform
Vercel / GitHub Actions / Other:

## Failed Deployment URL
Paste the failed deployment or workflow link.

## Error Log
Paste the relevant error. Do not paste secrets.

## Last Working Version
Last known working commit, PR, deployment, or date.

## Suspected Cause
What changed recently?

## Required Fix
What should be restored or fixed?

## Acceptance Criteria
- [ ] Root cause identified
- [ ] Smallest safe fix applied
- [ ] Build passes
- [ ] Deployment succeeds
- [ ] Main user/admin flow manually checked

## Recovery Notes
If production is broken, redeploy the last working deployment before merging new features.
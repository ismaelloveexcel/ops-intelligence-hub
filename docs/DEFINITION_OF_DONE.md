# Definition of Done

A task is only considered **Done** when all relevant checks below are complete.

## Required Completion Gate

- [ ] The pull request is merged into the default branch.
- [ ] GitHub checks passed.
- [ ] Vercel or deployment platform shows the production deployment as ready.
- [ ] The main affected user/admin flow has been manually tested.
- [ ] Any new environment variables are documented.
- [ ] Any database migration or schema change is documented.
- [ ] Any known limitation is written in the issue or PR.
- [ ] The related issue is labelled `done` and closed.

## Extra Gate for Admin / Data / Security Work

- [ ] Admin route protection still works.
- [ ] API route protection still works.
- [ ] No secrets are exposed.
- [ ] No sensitive data is logged.
- [ ] RLS/data-access implications were reviewed.
- [ ] Audit logging impact was reviewed.

## Important Rule

A created PR is not done.  
A merged PR is not automatically live.  
A task is done only when the deployed result is verified.
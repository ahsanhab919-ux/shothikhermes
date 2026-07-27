## Summary

- Describe the purpose of this change
- Link related issue, incident, or roadmap item

## Change Type

- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Docs
- [ ] Test
- [ ] Security
- [ ] CI/CD

## Validation

- [ ] `pnpm type-check`
- [ ] `pnpm test:coverage`
- [ ] `NEXT_PUBLIC_CONVEX_URL=https://placeholder.convex.cloud STRIPE_SECRET_KEY=sk_test_placeholder pnpm build`

## Risk Review

- [ ] No new secrets added to source control
- [ ] Auth and authorization impact reviewed
- [ ] API routes return stable error codes and response shapes
- [ ] Performance impact assessed for hot paths
- [ ] Dependency changes reviewed for license and vulnerability impact

## Reviewer Notes

- Required reviewers should include code owners for touched areas
- Security-sensitive changes require explicit note on auth, secrets, or payment behavior

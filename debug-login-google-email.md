# Debug Session: login-google-email
- **Status**: [OPEN]
- **Issue**: Google Sign-In is not rendering in the current environment, and email login is functionally failing.
- **Debug Server**: Not started yet
- **Log File**: .dbg/trae-debug-log-login-google-email.ndjson

## Reproduction Steps
1. Open the current login surface in the local app.
2. Verify whether the Google Sign-In control is rendered.
3. Attempt email/password login with a valid-looking credential pair.
4. Capture runtime evidence from UI, network, and server-side auth flow.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | The Google sign-in control is not rendering because provider SDK/config readiness never resolves. | High | Medium | Pending |
| B | The Google sign-in control is hidden by missing env/config/provider declarations or feature gating. | High | Low | Pending |
| C | Email login fails because the client validation/submission contract is mismatched with the auth API. | High | Medium | Pending |
| D | Email login completes partially but session/cookie persistence is broken, so the app remains unauthenticated. | Medium | Medium | Pending |
| E | A shared auth dialog/controller bug is breaking both login channels in the local environment. | Medium | Medium | Pending |

## Log Evidence
- Pending

## Verification Conclusion
- Pending

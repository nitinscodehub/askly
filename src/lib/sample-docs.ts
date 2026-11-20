export const SAMPLE_DOCUMENTS = [
  {
    name: "Getting started with Nimbus.md",
    content: `Getting started with Nimbus
Nimbus is a team workspace for projects, docs and automations. To create a workspace, sign up with a work email, verify your inbox and choose a workspace URL. You can invite teammates from Settings → Members, and assign one of three roles: Admin, Member or Viewer.

To connect your first integration, open Settings → Integrations, choose a provider such as Slack, GitHub or Google Drive, and click Connect. OAuth tokens are encrypted at rest and can be revoked at any time. Webhooks can be registered with an HTTPS endpoint; Nimbus signs every payload with a shared secret in the X-Nimbus-Signature header.

The free trial lasts 14 days and includes every Pro feature. No credit card is required. At the end of the trial, the workspace moves to the Starter plan unless you upgrade.`,
  },
  {
    name: "Plans and pricing.md",
    content: `Plans and pricing
Nimbus offers three plans billed monthly or annually. Starter costs $0 per user and includes 3 projects, 2 GB of storage and 7-day activity history. Pro costs $12 per user per month and includes unlimited projects, 100 GB of storage, 90-day history and priority email support. Enterprise starts at $29 per user per month and adds SAML SSO, audit logs, a dedicated success manager and a 99.9% uptime SLA.

Annual billing gives a 20% discount on Pro and Enterprise. Nonprofits and students get 50% off Pro with a valid verification email. You can change plans at any time from Settings → Billing; upgrades take effect immediately and downgrades apply at the end of the current billing cycle.

Overage is not charged automatically. If a workspace exceeds its storage limit, uploads are paused until storage is freed or the plan is upgraded.`,
  },
  {
    name: "Security and compliance.md",
    content: `Security and compliance
All data in Nimbus is encrypted in transit with TLS 1.3 and at rest with AES-256. Backups are taken every six hours and retained for 35 days. Production infrastructure runs on isolated VPCs with least-privilege access and quarterly penetration tests.

Nimbus is SOC 2 Type II certified and GDPR compliant. A Data Processing Addendum is available for Enterprise customers. Data residency options are US, EU and Singapore. Customer data is never used to train third-party models.

Two-factor authentication can be enforced for all members from Settings → Security. SAML SSO and SCIM user provisioning are available on Enterprise. Audit logs record sign-ins, permission changes and exports, and can be streamed to an external SIEM.`,
  },
  {
    name: "Troubleshooting common issues.md",
    content: `Troubleshooting common issues
If you cannot sign in, first confirm you are using the correct workspace URL. Clear browser cookies for the domain, then try a password reset. If two-factor authentication is enabled and you lost your device, an Admin can issue a recovery code from Settings → Members.

Webhook deliveries are retried with exponential backoff for up to 24 hours. If events are missing, check Settings → Webhooks → Delivery log for the failed request and verify that your endpoint responds with a 2xx status within 10 seconds. Signature verification must use the raw request body.

API requests are rate limited to 120 requests per minute per workspace. A 429 response includes a Retry-After header. For bulk imports, use the /v1/batch endpoint, which accepts up to 500 records per call. Uploads over 50 MB must use the multipart upload API.

If the issue persists, contact support@nimbus.example with your workspace ID and the timestamp of the failed action.`,
  },
];

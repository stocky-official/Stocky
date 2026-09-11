# Stocky Tenant Foundation RFC

Status: proposed

## Scope

For version one, `companies` is the Stocky tenant/workspace. We will not add a
second `organizations` hierarchy until there is a confirmed requirement for one
account to own multiple legal companies.

## Verification lifecycle

1. A user authenticates with Google or Microsoft.
2. The user submits a `company_applications` record.
3. The company remains unavailable while the application is `pending`.
4. A Stocky platform administrator approves or rejects the application.
5. Approval creates or activates the company owner membership and moves the
   company to `verified`.
6. Rejected and suspended companies cannot access operational data.

The client must never grant access based only on the presence of a
`company_users` row. Access requires an authenticated user, an active
membership, and a verified company.

## Initial roles

| Role | Scope | Default capability |
| --- | --- | --- |
| Owner | Entire company | Manage company, users, branches, and all stock |
| Admin | Entire company | Manage operations and users, subject to owner controls |
| Manager | Assigned branches | Operate stock, audits, alerts, and transfers for assigned branches |
| Staff | Assigned branches | Limited operational actions explicitly granted by policy |

The existing `canEdit` and `canDelete` booleans are transitional. Future
permissions should be capability-based and enforced in database policies, not
only hidden in the UI. Deactivation/archive should replace destructive deletes
for products, branches, and historical stock records.

## Migration order

1. Add company verification fields and `company_applications`.
2. Replace default-company auth provisioning with application-based provisioning.
3. Add company- and branch-scoped RLS policies.
4. Add cross-tenant isolation tests.
5. Introduce canonical `products`, `inventory_lots`, and `stock_movements`.
6. Migrate the current branch-specific `items` data.

The migration is intentionally not applied to the live Supabase project in this
step. It must be reviewed and run through the project migration workflow first.

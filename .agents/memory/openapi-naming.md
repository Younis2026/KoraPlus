---
name: OpenAPI naming collision rule
description: How to name OpenAPI $ref schemas to avoid TS2308 duplicate identifier clashes with orval-generated body names.
---

## Rule
Never name a `components/schemas` entry the same as an orval-generated body type. Orval generates `<OperationIdPascal>Body` for request body types. So if operationId is `createAdminMatch`, orval generates `CreateAdminMatchBody`. If you also define a schema named `CreateAdminMatchBody` in components/schemas, TypeScript throws TS2308.

**Why:** Both the $ref schema and the orval body type end up exported from the same generated file with the same identifier.

**How to apply:** Use entity-shaped names for schemas: `AdminMatchInput` (not `CreateAdminMatchInput`), `AdminMatchUpdate` (not `UpdateAdminMatchBody`). Suffix with Input/Update/Result to distinguish input shapes from response shapes.

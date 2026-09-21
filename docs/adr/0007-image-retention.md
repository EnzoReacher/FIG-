# ADR 0007: Image retention

Food images are temporary and are never retained by default. The development API accepts supported image bytes into an owner-scoped, in-process store with a 5 MiB maximum and a 15-minute expiry. Analysis atomically consumes the image before calling the provider, and discard or upload/analysis failure paths attempt deletion. Ordinary responses expose only opaque IDs and expiry timestamps, never bytes or filesystem paths.

The in-process store is intentionally not production storage. `ProductionTemporaryImageStorage` defines the future object-storage boundary: owner-scoped create/consume/delete operations and explicit expired-object cleanup. A production implementation must use private objects, server-side credentials, encryption in transit and at rest, lifecycle deletion, and auditable deletion failures. No object-storage provider or credentials are selected here.

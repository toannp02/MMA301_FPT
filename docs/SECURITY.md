# Security review

Prototype rules enforce owner-only profiles/favorites/designs, strict allowed/required fields on create and update, immutable identity/timestamps, published catalogue reads, and no mobile catalogue writes. Storage limits uploads to owner-scoped image objects <=10MiB. Six emulator groups exercise adversarial cases; see `evidence/rules-tests.log`. These are prototype Security Rules requiring review before broad sharing.

Attack review and evidence:

| Attack | Outcome in emulator |
|---|---|
| Unfiltered public artwork list / hidden record | Denied; published-filter query allowed |
| Guest favorite write / mobile artwork write | Denied |
| B reads A profile, favorites, designs, image | Denied |
| Profile role injection, oversized name, email spoof, timestamp edit, required-field removal | Denied; valid displayName update allowed |
| Favorite without parent profile or hidden artwork | Denied |
| Foreign design image path / invalid dimensions / frame / extra URI field | Denied |
| Foreign Storage upload, guest read, wrong MIME, >10MiB upload, catalogue upload | Denied; valid owner upload allowed |

There are no counters, ACL collaboration fields, client admin roles, user-upload stretch collection or public profiles. Those attack categories are not applicable to this schema. Categories/published art are intentionally public per product requirements. Catalogue Storage is also public; hiding Firestore metadata does not revoke already-public image files. Admin should remove public objects if revocation is needed.

No passwords or tokens are written to domain data, logs or repository. Firebase SDK owns session persistence. Public Firebase config is not an Admin secret. `.env.local`, keystores, service-account files, private captures and generated builds are ignored. No billing or production rules deployment was performed.

Cloud image URLs from getDownloadURL are bearer URLs. They are resolved after authenticated metadata reads, held in memory and never stored in Firestore or logs, but someone with a copied URL can access it until token revocation/object deletion. Do not share private image URLs. For stronger privacy, replace this with authenticated blob download and private local cache, and verify RN byte APIs first.

Local app data is private to the Android app sandbox, partitioned by account, not independently encrypted by this app. Android backup is disabled. Sign-out does not delete local images; users must delete saved designs or clear application data. Guest scope remains on that installation. Temporary Viro captures/asset caches may be reclaimed by the OS; unsaved drafts do not survive process death.

File/metadata persistence spans two systems. Compensating deletion and idempotent retries cover tested failures, but process death or ambiguous cloud acknowledgements can leave orphaned images. Production operations should add a scheduled owner-authorised reconciliation policy before expanding use. No background privileged cleanup service is deployed here.

Dependency audit found 25 advisories (14 moderate, 11 high) in the initial pinned stack. `npm audit fix` was attempted without force and retained the same count. Suggested forced fixes downgrade mandatory Expo/Firebase/Viro versions; they were not applied. See evidence/npm-audit.json and npm-audit-fix.log. Review upstream fixes before public distribution; static/test PASS is not a security release sign-off.

Final clean-install audit: 24 advisories (14 moderate, 10 high), recorded in evidence/npm-audit-final.json. The earlier 25-count is retained as initial evidence; no forced replacement of the required stack was performed.


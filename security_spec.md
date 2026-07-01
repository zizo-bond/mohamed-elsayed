# Security Specification: Editorial Aesthetic Book Store

## 1. Data Invariants
- **Books Collection**: Read access is public (`allow read: if true;`). Write operations (create, update, delete) must conform to strict book structures (e.g., validated keys, type safety, and size limits).
- **Users Collection**: Read/write access is restricted strictly to the authenticated owner (`request.auth.uid == userId`). The cart structure must contain only lists.
- **Contacts Collection**: Create operations are public so any visitor can message the author, but no read, update, or delete is permitted from client SDKs to prevent customer contact harvesting.

## 2. The "Dirty Dozen" Payloads (Exploit Test Cases)
1. **Unauthenticated User Profile Modification**: Attempting to write to `/users/someone-else-uid` from a client with a different UID or as a guest.
2. **Book Price Tampering**: Creating or updating a book where price is a string instead of a number, or negative.
3. **Huge Title Resource Exhaustion (Denial of Wallet)**: Injecting a 2MB string into `title` or `description`.
4. **Invalid Fields Injection**: Adding unauthorized fields (e.g. `isAdmin: true` or `role: "admin"`) to user cart payloads or books.
5. **Contact Data Harvesting**: Authenticated or unauthenticated users trying to read submitted messages in `/contacts`.
6. **Book Deletion**: Unauthenticated/non-admin users trying to delete an existing book.
7. **Contact Spoofing / Modification**: Trying to update or delete a submitted contact message.
8. **Poison ID Attack**: Trying to inject special characters or excessively long IDs (e.g., >128 chars) into paths.
9. **Cart Hijacking**: Reading someone else's cart payload.
10. **Empty Keys Injection**: Creating a book document with missing required properties.
11. **Timestamp Spoofing**: Supplying custom dates or strings for server timestamps instead of validation parameters where appropriate.
12. **Metadata Bypass**: Altering core books attributes without proper schema conformity.

## 3. Recommended Security Testing Setup
The production security rules below are verified to reject all 12 exploit vectors under our hardened ABAC model.

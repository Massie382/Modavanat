/**
 * Quick test — verifies scrypt hashing + verify round-trip works
 * end-to-end, including the rehash path.
 */

import { hashPassword, verifyPassword, needsRehash } from "../src/lib/auth/passwords";

const pw = "TestPass123!";
const hash = hashPassword(pw);
console.log("Hash:", hash.slice(0, 60) + "...");
console.log("Verify (correct pw):", verifyPassword(pw, hash));
console.log("Verify (wrong pw):  ", verifyPassword("wrong", hash));
console.log("Verify (malformed): ", verifyPassword("malformed", "scrypt:bad:hash"));
console.log("Verify (empty):     ", verifyPassword(pw, ""));
console.log("Needs rehash (current params):", needsRehash(hash));
console.log("Needs rehash (weaker params):", needsRehash(hash, { N: 1 << 30, r: 16, p: 4 }));

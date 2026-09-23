import { DEVFRAME_OTP_URL_PARAM } from "./constants.mjs";
import { n as randomToken, r as timingSafeEqual, t as randomDigits } from "./crypto-token-XCqTSMg9.mjs";
//#region src/node/auth/state.ts
/** Number of decimal digits in a human-typed one-time authentication code. */
const TEMP_AUTH_CODE_LENGTH = 6;
/**
* How long an authentication code stays valid after it is (re)generated. A
* 6-digit code only has ~20 bits of entropy, so a short lifetime plus the
* attempt cap below are what keep it brute-force resistant.
*/
const TEMP_AUTH_CODE_TTL = 5 * 6e4;
/** Failed attempts allowed against a single code before it is rotated. */
const TEMP_AUTH_MAX_ATTEMPTS = 5;
let tempAuthCode = generateTempCode();
let tempAuthCodeExpiresAt = Date.now() + TEMP_AUTH_CODE_TTL;
let tempAuthFailedAttempts = 0;
function generateTempCode() {
	return randomDigits(TEMP_AUTH_CODE_LENGTH);
}
/**
* The current one-time authentication code. Display this to the user (e.g. in
* the dev-server terminal) so they can type it into the browser to authenticate.
*/
function getTempAuthCode() {
	return tempAuthCode;
}
/**
* Rotate the authentication code, resetting its expiry window and failed-attempt
* counter. Call this when a new authentication flow begins (e.g. when an
* untrusted client starts authenticating) so the displayed code is freshly
* valid for its full TTL.
*/
function refreshTempAuthCode() {
	tempAuthCode = generateTempCode();
	tempAuthCodeExpiresAt = Date.now() + TEMP_AUTH_CODE_TTL;
	tempAuthFailedAttempts = 0;
	return tempAuthCode;
}
/**
* Build a "magic link" authentication URL that embeds a one-time code (OTP) in
* the URL **fragment**. Opening it authenticates the client without typing —
* print it on startup (devframe stays headless, so the host prints its own
* banner). Defaults to the current code; the link is subject to the same TTL.
*
* The code rides the fragment (`#devframe_otp=…`), not the query string, so it
* is never sent to the server, written to an access log, or leaked in a
* `Referer` header — the browser client reads it locally (see
* `consumeOtpFromUrl`). Any existing fragment parameters are preserved.
*/
function buildOtpAuthUrl(baseUrl, code = tempAuthCode) {
	const url = new URL(baseUrl);
	const fragment = new URLSearchParams(url.hash.replace(/^#/, ""));
	fragment.set(DEVFRAME_OTP_URL_PARAM, code);
	url.hash = fragment.toString();
	return url.href;
}
/**
* Re-authenticate a connection that presents a previously-issued bearer token.
* Returns `true` and marks the session trusted when the token is known.
*
* Used by the `anonymous:devframe:auth` handler so a client that already
* authenticated (token persisted in the browser) is trusted on reconnect
* without entering the code again.
*/
function verifyAuthToken(token, session, storage) {
	if (!token || !storage.value().trusted[token]) return false;
	session.meta.clientAuthToken = token;
	session.meta.isTrusted = true;
	return true;
}
/**
* Exchange a one-time authentication code for a fresh, node-issued bearer token.
*
* On success this mints a high-entropy token, records it in the trusted store,
* marks the calling session trusted, rotates the code, and returns the token
* for the client to persist. Returns `null` on any failure.
*
* Because the code is short and human-typed, verification is hardened against
* brute force: it enforces a time-to-live, compares in constant time, and
* rotates the code after {@link TEMP_AUTH_MAX_ATTEMPTS} failed attempts so an
* attacker cannot keep guessing against the same code.
*/
function exchangeTempAuthCode(code, session, info, storage) {
	if (Date.now() > tempAuthCodeExpiresAt) {
		refreshTempAuthCode();
		return null;
	}
	if (!timingSafeEqual(code, tempAuthCode)) {
		tempAuthFailedAttempts += 1;
		if (tempAuthFailedAttempts >= TEMP_AUTH_MAX_ATTEMPTS) refreshTempAuthCode();
		return null;
	}
	const authToken = randomToken();
	storage.mutate((state) => {
		state.trusted[authToken] = {
			authToken,
			ua: info.ua,
			origin: info.origin,
			timestamp: Date.now()
		};
	});
	session.meta.clientAuthToken = authToken;
	session.meta.isTrusted = true;
	refreshTempAuthCode();
	return authToken;
}
//#endregion
export { verifyAuthToken as a, refreshTempAuthCode as i, exchangeTempAuthCode as n, getTempAuthCode as r, buildOtpAuthUrl as t };

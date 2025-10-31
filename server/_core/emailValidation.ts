import { ForbiddenError } from "@shared/_core/errors";

const ALLOWED_EMAIL_DOMAIN = "@officedeyasai.jp";

/**
 * Validates that an email address belongs to the allowed domain
 * @param email - Email address to validate
 * @throws ForbiddenError if email is not from @officedeyasai.jp
 */
export function validateEmailDomain(email: string | null | undefined): void {
  if (!email) {
    throw ForbiddenError("Email address is required");
  }

  if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    throw ForbiddenError(
      `Access denied. Only @officedeyasai.jp email addresses are allowed.`
    );
  }
}

/**
 * Checks if an email address belongs to the allowed domain
 * @param email - Email address to check
 * @returns true if email is from @officedeyasai.jp, false otherwise
 */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return email.endsWith(ALLOWED_EMAIL_DOMAIN);
}


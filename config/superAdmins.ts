
/**
 * List of emails granted Superadmin privileges.
 * Superadmins bypass access codes and can reset their roles in the Review Hub.
 */
export const SUPER_ADMIN_EMAILS = [
  'amule25559@gmail.com',
  'amule2559@gmail.com',
  // Add your testing emails here
];

export const isSuperAdminEmail = (email: string): boolean => {
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

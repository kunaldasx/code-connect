/**
 * Type definitions for GitHub commit form data.
 * Includes:
 * - File name field
 * - Commit message field
 *
 * By Kunal Das (https://kunaldasx.vercel.app)
 */

export interface CommitForm {
  commitSummary: string;
  fileName: string;
}

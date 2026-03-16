/**
 * Type definitions for editor option configurations.
 * Features:
 * - Option metadata
 * - Type constraints
 * - Value definitions
 *
 * By Kunal Das (https://kunaldasx.vercel.app)
 */

export interface EditorOption {
  currentValue: unknown;
  options?: string[];
  title: string;
  type: "boolean" | "string" | "number" | "select" | "text";
}

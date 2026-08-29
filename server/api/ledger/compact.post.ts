import { compactLedger } from '../../utils/ledger'

/** Rewrites the log with only live state. Safe: writes then renames. */
export default defineEventHandler(async () => compactLedger())

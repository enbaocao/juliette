# RTMS Cleanup Guide

This document lists RTMS-specific code that can be removed now that we're using the bot implementation instead.

## Files to Remove

### 1. RTMS Client (No longer needed)

```bash
rm rtms-service/src/rtms-client.ts
```

This file contains the RTMS WebSocket connection logic which is replaced by `bot-client.ts`.

## Database Columns (Optional Cleanup)

### Can Be Removed from `live_sessions` table:

- ❌ `rtms_stream_id` - Not used by bot implementation

However, keep these (reused by bot):
- ✅ `rtms_status` - Reused as general transcription status
- ✅ `is_transcribing` - Still used
- ✅ `transcription_started_at` - Still used
- ✅ `last_transcript_at` - Still used

### Can Be Removed from `transcript_chunks` table:

None - all fields are still used by bot implementation.

### Can Be Removed: `rtms_connections` table

The entire `rtms_connections` table can be dropped if you want cleaner schema:

```sql
DROP TABLE IF EXISTS rtms_connections;
```

**However**, if you might want to track bot connection metrics in the future, consider renaming it instead:

```sql
ALTER TABLE rtms_connections RENAME TO bot_connections;
ALTER TABLE bot_connections RENAME COLUMN rtms_stream_id TO bot_session_id;
-- Update the table to track bot-specific metrics
```

## Code References to Update

### Search and Replace (Optional)

If you want to rename references from "RTMS" to "Bot":

```bash
# Find all "RTMS" references
grep -r "RTMS" --include="*.ts" --include="*.tsx"

# Common replacements:
# "RTMS service" → "Bot service"
# "RTMS connection" → "Bot connection"
# "RTMS status" → "Transcription status"
```

### Specific Files to Update

1. **Log Messages**
   - Update console.log messages to say "bot" instead of "RTMS"
   - Already done in `index.ts` startup message

2. **Comments**
   - Update comments in `audio-buffer.ts` if they reference RTMS
   - Update comments in `transcription-pipeline.ts`

3. **Database Field Names** (Optional, Breaking Change)
   - Rename `rtms_status` → `transcription_status`
   - Rename `rtms_stream_id` → Remove or rename to `bot_session_id`

## Documentation to Archive

Move to `/archive` folder or delete:

- ❌ `RTMS_SETUP_GUIDE.md` - Specific to RTMS setup
- ❌ `RTMS_IMPLEMENTATION_SUMMARY.md` - Describes RTMS approach
- ❌ `QUICK_START.md` - References RTMS endpoints

Keep these:
- ✅ `BOT_IMPLEMENTATION.md` - New bot documentation
- ✅ `ALTERNATIVE_APPROACH.md` - Explains why we switched
- ✅ Database migration `003_rtms_integration.sql` (schema still valid)

## Environment Variables

### Can Remove from `.env` files:

None - all variables are still used:
- `ZOOM_CLIENT_ID` - Used by bot
- `ZOOM_CLIENT_SECRET` - Used by bot
- `SUPABASE_*` - Used by bot
- `OPENAI_API_KEY` - Used by bot

### Rename (Optional):

```bash
# In .env.local
RTMS_SERVICE_URL → BOT_SERVICE_URL  # Already supports both
```

We've made it backward compatible by checking both:
```typescript
const BOT_SERVICE_URL = process.env.BOT_SERVICE_URL || process.env.RTMS_SERVICE_URL || 'http://localhost:4000';
```

## npm Packages

### Check if installed, remove if found:

```bash
cd rtms-service
npm uninstall @zoom/rtms  # If this was added
```

Most likely this package was NOT installed yet since we pivoted before completing RTMS integration.

## Migration SQL (Optional Cleanup)

If you want to clean up the database schema, create a new migration:

**File:** `supabase/migrations/004_cleanup_rtms.sql`

```sql
-- Remove RTMS-specific table
DROP TABLE IF EXISTS rtms_connections;

-- Remove unused column from live_sessions
ALTER TABLE live_sessions DROP COLUMN IF EXISTS rtms_stream_id;

-- Optional: Rename for clarity
ALTER TABLE live_sessions RENAME COLUMN rtms_status TO transcription_status;

-- Add comment to clarify field usage
COMMENT ON COLUMN live_sessions.transcription_status IS 'Status of live transcription: idle, connecting, streaming, error';
COMMENT ON COLUMN live_sessions.is_transcribing IS 'Whether bot is currently transcribing this session';
```

⚠️ **Warning:** This is a breaking change. Only do this if you're sure no code references these old names.

## What NOT to Remove

### Keep All of These:

- ✅ `audio-buffer.ts` - Still used by bot
- ✅ `transcription-pipeline.ts` - Still used by bot
- ✅ `database-writer.ts` - Still used by bot
- ✅ Database schema fields (except `rtms_stream_id`)
- ✅ API routes `/api/rtms/*` - Keep for backward compatibility
- ✅ Frontend components - Already updated for bot
- ✅ Environment variables - All still needed

## Recommended Cleanup Steps

### Minimal (Safe) Cleanup:

1. Delete `rtms-service/src/rtms-client.ts`
2. Move old documentation to `/archive` folder
3. Keep database schema as-is (reused fields)

### Moderate Cleanup:

1. All minimal steps
2. Drop `rtms_connections` table via migration
3. Remove `rtms_stream_id` column from `live_sessions`
4. Update console.log messages to say "bot" instead of "RTMS"

### Full Cleanup (Breaking Changes):

1. All moderate steps
2. Rename `rtms_status` → `transcription_status`
3. Search/replace all "RTMS" references in code comments
4. Remove `@zoom/rtms` npm package if installed

## Summary

**Priority 1 - Safe to remove now:**
- `rtms-service/src/rtms-client.ts`

**Priority 2 - Optional cleanup:**
- `rtms_connections` table (via migration)
- `rtms_stream_id` column (via migration)
- Archive old RTMS documentation

**Priority 3 - Can do later:**
- Rename fields for clarity
- Update all comments and log messages
- Full search/replace of "RTMS" → "Bot"

Most RTMS infrastructure is actually reusable for the bot implementation, so there's not much to remove!

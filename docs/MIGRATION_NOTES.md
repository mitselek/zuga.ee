# Event Scheduling System Migration Notes

## Migration Script: `scripts/migrate-to-event-system.js`

This script migrates legacy `premiere_date` and `venue` fields to the new `premiere` object structure.

### Current Capabilities

- ✅ Converts `premiere_date` → `premiere.date` (normalizes ISO dates to YYYY-MM-DD)
- ✅ Converts `venue` → `premiere.venue_id` (maps venue names to venue IDs)
- ✅ Preserves legacy fields for backward compatibility
- ✅ Handles various date formats (ISO, YYYY-MM-DD)

### Future Enhancements

The script can be extended for:

1. **Workshop Booking Migration**
   - Convert legacy `booking: "Ettetellimisel"` string → structured `booking` object
   - Extract contact info, requirements, pricing from existing fields

2. **Adding Showings Arrays**
   - Parse tour dates from external sources (Fienta, STL website)
   - Add `showings` array with multiple dates

3. **Adding Tickets and Special Events**
   - Extract ticket platform links from content
   - Add `tickets` object with platforms and pricing
   - Add `special_events` array (artist talks, workshops)

### Usage

```bash
# Dry run (preview changes)
node scripts/migrate-to-event-system.js --dry-run --skip-backups

# Apply migration
node scripts/migrate-to-event-system.js --skip-backups

# Verbose output
node scripts/migrate-to-event-system.js --verbose
```

### Venue Name Mapping

The script maps venue names to venue IDs:

- "Sõltumatu Tantsu Lava" / "Independent Dance Stage" → `stl`
- "Kanuti Gildi SAAL" → `kanuti-gildi-saal`
- "Kumu Kunstimuuseum" / "Kumu Art Museum" → `kumu`
- "Rakvere Teater" / "Rakvere Theatre" → `rakvere-teater`

To add new venues, update `VENUE_NAME_TO_ID` mapping in the script.

### Date Format Notes

- **Legacy format**: `premiere_date: 2024-10-26` or `premiere_date: 2024-10-26T00:00:00.000Z`
- **New format**: `premiere.date: '2024-10-26'` (YYYY-MM-DD string)
- The script normalizes ISO dates to YYYY-MM-DD format
- Files should use YYYY-MM-DD string format going forward (not Date objects)

### Verification Checklist

After migration, verify:

- [ ] Correct venue ID mapping (check `premiere.venue_id` matches venue name)
- [ ] Date format consistency (all `premiere.date` in YYYY-MM-DD format)
- [ ] No data loss (legacy fields preserved, new fields populated)
- [ ] Build passes (`npm run build`)
- [ ] Schema validation passes (`node scripts/validate-all.js --web-only`)

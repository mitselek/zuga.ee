# Calendar Implementation Notes

## Phase 4: Calendar Pages Implementation

### Routes Generated

- `/et/kalender` - Main calendar page (Estonian)
- `/et/kalender/tulemas` - Upcoming events (Estonian)
- `/et/kalender/olnud` - Past events (Estonian)
- `/en/kalender` - Main calendar page (English)
- `/en/kalender/upcoming` - Upcoming events (English)
- `/en/kalender/past` - Past events (English)

### Event Querying Logic

**Date Extraction:**
- Extracts dates from `premiere.date` (if exists)
- Extracts dates from `showings[]` array (if exists)
- Handles edge cases:
  - Events with only premiere → premiere date included
  - Events with only showings → showing dates included
  - Events with premiere in past but showings in future → both included (appears in both upcoming and past lists)

**Filtering:**
- Upcoming: `date >= today` (Estonia timezone)
- Past: `date < today` (Estonia timezone)
- Main calendar: All events

**Sorting:**
- Upcoming: Ascending (closest first)
- Past: Descending (most recent first)
- Main: Ascending

**Grouping:**
- Events grouped by month/year
- Displayed in chronological order

### Timezone Handling

- Uses Estonia timezone (UTC+2/UTC+3)
- Date comparisons use `YYYY-MM-DD` format for consistency
- Time display uses locale-specific formatting

### Empty States

- **No upcoming events**: "Tulevasi üritusi hetkel pole. Vaata tagasi varsti uute ürituste jaoks."
- **No past events**: "Varasemaid üritusi ei leitud. ZUGA esimene etendus oli 2006. aastal."

### Known Limitations (Phase 5)

**Venue Display:**
- Currently shows venue ID (e.g., "stl") instead of venue name
- Phase 5 will resolve `venue_id` → venue name from `knowledge-base/venues/`
- Venue names will be displayed in page language (et/en)

**Future Enhancements (Not Blocking):**
- iCal/Google Calendar export
- Filter by venue
- Filter by performance type (adults/youth)
- RSS feed for upcoming events
- Venue map integration
- Ticket platform deep links

### Testing Checklist

- ✅ Build passes (52 pages)
- ✅ Routes accessible at expected URLs
- ✅ Upcoming events list shows future dates only
- ✅ Past events list shows past dates only
- ✅ Event cards link to correct detail pages
- ✅ Timezone comparison works correctly
- ✅ Month grouping displays correctly
- ⚠️ Venue names display (not IDs) - Phase 5 will improve this
- ✅ Empty states display appropriate messages
- ✅ Edge cases handled (premiere only, showings only, mixed)

### Date Edge Cases Verified

1. **Event with only premiere** → Premiere date appears in appropriate list ✅
2. **Event with only showings** → Showing dates appear in appropriate lists ✅
3. **Event with premiere in past but showings in future** →
   - Premiere appears in past list ✅
   - Showings appear in upcoming list ✅
   - Both appear in main calendar ✅

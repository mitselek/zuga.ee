# Issue #55: Update Prompts for Event Scheduling System

**Priority**: P1 - High
**Type**: Documentation, Enhancement
**Labels**: `prompts`, `documentation`, `event-calendar`, `enhancement`
**Related**: Issue #54 (Event Calendar & Scheduling System)
**Estimated Effort**: 6-8 hours

---

## Summary

The AI prompts (`/harvest-content` and `/add-content`) need updates to teach the new event scheduling system introduced in Issue #54. Currently, prompts use legacy fields (`premiere_date`, `venue`) and don't leverage the new structured event scheduling features.

**Impact**: Medium - Prompts still work due to backward compatibility, but create suboptimal content that doesn't utilize new calendar features.

---

## Background

Issue #54 implemented a comprehensive event scheduling system (Phases 1-5, all complete):

- ✅ **Phase 1**: Venues collection in KnB (`knowledge-base/venues/`)
- ✅ **Phase 2**: Event scheduling schemas (`premiere`, `showings`, `tickets`, `special_events`, `booking`)
- ✅ **Phase 3**: Content migration (legacy → new format)
- ✅ **Phase 4**: Calendar pages (`/kalender/tulemas`, `/kalender/olnud`)
- ✅ **Phase 5**: Components (`EventCard`, `EventList`, `VenueInfo`)

**Schema changes**:

- **Deprecated** (but supported): `premiere_date`, `venue`
- **New**: `premiere` object, `showings` array, `tickets` object, `special_events` array, `booking` object
- **Venues**: Centralized in `knowledge-base/venues/` with venue IDs

---

## Current State Assessment

### What's Working ✅

1. **Registry Integration**: Both prompts reference `knowledge-base/registry/performances.yaml`
2. **Venue Names**: Prompts mention common venue names
3. **Basic Dates**: Use `premiere_date` (legacy but valid)

### What's Missing ❌

| Feature             | `/harvest-content`      | `/add-content`          | Impact |
| ------------------- | ----------------------- | ----------------------- | ------ |
| `premiere` object   | ❌ Uses `premiere_date` | ❌ Uses `premiere_date` | High   |
| `showings` array    | ❌ Not mentioned        | ❌ Not mentioned        | High   |
| `tickets` object    | ❌ Not mentioned        | ❌ Not mentioned        | Medium |
| `special_events`    | ❌ Not mentioned        | ❌ Not mentioned        | Medium |
| Venue ID lookup     | ❌ No guidance          | ❌ No guidance          | High   |
| Venue fallback      | ❌ Not explained        | ❌ Not explained        | Medium |
| `booking` object    | ❌ Uses string only     | ❌ Uses string only     | Low    |
| `kalender` category | ❌ Not mentioned        | ❌ Not mentioned        | Low    |

---

## Problem Details

### Problem 1: Legacy Date/Venue Format

**Current prompt output**:

```yaml
premiere_date: 2024-10-15
venue: Kanuti Gildi SAAL
```

**Should teach**:

```yaml
premiere:
  date: "2024-10-15"
  time: "19:00"
  venue_id: kanuti-gildi-saal
```

**Impact**: Content doesn't benefit from structured premiere data, calendar pages show less detail.

---

### Problem 2: No Multiple Showings Support

**Current**: Prompts don't extract tour dates or repeat showings from articles.

**Should extract**:

```yaml
showings:
  - date: "2024-11-15"
    time: "19:00"
    venue_id: stl
  - date: "2024-11-22"
    time: "19:00"
    notes: "Sold out"
  - date: "2024-12-05"
    venue_id: rakvere-teater
    notes: "Külalisetendus"
```

**Impact**: Calendar pages miss tour dates, users don't see all performances.

---

### Problem 3: No Venue ID Lookup Guidance

**Current**: Prompts use venue names directly.

**Should teach**:

1. Check `knowledge-base/venues/` for venue files
2. Use venue `id` field (e.g., `stl`, `kanuti-gildi-saal`)
3. Common venue mappings:
   - "Sõltumatu Tantsu Lava" / "Independent Dance Stage" → `stl`
   - "Kanuti Gildi SAAL" → `kanuti-gildi-saal`
   - "Kumu Kunstimuuseum" / "Kumu Art Museum" → `kumu`
   - "Rakvere Teater" / "Rakvere Theatre" → `rakvere-teater`

**Impact**: VenueInfo component can't resolve venue names, calendar shows IDs.

---

### Problem 4: No Venue Fallback Explanation

**Current**: No guidance on when to omit `venue_id`.

**Should explain**:

- If showing at same venue as premiere → omit `venue_id` (fallback to `premiere.venue_id`)
- If showing at different venue → specify `venue_id`
- Reduces repetition (DRY principle)

**Example**:

```yaml
premiere:
  venue_id: stl

showings:
  - date: "2024-11-15"
    # venue_id omitted → inherits stl
  - date: "2024-12-05"
    venue_id: rakvere-teater # Different venue
```

---

### Problem 5: No Ticket Information Extraction

**Current**: Prompts don't extract ticket sales info from articles.

**Should extract**:

```yaml
tickets:
  on_sale: true
  platforms:
    - name: Fienta
      url: https://fienta.com/et/zuga-ilma
  pricing:
    - type: adult
      price: 15
      currency: EUR
    - type: student
      price: 10
      currency: EUR
```

**Impact**: Calendar doesn't show ticket availability, users can't buy tickets easily.

---

### Problem 6: No Special Events Support

**Current**: Prompts don't extract artist talks, post-show discussions, etc.

**Should extract**:

```yaml
special_events:
  - type: artist-talk
    date: "2024-10-20"
    time: "18:00"
    duration: 60
    free: true
    description:
      et: "Kunstnikuvestlus lavastajaga"
```

**Impact**: Calendar misses supplementary events, lower engagement.

---

### Problem 7: Workshop Booking (String vs Object)

**Current**: Prompts only use string format:

```yaml
booking: "Ettetellimisel"
```

**Should teach structured format**:

```yaml
booking:
  required: true
  contact:
    name: "ZUGA administratsioon"
    email: "zuga@zuga.ee"
  requirements:
    min_participants: 10
    max_participants: 30
  pricing:
    model: per-group
    amount: 150
    currency: EUR
```

**Impact**: Less structured workshop information, harder to automate booking.

---

## Proposed Solution

### High Priority Updates

#### 1. Update `/add-content` Prompt Schema Reference

**File**: `.github/prompts/add-content.prompt.md`

**Add section after line ~150** (after existing schema reference):

````markdown
## Event Scheduling Schema (Issue #54)

**NEW**: Performances and workshops support structured event scheduling for calendar system.

### Legacy vs New Format

**OLD (deprecated but still supported)**:

```yaml
premiere_date: 2024-10-15
venue: Kanuti Gildi SAAL
```

**NEW (preferred for calendar features)**:

```yaml
premiere:
  date: "2024-10-15" # YYYY-MM-DD format (required)
  time: "19:00" # HH:MM format (optional)
  venue_id: kanuti-gildi-saal # From knowledge-base/venues/ (optional)
```

### Venue ID Lookup

**Venue IDs** reference venue profiles in `knowledge-base/venues/`:

1. List venue files: `ls knowledge-base/venues/`
2. Common venue ID mappings:

| Venue Name            | English Name            | Venue ID            |
| --------------------- | ----------------------- | ------------------- |
| Sõltumatu Tantsu Lava | Independent Dance Stage | `stl`               |
| Kanuti Gildi SAAL     | Kanuti Gildi SAAL       | `kanuti-gildi-saal` |
| Kumu Kunstimuuseum    | Kumu Art Museum         | `kumu`              |
| Rakvere Teater        | Rakvere Theatre         | `rakvere-teater`    |

3. Check venue file frontmatter for `id` field
4. If venue not in KnB → use legacy `venue: "Venue Name"` string

### Multiple Showings (Tour Dates)

Extract all performance dates from KnB articles:

```yaml
showings:
  - date: "2024-11-15"
    time: "19:00"
    venue_id: stl # Same venue
  - date: "2024-11-22"
    time: "19:00"
    # venue_id omitted → inherits from premiere (fallback)
    status: sold-out # Optional: scheduled, sold-out, cancelled
  - date: "2024-12-05"
    time: "14:00"
    venue_id: rakvere-teater # Different venue (tour date)
    notes: "Külalisetendus Rakvere Teatris"
```

**Venue Fallback**: If `venue_id` omitted from showing, it inherits from `premiere.venue_id`. Only specify when different from premiere venue.

### Ticket Information

Extract from articles mentioning ticket sales:

```yaml
tickets:
  on_sale: true
  sale_start: "2024-10-01" # Optional: when sales open
  sale_end: "2024-12-31" # Optional: when sales close
  platforms:
    - name: Fienta
      url: https://fienta.com/et/zuga-ilma
    - name: Piletilevi
      url: https://piletilevi.ee/est/piletid/ilma-123
  pricing:
    - type: adult
      price: 15
      currency: EUR
    - type: student
      price: 10
      currency: EUR
    - type: child
      price: 8
      currency: EUR
```

### Special Events

Extract artist talks, workshops, discussions mentioned in articles:

```yaml
special_events:
  - type: artist-talk # Options: artist-talk, workshop, discussion, screening, masterclass
    date: "2024-10-20"
    time: "18:00"
    duration: 60 # Minutes (optional)
    free: true # Optional, default false
    registration_required: false # Optional, default false
    description:
      et: "Kunstnikuvestlus lavastaja ja koreograafiga pärast etendust"
      en: "Artist talk with director and choreographer after the performance"
```

### Workshop Booking

**Legacy format** (still supported):

```yaml
booking: "Ettetellimisel"
```

**NEW structured format** (preferred):

```yaml
booking:
  required: true # Pre-booking required vs walk-in
  contact:
    name: "ZUGA administratsioon"
    email: "zuga@zuga.ee"
    phone: "+372 123 4567" # Optional
  requirements:
    min_participants: 10 # Optional
    max_participants: 30 # Optional
    space: "Klassiruum või saal" # Optional
    equipment: "Kõlarid, projektsioon" # Optional
  pricing:
    model: per-group # Options: per-group, per-person
    amount: 150
    currency: EUR
    outside_tallinn_fee: true # Optional
  target_age: "6-13" # Optional
  duration: 45 # Minutes (optional)
```

### Calendar Category

NEW category for calendar pages:

```yaml
category: kalender # For calendar section/detail pages
```

### Complete Example

```yaml
---
title: Ilma
slug: weather-or-not
language: en
type: detail
category: etendused
subcategory: noorele-publikule
status: published

# Event Scheduling (NEW)
premiere:
  date: "2024-10-26"
  time: "19:00"
  venue_id: stl

showings:
  - date: "2024-11-15"
    time: "19:00"
    # Inherits venue_id: stl
  - date: "2024-11-22"
    time: "19:00"
    status: sold-out
  - date: "2024-12-05"
    time: "14:00"
    venue_id: rakvere-teater
    notes: "Guest performance in Rakvere"

tickets:
  on_sale: true
  platforms:
    - name: Fienta
      url: https://fienta.com/et/zuga-ilma
  pricing:
    - type: adult
      price: 15
      currency: EUR
    - type: student
      price: 10
      currency: EUR

special_events:
  - type: artist-talk
    date: "2024-10-27"
    time: "18:00"
    free: true

# Legacy fields (deprecated but still supported)
premiere_date: 2024-10-26T00:00:00.000Z
venue: Sõltumatu Tantsu Lava

# KnB Sources
knowledge_base_sources:
  articles:
    - "articles/2024-10-err-kultuur-ilma.md"
  persons:
    - "persons/paar-parenson.md"
---
```
````

---

#### 2. Update `/harvest-content` Prompt Extraction Logic

**File**: `.github/prompts/harvest-content.prompt.md`

**Add section after "Content Type Classification"** (around line 500):

````markdown
## Event Scheduling Data Extraction

When harvesting content about performances or workshops, extract structured event scheduling data:

### 1. Premiere Information

Look for:
- Premiere date (explicit or implied: "opening night", "debüteerib", "esiettekanne")
- Premiere time (if mentioned)
- Premiere venue

**Extract as**:
```yaml
premiere:
  date: '2024-10-26'  # YYYY-MM-DD
  time: '19:00'       # HH:MM (if mentioned)
  venue_id: stl       # Look up from knowledge-base/venues/
```

**Venue ID Lookup**:

1. Identify venue name in article (e.g., "Sõltumatu Tantsu Lava", "STL", "Independent Dance Stage")
2. Map to venue ID from `knowledge-base/venues/`:
   - "Sõltumatu Tantsu Lava" / "STL" / "Independent Dance Stage" → `stl`
   - "Kanuti Gildi SAAL" / "Kanuti" → `kanuti-gildi-saal`
   - "Kumu Kunstimuuseum" / "Kumu Art Museum" → `kumu`
   - "Rakvere Teater" / "Rakvere Theatre" → `rakvere-teater`
3. If venue not in venues collection → use string: `venue: "Venue Name"`

### 2. Multiple Showings (Tour Dates)

Look for:

- Additional performance dates
- Tour dates ("tuuritab", "külalisettekanne", "on tour")
- Repeat showings ("kordusettekanne", "repeat performance")

**Extract as**:

```yaml
showings:
  - date: "2024-11-15"
    time: "19:00"
    # venue_id omitted → inherits from premiere
  - date: "2024-12-05"
    venue_id: rakvere-teater # Different venue
    notes: "Külalisettekanne"
```

**Venue Fallback Strategy**:

- If showing at same venue as premiere → **omit** `venue_id`
- If showing at different venue → **specify** `venue_id`
- Reduces repetition (DRY principle)

### 3. Ticket Information

Look for:

- Ticket sales status ("piletid müügil", "tickets on sale")
- Ticket platforms (Fienta, Piletilevi, Ticketer, venue website)
- Ticket URLs
- Pricing ("piletid 15 eurot", "students 10€")

**Extract as**:

```yaml
tickets:
  on_sale: true
  platforms:
    - name: Fienta
      url: [extracted URL]
  pricing:
    - type: adult
      price: 15
      currency: EUR
```

### 4. Special Events

Look for:

- Artist talks ("kunstnikuvestlus", "artist talk", "post-show discussion")
- Workshops tied to performance
- Film screenings
- Masterclasses

**Extract as**:

```yaml
special_events:
  - type: artist-talk
    date: "2024-10-27"
    time: "18:00"
    free: true
    description:
      et: [extracted text]
```

### 5. Workshop Booking

For workshop articles, look for:

- Booking requirements ("ettetellimisel", "registration required")
- Contact information
- Participant limits
- Space/equipment requirements
- Pricing model (per group vs per person)

**Extract as**:

```yaml
booking:
  required: true
  contact:
    name: [extracted]
    email: [extracted]
  requirements:
    min_participants: [number]
    max_participants: [number]
  pricing:
    model: per-group
    amount: [number]
    currency: EUR
```

### Example Extraction

**Article text**:

```
ZUGA's new performance "Ilma" premieres October 26 at 7pm at Sõltumatu Tantsu Lava.
Additional showings: November 15 and 22 at STL, December 5 at Rakvere Theatre.
Tickets (adult 15€, student 10€) available at Fienta.
Artist talk with choreographer Päär Pärenson on October 27 at 6pm (free admission).
```

**Extract**:

```yaml
premiere:
  date: "2024-10-26"
  time: "19:00"
  venue_id: stl

showings:
  - date: "2024-11-15"
    time: "19:00"
    # venue_id: stl (inherited)
  - date: "2024-11-22"
    time: "19:00"
    # venue_id: stl (inherited)
  - date: "2024-12-05"
    venue_id: rakvere-teater

tickets:
  on_sale: true
  platforms:
    - name: Fienta
      url: [extracted from article if available]
  pricing:
    - type: adult
      price: 15
      currency: EUR
    - type: student
      price: 10
      currency: EUR

special_events:
  - type: artist-talk
    date: "2024-10-27"
    time: "18:00"
    free: true
    description:
      et: "Kunstnikuvestlus koreograaf Päär Pärenson'iga"
```
````

---

#### 3. Update Mirror Prompts in `.cursor/commands/`

**Files**:

- `.cursor/commands/add-content.md`
- `.cursor/commands/harvest.md`

**Action**: Apply same updates as GitHub prompts to maintain consistency.

---

### Medium Priority Updates

#### 4. Add Validation Rules

**Both prompts** - Add to validation sections:

````markdown
### Event Scheduling Validation

- ✅ `premiere.date` uses YYYY-MM-DD format
- ✅ `premiere.time` uses HH:MM format (if provided)
- ✅ `premiere.venue_id` matches a venue in `knowledge-base/venues/` (if provided)
- ✅ `showings[].date` uses YYYY-MM-DD format
- ✅ `showings[].venue_id` matches venue ID or is omitted (fallback to premiere)
- ✅ `tickets.platforms[].url` is valid URL
- ✅ `tickets.pricing[].price` is positive number
- ✅ `special_events[].type` is one of: artist-talk, workshop, discussion, screening, masterclass
- ✅ Legacy `premiere_date` and `venue` fields can coexist with new fields (backward compatibility)
````

---

#### 5. Update Examples Throughout Prompts

**Search and replace** old examples with new format:

**Old**:

```yaml
premiere_date: 2024-10-15
venue: Kanuti Gildi SAAL
```

**New**:

```yaml
premiere:
  date: "2024-10-15"
  time: "19:00"
  venue_id: kanuti-gildi-saal
```

Estimated **~15-20 example blocks** to update across both prompts.

---

### Low Priority Updates

#### 6. Add Venue Collection Documentation

Add reference section:

````markdown
## Venue Collection Reference

Venues are centralized in `knowledge-base/venues/` with structured profiles.

**Available venues**:

- `stl` - Sõltumatu Tantsu Lava (Telliskivi 60a/9, Tallinn)
- `kanuti-gildi-saal` - Kanuti Gildi SAAL (Pikk 20, Tallinn)
- `kumu` - Kumu Kunstimuuseum (Weizenbergi 34, Tallinn)
- `rakvere-teater` - Rakvere Teater (Kreutzwaldi 2a, Rakvere)

**Venue schema** (knowledge-base/config.ts):

- `id` - Short identifier
- `name` - Bilingual name (et, en)
- `address` - Full address object
- `coordinates` - GPS (lat, lng)
- `capacity` - Audience capacity
- `accessibility` - Wheelchair, elevator, hearing loop
- `transit` - Public transit info

**Adding new venues**: Create file in `knowledge-base/venues/` following schema.
````

---

#### 7. Update Schema Version References

**Both prompts** - Update schema version comments:

````typescript
// apps/web/src/content/config.ts - Event Scheduling (Issue #54)

// Legacy fields (deprecated):
premiere_date: string | Date (optional)
venue: string (optional)

// NEW structured fields:
premiere: { date, time?, venue_id? } (optional)
showings: Array<{ date, time?, venue_id?, status?, notes? }> (optional)
tickets: { on_sale?, platforms?, pricing? } (optional)
special_events: Array<{ type, date, time?, duration?, free?, description? }> (optional)
booking: string | { required, contact, requirements?, pricing? } (optional)
````

---

## Implementation Plan

### Phase 1: Core Schema Updates (4 hours)

- [ ] Add "Event Scheduling Schema" section to `/add-content` prompt
- [ ] Add "Event Scheduling Data Extraction" section to `/harvest-content` prompt
- [ ] Mirror updates to `.cursor/commands/` versions
- [ ] Test prompt with sample article extraction

**Deliverable**: Prompts teach new structured format

### Phase 2: Example Updates (2 hours)

- [ ] Update all code examples to use new format
- [ ] Add complete examples with premiere + showings + tickets
- [ ] Update validation sections with new rules

**Deliverable**: Consistent examples throughout prompts

### Phase 3: Documentation (1-2 hours)

- [ ] Add venue collection reference
- [ ] Document venue fallback strategy
- [ ] Update schema version comments
- [ ] Add migration notes (legacy → new format)

**Deliverable**: Complete reference documentation

### Phase 4: Testing (1 hour)

- [ ] Test `/add-content` with new format
- [ ] Test `/harvest-content` extraction
- [ ] Verify validation rules work
- [ ] Create sample content using updated prompts

**Deliverable**: Validated, working prompts

---

## Testing Checklist

### Prompt Functionality

- [ ] `/add-content` creates pages with `premiere` object
- [ ] `/add-content` creates pages with `showings` array
- [ ] `/add-content` looks up venue IDs correctly
- [ ] `/add-content` uses venue fallback (omits venue_id when same as premiere)
- [ ] `/add-content` creates `tickets` object when info available
- [ ] `/harvest-content` extracts premiere date/time/venue
- [ ] `/harvest-content` extracts multiple showing dates
- [ ] `/harvest-content` maps venue names to venue IDs
- [ ] `/harvest-content` extracts ticket information
- [ ] `/harvest-content` extracts special events

### Backward Compatibility

- [ ] Prompts still support legacy `premiere_date` format
- [ ] Prompts still support legacy `venue` string format
- [ ] Prompts can create content with mixed legacy + new fields
- [ ] Validation passes for legacy-only content
- [ ] Validation passes for new-format-only content
- [ ] Validation passes for mixed-format content

### Documentation

- [ ] Venue ID lookup process clear
- [ ] Venue fallback strategy explained
- [ ] Examples show complete event scheduling
- [ ] Schema reference accurate
- [ ] Migration path documented

---

## Success Criteria

**Core Functionality**:

- [ ] Prompts create content using new event scheduling format
- [ ] Venue IDs correctly resolved from venue names
- [ ] Multiple showings extracted from articles
- [ ] Calendar pages populated with complete event data

**Quality**:

- [ ] Examples throughout prompts use new format
- [ ] Documentation comprehensive
- [ ] Backward compatibility maintained
- [ ] Validation rules enforced

**User Experience**:

- [ ] Prompts provide clear guidance
- [ ] Error messages helpful
- [ ] Venue lookup straightforward
- [ ] Examples easy to follow

---

## Related Documentation

- Issue #54: Event Calendar & Scheduling System (all phases complete)
- `docs/CALENDAR_IMPLEMENTATION_NOTES.md` - Technical implementation
- `apps/web/src/content/config.ts` - Schema definitions
- `knowledge-base/config.ts` - Venue schema
- `knowledge-base/README.md` - Venue collection docs

---

## Risk Assessment

**Low Risk** 🟢

- Backward compatibility maintained (legacy fields still work)
- Prompts remain functional during transition
- Changes are additive (teach new format, don't break old)
- Can update incrementally (one section at a time)

**Mitigation**:

- Keep legacy examples alongside new examples during transition
- Add "DEPRECATED" notices to old format examples
- Test both formats after updates
- Document rollback if needed (revert to git commit)

---

## Appendix: File Locations

### Files to Update

**GitHub Prompts** (primary):

- `.github/prompts/add-content.prompt.md` (~1200 lines)
- `.github/prompts/harvest-content.prompt.md` (~2400 lines)

**Cursor Commands** (mirrors):

- `.cursor/commands/add-content.md` (~1200 lines)
- `.cursor/commands/harvest.md` (~2400 lines)

**Total**: ~7200 lines across 4 files

### Reference Files

**Schema Definitions**:

- `apps/web/src/content/config.ts` - Web content schema (premiere, showings, tickets)
- `knowledge-base/config.ts` - KnB schemas (venue schema)

**Documentation**:

- `knowledge-base/README.md` - Venue collection docs
- `docs/CALENDAR_IMPLEMENTATION_NOTES.md` - Implementation notes

**Venues**:

- `knowledge-base/venues/*.md` - Venue profiles (4 files)

---

## Next Steps

1. **Review this issue** with team
2. **Prioritize** - High priority (blocks optimal calendar usage) or can defer?
3. **Assign** - Who updates prompts?
4. **Start with Phase 1** - Core schema updates (highest value)
5. **Test incrementally** - Validate each section before proceeding
6. **Update documentation** - Keep README and examples in sync

---

**Status**: 📋 Ready for Implementation
**Created**: 2025-12-15
**Related Branch**: `feat/event-calendar-system` (ready to merge)

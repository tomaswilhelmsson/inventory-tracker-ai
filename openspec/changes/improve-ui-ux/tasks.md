# Tasks: Improve UI/UX for Enhanced Usability

## Phase 1: Design System Foundation (3-4 hours)

### 1.1 Create Color System Documentation
- [ ] Document semantic color mapping in design system guide
  - Define 5 core severities: success, warning, danger, info, secondary
  - Map each severity to use cases (e.g., success = valid data, in stock)
  - Create color usage decision tree (when to use each color)
  - Validation: Documentation is clear and provides examples
  - Test: Team review for clarity

### 1.2 Define CSS Custom Properties
- [ ] Create `frontend/src/styles/variables.css` for design tokens
  - Import PrimeVue color variables
  - Define semantic color aliases (--color-valid, --color-error, etc.)
  - Define background tint variables (--bg-success, --bg-warning, etc.)
  - Define text color variables (--text-success, --text-warning, etc.)
  - Validation: All variables compile and are accessible in components
  - Test: Use variables in a test component

### 1.3 Create Utility CSS Classes
- [ ] Create `frontend/src/styles/utilities.css` for reusable classes
  - `.status-success`, `.status-warning`, `.status-danger` (text colors)
  - `.bg-success`, `.bg-warning`, `.bg-danger` (background colors)
  - `.border-success`, `.border-warning`, `.border-danger` (borders)
  - `.highlight-success`, `.highlight-warning`, `.highlight-danger` (combined)
  - Validation: Classes work in isolation and don't conflict
  - Test: Apply classes to various PrimeVue components

### 1.4 Establish Icon Usage Guidelines
- [ ] Document icon + color pairing standards
  - Success: `pi pi-check-circle` + green
  - Warning: `pi pi-exclamation-triangle` + orange
  - Danger: `pi pi-times-circle` + red
  - Info: `pi pi-info-circle` + blue
  - Validation: All icon names exist in PrimeVue icon library
  - Test: Render each icon with corresponding color

### 1.5 Create Accessibility Testing Checklist
- [ ] Document accessibility validation requirements
  - WCAG 2.1 AA contrast ratio requirements (4.5:1 for text, 3:1 for large)
  - Color blindness testing tools (Chrome DevTools simulator)
  - Screen reader testing approach (icon aria-labels)
  - Keyboard navigation requirements
  - Reduced motion support (`prefers-reduced-motion`)
  - Validation: Checklist covers all accessibility dimensions
  - Test: Use checklist on existing component

## Phase 2: Multi-Item Purchase Dialog Enhancements (4-5 hours)

### 2.1 Implement Invoice Total Mismatch Indicator
- [ ] Update `MultiItemPurchaseDialog.vue` summary section styling
  - Add conditional class binding for mismatch state
  - Apply orange background (`--orange-50`) when mismatch exists
  - Add 2px orange border (`--orange-500`)
  - Create subtle pulse animation on mismatch detection
  - Validation: Mismatch visual appears when totals don't match
  - Test: Enter various invoice totals to trigger/clear mismatch

### 2.2 Add Mismatch Warning Message Component
- [ ] Create prominent warning message below total
  - Use PrimeVue `Message` component with `severity="warn"`
  - Display calculated vs. entered amounts
  - Show difference amount
  - Add exclamation triangle icon
  - Validation: Message appears/disappears with mismatch state
  - Test: Verify message text is clear and helpful

### 2.3 Implement Line Item Row Color Coding
- [ ] Add `getLineItemRowClass` computed function
  - Calculate completeness: product + quantity + (unitCost OR totalCost)
  - Return appropriate class: `line-item-complete`, `line-item-partial`, `line-item-empty`
  - Bind to DataTable `:rowClass` prop
  - Validation: Rows update color as data is entered
  - Test: Add/remove data from line items to see color changes

### 2.4 Style Line Item Row States
- [ ] Create CSS for line item status classes
  - `.line-item-complete`: Green left border (4px), light green background gradient
  - `.line-item-partial`: Yellow left border, light yellow background
  - `.line-item-empty`: Reduced opacity (0.6)
  - Add checkmark icon to complete rows using `::before` pseudo-element
  - Validation: All three states visually distinct
  - Test: Create multi-item purchase with mixed completion states

### 2.5 Highlight Shipping Allocation Column
- [ ] Style shipping allocation display
  - Use distinct background color (light blue tint)
  - Add tooltip explaining auto-calculation
  - Make column header visually prominent
  - Validation: Column stands out from others
  - Test: Verify calculation updates when shipping cost changes

### 2.6 Add Field Validation Visual Feedback
- [ ] Update form fields with validation state classes
  - Red border for invalid fields (`:class="{ 'p-invalid': formErrors.fieldName }"`)
  - Add error icons next to invalid fields
  - Optional: Green checkmark for valid required fields
  - Validation: Errors are immediately visible
  - Test: Submit form with missing fields, verify visual feedback

## Phase 3: Inventory View Enhancements (3-4 hours)

### 3.1 Create Quantity Status Badge Component
- [ ] Extract quantity tag into reusable component `QuantityBadge.vue`
  - Accept props: `quantity`, `unit`
  - Compute severity based on quantity (0=danger, <10=warning, ≥10=success)
  - Compute icon based on quantity thresholds
  - Use PrimeVue `Tag` component with computed severity and icon
  - Validation: Badge shows correct color and icon for each threshold
  - Test: Pass various quantities (0, 5, 100) to verify behavior

### 3.2 Update Inventory Table to Use Quantity Badge
- [ ] Replace plain quantity tags with `QuantityBadge` component
  - Import `QuantityBadge` in `InventoryView.vue`
  - Update quantity column template to use badge
  - Ensure units display correctly
  - Validation: All inventory items show appropriate badge
  - Test: Inventory with zero, low, and normal quantities

### 3.3 Implement High-Value Item Highlighting
- [ ] Add `getInventoryRowClass` computed function
  - Define high-value threshold (e.g., $1000)
  - Return `high-value-item` class for items exceeding threshold
  - Bind to DataTable `:rowClass` prop
  - Validation: High-value rows are highlighted
  - Test: Adjust threshold to verify detection

### 3.4 Style High-Value Item Rows
- [ ] Create CSS for high-value items
  - Yellow gradient background (left to transparent)
  - 3px left border (yellow-600)
  - Optional: Subtle icon/emoji in pseudo-element
  - Enhanced hover effect (darker yellow background)
  - Validation: Styling doesn't interfere with other indicators
  - Test: Hover over high-value items to verify interaction

### 3.5 Add Hover Effects to Table Rows
- [ ] Improve table row hover states
  - Subtle background color change on hover
  - Smooth transition (0.2s ease)
  - Ensure hover works with all row status classes
  - Validation: Hover is visible but not jarring
  - Test: Hover over various row types

### 3.6 Enhance Lots Dialog Visual Hierarchy
- [ ] Update lots dialog table styling
  - Add visual distinction between active and depleted lots
  - Use subtle color coding for lot values
  - Improve spacing and readability
  - Validation: Lots are easy to scan
  - Test: View lots for products with many purchases

## Phase 4: Purchases View Enhancements (3-4 hours)

### 4.1 Implement Locked Year Badge
- [ ] Update locked year indicator in purchases table
  - Use PrimeVue `Tag` with `severity="warning"`
  - Add lock icon (`pi pi-lock`)
  - Apply custom class `locked-badge`
  - Validation: Badge appears for locked years
  - Test: View purchases from different years

### 4.2 Add Locked Year Badge Animation
- [ ] Create pulse animation for locked badge
  - CSS keyframe animation (opacity 1 to 0.7)
  - 2-second duration, infinite loop
  - Use `animation` CSS property
  - Validation: Animation is subtle and not distracting
  - Test: Observe animation over time

### 4.3 Respect Reduced Motion Preference
- [ ] Add media query for reduced motion
  - Wrap animations in `@media (prefers-reduced-motion: reduce)`
  - Set `animation: none` for reduced motion users
  - Validation: Animation stops when OS setting enabled
  - Test: Toggle reduced motion in OS, verify behavior

### 4.4 Implement Batch Grouping Visual Cues
- [ ] Add `getBatchRowClass` computed function
  - Calculate batch color index using modulo: `batchId % 3`
  - Return appropriate batch class: `batch-0`, `batch-1`, `batch-2`
  - Handle null batchId (return empty string)
  - Bind to DataTable `:rowClass` prop
  - Validation: Batches have distinct background colors
  - Test: Create multiple batch purchases, verify grouping

### 4.5 Style Batch Grouping Backgrounds
- [ ] Create CSS for batch row classes
  - `.batch-0`: Light blue background (`--blue-50`)
  - `.batch-1`: Light purple background (`--purple-50`)
  - `.batch-2`: Light teal background (`--teal-50`)
  - Ensure colors are subtle and accessible
  - Validation: Batch colors don't conflict with other indicators
  - Test: View table with multiple batches

### 4.6 Highlight Verification Numbers
- [ ] Style verification number column
  - Use monospace font for better readability
  - Add subtle background when verification number exists
  - Increase font weight or use badge
  - Validation: Verification numbers are easy to spot
  - Test: Compare rows with and without verification numbers

### 4.7 Enhance Remaining Quantity Visual Feedback
- [ ] Update remaining quantity tag styling
  - Use severity based on remaining vs. original quantity
  - Add icon for depleted items (0 remaining)
  - Validation: Depletion status is clear
  - Test: View purchases with various remaining quantities

## Phase 5: Year-End Count View Enhancements (4-5 hours)

### 5.1 Create Gradient Progress Bar Component
- [ ] Add `getProgressStage` helper function
  - Define 5 stages: beginning (0-24%), started (25-49%), halfway (50-74%), almost (75-99%), complete (100%)
  - Return appropriate stage name
  - Validation: Correct stage for each percentage
  - Test: Calculate stage for various progress values

### 5.2 Style Progress Bar Gradients
- [ ] Create CSS for progress bar stages
  - `.progress-complete`: Solid green
  - `.progress-almost`: Blue to green gradient
  - `.progress-halfway`: Yellow to blue gradient
  - `.progress-started`: Orange to yellow gradient
  - `.progress-beginning`: Red to orange gradient
  - Use CSS `linear-gradient` on `.p-progressbar-value`
  - Validation: Gradients are smooth and visually pleasing
  - Test: Manually set progress to each stage

### 5.3 Bind Progress Stage Class to ProgressBar
- [ ] Update ProgressBar component in YearEndCountView
  - Add `:class` binding to progress stage computed property
  - Ensure PrimeVue ProgressBar supports class customization
  - Validation: Progress bar color changes as count progresses
  - Test: Complete count from 0% to 100%, observe gradient changes

### 5.4 Implement Uncounted Item Row Highlighting
- [ ] Add `getCountRowClass` computed function
  - Check if `countedQuantity === null` → return `uncounted-item`
  - Check if `Math.abs(variance) > 100` → return `large-variance`
  - Otherwise return empty string
  - Bind to count sheet DataTable `:rowClass`
  - Validation: Uncounted items are highlighted
  - Test: View count sheet with mix of counted/uncounted items

### 5.5 Style Uncounted Item Rows
- [ ] Create CSS for uncounted item rows
  - Orange background (`--orange-50`)
  - 4px left border (orange)
  - Pulse animation (background color oscillation)
  - Add clock/timer icon using `::before` pseudo-element
  - Validation: Uncounted items draw attention
  - Test: Observe animation, verify it's not annoying

### 5.6 Style Large Variance Rows
- [ ] Create CSS for large variance indication
  - Red background (`--red-50`)
  - 4px left border (red)
  - Bold font weight
  - Validation: Large variances are immediately visible
  - Test: Create count with large positive and negative variances

### 5.7 Implement Variance Color Coding
- [ ] Create `getVarianceSeverity` helper function
  - variance === 0 → 'secondary' (gray)
  - Math.abs(variance) > 100 → 'danger' (red)
  - variance > 0 → 'success' (green)
  - variance < 0 → 'warning' (orange)
  - Validation: Severity matches variance magnitude and direction
  - Test: Various variance values

### 5.8 Implement Variance Icons
- [ ] Create `getVarianceIcon` helper function
  - variance === 0 → 'pi pi-minus'
  - variance > 0 → 'pi pi-arrow-up'
  - variance < 0 → 'pi pi-arrow-down'
  - Validation: Icons reflect variance direction
  - Test: Verify icons appear with correct direction

### 5.9 Update Variance Column Template
- [ ] Modify variance column to use Tag with severity and icon
  - Use PrimeVue `Tag` component
  - Bind `:severity` to computed variance severity
  - Bind `:icon` to computed variance icon
  - Format variance number (e.g., "+15", "-23")
  - Validation: Variance display is clear and color-coded
  - Test: Count sheet with various variance scenarios

## Phase 6: Form Validation Enhancements (3-4 hours)

### 6.1 Create Field Validation State Classes
- [ ] Define field validation CSS classes
  - `.field-error`: Red border, red focus shadow
  - `.field-success`: Green border (optional)
  - `.field-warning`: Orange border (for warnings)
  - Validation: Classes work on all input types (text, dropdown, number)
  - Test: Apply to various PrimeVue input components

### 6.2 Update All Forms with Validation Classes
- [ ] Add conditional class binding to all form fields
  - Suppliers form: Name, email, phone, etc.
  - Products form: Name, unit, supplier
  - Purchases form: Date, product, quantity, unitCost
  - Multi-purchase dialog: All batch and line item fields
  - Year-end count: Counted quantity fields
  - Validation: Invalid fields show red border
  - Test: Trigger validation errors in each form

### 6.3 Create Error Message Component
- [ ] Design inline error message display
  - Small red text with icon
  - Position below field
  - Fade-in transition (0.2s)
  - Validation: Error messages are legible
  - Test: Error appears when field becomes invalid

### 6.4 Create Success Indicator Component
- [ ] Design success checkmark display
  - Small green checkmark icon
  - Position next to or below field
  - Fade-in transition
  - Validation: Success indicator appears for valid required fields
  - Test: Fill required field correctly, verify checkmark

### 6.5 Add Field Validation Icons
- [ ] Update field templates to include icons
  - Error icon (`pi pi-times-circle`) for invalid fields
  - Success icon (`pi pi-check-circle`) for valid required fields
  - Warning icon (`pi pi-exclamation-triangle`) for warnings
  - Position icons inside input (right side) or next to it
  - Validation: Icons don't overlap with input text
  - Test: Various field states (valid, invalid, warning)

### 6.6 Implement Validation Timing
- [ ] Configure when validation feedback appears
  - Validate on blur (user leaves field)
  - Don't validate on keystroke (too aggressive)
  - Clear errors immediately when corrected
  - Show success only after blur
  - Validation: Validation timing feels natural
  - Test: Tab through form, verify validation triggers

## Phase 7: Loading States and Skeletons (2-3 hours)

### 7.1 Create Skeleton Row Component
- [ ] Build `SkeletonTableRow.vue` component
  - Accept prop: `columns` (number of cells)
  - Render gray rectangular cells with shimmer
  - Match table cell dimensions
  - Validation: Skeleton matches table layout
  - Test: Insert into DataTable loading state

### 7.2 Implement Shimmer Animation
- [ ] Create CSS shimmer animation
  - Use `linear-gradient` with 3 color stops (gray-light-gray)
  - Animate `background-position` from left to right
  - Duration: 1.5 seconds, infinite loop
  - Validation: Shimmer is smooth and indicates loading
  - Test: Observe shimmer in various loading states

### 7.3 Update DataTable Loading Templates
- [ ] Add loading templates to all DataTables
  - Inventory table: Show 5 skeleton rows
  - Purchases table: Show 10 skeleton rows
  - Suppliers table: Show 5 skeleton rows
  - Products table: Show 5 skeleton rows
  - Year-end count table: Show skeleton matching product count estimate
  - Validation: Skeleton appears during data fetch
  - Test: Simulate slow network to see skeletons

### 7.4 Add Respect for Reduced Motion
- [ ] Disable shimmer for reduced motion preference
  - Wrap animation in `@media (prefers-reduced-motion: reduce)`
  - Show static gray rectangles instead of shimmer
  - Validation: Shimmer stops when reduced motion enabled
  - Test: Toggle OS reduced motion setting

### 7.5 Implement Loading Spinners for Buttons
- [ ] Update async action buttons with loading state
  - Add `:loading` prop to save/submit buttons
  - Bind to component's `saving` or `loading` ref
  - Validation: Spinner appears during async operations
  - Test: Click save button, verify spinner shows

## Phase 8: Accessibility and Testing (4-6 hours)

### 8.1 Run WCAG Contrast Checker
- [ ] Validate all color combinations
  - Use WebAIM Contrast Checker or browser DevTools
  - Test all text on background combinations
  - Ensure 4.5:1 ratio for normal text, 3:1 for large text
  - Document any failures and adjust colors
  - Validation: All combinations meet WCAG 2.1 AA
  - Test: Generate contrast report

### 8.2 Test with Color Blindness Simulator
- [ ] Simulate various color vision deficiencies
  - Use Chrome DevTools "Rendering" → "Emulate vision deficiencies"
  - Test: Protanopia (red-blind), Deuteranopia (green-blind), Tritanopia (blue-blind)
  - Verify icons/text provide sufficient non-color cues
  - Document any issues
  - Validation: All indicators are distinguishable
  - Test: Navigate app with each deficiency simulation

### 8.3 Validate Screen Reader Support
- [ ] Test with screen reader (NVDA, JAWS, or VoiceOver)
  - Add `aria-label` to icon-only indicators
  - Verify status tags are announced correctly
  - Ensure form validation errors are announced
  - Test landmark navigation
  - Validation: All visual indicators have text equivalents
  - Test: Complete full user flow with screen reader

### 8.4 Test Keyboard Navigation
- [ ] Verify all interactive elements are keyboard accessible
  - Tab through all forms
  - Ensure focus states are clearly visible
  - Test escape key closes modals
  - Test arrow keys in dropdowns/tables
  - Validation: No keyboard traps, all actions accessible
  - Test: Complete purchase entry using keyboard only

### 8.5 Validate Reduced Motion Support
- [ ] Test all animations with reduced motion enabled
  - Enable OS reduced motion setting
  - Navigate through all views
  - Verify animations stop (pulse, shimmer, transitions)
  - Ensure functionality still works
  - Validation: No animations play when preference set
  - Test: All features work without animation

### 8.6 Performance Testing
- [ ] Measure performance impact of visual enhancements
  - Use Chrome DevTools Lighthouse
  - Measure before/after performance scores
  - Check rendering performance (FPS in tables)
  - Monitor bundle size increase
  - Validation: No significant performance degradation (<10%)
  - Test: Large datasets (1000+ purchases, 100+ products)

### 8.7 Cross-Browser Testing
- [ ] Test in multiple browsers
  - Chrome/Edge (Chromium)
  - Firefox
  - Safari (macOS/iOS)
  - Verify CSS custom properties work
  - Verify animations work
  - Validation: Consistent appearance across browsers
  - Test: All features work in each browser

### 8.8 Responsive Design Validation
- [ ] Test on various screen sizes
  - Desktop (1920x1080, 1366x768)
  - Tablet (768x1024)
  - Mobile (375x667)
  - Verify color indicators don't break layout
  - Validation: All enhancements work on small screens
  - Test: Multi-purchase dialog on mobile

## Phase 9: Documentation and Guidelines (2-3 hours)

### 9.1 Create Design System Documentation
- [ ] Write comprehensive design system guide
  - Document color semantic mapping with examples
  - Explain when to use each severity level
  - Provide code examples for common patterns
  - Include accessibility guidelines
  - Validation: Documentation is clear and complete
  - Test: New developer can follow guide to add feature

### 9.2 Document Component Usage Examples
- [ ] Create example gallery or Storybook stories
  - Quantity badge examples (zero, low, normal)
  - Form validation states (invalid, valid, warning)
  - Progress bar stages (all 5 gradients)
  - Row highlighting examples (batch, high-value, uncounted)
  - Validation: Examples cover all visual patterns
  - Test: Examples are easy to copy/paste

### 9.3 Write Accessibility Guidelines
- [ ] Document accessibility best practices
  - Color contrast requirements
  - Icon + text pairing rules
  - ARIA label usage
  - Keyboard navigation standards
  - Reduced motion support
  - Validation: Guidelines are actionable
  - Test: Use guidelines to audit new feature

### 9.4 Update Developer Onboarding Guide
- [ ] Add UI/UX section to onboarding docs
  - Explain visual feedback philosophy
  - Reference design system documentation
  - Provide checklist for new components
  - Include accessibility testing steps
  - Validation: Onboarding covers visual standards
  - Test: Onboard new developer, gather feedback

### 9.5 Create Color Legend for Users
- [ ] Design in-app help/legend for color meanings
  - Create modal or tooltip explaining color codes
  - Provide examples: green badge = in stock, red = error
  - Make accessible from help menu or first-time tooltips
  - Validation: Legend is easy to understand
  - Test: Show to non-technical user, verify comprehension

### 9.6 Document Known Limitations
- [ ] Create list of known limitations and future work
  - Low inventory threshold is hardcoded (not configurable)
  - No dark mode support (uses light theme colors)
  - Batch grouping limited to 3 colors
  - Validation: Limitations are clearly documented
  - Test: Review list with product owner

## Dependencies

- Phase 1 must complete before all other phases (foundation required)
- Phase 2-7 can run in parallel (different views/components)
- Phase 8 depends on completion of Phases 2-7 (need implementations to test)
- Phase 9 can start after Phase 1 and run parallel with implementation

## Parallelizable Work

- Phases 2, 3, 4, 5 can be done by different developers simultaneously
- Phase 6 and 7 can overlap with view-specific work (Phases 2-5)
- Within Phase 8, tasks 8.1-8.5 can be divided among team members

## Estimated Effort

- Phase 1: 3-4 hours
- Phase 2: 4-5 hours
- Phase 3: 3-4 hours
- Phase 4: 3-4 hours
- Phase 5: 4-5 hours
- Phase 6: 3-4 hours
- Phase 7: 2-3 hours
- Phase 8: 4-6 hours
- Phase 9: 2-3 hours
- **Total**: 28-38 hours

## Notes

- All animations must respect `prefers-reduced-motion` media query
- Test all color combinations with WCAG contrast checker before commit
- Use PrimeVue design tokens exclusively (no hardcoded hex colors)
- Always pair color with icon or text for accessibility
- Document any deviations from design system with justification
- Get product owner approval before changing thresholds (e.g., low inventory = 10)

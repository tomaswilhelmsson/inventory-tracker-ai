# Design: UI/UX Enhancement with Visual Indicators

## Context

The inventory tracking system is a Vue 3 application using PrimeVue components, TypeScript, and the Composition API. While functionally complete, the UI lacks visual cues that help users quickly identify data discrepancies, validation errors, and status conditions. This design introduces a comprehensive visual feedback system using color coding, icons, and animations to improve usability and reduce error rates.

## Goals / Non-Goals

### Goals
- Make data discrepancies immediately visible through color coding
- Reduce time to identify errors in multi-item purchase entry
- Provide clear visual feedback for form validation states
- Help users quickly scan and prioritize inventory issues
- Improve data entry confidence through real-time visual validation
- Maintain accessibility standards (WCAG 2.1 AA)
- Create consistent visual language across all views

### Non-Goals
- Complete UI redesign or layout restructuring
- Dark mode implementation
- Custom animation library integration
- Mobile-specific UI optimizations
- Interactive data visualization (charts/graphs)
- User-customizable color themes
- Backend validation message improvements

## Decisions

### Decision 1: Color Coding Strategy
**Choice**: Use semantic color system based on PrimeVue severity levels

**Rationale**:
- **Consistency**: PrimeVue already defines `success`, `warning`, `danger`, `info`, and `secondary` severities
- **Accessibility**: PrimeVue colors are designed with sufficient contrast
- **Maintainability**: Using design tokens allows theme changes without code updates
- **Familiarity**: Users recognize standard color conventions (green=good, red=error, orange=warning)

**Color Semantic Mapping**:
- **Success (Green)**: Valid data, positive variance, items in stock, completed states
- **Warning (Orange)**: Caution states, incomplete data, low inventory, locked items
- **Danger (Red)**: Errors, mismatches, zero inventory, large negative variances
- **Info (Blue)**: Neutral information, batch grouping, verification indicators
- **Secondary (Gray)**: Inactive, disabled, or neutral states

**Alternatives considered**:
- **Custom color palette**: Rejected due to maintenance overhead and risk of inconsistency
- **Monochrome with patterns**: Rejected due to reduced scannability and visual impact
- **Material Design colors**: Rejected because PrimeVue already has a complete system

### Decision 2: Multi-Item Purchase Validation Approach
**Choice**: Triple-level validation with progressive visual feedback

**Implementation**:
1. **Field-level**: Individual input validation with red borders and error icons
2. **Row-level**: Line item completeness with colored left borders
3. **Form-level**: Invoice total mismatch with prominent highlighted section

**Visual States**:
- **Complete & Valid**: Green left border, checkmark icon
- **Partial**: Yellow background, partial data entered
- **Incomplete**: Orange background, required fields missing
- **Error**: Red border, validation failed

**Rationale**:
- Progressive disclosure prevents overwhelming users
- Multiple validation levels catch different error types
- Visual hierarchy guides user attention to critical issues
- Color + icon + text ensures accessibility

**Alternatives considered**:
- **Error list at top**: Requires scrolling, less contextual
- **Modal blocking submission**: Too intrusive for warnings
- **Toast notifications only**: Disappear, not persistent enough

### Decision 3: Inventory Status Visualization
**Choice**: Dynamic status badges with quantity-based severity

**Thresholds**:
- Zero quantity: Red badge with error icon
- Low stock (< 10 units): Orange badge with warning icon
- Normal stock (≥ 10 units): Green badge with checkmark
- High value (> $1000): Yellow highlight background

**Rationale**:
- Quantity thresholds are business-meaningful
- Color coding matches user mental model (traffic light)
- Icons reinforce meaning for accessibility
- High-value highlighting helps prioritize attention

**Alternatives considered**:
- **Fixed color per product**: Requires configuration, less dynamic
- **Percentage-based thresholds**: Harder to understand, less universal
- **Text-only indicators**: Less scannable in large tables

### Decision 4: Year-End Count Progress Indicators
**Choice**: Gradient progress bar with completion-based colors

**Progress Color Mapping**:
- 0-24%: Red-to-orange gradient (just started)
- 25-49%: Orange-to-yellow gradient (making progress)
- 50-74%: Yellow-to-blue gradient (halfway)
- 75-99%: Blue-to-green gradient (almost done)
- 100%: Solid green (complete)

**Uncounted Items Highlighting**:
- Orange background with subtle pulse animation
- Left border indicator
- Sortable to bring to top

**Variance Color Coding**:
- Large negative (< -100): Red with down arrow
- Small negative: Orange with down arrow
- Zero: Gray with minus icon
- Small positive: Light green with up arrow
- Large positive (> +100): Green with up arrow

**Rationale**:
- Gradient provides more nuance than solid colors
- Animation draws attention to actionable items
- Variance magnitude differentiation helps prioritize
- Progress bar is universally understood

**Alternatives considered**:
- **Solid color steps**: Less visually engaging, abrupt transitions
- **Percentage text only**: Requires reading, less instant comprehension
- **Circular progress**: Takes more space, less familiar in tables

### Decision 5: Locked Year Visual Treatment
**Choice**: Multi-indicator approach (badge + icon + row styling)

**Indicators**:
1. Orange "LOCKED" badge with lock icon
2. Pulse animation to draw attention
3. Disabled edit/delete buttons with tooltip
4. Optional: Subtle background tint for entire row

**Rationale**:
- Multiple indicators ensure users notice the constraint
- Orange (warning) is appropriate (not error, but caution)
- Animation helps first-time discovery
- Disabled buttons prevent action attempts
- Tooltip provides explanation

**Alternatives considered**:
- **Red badge**: Too alarming (not an error, just a business rule)
- **Gray out entire row**: Makes data hard to read
- **Hide edit buttons**: Less clear why actions unavailable

### Decision 6: Batch Purchase Grouping
**Choice**: Subtle background tinting with 3-color rotation

**Implementation**:
```css
.batch-0 { background: var(--blue-50); }   /* Lightest blue tint */
.batch-1 { background: var(--purple-50); } /* Lightest purple tint */
.batch-2 { background: var(--teal-50); }   /* Lightest teal tint */
```

**Rationale**:
- Subtle backgrounds don't interfere with other status colors
- 3-color rotation is sufficient (rare to have 3+ batches on one screen)
- Batch ID modulo operator (`batchId % 3`) ensures consistent coloring
- Background tint is less intrusive than borders

**Alternatives considered**:
- **Borders only**: Less visible, harder to scan
- **More than 3 colors**: Unnecessary complexity
- **Solid colors**: Too prominent, conflicts with status indicators

### Decision 7: Form Validation Visual Feedback
**Choice**: Real-time validation with field-level state indicators

**Visual States**:
- **Untouched**: Default styling, no indicators
- **Valid**: Green border (optional), green checkmark icon
- **Invalid**: Red border, red error icon, error message below
- **Warning**: Orange border, warning icon, warning message

**Timing**:
- Validate on blur (after user leaves field)
- Show success on valid input
- Persist errors until fixed
- Clear errors on correction

**Rationale**:
- Immediate feedback helps users correct errors quickly
- Success confirmation builds confidence
- Error messages are contextual (next to field)
- Color + icon + text ensures multi-sensory feedback

**Alternatives considered**:
- **Validate on submit only**: Delayed feedback, frustrating
- **Validate on every keystroke**: Too aggressive, interrupts typing
- **No success indicators**: Missed opportunity for positive reinforcement

### Decision 8: Loading and Skeleton States
**Choice**: Skeleton screens with shimmer animation

**Implementation**:
- Show skeleton UI matching final layout
- Shimmer animation (left-to-right gradient)
- Replace with actual data when loaded
- Respect `prefers-reduced-motion` for accessibility

**Rationale**:
- Perceived performance improvement (looks faster)
- Maintains layout stability (no content jump)
- Shimmer indicates activity (not frozen)
- Industry standard pattern (Facebook, LinkedIn)

**Alternatives considered**:
- **Spinner only**: Doesn't indicate layout, feels slower
- **Blank space**: Looks broken, no feedback
- **Static gray boxes**: Doesn't indicate loading is happening

## Risks / Trade-offs

### Risk: Color Overload
**Impact**: Too many colors create visual chaos and confusion
**Mitigation**: 
- Limit to 5 semantic colors (success, warning, danger, info, secondary)
- Use neutral backgrounds (white/gray) as default
- Apply color sparingly (only to status-critical elements)
- Create design guidelines document with clear usage rules

### Risk: Accessibility Violations
**Impact**: Color-blind users or screen reader users cannot use system
**Mitigation**:
- Always pair color with icon or text label
- Validate all combinations meet WCAG 2.1 AA (4.5:1 contrast)
- Test with color blindness simulators (Chrome DevTools)
- Use `aria-label` for icon-only indicators
- Provide alternative views (e.g., list uncounted items separately)

### Risk: Animation Performance
**Impact**: Pulse/shimmer animations cause jank or battery drain
**Mitigation**:
- Use CSS animations (GPU-accelerated) not JavaScript
- Limit animations to critical indicators only
- Respect `prefers-reduced-motion` media query
- Test on low-end devices and mobile
- Use `will-change` CSS property sparingly

### Risk: Visual Inconsistency
**Impact**: Different developers apply colors differently
**Mitigation**:
- Document color usage rules in design system
- Create reusable CSS utility classes (`.status-success`, `.row-warning`)
- Code review checklist includes visual consistency
- Provide component examples/storybook

### Trade-off: Customization vs. Consistency
**Decision**: Prioritize consistency over user customization
**Reasoning**: Small team, B2B application, enterprise users prefer predictability
**Impact**: No user-configurable themes or colors in v1

### Trade-off: Animation vs. Battery Life
**Decision**: Use animations sparingly, only for critical states
**Reasoning**: Uncounted items and locked years are high-priority indicators
**Impact**: Only 2-3 animation types across entire app

## Component-Specific Designs

### Multi-Item Purchase Dialog

#### Invoice Total Mismatch Indicator
```vue
<div class="summary-section">
  <div class="summary-row total-row" :class="{ 'total-mismatch': invoiceTotalMismatch }">
    <span>Total (incl. VAT):</span>
    <strong>{{ formatCurrency(calculatedTotal) }}</strong>
  </div>
  
  <Message v-if="invoiceTotalMismatch" severity="warn" :closable="false" class="mismatch-warning">
    <div class="mismatch-details">
      <i class="pi pi-exclamation-triangle"></i>
      <div>
        <strong>Invoice Total Mismatch</strong>
        <p>
          Entered: {{ formatCurrency(formData.invoiceTotal) }} |
          Calculated: {{ formatCurrency(calculatedTotal) }} |
          Difference: {{ formatCurrency(Math.abs(invoiceTotalMismatch)) }}
        </p>
      </div>
    </div>
  </Message>
</div>
```

```css
.total-mismatch {
  background: var(--orange-50);
  border: 2px solid var(--orange-500);
  animation: highlight-pulse 0.5s ease;
}

.mismatch-warning {
  margin-top: 1rem;
  border-left: 4px solid var(--orange-500);
}

@keyframes highlight-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(251, 146, 60, 0); }
  50% { box-shadow: 0 0 0 8px rgba(251, 146, 60, 0.3); }
}
```

#### Line Item Row Status
```vue
<DataTable :value="formData.items" :rowClass="getLineItemRowClass">
  <!-- Column definitions -->
</DataTable>

<script>
const getLineItemRowClass = (data: LineItem): string => {
  const hasProduct = !!data.productId;
  const hasQuantity = data.quantity && data.quantity > 0;
  const hasCost = data.unitCost !== null || data.totalCost !== null;
  
  if (hasProduct && hasQuantity && hasCost) {
    return 'line-item-complete';
  }
  
  if (hasProduct || hasQuantity || hasCost) {
    return 'line-item-partial';
  }
  
  return 'line-item-empty';
};
</script>
```

```css
.line-item-complete {
  border-left: 4px solid var(--green-500);
  background: linear-gradient(90deg, var(--green-50) 0%, transparent 5%);
}

.line-item-complete td:first-child::before {
  content: '✓';
  color: var(--green-600);
  margin-right: 0.5rem;
  font-weight: bold;
}

.line-item-partial {
  border-left: 4px solid var(--yellow-500);
  background: linear-gradient(90deg, var(--yellow-50) 0%, transparent 5%);
}

.line-item-empty {
  opacity: 0.6;
}
```

### Inventory View

#### Quantity Status Badge Component
```vue
<template>
  <Tag 
    :value="displayValue"
    :severity="severity"
    :icon="icon"
    class="quantity-badge"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  quantity: number;
  unit: string;
}>();

const displayValue = computed(() => `${props.quantity} ${props.unit}`);

const severity = computed(() => {
  if (props.quantity === 0) return 'danger';
  if (props.quantity < 10) return 'warning';
  return 'success';
});

const icon = computed(() => {
  if (props.quantity === 0) return 'pi pi-times-circle';
  if (props.quantity < 10) return 'pi pi-exclamation-triangle';
  return 'pi pi-check-circle';
});
</script>
```

#### High-Value Item Row Styling
```css
.high-value-item {
  position: relative;
  background: linear-gradient(90deg, var(--yellow-50) 0%, var(--yellow-25) 50%, transparent 100%);
  border-left: 3px solid var(--yellow-600);
}

.high-value-item::before {
  content: '💰';
  position: absolute;
  left: 0.5rem;
  opacity: 0.3;
  font-size: 1.5rem;
}

.high-value-item:hover {
  background: linear-gradient(90deg, var(--yellow-100) 0%, var(--yellow-50) 50%, transparent 100%);
}
```

### Year-End Count View

#### Progress Bar with Gradient
```vue
<div class="count-progress">
  <div class="progress-header">
    <span>Progress: {{ countedItems }} / {{ totalItems }} items</span>
    <strong>{{ progress }}%</strong>
  </div>
  <ProgressBar 
    :value="progress" 
    :class="`progress-${getProgressStage(progress)}`"
    :showValue="false"
  />
</div>

<script>
const getProgressStage = (value: number): string => {
  if (value === 100) return 'complete';
  if (value >= 75) return 'almost';
  if (value >= 50) return 'halfway';
  if (value >= 25) return 'started';
  return 'beginning';
};
</script>
```

```css
.progress-complete .p-progressbar-value {
  background: var(--green-500);
}

.progress-almost .p-progressbar-value {
  background: linear-gradient(90deg, var(--blue-500), var(--green-500));
}

.progress-halfway .p-progressbar-value {
  background: linear-gradient(90deg, var(--yellow-500), var(--blue-500));
}

.progress-started .p-progressbar-value {
  background: linear-gradient(90deg, var(--orange-500), var(--yellow-500));
}

.progress-beginning .p-progressbar-value {
  background: linear-gradient(90deg, var(--red-500), var(--orange-500));
}
```

#### Uncounted Item Row
```css
.uncounted-item {
  background: var(--orange-50);
  border-left: 4px solid var(--orange-500);
  animation: uncounted-pulse 2s ease-in-out infinite;
}

.uncounted-item td:first-child::before {
  content: '⏱';
  margin-right: 0.5rem;
  font-size: 1.1rem;
}

@keyframes uncounted-pulse {
  0%, 100% { 
    background: var(--orange-50);
    border-left-color: var(--orange-500);
  }
  50% { 
    background: var(--orange-100);
    border-left-color: var(--orange-600);
  }
}

@media (prefers-reduced-motion: reduce) {
  .uncounted-item {
    animation: none;
  }
}
```

## Implementation Checklist

### Phase 1: Design System Foundation
- [ ] Document color semantic mapping
- [ ] Create CSS custom properties for all status colors
- [ ] Define reusable utility classes (`.status-*`, `.highlight-*`)
- [ ] Establish icon usage guidelines
- [ ] Create accessibility testing checklist

### Phase 2: Multi-Item Purchase Dialog
- [ ] Implement invoice total mismatch visual indicator
- [ ] Add line item row status colors
- [ ] Create validation state indicators
- [ ] Add shipping allocation highlighting
- [ ] Test with various mismatch scenarios

### Phase 3: Inventory View
- [ ] Implement quantity status badges with icons
- [ ] Add high-value item highlighting
- [ ] Create hover effects for table rows
- [ ] Test with zero, low, and normal quantities
- [ ] Validate accessibility of color combinations

### Phase 4: Purchases View
- [ ] Add locked year badge and animations
- [ ] Implement batch grouping background colors
- [ ] Highlight verification numbers
- [ ] Add remaining quantity visual feedback
- [ ] Test with mixed locked/unlocked years

### Phase 5: Year-End Count View
- [ ] Create gradient progress bar component
- [ ] Implement uncounted item highlighting
- [ ] Add variance color coding with icons
- [ ] Create completion status badges
- [ ] Test full counting workflow

### Phase 6: Form Validation
- [ ] Add field-level validation styling
- [ ] Implement success/error icons
- [ ] Create validation message components
- [ ] Add focus states and transitions
- [ ] Test with keyboard navigation

### Phase 7: Loading States
- [ ] Create skeleton screen components
- [ ] Add shimmer animation
- [ ] Implement reduced motion support
- [ ] Test perceived performance improvements

### Phase 8: Accessibility & Testing
- [ ] Run WCAG contrast checker on all combinations
- [ ] Test with color blindness simulators
- [ ] Validate screen reader compatibility
- [ ] Test keyboard navigation
- [ ] Measure performance impact

### Phase 9: Documentation
- [ ] Write design system documentation
- [ ] Create component usage examples
- [ ] Document accessibility guidelines
- [ ] Update developer onboarding guide

## Open Questions

1. **Q**: Should we add configurable thresholds for low inventory?
   **A**: Defer to v2. Use hardcoded threshold (10 units) for v1 simplicity.

2. **Q**: What about users who dislike animations?
   **A**: Respect `prefers-reduced-motion`, provide non-animated fallback.

3. **Q**: Should we implement a legend explaining color codes?
   **A**: Yes, add tooltips on first occurrence per view. Consider adding "Help" modal with color legend.

4. **Q**: How to handle color contrast in dark mode (future)?
   **A**: Dark mode is out of scope for v1. When implemented, PrimeVue's dark theme will provide adjusted colors.

5. **Q**: Should we track which visual indicators users find most helpful?
   **A**: Out of scope for v1. Consider analytics in v2 if needed.

## References

- [WCAG 2.1 Color Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [PrimeVue Design Tokens](https://primevue.org/theming/)
- [Chrome DevTools Color Vision Deficiency Simulation](https://developer.chrome.com/docs/devtools/accessibility/reference/#vision-deficiencies)
- [CSS Animations Best Practices](https://web.dev/animations-guide/)

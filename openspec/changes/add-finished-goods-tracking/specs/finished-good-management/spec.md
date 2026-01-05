# Finished Good Management

## ADDED Requirements

### Requirement: Create Finished Good Types
The system SHALL allow users to create finished good types with a name, optional description, unit of measure, and material cost.

#### Scenario: Create new finished good with valid data
**Given** the user is authenticated  
**And** a unit "pieces" exists in the system  
**When** the user creates a finished good with:
- name: "Widget A"
- description: "Standard widget"
- unitId: 1 (pieces)
- materialCost: 150.50  

**Then** the finished good is created successfully  
**And** the finished good has a unique ID  
**And** the finished good is marked as active by default  
**And** the creation timestamp is recorded

#### Scenario: Prevent duplicate finished good names
**Given** a finished good named "Widget A" already exists  
**When** the user attempts to create another finished good with name "Widget A"  
**Then** the system returns an error "Finished good name must be unique"  
**And** no finished good is created

#### Scenario: Validate material cost is non-negative
**Given** the user is creating a finished good  
**When** the material cost is set to -10.00  
**Then** the system returns an error "Material cost must be zero or greater"  
**And** no finished good is created

---

### Requirement: List Finished Goods
The system SHALL allow users to retrieve a list of all finished goods with filtering options.

#### Scenario: List all active finished goods
**Given** the system has 5 active finished goods and 2 inactive finished goods  
**When** the user requests all finished goods with filter `isActive=true`  
**Then** the system returns 5 finished goods  
**And** each finished good includes: id, name, description, unit, materialCost, isActive, createdAt

#### Scenario: List all finished goods including inactive
**Given** the system has 5 active finished goods and 2 inactive finished goods  
**When** the user requests all finished goods without filters  
**Then** the system returns 7 finished goods

---

### Requirement: Update Finished Good
The system SHALL allow users to update finished good details including material cost.

#### Scenario: Update finished good material cost
**Given** a finished good "Widget A" with material cost 150.50  
**When** the user updates the material cost to 175.00  
**Then** the finished good material cost is updated to 175.00  
**And** the update does not affect any historical year-end count data

#### Scenario: Update finished good name
**Given** a finished good "Widget A"  
**When** the user updates the name to "Widget A Pro"  
**Then** the finished good name is updated  
**And** the name remains unique in the system

#### Scenario: Deactivate finished good
**Given** an active finished good "Widget A"  
**When** the user sets isActive to false  
**Then** the finished good is marked as inactive  
**And** the finished good is hidden from active lists  
**And** the finished good can still be viewed by ID

---

### Requirement: Delete Finished Good
The system SHALL allow users to delete finished goods that are not referenced in any year-end count.

#### Scenario: Delete unused finished good
**Given** a finished good "Widget A" that has never been included in a year-end count  
**When** the user deletes the finished good  
**Then** the finished good is permanently removed from the system

#### Scenario: Prevent deletion of finished good used in counts
**Given** a finished good "Widget A" that is included in year 2024 year-end count  
**When** the user attempts to delete the finished good  
**Then** the system returns an error "Cannot delete finished good that is referenced in year-end counts"  
**And** the finished good is not deleted  
**And** the system suggests marking it as inactive instead

---

### Requirement: Retrieve Finished Good by ID
The system SHALL allow users to retrieve a specific finished good by its ID.

#### Scenario: Get existing finished good
**Given** a finished good with ID 1 exists  
**When** the user requests finished good ID 1  
**Then** the system returns the finished good details including:
- id: 1
- name: "Widget A"
- description: "Standard widget"
- unit: { id: 1, name: "pieces" }
- materialCost: 150.50
- isActive: true
- createdAt: timestamp

#### Scenario: Get non-existent finished good
**Given** no finished good with ID 999 exists  
**When** the user requests finished good ID 999  
**Then** the system returns a 404 error "Finished good not found"

---

### Requirement: Material Cost History Tracking
The system SHALL maintain material cost values at the time of year-end counts for accurate historical reporting.

#### Scenario: Material cost snapshot in year-end count
**Given** a finished good "Widget A" with material cost 150.00  
**And** a year-end count for 2024 is initiated  
**When** the count is created  
**Then** the finished goods count item stores materialCostPerUnit as 150.00  
**And** subsequent changes to the finished good's material cost do not affect the 2024 count

#### Scenario: Material cost change between years
**Given** year 2024 count has "Widget A" with materialCostPerUnit 150.00  
**And** the user updates "Widget A" material cost to 175.00 after 2024 is confirmed  
**When** year 2025 count is initiated  
**Then** the 2025 count uses materialCostPerUnit 175.00  
**And** the 2024 count still shows materialCostPerUnit 150.00

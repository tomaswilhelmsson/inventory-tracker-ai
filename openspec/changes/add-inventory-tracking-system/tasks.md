# Implementation Tasks

## 1. Project Setup
- [ ] 1.1 Initialize Node.js project with package.json
- [ ] 1.2 Create project directory structure (/backend, /frontend)
- [ ] 1.3 Configure TypeScript for backend and frontend
- [ ] 1.4 Set up ESLint and Prettier
- [ ] 1.5 Create .env.example file with required environment variables
- [ ] 1.6 Initialize Git repository and create .gitignore

## 2. Database Setup
- [ ] 2.1 Install Prisma and initialize with SQLite provider
- [ ] 2.2 Define Prisma schema for all entities (Supplier, Product, PurchaseLot, YearEndCount, YearEndCountItem, LockedYear)
- [ ] 2.3 **CRITICAL: Add index on PurchaseLot (productId, purchaseDate, remainingQuantity) - MANDATORY for FIFO integrity**
- [ ] 2.4 Create initial migration
- [ ] 2.5 Create seed script with sample data for testing (include multi-year lots with different dates)
- [ ] 2.6 Test schema with both SQLite and MariaDB providers
- [ ] 2.7 Document database migration path from SQLite to MariaDB

## 3. Backend - Core Setup
- [ ] 3.1 Install Express and core dependencies
- [ ] 3.2 Set up Express server with middleware (cors, body-parser, error handling)
- [ ] 3.3 Create database connection utility using Prisma Client
- [ ] 3.4 Implement simple authentication middleware (bcrypt for password hashing)
- [ ] 3.5 Create environment configuration loader
- [ ] 3.6 Set up request validation using express-validator or Joi

## 4. Backend - Supplier Management API
- [ ] 4.1 Create supplier routes (POST /api/suppliers, GET /api/suppliers, GET /api/suppliers/:id, PUT /api/suppliers/:id, DELETE /api/suppliers/:id)
- [ ] 4.2 Implement supplier service layer with business logic
- [ ] 4.3 Add validation for supplier creation and updates
- [ ] 4.4 Implement duplicate name checking
- [ ] 4.5 Add cascade delete protection (check for associated products/purchases)
- [ ] 4.6 Write unit tests for supplier endpoints

## 5. Backend - Product Catalog API
- [ ] 5.1 Create product routes (POST /api/products, GET /api/products, GET /api/products/:id, PUT /api/products/:id, DELETE /api/products/:id)
- [ ] 5.2 Implement product service layer with supplier relationship
- [ ] 5.3 Add validation for product creation and updates
- [ ] 5.4 Implement product search and filtering by supplier
- [ ] 5.5 Add cascade delete protection (check for purchase history)
- [ ] 5.6 Write unit tests for product endpoints

## 6. Backend - Purchase Tracking API
- [ ] 6.1 Create purchase routes (POST /api/purchases, GET /api/purchases, GET /api/purchases/:id, PUT /api/purchases/:id, DELETE /api/purchases/:id)
- [ ] 6.2 Implement purchase service layer with lot creation
- [ ] 6.3 Add validation for purchase data (quantity > 0, unitCost > 0, valid date)
- [ ] 6.4 Implement automatic year extraction from purchase date
- [ ] 6.5 Add locked year checking before create/update/delete operations
- [ ] 6.6 Implement purchase filtering (by product, supplier, year, remaining inventory)
- [ ] 6.7 Write unit tests for purchase endpoints

## 7. Backend - FIFO Inventory Valuation
- [ ] 7.1 Create inventory service for FIFO calculations
- [ ] 7.2 Implement getCurrentInventoryValue(productId) function **CRITICAL: MUST use ORDER BY purchaseDate ASC**
- [ ] 7.3 Implement getCurrentInventoryQuantity(productId) function **CRITICAL: MUST use ORDER BY purchaseDate ASC**
- [ ] 7.4 Implement getLotsByFIFOOrder(productId) function **CRITICAL: Returns lots ordered by purchaseDate ASC (oldest first)**
- [ ] 7.5 Implement consumeInventoryFIFO(productId, countedQuantity) function **CRITICAL: MUST consume oldest lots first using ORDER BY purchaseDate ASC**
- [ ] 7.6 Create API endpoint GET /api/inventory/value (total and by product/supplier)
- [ ] 7.7 Write comprehensive unit tests for FIFO logic with multi-year scenarios **CRITICAL: Verify ordering is always purchaseDate ASC**

## 8. Backend - Year-End Count Process
- [ ] 8.1 Create year-end count routes (POST /api/year-end-count, GET /api/year-end-count/:year, PUT /api/year-end-count/:id/items, POST /api/year-end-count/:id/confirm)
- [ ] 8.2 Implement initiateYearEndCount(year) service function
- [ ] 8.3 Implement getCountSheet(countId) service function returning products sorted alphabetically with expected quantities
- [ ] 8.4 Implement updateCountItem(productId, countedQuantity) service function with auto-save
- [ ] 8.5 Implement calculateVariances() service function
- [ ] 8.6 Implement exportCountSheetPDF(countId) service function for printable count sheets
- [ ] 8.7 Implement exportCountSheetCSV(countId) service function with empty Actual Count column
- [ ] 8.8 Implement importCountDataCSV(countId, file) service function with validation
- [ ] 8.9 Implement generateYearEndReport(countId) service function
- [ ] 8.10 Implement confirmYearEndCount(countId) service function with lot updates
- [ ] 8.11 Implement lockYear(year) function to prevent future edits
- [ ] 8.12 Write unit tests for year-end count workflow including CSV import/export

## 9. Backend - Reporting API
- [ ] 9.1 Create report routes (GET /api/reports/purchase-history, GET /api/reports/year-end/:year, GET /api/reports/inventory-summary)
- [ ] 9.2 Implement purchaseHistoryReport(year, filters) service function
- [ ] 9.3 Implement yearEndInventoryReport(year) service function
- [ ] 9.4 Implement inventoryValueSummary(groupBy) service function
- [ ] 9.5 Add CSV export functionality
- [ ] 9.6 Add PDF export functionality using library (e.g., pdfkit)
- [ ] 9.7 Write unit tests for report generation

## 10. Backend - Database Backup
- [ ] 10.1 Install Google Cloud Storage SDK (@google-cloud/storage)
- [ ] 10.2 Create backup service with GCS configuration
- [ ] 10.3 Implement createBackupFile(year, timestamp) for SQLite (file copy)
- [ ] 10.4 Implement createBackupFile(year, timestamp) for MariaDB (mysqldump)
- [ ] 10.5 Implement uploadToGCS(filePath, year) with retry logic
- [ ] 10.6 Implement calculateChecksum(filePath) for integrity verification
- [ ] 10.7 Integrate backup into confirmYearEndCount() workflow
- [ ] 10.8 Create backup management endpoint (GET /api/backups)
- [ ] 10.9 Write unit tests for backup and upload logic
- [ ] 10.10 Test GCS integration with test bucket

## 11. Frontend - Project Setup
- [ ] 11.1 Initialize Vue 3 project with Vite
- [ ] 11.2 Install Vue Router and Pinia for state management
- [ ] 11.3 Install UI framework (e.g., Vuetify, PrimeVue, or Element Plus)
- [ ] 11.4 Set up API client service using Axios
- [ ] 11.5 Configure environment variables for API base URL
- [ ] 11.6 Create global error handling and notification system

## 12. Frontend - Authentication
- [ ] 12.1 Create login page component
- [ ] 12.2 Implement authentication store with Pinia
- [ ] 12.3 Set up route guards for protected pages
- [ ] 12.4 Implement token storage and refresh logic
- [ ] 12.5 Create logout functionality

## 13. Frontend - Supplier Management UI
- [ ] 13.1 Create supplier list view with search and filter
- [ ] 13.2 Create supplier create/edit form component
- [ ] 13.3 Implement supplier delete with confirmation dialog
- [ ] 13.4 Create supplier detail view showing products and statistics
- [ ] 13.5 Add form validation
- [ ] 13.6 Integrate with backend API

## 14. Frontend - Product Catalog UI
- [ ] 14.1 Create product list view with search and supplier filter
- [ ] 14.2 Create product create/edit form component with supplier dropdown
- [ ] 14.3 Implement product delete with confirmation dialog
- [ ] 14.4 Create product detail view showing inventory and purchase history
- [ ] 14.5 Add form validation
- [ ] 14.6 Integrate with backend API

## 15. Frontend - Purchase Tracking UI
- [ ] 15.1 Create purchase list view with filters (product, supplier, year, remaining inventory)
- [ ] 15.2 Create purchase create/edit form component with product and supplier dropdowns
- [ ] 15.3 Implement date picker for purchase date
- [ ] 15.4 Display remaining quantity and lot value in list view
- [ ] 15.5 Add validation for quantity and unit cost
- [ ] 15.6 Show "locked year" warning when applicable
- [ ] 15.7 Integrate with backend API

## 16. Frontend - Inventory Dashboard
- [ ] 16.1 Create dashboard view showing current inventory summary
- [ ] 16.2 Display total inventory value
- [ ] 16.3 Show inventory by product with quantities and values
- [ ] 16.4 Display inventory by supplier
- [ ] 16.5 Create charts/visualizations for inventory distribution
- [ ] 16.6 Integrate with inventory valuation API

## 17. Frontend - Year-End Count UI
- [ ] 17.1 Create year-end count initiation page
- [ ] 17.2 Create count sheet table with columns: Product Name, Expected Quantity, Actual Count (input), Variance
- [ ] 17.3 Sort products alphabetically by name for easy physical lookup
- [ ] 17.4 Implement real-time variance calculation as user enters actual counts
- [ ] 17.5 Add visual indicators: green for positive variance (+), red for negative (-), exact match indicator
- [ ] 17.6 Highlight uncounted products (empty actual count field) with distinct styling
- [ ] 17.7 Implement auto-save draft functionality so counting can be paused and resumed
- [ ] 17.8 Add "Export to PDF" button for printable count sheet with empty Actual Count column
- [ ] 17.9 Add "Export to CSV" button for offline counting in spreadsheet
- [ ] 17.10 Add "Import from CSV" button to upload completed count data
- [ ] 17.11 Validate CSV import and display clear error messages for invalid data
- [ ] 17.12 Make count sheet mobile-responsive for tablet use in warehouse
- [ ] 17.13 Add keyboard navigation (Tab/Enter) for quick data entry
- [ ] 17.14 Display count progress indicator (e.g., "15 of 50 products counted")
- [ ] 17.15 Implement count report preview with FIFO value breakdown
- [ ] 17.16 Create confirmation dialog with summary showing total variance and value
- [ ] 17.17 Display success message with backup information after confirmation
- [ ] 17.18 Show locked year indicator
- [ ] 17.19 Integrate with year-end count API

## 18. Frontend - Reporting UI
- [ ] 18.1 Create reports navigation menu
- [ ] 18.2 Create purchase history report view with filters
- [ ] 18.3 Create year-end inventory report view
- [ ] 18.4 Create inventory summary report view
- [ ] 18.5 Implement CSV export button
- [ ] 18.6 Implement PDF export button
- [ ] 18.7 Add print-friendly report layouts
- [ ] 18.8 Integrate with reporting API

## 19. Testing and Quality Assurance
- [ ] 19.1 Write integration tests for critical API workflows
- [ ] 19.2 Write end-to-end tests for year-end count process
- [ ] 19.3 Test FIFO calculation with complex multi-year scenarios
- [ ] 19.4 Test database migration from SQLite to MariaDB with real data
- [ ] 19.5 Test backup and restore process
- [ ] 19.6 Perform security audit (authentication, SQL injection, XSS)
- [ ] 19.7 Test on different browsers and screen sizes
- [ ] 19.8 Load testing with large datasets (1000+ products, 10000+ purchases)

## 20. Documentation and Deployment
- [ ] 20.1 Write README.md with setup instructions
- [ ] 20.2 Document API endpoints (OpenAPI/Swagger)
- [ ] 20.3 Create user guide for year-end count process
- [ ] 20.4 Document SQLite to MariaDB migration procedure
- [ ] 20.5 Document GCS backup configuration
- [ ] 20.6 Create Docker configuration for backend
- [ ] 20.7 Create Docker configuration for frontend
- [ ] 20.8 Create docker-compose.yml for full stack
- [ ] 20.9 Write deployment guide for production
- [ ] 20.10 Set up CI/CD pipeline (optional)

## Dependencies and Sequencing

**Parallel Work**:
- Tasks 1-3 must be completed first
- Tasks 4-10 (backend) can be developed in parallel with tasks 11-18 (frontend)
- Task 19 (testing) runs alongside development
- Task 20 (documentation) can start once features are stable

**Critical Path**:
1. Project Setup (1-3)
2. Core Backend (4-6)
3. FIFO Logic (7)
4. Year-End Count (8)
5. Backup Integration (10)
6. Frontend Implementation (11-18)
7. Testing (19)
8. Deployment (20)

**Validation Points**:
- After Task 7: Verify FIFO calculations with test scenarios
- After Task 8: Complete end-to-end year-end count test
- After Task 10: Verify GCS backup works
- After Task 18: User acceptance testing
- After Task 19: Security and performance review

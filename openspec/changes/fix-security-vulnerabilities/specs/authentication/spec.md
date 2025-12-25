# Authentication Security Enhancements

## ADDED Requirements

### Requirement: JWT Secret Enforcement in Production
The system SHALL require JWT_SECRET environment variable to be explicitly set in production environments.

#### Scenario: Production startup without JWT_SECRET
- **WHEN** the application starts in production mode (NODE_ENV=production)
- **AND** JWT_SECRET environment variable is not set
- **THEN** the application SHALL throw an error with message "JWT_SECRET environment variable is required in production"
- **AND** the application SHALL terminate startup

#### Scenario: Development startup without JWT_SECRET
- **WHEN** the application starts in development mode (NODE_ENV=development)
- **AND** JWT_SECRET environment variable is not set
- **THEN** the application SHALL use fallback secret "dev-secret-key-not-for-production"
- **AND** the application SHALL start successfully

#### Scenario: Production startup with JWT_SECRET
- **WHEN** the application starts in production mode
- **AND** JWT_SECRET environment variable is set to a valid value
- **THEN** the application SHALL use the provided JWT_SECRET
- **AND** the application SHALL start successfully

### Requirement: Constant-Time Password Comparison
The system SHALL prevent timing attacks during authentication by using constant-time password comparison for all authentication attempts.

#### Scenario: Valid user with correct password
- **WHEN** a login request is made with valid username and correct password
- **THEN** the system SHALL perform bcrypt comparison using the user's password hash
- **AND** return authentication success with JWT token

#### Scenario: Valid user with incorrect password
- **WHEN** a login request is made with valid username but incorrect password
- **THEN** the system SHALL perform bcrypt comparison using the user's password hash
- **AND** return "Invalid credentials" error
- **AND** the timing SHALL be comparable to successful authentication

#### Scenario: Non-existent user
- **WHEN** a login request is made with non-existent username
- **THEN** the system SHALL perform bcrypt comparison using a dummy hash "$2b$10$invalidhashtopreventtimingattack"
- **AND** return "Invalid credentials" error
- **AND** the timing SHALL be comparable to valid user authentication

### Requirement: CORS Origin Validation
The system SHALL validate request origins against an allowlist of permitted origins for CORS requests.

#### Scenario: Request from allowed origin
- **WHEN** a cross-origin request is received from an allowed origin
- **THEN** the system SHALL accept the request
- **AND** include appropriate CORS headers in the response

#### Scenario: Request from disallowed origin
- **WHEN** a cross-origin request is received from an origin not in the allowlist
- **THEN** the system SHALL reject the request
- **AND** return "Not allowed by CORS" error

#### Scenario: Request without origin header
- **WHEN** a request is received without an origin header (same-origin request)
- **THEN** the system SHALL accept the request

### Requirement: Rate Limiting on Authentication Endpoints
The system SHALL implement rate limiting on authentication endpoints to prevent brute force attacks.

#### Scenario: Login attempts within limit
- **WHEN** a client makes 5 or fewer login attempts within 15 minutes
- **THEN** all requests SHALL be processed normally

#### Scenario: Login attempts exceeding limit
- **WHEN** a client makes more than 5 login attempts within 15 minutes
- **THEN** subsequent requests SHALL be rejected with status code 429 (Too Many Requests)
- **AND** return message "Too many requests from this IP, please try again later"
- **AND** the limit SHALL reset after 15 minutes

#### Scenario: Successful login resets counter
- **WHEN** a login attempt is successful
- **THEN** the rate limit counter for that IP SHALL be reset
- **AND** subsequent attempts SHALL not count toward the limit

### Requirement: General API Rate Limiting
The system SHALL implement rate limiting on all API endpoints to prevent abuse and denial of service attacks.

#### Scenario: API requests within limit
- **WHEN** a client makes 100 or fewer API requests within 15 minutes
- **THEN** all requests SHALL be processed normally

#### Scenario: API requests exceeding limit
- **WHEN** a client makes more than 100 API requests within 15 minutes
- **THEN** subsequent requests SHALL be rejected with status code 429
- **AND** return message "Too many requests from this IP, please try again later"
- **AND** the limit SHALL reset after 15 minutes

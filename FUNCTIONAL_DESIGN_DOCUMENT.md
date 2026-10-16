# Functional Design Document (FDD)
## Veterinary Clinic Management System

---

## Document Information

| **Field** | **Details** |
|-----------|-------------|
| **Document Title** | Functional Design Document - Veterinary Clinic Management System |
| **Version** | 1.0 |
| **Date** | October 16, 2026 |
| **Author** | [Your Name] |
| **Project Type** | Web-Based Application |
| **Technology Stack** | Laravel (PHP), Inertia.js, React/Vue.js, MySQL |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [User Roles and Access Control](#3-user-roles-and-access-control)
4. [Functional Requirements](#4-functional-requirements)
5. [Feature Specifications](#5-feature-specifications)
6. [Database Architecture](#6-database-architecture)
7. [System Integration](#7-system-integration)
8. [Security Features](#8-security-features)
9. [Appendices](#9-appendices)

---

## 1. Executive Summary

### 1.1 Purpose
This document describes the functional design and features of a comprehensive Veterinary Clinic Management System designed to streamline clinic operations, enhance client experience, and improve service delivery for a veterinary practice specializing in dog care.

### 1.2 Project Scope
The system provides a complete digital solution for managing:
- Client (dog owner) registrations and profiles
- Dog records and medical information
- Appointment scheduling and management
- Service catalog and pricing
- Payment processing
- Staff management and role-based access
- Client communications and notifications
- Complaint handling and resolution
- FAQ knowledge base with AI-powered chat
- Reporting and analytics

### 1.3 System Goals
1. **Operational Efficiency**: Automate appointment scheduling, payment processing, and client communications
2. **Client Experience**: Provide a user-friendly portal for booking services, managing dog profiles, and accessing help
3. **Staff Productivity**: Enable efficient management of daily operations, client records, and service delivery
4. **Data-Driven Decisions**: Generate reports and analytics for business insights
5. **Quality Assurance**: Implement feedback and rating systems to monitor service quality

---

## 2. System Overview

### 2.1 System Architecture
The system is built on a **three-tier architecture**:

- **Presentation Layer**: Inertia.js-based SPA (Single Page Application) with React/Vue.js components
- **Application Layer**: Laravel PHP framework with MVC pattern
- **Data Layer**: MySQL relational database

### 2.2 Key System Components

| **Component** | **Description** |
|---------------|-----------------|
| **Public Landing Page** | Marketing site showcasing clinic services and information |
| **Authentication System** | Dual authentication (password-based + Firebase Google Sign-In) |
| **Owner Portal** | Client-facing interface for booking, payments, and communications |
| **Admin Console** | Management interface for clinic-wide operations and settings |
| **Operations Dashboard** | Staff interface for managing daily appointments and workflows |
| **Notification Engine** | Automated reminder and communication system |
| **Payment Gateway** | Integrated payment processing system |
| **Reporting Module** | Business intelligence and analytics generation |

### 2.3 User Types

The system supports **two primary account types** with **five distinct roles**:

1. **Dog Owners** (Client accounts)
   - Role: Owner
   - Authentication: `dog_owners` table

2. **Staff Members** (Employee accounts)
   - Role: Administrator
   - Role: Veterinarian
   - Role: Groomer
   - Authentication: `staff` table

---

## 3. User Roles and Access Control

### 3.1 Role Definitions

#### 3.1.1 Dog Owner (Client)
**Access Level**: Owner Portal

**Capabilities**:
- Register and manage personal account
- Register and manage multiple dog profiles
- Browse service catalog with pricing
- Book appointments online
- View appointment history and status
- Make payments for services
- Cancel upcoming appointments
- Rate and review completed services
- Submit and track complaints
- Access FAQ and help resources
- Receive notifications about appointments
- Search for services and information

**Access Restrictions**:
- Cannot access admin or operations dashboards
- Cannot view other owners' information
- Cannot modify service pricing or availability

---

#### 3.1.2 Administrator
**Access Level**: Admin Console + Operations Dashboard

**Capabilities**:
- **Staff Management**:
  - Create, edit, and deactivate staff accounts
  - Assign staff roles (veterinarian, admin, groomer)
  - Reset staff passwords
  - View staff profiles and qualifications

- **Service Management**:
  - Create, edit, and activate/deactivate services
  - Set service pricing and duration
  - Manage service categories
  - Upload service images

- **Appointment Operations**:
  - Confirm pending appointments
  - Cancel appointments
  - Mark appointments as completed
  - Mark no-shows
  - View all appointments across staff

- **Client Management**:
  - View all dog owner profiles
  - Review client appointment history
  - Activate/deactivate client accounts
  - Create new client accounts

- **Complaint Management**:
  - View all submitted complaints
  - Assign complaints to staff
  - Respond to complaints via threaded messages
  - Update complaint status (Open, In Progress, Resolved, Closed)
  - Set complaint priority levels

- **FAQ Management**:
  - Create, edit, and delete FAQ entries
  - Publish/unpublish FAQs
  - Organize FAQs by category
  - Review client-submitted questions

- **Settings & Configuration**:
  - Update clinic information (name, address, hours)
  - Configure system settings
  - Manage notification preferences

- **Reporting & Analytics**:
  - Generate business reports
  - View dashboard statistics
  - Export report data
  - Analyze appointment trends

- **Financial Management**:
  - View all payments
  - Track payment status
  - Monitor revenue metrics

**Access Restrictions**:
- Cannot directly edit owner personal information (owners manage their own data)

---

#### 3.1.3 Veterinarian
**Access Level**: Operations Dashboard (Limited)

**Capabilities**:
- View assigned appointments
- Access patient (dog) medical information
- View owner contact information for assigned appointments
- Update appointment notes

**Access Restrictions**:
- Cannot access admin console
- Cannot manage staff or services
- Cannot access financial reports
- Cannot modify system settings

---

#### 3.1.4 Groomer
**Access Level**: Operations Dashboard (Limited)

**Capabilities**:
- View assigned grooming appointments
- Access dog information for grooming sessions
- View owner contact information for assigned appointments
- Update appointment notes

**Access Restrictions**:
- Cannot access admin console
- Cannot manage staff or services
- Cannot access financial reports
- Cannot modify system settings
- Cannot access medical service appointments

---

### 3.2 Authentication & Authorization

#### 3.2.1 Authentication Methods

**1. Traditional Password-Based Authentication**
- Email and password login
- Separate authentication guards for owners and staff
- Password hashing using Laravel's built-in hashing
- "Remember Me" functionality disabled (no token column in schema)

**2. Firebase Google Sign-In**
- OAuth 2.0 integration with Google
- Firebase ID token verification
- Automatic account matching to existing records
- Session bridging to Laravel authentication

#### 3.2.2 Authorization Mechanism
- **Middleware-Based**: `EnsureUserHasRole` middleware enforces role-based access
- **Route Protection**: All routes protected by `auth:owner,staff` middleware
- **Role-Specific Areas**: Additional `role:admin` or `role:owner` middleware
- **403 Response**: Users accessing unauthorized areas receive Forbidden error

#### 3.2.3 Password Management

**For Dog Owners**:
- Self-service password reset via email
- Password reset token expiration: 60 minutes
- Throttled reset requests: 60 seconds between attempts

**For Staff Members**:
- Admin-controlled password reset
- No self-service reset (matches clinic internal policy)
- Passwords hashed on assignment

---

## 4. Functional Requirements

### 4.1 Core Functional Requirements

| **FR ID** | **Requirement** | **Priority** | **User Role** |
|-----------|-----------------|--------------|---------------|
| FR-001 | User registration and authentication | Critical | All |
| FR-002 | Dog profile creation and management | Critical | Owner |
| FR-003 | Service browsing and search | High | Owner |
| FR-004 | Online appointment booking | Critical | Owner |
| FR-005 | Appointment status management | Critical | Admin, Staff |
| FR-006 | Online payment processing | Critical | Owner |
| FR-007 | Automated appointment reminders | High | System |
| FR-008 | Service rating and review system | Medium | Owner |
| FR-009 | Complaint submission and tracking | High | Owner, Admin |
| FR-010 | FAQ knowledge base | Medium | All |
| FR-011 | AI-powered FAQ chat | Medium | Owner |
| FR-012 | Staff management | Critical | Admin |
| FR-013 | Service catalog management | Critical | Admin |
| FR-014 | Client management | High | Admin |
| FR-015 | Business reporting and analytics | High | Admin |
| FR-016 | Notification system | High | System |
| FR-017 | Search functionality | Medium | Owner |
| FR-018 | Account management | High | All |
| FR-019 | Role-based access control | Critical | System |
| FR-020 | Clinic settings management | High | Admin |

---

## 5. Feature Specifications

### 5.1 User Registration & Authentication

#### 5.1.1 Dog Owner Registration
**Feature ID**: F-AUTH-001

**Description**: Allows new clients to create accounts through a self-service registration form.

**User Story**: As a new client, I want to register an account so that I can book appointments for my dog.

**Functional Flow**:
1. User navigates to registration page
2. User provides:
   - First name
   - Last name
   - Email address
   - Password
   - Phone number
   - Address
3. System validates:
   - Email uniqueness
   - Password strength
   - Required field completion
4. System creates account with hashed password
5. User automatically logged in after registration
6. User redirected to dashboard

**Validation Rules**:
- Email: Valid format, unique in system
- Password: Minimum 8 characters
- Phone: Valid format
- All fields required except address

**Database Tables**: `dog_owners`

---

#### 5.1.2 Staff Login
**Feature ID**: F-AUTH-002

**Description**: Staff members authenticate using admin-created credentials.

**User Story**: As a staff member, I want to log in with my credentials so that I can access my work dashboard.

**Functional Flow**:
1. User navigates to login page
2. User enters email and password
3. System authenticates against `staff` table
4. System checks `is_active` status
5. System establishes session with staff guard
6. User redirected based on role:
   - Admin → Admin Dashboard
   - Veterinarian/Groomer → Operations Dashboard

**Access Control**: Staff accounts cannot self-register; must be created by admin.

**Database Tables**: `staff`

---

#### 5.1.3 Firebase Google Sign-In
**Feature ID**: F-AUTH-003

**Description**: Alternative authentication using Google OAuth via Firebase.

**User Story**: As a user, I want to sign in with my Google account for faster access.

**Functional Flow**:
1. User clicks "Sign in with Google" button
2. Google OAuth popup appears
3. User authenticates with Google
4. Firebase generates ID token
5. Frontend sends token to backend endpoint
6. Backend verifies token with Firebase
7. System matches email to existing `dog_owners` or `staff` record
8. System creates Laravel session
9. User redirected to appropriate dashboard

**Security**: Rate limited to 10 requests per minute per IP.

**Database Tables**: `dog_owners`, `staff`

---

#### 5.1.4 Password Reset (Owners Only)
**Feature ID**: F-AUTH-004

**Description**: Self-service password recovery for dog owners.

**User Story**: As a dog owner, I want to reset my forgotten password via email.

**Functional Flow**:
1. User clicks "Forgot Password" link
2. User enters email address
3. System generates reset token
4. System sends reset email with link
5. User clicks link (valid for 60 minutes)
6. User enters new password
7. System updates password and clears token
8. User redirected to login page

**Throttling**: 60 seconds between reset requests.

**Database Tables**: `dog_owners`, `password_reset_tokens`

---

### 5.2 Dog Management

#### 5.2.1 Dog Profile Creation
**Feature ID**: F-DOG-001

**Description**: Owners can register their dogs with complete medical and identification information.

**User Story**: As a dog owner, I want to register my dog's information so that the clinic has accurate records for appointments.

**Functional Flow**:
1. Owner navigates to dog registration form
2. Owner provides:
   - Dog name
   - Breed (selected from predefined list)
   - Sex (Male/Female)
   - Birth date
   - Weight (in kg)
   - Color
   - Vaccination status
   - Photo (optional)
3. System validates data
4. System creates dog record linked to owner
5. Dog appears in owner's dog list

**Data Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| dog_name | String | Yes | |
| breed_id | Foreign Key | Yes | References `dog_breeds` table |
| sex | Enum | Yes | Male/Female |
| birth_date | Date | Yes | |
| weight_kg | Decimal(2) | Yes | |
| color | String | No | |
| is_vaccinated | Boolean | Yes | |
| photo_url | String | No | Image path |
| is_active | Boolean | Yes | Default: true |

**Business Rules**:
- One owner can register multiple dogs
- Breed must exist in system breed database
- Weight must be positive number
- Photo upload size limited to 5MB
- Supported photo formats: JPG, PNG, WEBP

**Database Tables**: `dogs`, `dog_breeds`, `dog_owners`

---

#### 5.2.2 Dog Profile Update
**Feature ID**: F-DOG-002

**Description**: Owners can update their dog's information as it changes.

**User Story**: As a dog owner, I want to update my dog's weight and vaccination status to keep records current.

**Functional Flow**:
1. Owner views dog profile
2. Owner clicks edit button
3. Owner modifies fields
4. System validates changes
5. System saves updates
6. Updated information displayed

**Editable Fields**: All fields except `owner_id` and creation timestamp.

**Database Tables**: `dogs`

---

#### 5.2.3 Dog Profile Deactivation
**Feature ID**: F-DOG-003

**Description**: Owners can deactivate dog profiles (e.g., if dog is deceased or rehomed).

**User Story**: As a dog owner, I want to deactivate my dog's profile while preserving historical records.

**Functional Flow**:
1. Owner views dog profile
2. Owner clicks deactivate option
3. System confirms action
4. System sets `is_active = false`
5. Dog no longer appears in active lists
6. Historical appointments remain viewable

**Business Rules**:
- Deactivation is soft delete (preserves data)
- Cannot book new appointments for deactivated dogs
- Past appointments and medical history remain accessible

**Database Tables**: `dogs`

---

### 5.3 Service Management

#### 5.3.1 Service Catalog Display (Owner View)
**Feature ID**: F-SRV-001

**Description**: Dog owners browse available services with pricing and descriptions.

**User Story**: As a dog owner, I want to view all available services with prices so that I can choose what my dog needs.

**Display Information**:
- Service name
- Category (Consultation, Vaccination, Surgery, Grooming, etc.)
- Description
- Duration (in minutes)
- Price
- Service image
- Average rating (from feedback)
- Number of reviews
- Available staff (veterinarians or groomers)

**Filtering Options**:
- By category
- By price range
- By rating
- Active services only

**Functional Flow**:
1. Owner navigates to Services page
2. System retrieves all active services
3. System displays services in card/grid layout
4. Owner can click service for detailed view
5. Detailed view shows:
   - Full description
   - All published reviews
   - Book appointment button
   - Availability calendar

**Business Rules**:
- Only `is_active = true` services displayed
- Services sorted by category, then name
- Ratings calculated from published feedback only

**Database Tables**: `services`, `service_categories`, `ratings_feedback`

---

#### 5.3.2 Service Management (Admin)
**Feature ID**: F-SRV-002

**Description**: Administrators create, edit, and manage the service catalog.

**User Story**: As an administrator, I want to manage our service offerings so that clients can book the services we provide.

**Management Actions**:

**Create Service**:
1. Admin navigates to Services → Create
2. Admin fills form:
   - Service name
   - Category
   - Description
   - Duration (minutes)
   - Price
   - Image upload
3. System validates data
4. System creates service (default: active)
5. Service appears in catalog

**Edit Service**:
1. Admin selects service from list
2. Admin modifies fields
3. System saves changes
4. Updated service reflected immediately

**Toggle Active Status**:
1. Admin clicks activate/deactivate button
2. System toggles `is_active` field
3. Service visibility updated in owner portal

**Delete Service** (Not Implemented):
- Services are deactivated, not deleted
- Preserves appointment history referencing services

**Data Validation**:
- Service name: Required, max 255 characters
- Category: Must exist in `service_categories`
- Duration: Positive integer, typically 15-180 minutes
- Price: Positive decimal, 2 decimal places
- Image: JPG/PNG/WEBP, max 5MB

**Business Rules**:
- Deactivated services cannot be booked
- Existing appointments using deactivated services remain valid
- Price changes do not affect past appointments
- Service image is optional but recommended

**Database Tables**: `services`, `service_categories`

---

#### 5.3.3 Service Availability Check
**Feature ID**: F-SRV-003

**Description**: System displays available appointment slots for a specific service.

**User Story**: As a dog owner, I want to see when a service is available so that I can book a convenient time.

**Functional Flow**:
1. Owner views service detail page
2. Owner clicks "Check Availability"
3. System retrieves availability data:
   - Staff members qualified for service
   - Staff work schedules (time slots)
   - Existing appointments
4. System calculates available slots
5. System returns JSON calendar data
6. Frontend displays calendar with:
   - Available dates highlighted
   - Time slots for each date
   - Staff member name for each slot

**Availability Logic**:
- Grooming services → Groomer staff
- All other services → Veterinarian staff
- Only active staff shown
- Only time slots not already booked
- Slots match service duration

**Database Tables**: `services`, `staff`, `time_slots`, `appointments`

---

### 5.4 Appointment Management

#### 5.4.1 Appointment Booking (Owner)
**Feature ID**: F-APPT-001

**Description**: Dog owners book appointments by selecting service, dog, date, and time.

**User Story**: As a dog owner, I want to book an appointment online so that I don't need to call the clinic.

**Functional Flow**:
1. Owner browses services
2. Owner selects desired service
3. Owner clicks "Book Appointment"
4. System displays booking modal:
   - Select dog (from owner's dogs)
   - Select date (from availability calendar)
   - Select time slot (from available times)
   - Add notes (optional)
5. Owner confirms booking
6. System validates:
   - Slot still available
   - Dog is active
   - Service is active
7. System creates appointment with status "Pending"
8. System creates notification record
9. System sends confirmation to owner
10. Appointment appears in owner's appointment list

**Data Captured**:
| Field | Description |
|-------|-------------|
| owner_id | Logged-in owner |
| dog_id | Selected dog |
| service_id | Selected service |
| staff_id | Assigned staff (from selected slot) |
| slot_id | Selected time slot |
| appointment_date | Appointment date |
| appointment_time | Appointment time |
| status_id | "Pending" status |
| notes | Owner's special requests/notes |

**Business Rules**:
- One slot can only be booked once
- Owner can only book for their own dogs
- Cannot book for deactivated dogs
- Cannot book past dates
- Appointments default to "Pending" status
- Payment not required at booking time

**Notification Triggers**:
- Confirmation email sent to owner
- Notification created in system
- Admin receives alert of new booking

**Database Tables**: `appointments`, `appointment_statuses`, `notifications`, `time_slots`

---

#### 5.4.2 Appointment Status Workflow
**Feature ID**: F-APPT-002

**Description**: Appointments progress through defined statuses managed by administrators.

**User Story**: As an administrator, I want to manage appointment statuses so that everyone knows the current state of each booking.

**Status Flow**:

```
Pending → Confirmed → Completed
         ↓           ↓
       Cancelled   No-Show
```

**Status Definitions**:

| Status | Description | Who Can Set | Next Valid States |
|--------|-------------|-------------|-------------------|
| **Pending** | Newly booked, awaiting confirmation | System (auto) | Confirmed, Cancelled |
| **Confirmed** | Clinic confirmed appointment | Admin | Completed, No-Show, Cancelled |
| **Completed** | Service delivered successfully | Admin | (Terminal state) |
| **Cancelled** | Appointment cancelled | Owner, Admin | (Terminal state) |
| **No-Show** | Client did not arrive | Admin | (Terminal state) |

**Admin Actions**:

**Confirm Appointment**:
- Endpoint: `PATCH /admin/operations/appointments/{id}/confirm`
- Changes status: Pending → Confirmed
- Sends confirmation notification to owner
- Makes appointment visible in daily schedule

**Complete Appointment**:
- Endpoint: `PATCH /admin/operations/appointments/{id}/complete`
- Changes status: Confirmed → Completed
- Enables payment if not already paid
- Enables rating/review submission
- Sends completion notification

**Mark No-Show**:
- Endpoint: `PATCH /admin/operations/appointments/{id}/no-show`
- Changes status: Confirmed → No-Show
- Releases time slot for rebooking
- May trigger policy enforcement (e.g., no-show fee)

**Cancel Appointment** (Admin):
- Endpoint: `PATCH /admin/operations/appointments/{id}/cancel`
- Changes status: Any → Cancelled
- Sends cancellation notification to owner
- Releases time slot

**Business Rules**:
- Only admins can confirm, complete, or mark no-show
- Owners can only cancel pending/confirmed appointments
- Cannot change status of completed appointments
- All status changes logged with timestamp

**Database Tables**: `appointments`, `appointment_statuses`, `notifications`

---

#### 5.4.3 Appointment Cancellation (Owner)
**Feature ID**: F-APPT-003

**Description**: Dog owners can cancel their upcoming appointments.

**User Story**: As a dog owner, I want to cancel an appointment if I can't make it.

**Functional Flow**:
1. Owner views appointment list
2. Owner clicks cancel on pending/confirmed appointment
3. System confirms cancellation request
4. System validates:
   - Appointment belongs to owner
   - Status is Pending or Confirmed
   - Appointment is in the future
5. System updates status to "Cancelled"
6. System releases time slot
7. System sends cancellation notification to admin
8. Owner sees updated status

**Cancellation Rules**:
- Can only cancel own appointments
- Can only cancel Pending or Confirmed status
- Cannot cancel Completed or No-Show appointments
- Cannot cancel past appointments
- No cancellation deadline enforced (configurable in future)

**Notification Triggers**:
- Email sent to owner confirming cancellation
- Admin notification of cancellation
- Staff notification if appointment was within 24 hours

**Database Tables**: `appointments`, `notifications`

---

#### 5.4.4 Appointment View (Owner)
**Feature ID**: F-APPT-004

**Description**: Dog owners view their appointment history and upcoming appointments.

**User Story**: As a dog owner, I want to see all my past and upcoming appointments in one place.

**Display Sections**:

**Upcoming Appointments**:
- Appointments with status: Pending, Confirmed
- Sorted by date (nearest first)
- Shows:
  - Service name
  - Dog name
  - Date and time
  - Staff name
  - Status
  - Cancel button (if applicable)
  - Payment status

**Past Appointments**:
- Appointments with status: Completed, Cancelled, No-Show
- Sorted by date (most recent first)
- Shows:
  - Service name
  - Dog name
  - Date and time
  - Staff name
  - Status
  - Payment status
  - Review button (if completed and not reviewed)

**Filtering Options**:
- By dog
- By date range
- By status
- By service type

**Database Tables**: `appointments`, `services`, `dogs`, `staff`, `payments`, `ratings_feedback`

---

#### 5.4.5 Appointment View (Admin/Staff)
**Feature ID**: F-APPT-005

**Description**: Staff view appointments relevant to their role and daily schedule.

**User Story**: As a staff member, I want to see my daily appointment schedule so that I know which clients to expect.

**Admin View** (Operations Dashboard):
- All appointments across all staff
- Daily calendar view
- Weekly/Monthly views
- Filter by:
  - Staff member
  - Status
  - Service type
  - Date range
- Bulk actions available

**Staff View** (Veterinarian/Groomer):
- Only appointments assigned to them
- Daily list view
- Shows:
  - Time
  - Owner name
  - Dog name and details
  - Service
  - Status
  - Notes
  - Contact information

**Actions Available**:
- View appointment details
- Access dog medical history
- Contact owner
- Add service notes

**Database Tables**: `appointments`, `services`, `dogs`, `dog_owners`, `staff`

---

### 5.5 Payment Processing

#### 5.5.1 Payment Creation
**Feature ID**: F-PAY-001

**Description**: Dog owners pay for confirmed or completed appointments.

**User Story**: As a dog owner, I want to pay for my appointment online so that I don't need to pay in person.

**Functional Flow**:
1. Owner views appointment details
2. Owner clicks "Pay Now" button
3. System displays payment modal:
   - Appointment details
   - Service name
   - Amount due
   - Payment method selection
4. Owner selects payment method:
   - GCash
   - Credit/Debit Card
   - Cash (marked for in-person payment)
   - Bank Transfer
5. Owner submits payment
6. System creates payment record:
   - Status: "Pending" or "Paid"
   - Reference number generated
   - Payment timestamp
7. System updates appointment payment status
8. System sends receipt to owner
9. Payment appears in owner's payment history

**Payment Methods**:
| Method ID | Method Name | Processing |
|-----------|-------------|------------|
| 1 | GCash | Online (mock) |
| 2 | Credit Card | Online (mock) |
| 3 | Debit Card | Online (mock) |
| 4 | Cash | In-person |
| 5 | Bank Transfer | Online (mock) |

**Payment Statuses**:
- **Pending**: Payment initiated, awaiting confirmation
- **Paid**: Payment successfully processed
- **Failed**: Payment processing failed
- **Refunded**: Payment refunded to owner

**Business Rules**:
- Can pay for Confirmed or Completed appointments
- Cannot pay for Cancelled or No-Show appointments
- One appointment can have multiple payment records (partial payments)
- Amount must match service price
- Payment reference is unique
- Cash payments marked as Pending until confirmed by staff

**Database Tables**: `payments`, `payment_methods`, `appointments`

---

#### 5.5.2 Payment History View
**Feature ID**: F-PAY-002

**Description**: Dog owners view all payment transactions.

**User Story**: As a dog owner, I want to see my payment history so that I can track my expenses.

**Display Information**:
- Payment date
- Appointment details (service, dog, date)
- Amount
- Payment method
- Status
- Reference number
- Receipt download (future enhancement)

**Filtering**:
- By date range
- By status
- By payment method
- By dog

**Database Tables**: `payments`, `appointments`, `payment_methods`

---

#### 5.5.3 Payment Management (Admin)
**Feature ID**: F-PAY-003

**Description**: Administrators view and manage all payments.

**User Story**: As an administrator, I want to track all payments so that I can monitor clinic revenue.

**Admin Capabilities**:
- View all payments across all owners
- Filter and search payments
- Mark cash payments as paid
- Issue refunds
- Generate payment reports
- Export payment data
- View payment analytics:
  - Total revenue
  - Revenue by service
  - Revenue by period
  - Payment method distribution

**Refund Process**:
1. Admin selects paid payment
2. Admin clicks "Issue Refund"
3. System confirms refund
4. System creates refund record
5. System updates payment status to "Refunded"
6. System sends refund notification to owner

**Database Tables**: `payments`, `appointments`, `dog_owners`

---

### 5.6 Rating & Feedback System

#### 5.6.1 Service Review Submission
**Feature ID**: F-RATE-001

**Description**: Dog owners rate and review completed appointments.

**User Story**: As a dog owner, I want to rate my experience so that others can benefit from my feedback.

**Functional Flow**:
1. Owner views completed appointment
2. Owner clicks "Leave Review" button
3. System displays review form:
   - Star rating (1-5 stars)
   - Written comment (optional)
4. Owner submits review
5. System validates:
   - Appointment is completed
   - Appointment belongs to owner
   - No existing review for this appointment
6. System creates feedback record:
   - Status: "Unpublished" (default)
   - Links to appointment, owner, staff, service
7. Review appears in owner's profile (unpublished)
8. Admin receives notification of new review

**Rating Scale**:
- 1 star: Very Poor
- 2 stars: Poor
- 3 stars: Average
- 4 stars: Good
- 5 stars: Excellent

**Business Rules**:
- Can only review Completed appointments
- One review per appointment
- Cannot edit review after submission (must contact admin)
- Reviews unpublished by default (requires admin approval)
- Cannot review cancelled or no-show appointments

**Database Tables**: `ratings_feedback`, `appointments`, `staff`

---

#### 5.6.2 Review Moderation (Admin)
**Feature ID**: F-RATE-002

**Description**: Administrators moderate reviews before public display.

**User Story**: As an administrator, I want to review feedback before it's published to maintain quality.

**Moderation Flow**:
1. Admin receives notification of new review
2. Admin navigates to review moderation panel
3. Admin views review details:
   - Owner name
   - Service
   - Rating
   - Comment
   - Date submitted
4. Admin decides:
   - **Publish**: Sets `is_published = true`
   - **Keep Unpublished**: Review remains private
   - **Delete**: Removes inappropriate content (future)
5. Published reviews appear on service detail pages
6. Owner receives notification of publication decision

**Publication Criteria** (Guidelines):
- Appropriate language
- Relevant to service received
- No personal attacks
- No spam or promotional content

**Database Tables**: `ratings_feedback`

---

#### 5.6.3 Service Rating Display
**Feature ID**: F-RATE-003

**Description**: Published reviews displayed on service detail pages.

**User Story**: As a dog owner, I want to read reviews from other clients before booking.

**Display Information**:
- **Aggregate Metrics**:
  - Average star rating
  - Total number of reviews
  - Rating distribution (5-star: X%, 4-star: Y%, etc.)

- **Individual Reviews**:
  - Reviewer name (first name only or anonymous)
  - Star rating
  - Written comment
  - Date of service
  - Staff member name

**Sorting Options**:
- Most recent first
- Highest rated first
- Lowest rated first

**Business Rules**:
- Only published reviews shown
- Only reviews from completed appointments
- Ratings calculated from published reviews only

**Database Tables**: `ratings_feedback`, `services`, `dog_owners`

---

### 5.7 Complaint Management System

#### 5.7.1 Complaint Submission (Owner)
**Feature ID**: F-COMP-001

**Description**: Dog owners submit complaints about services or experiences.

**User Story**: As a dog owner, I want to report an issue so that the clinic can address it.

**Functional Flow**:
1. Owner navigates to complaints section
2. Owner clicks "Submit Complaint"
3. Owner fills complaint form:
   - Subject/Title (required)
   - Description (required)
   - Related appointment (optional)
   - Priority (System assigns default)
4. Owner submits complaint
5. System creates complaint record:
   - Status: "Open"
   - Priority: "Medium" (default)
   - Timestamp
6. System sends confirmation to owner
7. System notifies admin team
8. Complaint appears in owner's complaint list

**Complaint Priorities**:
- **Low**: General feedback, minor issues
- **Medium**: Service concerns, wait times (default)
- **High**: Serious issues, safety concerns

**Business Rules**:
- Owner can submit unlimited complaints
- Complaint can reference specific appointment
- Complaint without appointment reference is general feedback
- System auto-assigns "Medium" priority
- Admin can change priority later

**Database Tables**: `complaints`, `appointments`

---

#### 5.7.2 Complaint Tracking (Owner)
**Feature ID**: F-COMP-002

**Description**: Dog owners view status and responses to their complaints.

**User Story**: As a dog owner, I want to track my complaint status and see responses from the clinic.

**Display Information**:
- **Complaint List**:
  - Subject
  - Status (Open, In Progress, Resolved, Closed)
  - Priority
  - Submission date
  - Last updated date
  - Unread message indicator

- **Complaint Detail View**:
  - Full description
  - Related appointment (if any)
  - Assigned staff member
  - Complete message thread:
    - Owner messages
    - Admin replies
    - Timestamps for each message
    - Sender identification
  - Current status
  - Resolution notes (if resolved)

**Owner Actions**:
- View all complaints
- Reply to ongoing complaints
- View resolution notes
- Cannot close or change status

**Database Tables**: `complaints`, `complaint_messages`

---

#### 5.7.3 Complaint Resolution (Admin)
**Feature ID**: F-COMP-003

**Description**: Administrators manage, respond to, and resolve client complaints.

**User Story**: As an administrator, I want to manage complaints efficiently so that we maintain client satisfaction.

**Admin Dashboard Features**:
- **Complaint Inbox**:
  - All complaints across all owners
  - Filter by:
    - Status
    - Priority
    - Date range
    - Assigned staff
  - Sort by priority or date
  - Unread message counts
  - Quick action buttons

**Complaint Management Actions**:

**1. View Complaint Details**:
- Full complaint information
- Owner details and contact info
- Related appointment details
- Complete message history
- Action log

**2. Reply to Complaint**:
- Type response message
- Message added to thread
- Owner receives notification
- Complaint status can be updated

**3. Assign Complaint**:
- Assign to specific staff member
- Reassign if needed
- Assignee receives notification

**4. Update Priority**:
- Change between Low/Medium/High
- Change logged in complaint history

**5. Update Status**:
- **Open**: Initial state, unassigned
- **In Progress**: Being actively worked on
- **Resolved**: Issue addressed, awaiting closure
- **Closed**: Complaint fully closed

**6. Add Resolution Notes**:
- Document how issue was resolved
- Internal notes for reference
- Visible to owner in final state

**Status Workflow**:
```
Open → In Progress → Resolved → Closed
  ↓         ↓           ↓
 (Can change priority and assignee at any stage)
```

**Business Rules**:
- Only admins can change status and priority
- Resolved/Closed complaints can still receive messages
- Closed complaints cannot be reopened (create new complaint instead)
- All actions logged with timestamp and actor
- Owner notified of all status changes

**Database Tables**: `complaints`, `complaint_messages`, `staff`

---

### 5.8 FAQ Knowledge Base

#### 5.8.1 FAQ Browsing (Owner)
**Feature ID**: F-FAQ-001

**Description**: Dog owners browse published FAQs organized by category.

**User Story**: As a dog owner, I want to find answers to common questions without contacting the clinic.

**Display Features**:
- **Category Organization**:
  - General Information
  - Appointment & Booking
  - Services & Pricing
  - Dog Care
  - Vaccinations
  - Emergency Care
  - Payments
  - Policies

- **FAQ Entry Display**:
  - Question (prominent)
  - Answer (expandable)
  - Category tag
  - Last updated date

**Search & Navigation**:
- Search bar for keyword search
- Category filter dropdown
- Accordion-style expand/collapse
- "Was this helpful?" feedback (future)

**Access Method**:
- Floating FAQ button on all portal pages
- Dedicated FAQ page
- Help icon in navigation

**Business Rules**:
- Only published FAQs shown
- FAQs sorted by category, then creation date
- Search includes both questions and answers

**Database Tables**: `faqs`, `faq_categories`

---

#### 5.8.2 AI-Powered FAQ Chat
**Feature ID**: F-FAQ-002

**Description**: Interactive chat interface where owners ask questions and receive relevant FAQ answers.

**User Story**: As a dog owner, I want to ask questions in my own words and get instant answers.

**Functional Flow**:
1. Owner clicks FAQ chat button
2. Chat interface opens
3. Owner types question in natural language
4. System processes question:
   - Tokenizes and analyzes question
   - Searches FAQ database for matches
   - Ranks results by relevance
5. System returns:
   - Best matching FAQ answer
   - Alternative related FAQs
   - "Still need help?" option
6. Owner can:
   - Ask follow-up question
   - Submit new question (if no match)
   - Contact support

**Matching Algorithm**:
- Keyword extraction from question
- Similarity scoring against FAQ database
- Return top 3 most relevant FAQs
- Confidence threshold for responses

**New Question Submission**:
- If no good match found
- Owner can submit question to admin
- Question saved as potential new FAQ
- Admin reviews and creates FAQ entry

**Database Tables**: `faqs`, `faq_categories`

---

#### 5.8.3 FAQ Management (Admin)
**Feature ID**: F-FAQ-003

**Description**: Administrators create, edit, and manage FAQ content.

**User Story**: As an administrator, I want to maintain our FAQ database so that clients can self-serve common questions.

**Management Features**:

**Create FAQ**:
1. Admin navigates to FAQs → Create
2. Admin fills form:
   - Question (required)
   - Answer (required, rich text)
   - Category (required)
   - Source (optional - which owner asked, if any)
   - Published status (toggle)
3. System saves FAQ
4. If published, immediately visible to owners

**Edit FAQ**:
1. Admin selects FAQ from list
2. Admin modifies any field
3. System updates with timestamp
4. Changes reflected immediately

**Publish/Unpublish Toggle**:
- Quick toggle button on FAQ list
- Unpublishing removes from owner view immediately
- Useful for outdated or seasonal information

**Delete FAQ**:
- Permanently removes FAQ
- Confirmation required
- Safe to delete (no foreign key dependencies)

**Bulk Actions**:
- Bulk publish/unpublish
- Bulk delete
- Bulk category assignment

**Analytics** (Future Enhancement):
- Most viewed FAQs
- Most searched questions
- Gap analysis (common searches with no FAQ match)

**Database Tables**: `faqs`, `faq_categories`, `dog_owners`

---

### 5.9 Notification System

#### 5.9.1 Automated Appointment Reminders
**Feature ID**: F-NOTIF-001

**Description**: System automatically sends appointment reminders to dog owners.

**User Story**: As a dog owner, I want to receive reminders about my upcoming appointments so that I don't forget.

**Reminder Schedule**:
- **24 hours before**: First reminder
- **2 hours before**: Final reminder (optional)

**Notification Channels**:
- Email (primary)
- SMS (if configured)
- In-app notification

**Reminder Content**:
- Appointment date and time
- Service name
- Dog name
- Staff name
- Clinic address
- Cancellation policy reminder
- Quick actions:
  - View appointment details
  - Cancel appointment
  - Get directions

**Implementation**:
- Laravel scheduled command: `SendAppointmentReminders`
- Runs hourly via cron job
- Checks for appointments meeting reminder criteria
- Creates notification records
- Dispatches via configured channels

**Business Rules**:
- Only send for Confirmed appointments
- Do not send for Pending (not yet confirmed)
- Do not send for Cancelled, Completed, or No-Show
- Mark notifications as sent to avoid duplicates
- Log all sent notifications

**Database Tables**: `notifications`, `appointments`

---

#### 5.9.2 Notification Management (Owner)
**Feature ID**: F-NOTIF-002

**Description**: Dog owners view and manage their notifications.

**User Story**: As a dog owner, I want to see all notifications from the clinic in one place.

**Notification Types**:
- Appointment confirmations
- Appointment reminders
- Appointment cancellations
- Payment receipts
- Complaint responses
- Service updates
- General announcements

**Display Features**:
- Notification bell icon with unread count
- Dropdown showing recent notifications
- Full notification history page
- Timestamp for each notification
- Read/Unread status indicator
- Quick actions from notifications

**Actions**:
- Mark single notification as read
- Mark all as read
- Delete notification
- Click to view related item (appointment, complaint, etc.)

**Database Tables**: `notifications`

---

#### 5.9.3 Notification Management (Admin)
**Feature ID**: F-NOTIF-003

**Description**: Administrators send and monitor system notifications.

**User Story**: As an administrator, I want to send notifications to clients and track delivery status.

**Admin Capabilities**:
- **Send Custom Notifications**:
  - To individual owner
  - To all owners
  - To filtered groups (e.g., upcoming appointments)
  - Select channel (email, SMS, in-app)
  - Compose message
  - Schedule for later (future)

- **View Notification Log**:
  - All sent notifications
  - Delivery status
  - Failed deliveries
  - Filter by owner, type, date

- **Notification Templates**:
  - Predefined templates for common messages
  - Variable placeholders (name, appointment details)
  - Template management

**Notification Statuses**:
- **Scheduled**: Queued for sending
- **Sent**: Successfully delivered
- **Failed**: Delivery failed
- **Pending**: Awaiting processing

**Database Tables**: `notifications`

---

### 5.10 Staff Management

#### 5.10.1 Staff Account Creation
**Feature ID**: F-STAFF-001

**Description**: Administrators create staff accounts with appropriate roles.

**User Story**: As an administrator, I want to create staff accounts so that team members can access the system.

**Functional Flow**:
1. Admin navigates to Staff → Create
2. Admin fills staff form:
   - First name (required)
   - Last name (required)
   - Email (required, unique)
   - Phone number (required)
   - Role (required): Veterinarian, Admin, or Groomer
   - Specialization (optional, for vets)
   - Background (optional)
   - Experience years (optional)
   - Qualifications (optional)
   - License number (optional, for vets)
   - Initial password (required)
   - Profile photo (optional)
3. System validates data
4. System creates staff account:
   - Password automatically hashed
   - Account active by default
5. System can send welcome email with credentials
6. Staff appears in staff list

**Role-Specific Fields**:

**Veterinarian**:
- Specialization (e.g., Surgery, General Practice)
- License number (professional credential)
- Qualifications/Certifications

**Groomer**:
- Specialization (e.g., Show Grooming, Creative Styling)
- Certifications

**Administrator**:
- No additional fields required

**Validation Rules**:
- Email must be unique in staff table
- Email format validation
- Phone number format validation
- Role must be valid enum value
- Experience years must be positive integer
- Initial password minimum 8 characters

**Database Tables**: `staff`, `clinic_info`

---

#### 5.10.2 Staff Profile Management
**Feature ID**: F-STAFF-002

**Description**: Administrators update staff information and credentials.

**User Story**: As an administrator, I want to update staff profiles as their information changes.

**Editable Information**:
- Personal details (name, email, phone)
- Role (can be changed)
- Professional information (specialization, qualifications)
- Profile photo
- Active status

**Actions Available**:

**Edit Profile**:
1. Admin selects staff member
2. Admin clicks Edit
3. Admin modifies fields
4. System saves changes
5. Changes reflected in staff profile

**Reset Password**:
1. Admin clicks "Reset Password" for staff member
2. Admin enters new password
3. System hashes and updates password
4. Optional: Send password reset email to staff
5. Staff must change password on next login (future)

**Deactivate Staff**:
1. Admin toggles "Active" status to false
2. System sets `is_active = false`
3. Staff cannot log in
4. Staff remains in database with appointment history
5. Staff removed from booking availability

**Reactivate Staff**:
1. Admin toggles "Active" status to true
2. Staff can log in again
3. Staff appears in booking availability

**Business Rules**:
- Cannot delete staff accounts (preserve history)
- Deactivated staff cannot be assigned new appointments
- Existing appointments remain assigned to deactivated staff
- Email changes must maintain uniqueness
- At least one active admin must exist

**Database Tables**: `staff`

---

#### 5.10.3 Staff List & Search
**Feature ID**: F-STAFF-003

**Description**: Administrators view all staff members with filtering and search.

**User Story**: As an administrator, I want to view all staff members and find specific individuals quickly.

**Display Information**:
- Name
- Role
- Specialization
- Email
- Phone
- Experience years
- Active status
- Quick action buttons (Edit, Reset Password, View)

**Filtering Options**:
- By role (Veterinarian, Admin, Groomer)
- By active status
- By specialization

**Search**:
- By name
- By email
- By specialization

**Sorting**:
- By name (A-Z, Z-A)
- By role
- By experience years

**Database Tables**: `staff`

---

### 5.11 Client Management

#### 5.11.1 Client List & Search (Admin)
**Feature ID**: F-CLIENT-001

**Description**: Administrators view all dog owner accounts.

**User Story**: As an administrator, I want to view all registered clients and their information.

**Display Information**:
- Owner name
- Email
- Phone number
- Number of dogs registered
- Total appointments
- Active status
- Registration date
- Quick action buttons

**Filtering Options**:
- Active/Inactive status
- Registration date range
- Number of appointments
- Has upcoming appointments

**Search**:
- By name
- By email
- By phone number

**Sorting**:
- By name
- By registration date
- By appointment count

**Database Tables**: `dog_owners`, `dogs`, `appointments`

---

#### 5.11.2 Client Profile View (Admin)
**Feature ID**: F-CLIENT-002

**Description**: Administrators view detailed client profiles including all related data.

**User Story**: As an administrator, I want to see complete client information to provide better service.

**Profile Sections**:

**1. Personal Information**:
- Full name
- Email and phone
- Address
- Registration date
- Profile photo
- Active status

**2. Dogs Registered**:
- List of all dogs (active and inactive)
- Dog details (breed, age, vaccination status)
- Quick link to dog profile

**3. Appointment History**:
- All appointments (past and future)
- Appointment details and status
- Service history
- Quick actions (view, cancel if upcoming)

**4. Payment History**:
- All payments
- Total amount spent
- Payment methods used
- Outstanding balances

**5. Complaints Submitted**:
- All complaints
- Complaint status
- Quick link to complaint details

**6. Reviews & Ratings**:
- All reviews submitted
- Average rating given
- Services reviewed

**Actions Available**:
- Activate/Deactivate account
- Send notification
- View appointment details
- Contact owner

**Database Tables**: `dog_owners`, `dogs`, `appointments`, `payments`, `complaints`, `ratings_feedback`

---

#### 5.11.3 Client Account Management (Admin)
**Feature ID**: F-CLIENT-003

**Description**: Administrators manage client account status.

**User Story**: As an administrator, I want to deactivate problematic accounts or reactivate former clients.

**Management Actions**:

**Deactivate Account**:
1. Admin views client profile
2. Admin clicks "Deactivate"
3. System confirms action
4. System sets `is_active = false`
5. Client cannot log in
6. Upcoming appointments remain active
7. Account data preserved

**Reactivate Account**:
1. Admin views inactive client profile
2. Admin clicks "Activate"
3. System sets `is_active = true`
4. Client can log in again

**Create Client Account (Admin)**:
- Admin can manually create owner accounts
- Useful for walk-in clients
- Admin sets initial password
- Owner should change password on first login

**Business Rules**:
- Cannot delete client accounts (data preservation)
- Deactivation does not cancel appointments
- Historical data always accessible
- Inactive clients cannot book new appointments
- Reactivation restores full access

**Database Tables**: `dog_owners`

---

### 5.12 Reporting & Analytics

#### 5.12.1 Dashboard Analytics (Admin)
**Feature ID**: F-REPORT-001

**Description**: Admin dashboard displays key performance metrics and statistics.

**User Story**: As an administrator, I want to see important metrics at a glance to monitor clinic performance.

**Dashboard Widgets**:

**1. Appointment Metrics**:
- Total appointments today
- Total appointments this week/month
- Appointments by status (pending, confirmed, completed)
- Appointment completion rate
- No-show rate
- Cancellation rate

**2. Financial Metrics**:
- Revenue today
- Revenue this week/month/year
- Pending payments
- Payment collection rate
- Revenue by service category
- Revenue trends (chart)

**3. Client Metrics**:
- Total registered clients
- New registrations this month
- Active clients (with appointments)
- Total dogs registered
- Client satisfaction (average rating)

**4. Service Metrics**:
- Most booked services
- Service utilization rate
- Average service rating
- Service revenue ranking

**5. Staff Metrics**:
- Appointments per staff member
- Staff utilization rate
- Staff ratings

**6. Recent Activity**:
- Latest appointments
- Recent reviews
- Recent complaints
- Recent registrations

**Visualization**:
- Line charts for trends
- Pie charts for distributions
- Bar charts for comparisons
- KPI cards for key numbers

**Database Tables**: `appointments`, `payments`, `ratings_feedback`, `complaints`, `dog_owners`, `services`, `staff`

---

#### 5.12.2 Business Reports Generation
**Feature ID**: F-REPORT-002

**Description**: Administrators generate and download various business reports.

**User Story**: As an administrator, I want to generate reports for business analysis and planning.

**Available Reports**:

**1. Appointment Report**:
- Date range selection
- Filters: status, service, staff
- Metrics:
  - Total appointments
  - By service breakdown
  - By status breakdown
  - By staff breakdown
  - Daily/weekly/monthly trends
- Export: PDF, Excel

**2. Revenue Report**:
- Date range selection
- Filters: service, payment method
- Metrics:
  - Total revenue
  - By service category
  - By payment method
  - By staff member
  - Payment status distribution
- Export: PDF, Excel

**3. Client Report**:
- Metrics:
  - Total clients
  - New registrations by period
  - Client retention rate
  - Most active clients
  - Client distribution by area
- Export: PDF, Excel

**4. Service Performance Report**:
- Date range selection
- Metrics:
  - Service booking frequency
  - Service revenue
  - Service ratings
  - Service trends
- Export: PDF, Excel

**5. Staff Performance Report**:
- Date range selection
- Staff selection
- Metrics:
  - Appointments handled
  - Revenue generated
  - Client satisfaction ratings
  - Utilization rate
- Export: PDF, Excel

**Report Generation Flow**:
1. Admin navigates to Reports
2. Admin selects report type
3. Admin configures parameters (dates, filters)
4. Admin clicks "Generate Report"
5. System processes data
6. System displays report preview
7. Admin can:
   - View online
   - Download PDF
   - Download Excel
   - Schedule recurring generation (future)

**Storage**:
- Generated reports saved in `reports` table
- File stored in `storage/reports/` directory
- Report metadata includes:
  - Generator (staff member)
  - Report type
  - Date range
  - Generation timestamp
  - File path

**Database Tables**: `reports`, `appointments`, `payments`, `services`, `staff`, `dog_owners`

---

### 5.13 System Settings & Configuration

#### 5.13.1 Clinic Information Management
**Feature ID**: F-SETTINGS-001

**Description**: Administrators manage clinic details displayed throughout the system.

**User Story**: As an administrator, I want to update clinic information so that clients see accurate details.

**Configurable Information**:
- **Basic Details**:
  - Clinic name
  - Tagline/Description
  - Logo image
  
- **Contact Information**:
  - Phone number
  - Email address
  - Website URL
  - Social media links

- **Location**:
  - Street address
  - City
  - Province/State
  - Postal code
  - Country
  - Map coordinates (for directions)

- **Operating Hours**:
  - Monday - Sunday hours
  - Lunch break times
  - Holiday closures

- **Policies**:
  - Cancellation policy
  - Payment policy
  - No-show policy
  - Terms and conditions

**Update Flow**:
1. Admin navigates to Settings
2. Admin edits clinic information
3. System validates data
4. Admin saves changes
5. Changes reflected immediately throughout:
   - Landing page
   - Owner portal footer
   - Appointment confirmations
   - Email signatures

**Business Rules**:
- Only admins can edit settings
- Changes logged with timestamp
- Logo/images have size limits
- Operating hours affect appointment availability

**Database Tables**: `clinic_info`

---

#### 5.13.2 Service Category Management
**Feature ID**: F-SETTINGS-002

**Description**: Administrators manage service category taxonomy.

**User Story**: As an administrator, I want to organize services into categories for better navigation.

**Category Management**:
- Create new categories
- Edit category names
- Deactivate unused categories
- Reorder category display

**Default Categories**:
- Consultation
- Vaccination
- Surgery
- Dental Care
- Grooming
- Laboratory Tests
- Emergency Care
- Wellness Check

**Business Rules**:
- Cannot delete categories with active services
- Can deactivate to hide from owners
- Category order affects display on portal

**Database Tables**: `service_categories`, `services`

---

#### 5.13.3 Dog Breed Management
**Feature ID**: F-SETTINGS-003

**Description**: Administrators manage the list of available dog breeds.

**User Story**: As an administrator, I want to maintain an accurate breed list for dog registration.

**Breed Management**:
- Add new breeds
- Edit breed names
- Mark breeds as inactive
- Search existing breeds

**Common Breeds** (Pre-populated):
- Aspin (Asong Pinoy)
- Golden Retriever
- Labrador Retriever
- German Shepherd
- Beagle
- Poodle
- Shih Tzu
- Mixed Breed
- [Many others]

**Business Rules**:
- Breeds referenced by dogs cannot be deleted
- Can add custom breeds for rare/mixed breeds
- Breed list helps maintain data consistency

**Database Tables**: `dog_breeds`, `dogs`

---

### 5.14 Search Functionality

#### 5.14.1 Global Search (Owner Portal)
**Feature ID**: F-SEARCH-001

**Description**: Dog owners search across services, FAQs, and appointments.

**User Story**: As a dog owner, I want to quickly find what I'm looking for without navigating multiple pages.

**Search Scope**:
- **Services**:
  - Service name
  - Service description
  - Service category
  
- **FAQs**:
  - Question text
  - Answer text
  
- **Appointments** (owner's only):
  - Service name
  - Staff name
  - Notes

**Search Features**:
- Search bar in navigation header
- Real-time search suggestions (as you type)
- Debounced requests (reduce server load)
- Returns top 10 results per category
- Click result to navigate to detail page

**Search Algorithm**:
- Keyword matching
- Partial match support
- Case-insensitive
- Relevance ranking

**Response Format** (JSON):
```json
{
  "services": [
    {"id": 1, "name": "...", "category": "...", "price": "..."}
  ],
  "faqs": [
    {"id": 1, "question": "...", "answer_preview": "..."}
  ],
  "appointments": [
    {"id": 1, "service": "...", "date": "...", "status": "..."}
  ]
}
```

**Database Tables**: `services`, `faqs`, `appointments`

---

### 5.15 Account Management

#### 5.15.1 Owner Account Update
**Feature ID**: F-ACCOUNT-001

**Description**: Dog owners update their personal information.

**User Story**: As a dog owner, I want to update my contact details when they change.

**Editable Fields**:
- First name
- Last name
- Phone number
- Address
- Profile photo

**Non-Editable Fields**:
- Email (security - would affect login)
- Registration date

**Update Flow**:
1. Owner navigates to Account Settings
2. Owner edits fields
3. System validates data
4. Owner saves changes
5. System updates record
6. Confirmation message displayed

**Validation**:
- Name fields required
- Phone number format validation
- Photo size limit: 5MB
- Photo formats: JPG, PNG, WEBP

**Database Tables**: `dog_owners`

---

#### 5.15.2 Password Change
**Feature ID**: F-ACCOUNT-002

**Description**: Users change their password from account settings.

**User Story**: As a user, I want to change my password for security.

**Change Flow**:
1. User navigates to Password Change
2. User enters:
   - Current password
   - New password
   - Confirm new password
3. System validates:
   - Current password correct
   - New password meets requirements
   - Passwords match
4. System updates password (hashed)
5. System logs out other sessions (optional)
6. Confirmation displayed

**Password Requirements**:
- Minimum 8 characters
- Must not match current password

**Database Tables**: `dog_owners` or `staff`

---

#### 5.15.3 Profile Photo Upload
**Feature ID**: F-ACCOUNT-003

**Description**: Users upload and update profile photos.

**User Story**: As a user, I want to add my photo to personalize my account.

**Upload Process**:
1. User clicks profile photo area
2. User selects image file
3. System validates:
   - File type (JPG, PNG, WEBP)
   - File size (max 5MB)
   - Image dimensions (optional)
4. System uploads to storage
5. System generates thumbnail (optional)
6. System updates profile record with path
7. New photo displayed immediately

**Storage Location**: `storage/app/public/profiles/`

**Business Rules**:
- Old photo deleted when new one uploaded
- Default avatar if no photo
- Photo visible in appointments, reviews, etc.

**Database Tables**: `dog_owners`, `staff`

---

## 6. Database Architecture

### 6.1 Key Database Tables

#### 6.1.1 User & Authentication Tables

**dog_owners**
| Column | Type | Description |
|--------|------|-------------|
| owner_id | INT (PK) | Primary key |
| first_name | VARCHAR(100) | Owner first name |
| last_name | VARCHAR(100) | Owner last name |
| email | VARCHAR(255) UNIQUE | Login email |
| password_hash | VARCHAR(255) | Hashed password |
| phone_number | VARCHAR(20) | Contact number |
| address | TEXT | Full address |
| profile_photo_url | VARCHAR(255) | Photo path |
| is_active | BOOLEAN | Account status |
| created_at | TIMESTAMP | Registration date |
| updated_at | TIMESTAMP | Last update |

**staff**
| Column | Type | Description |
|--------|------|-------------|
| staff_id | INT (PK) | Primary key |
| clinic_id | INT (FK) | Clinic reference |
| first_name | VARCHAR(100) | Staff first name |
| last_name | VARCHAR(100) | Staff last name |
| email | VARCHAR(255) UNIQUE | Login email |
| password_hash | VARCHAR(255) | Hashed password |
| phone_number | VARCHAR(20) | Contact number |
| role | ENUM | veterinarian, admin, groomer |
| specialization | VARCHAR(255) | Professional focus |
| background | TEXT | Professional background |
| experience_years | INT | Years of experience |
| qualifications | TEXT | Certifications/degrees |
| license_number | VARCHAR(50) | Professional license |
| image_path | VARCHAR(255) | Profile photo |
| is_active | BOOLEAN | Account status |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

---

#### 6.1.2 Dog & Breed Tables

**dogs**
| Column | Type | Description |
|--------|------|-------------|
| dog_id | INT (PK) | Primary key |
| owner_id | INT (FK) | Owner reference |
| dog_name | VARCHAR(100) | Dog's name |
| breed_id | INT (FK) | Breed reference |
| sex | ENUM | Male, Female |
| birth_date | DATE | Date of birth |
| weight_kg | DECIMAL(5,2) | Weight in kilograms |
| color | VARCHAR(50) | Primary color |
| is_vaccinated | BOOLEAN | Vaccination status |
| photo_url | VARCHAR(255) | Dog photo path |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Registration date |
| updated_at | TIMESTAMP | Last update |

**dog_breeds**
| Column | Type | Description |
|--------|------|-------------|
| breed_id | INT (PK) | Primary key |
| breed_name | VARCHAR(100) | Breed name |
| description | TEXT | Breed characteristics |
| is_active | BOOLEAN | Active status |

---

#### 6.1.3 Service Tables

**services**
| Column | Type | Description |
|--------|------|-------------|
| service_id | INT (PK) | Primary key |
| category_id | INT (FK) | Category reference |
| service_name | VARCHAR(200) | Service name |
| description | TEXT | Detailed description |
| image_path | VARCHAR(255) | Service image |
| duration_minutes | INT | Service duration |
| price | DECIMAL(10,2) | Service price |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

**service_categories**
| Column | Type | Description |
|--------|------|-------------|
| category_id | INT (PK) | Primary key |
| category_name | VARCHAR(100) | Category name |
| description | TEXT | Category description |
| is_active | BOOLEAN | Active status |

---

#### 6.1.4 Appointment Tables

**appointments**
| Column | Type | Description |
|--------|------|-------------|
| appointment_id | INT (PK) | Primary key |
| owner_id | INT (FK) | Owner reference |
| dog_id | INT (FK) | Dog reference |
| service_id | INT (FK) | Service reference |
| staff_id | INT (FK) | Assigned staff |
| slot_id | INT (FK) | Time slot reference |
| appointment_date | DATE | Appointment date |
| appointment_time | TIME | Appointment time |
| status_id | INT (FK) | Status reference |
| notes | TEXT | Special requests |
| created_at | TIMESTAMP | Booking date |
| updated_at | TIMESTAMP | Last update |

**appointment_statuses**
| Column | Type | Description |
|--------|------|-------------|
| status_id | INT (PK) | Primary key |
| status_name | VARCHAR(50) | Pending, Confirmed, Completed, Cancelled, No-Show |
| description | TEXT | Status description |

**time_slots**
| Column | Type | Description |
|--------|------|-------------|
| slot_id | INT (PK) | Primary key |
| staff_id | INT (FK) | Staff reference |
| day_of_week | ENUM | Monday-Sunday |
| start_time | TIME | Slot start time |
| end_time | TIME | Slot end time |
| is_available | BOOLEAN | Availability status |

---

#### 6.1.5 Payment Tables

**payments**
| Column | Type | Description |
|--------|------|-------------|
| payment_id | INT (PK) | Primary key |
| appointment_id | INT (FK) | Appointment reference |
| owner_id | INT (FK) | Owner reference |
| method_id | INT (FK) | Payment method |
| amount | DECIMAL(10,2) | Payment amount |
| payment_status | ENUM | Pending, Paid, Refunded, Failed |
| reference | VARCHAR(100) | Transaction reference |
| paid_at | TIMESTAMP | Payment timestamp |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

**payment_methods**
| Column | Type | Description |
|--------|------|-------------|
| method_id | INT (PK) | Primary key |
| method_name | VARCHAR(50) | GCash, Card, Cash, Bank Transfer |
| description | TEXT | Method details |
| is_active | BOOLEAN | Active status |

---

#### 6.1.6 Feedback Tables

**ratings_feedback**
| Column | Type | Description |
|--------|------|-------------|
| feedback_id | INT (PK) | Primary key |
| appointment_id | INT (FK) | Appointment reference |
| owner_id | INT (FK) | Owner reference |
| staff_id | INT (FK) | Staff reference |
| rating | INT | 1-5 stars |
| comment | TEXT | Written review |
| is_published | BOOLEAN | Publication status |
| created_at | TIMESTAMP | Submission date |
| updated_at | TIMESTAMP | Last update |

---

#### 6.1.7 Complaint Tables

**complaints**
| Column | Type | Description |
|--------|------|-------------|
| complaint_id | INT (PK) | Primary key |
| owner_id | INT (FK) | Owner reference |
| appointment_id | INT (FK) NULLABLE | Related appointment |
| subject | VARCHAR(255) | Complaint title |
| description | TEXT | Detailed description |
| priority | ENUM | Low, Medium, High |
| status | ENUM | Open, In Progress, Resolved, Closed |
| assigned_to | INT (FK) NULLABLE | Assigned staff |
| resolution_notes | TEXT | Resolution details |
| resolved_at | TIMESTAMP | Resolution date |
| created_at | TIMESTAMP | Submission date |
| updated_at | TIMESTAMP | Last update |

**complaint_messages**
| Column | Type | Description |
|--------|------|-------------|
| message_id | INT (PK) | Primary key |
| complaint_id | INT (FK) | Complaint reference |
| sender_type | ENUM | owner, staff |
| sender_id | INT | Sender reference |
| message | TEXT | Message content |
| created_at | TIMESTAMP | Send timestamp |

---

#### 6.1.8 FAQ Tables

**faqs**
| Column | Type | Description |
|--------|------|-------------|
| faq_id | INT (PK) | Primary key |
| faq_category_id | INT (FK) | Category reference |
| owner_id | INT (FK) NULLABLE | Submitting owner (if user-submitted) |
| question | TEXT | FAQ question |
| answer | TEXT | FAQ answer |
| is_published | BOOLEAN | Publication status |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

**faq_categories**
| Column | Type | Description |
|--------|------|-------------|
| faq_category_id | INT (PK) | Primary key |
| category_name | VARCHAR(100) | Category name |
| description | TEXT | Category description |

---

#### 6.1.9 Notification Tables

**notifications**
| Column | Type | Description |
|--------|------|-------------|
| notification_id | INT (PK) | Primary key |
| owner_id | INT (FK) | Recipient owner |
| appointment_id | INT (FK) NULLABLE | Related appointment |
| channel | ENUM | email, sms, in-app |
| message | TEXT | Notification content |
| status | ENUM | Scheduled, Sent, Failed |
| scheduled_at | TIMESTAMP | When to send |
| sent_at | TIMESTAMP | When sent |
| created_at | TIMESTAMP | Record creation |

---

#### 6.1.10 System Tables

**clinic_info**
| Column | Type | Description |
|--------|------|-------------|
| clinic_id | INT (PK) | Primary key |
| clinic_name | VARCHAR(200) | Clinic name |
| address | TEXT | Full address |
| phone_number | VARCHAR(20) | Contact number |
| email | VARCHAR(255) | Contact email |
| website | VARCHAR(255) | Website URL |
| logo_path | VARCHAR(255) | Logo image |
| operating_hours | JSON | Hours by day |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

**reports**
| Column | Type | Description |
|--------|------|-------------|
| report_id | INT (PK) | Primary key |
| generated_by | INT (FK) | Staff who generated |
| report_type | VARCHAR(100) | Report type |
| date_from | DATE | Report start date |
| date_to | DATE | Report end date |
| file_path | VARCHAR(255) | Report file location |
| generated_at | TIMESTAMP | Generation timestamp |

---

### 6.2 Database Relationships

**Key Relationships**:

1. **dog_owners** → **dogs** (One-to-Many)
   - One owner can have multiple dogs

2. **dogs** → **appointments** (One-to-Many)
   - One dog can have multiple appointments

3. **dog_owners** → **appointments** (One-to-Many)
   - One owner can have multiple appointments

4. **services** → **appointments** (One-to-Many)
   - One service can have multiple appointments

5. **staff** → **appointments** (One-to-Many)
   - One staff member can have multiple appointments

6. **appointments** → **payments** (One-to-Many)
   - One appointment can have multiple payments

7. **appointments** → **ratings_feedback** (One-to-One)
   - One appointment can have one review

8. **dog_owners** → **complaints** (One-to-Many)
   - One owner can submit multiple complaints

9. **complaints** → **complaint_messages** (One-to-Many)
   - One complaint can have multiple messages

10. **dog_owners** → **notifications** (One-to-Many)
    - One owner can receive multiple notifications

---

## 7. System Integration

### 7.1 External Integrations

#### 7.1.1 Firebase Authentication
**Purpose**: Alternative Google Sign-In authentication

**Integration Points**:
- Frontend: Firebase SDK for Google OAuth popup
- Backend: Firebase Admin SDK for token verification
- Endpoint: `POST /firebase/session`

**Flow**:
1. Frontend initiates Google Sign-In via Firebase
2. Firebase returns ID token
3. Frontend sends token to Laravel backend
4. Backend verifies token authenticity
5. Backend matches email to existing user
6. Backend creates Laravel session
7. User redirected to appropriate dashboard

**Configuration**:
- Firebase project credentials
- API keys stored in `.env`
- CORS configuration for Firebase domains

---

#### 7.1.2 Email Service
**Purpose**: Transactional emails and notifications

**Email Types**:
- Password reset emails
- Appointment confirmations
- Appointment reminders
- Payment receipts
- Complaint responses
- System notifications

**Implementation**:
- Laravel Mail system
- Configured SMTP server
- Queue-based email sending
- Email templates with Blade

**Configuration**:
- MAIL_MAILER (smtp, sendmail, etc.)
- SMTP credentials in `.env`
- Queue configuration

---

#### 7.1.3 SMS Service (Future)
**Purpose**: SMS notifications and reminders

**Potential Integration**:
- Semaphore (Philippine SMS provider)
- Twilio
- Other SMS gateways

**Use Cases**:
- Appointment reminders
- Urgent notifications
- OTP verification

---

#### 7.1.4 Payment Gateway (Future Enhancement)
**Purpose**: Real payment processing

**Current State**: Mock payment processing
**Future Integration Options**:
- PayMongo (Philippines)
- Stripe
- PayPal
- GCash API

**Required Features**:
- Payment processing
- Refund handling
- Webhook for payment confirmations
- PCI compliance

---

### 7.2 Internal Integrations

#### 7.2.1 Inertia.js SPA
**Purpose**: Seamless frontend-backend communication

**Features**:
- Page rendering without full reloads
- Shared data across pages
- Flash messages
- Validation errors
- Form handling

---

#### 7.2.2 Laravel Scheduler
**Purpose**: Automated background tasks

**Scheduled Tasks**:
- **Appointment Reminders**: Runs hourly
  - Command: `php artisan app:send-appointment-reminders`
  - Checks appointments 24 hours ahead
  - Sends notifications

**Future Tasks**:
- Daily reports generation
- Database cleanup
- Data backups
- Analytics calculations

**Configuration**: `app/Console/Kernel.php` or Laravel 11+ `routes/console.php`

---

#### 7.2.3 Queue System
**Purpose**: Background job processing

**Queued Jobs**:
- Email sending
- SMS notifications
- Report generation
- Image processing
- Data imports/exports

**Implementation**:
- Queue driver: Database, Redis, or SQS
- Queue workers process jobs asynchronously
- Failed job handling

---

## 8. Security Features

### 8.1 Authentication Security

1. **Password Hashing**
   - Bcrypt algorithm
   - Salt per password
   - Automatic rehashing on assignment

2. **Session Management**
   - Secure session cookies
   - CSRF token protection
   - Session timeout (configurable)
   - Multiple guard support

3. **Firebase Token Verification**
   - Cryptographic signature validation
   - Token expiration checks
   - Rate limiting (10 req/min)

---

### 8.2 Authorization Security

1. **Role-Based Access Control (RBAC)**
   - Middleware enforcement
   - Route-level protection
   - Resource-level checks

2. **Ownership Verification**
   - Users can only access own resources
   - Staff can only see assigned appointments
   - Admins have full access

3. **Guard Separation**
   - Separate authentication for owners and staff
   - Prevents cross-account access
   - Isolated session management

---

### 8.3 Data Security

1. **Input Validation**
   - Form request validation classes
   - XSS prevention
   - SQL injection prevention (Eloquent ORM)
   - File upload validation

2. **Data Encryption**
   - Database credentials encrypted
   - Sensitive config values in `.env`
   - HTTPS enforcement (production)

3. **Soft Deletes**
   - No hard deletion of critical records
   - `is_active` flags for deactivation
   - Data preservation for auditing

---

### 8.4 Application Security

1. **CSRF Protection**
   - Token validation on all state-changing requests
   - Automatic token generation
   - SPA-compatible CSRF handling

2. **Rate Limiting**
   - Login attempts throttled
   - Password reset throttled
   - API endpoint rate limits
   - Firebase session endpoint limited

3. **File Upload Security**
   - File type validation (whitelist)
   - File size limits
   - Filename sanitization
   - Storage outside web root

4. **Error Handling**
   - Generic error messages to users
   - Detailed logs for developers
   - No sensitive data in error messages
   - Stack trace disabled in production

---

## 9. Appendices

### 9.1 User Role Matrix

| Feature | Owner | Veterinarian | Groomer | Admin |
|---------|-------|--------------|---------|-------|
| Register Account | ✓ | - | - | - |
| Login | ✓ | ✓ | ✓ | ✓ |
| View Dashboard | ✓ | ✓ | ✓ | ✓ |
| Manage Own Profile | ✓ | ✓ | ✓ | ✓ |
| Register Dogs | ✓ | - | - | - |
| Browse Services | ✓ | - | - | ✓ |
| Book Appointments | ✓ | - | - | - |
| View Own Appointments | ✓ | ✓* | ✓* | ✓ |
| Cancel Appointments | ✓** | - | - | ✓ |
| Confirm Appointments | - | - | - | ✓ |
| Complete Appointments | - | - | - | ✓ |
| Make Payments | ✓ | - | - | - |
| View Payment History | ✓ | - | - | ✓ |
| Submit Reviews | ✓*** | - | - | - |
| Submit Complaints | ✓ | - | - | - |
| View/Resolve Complaints | ✓**** | - | - | ✓ |
| Browse FAQs | ✓ | ✓ | ✓ | ✓ |
| Use FAQ Chat | ✓ | - | - | - |
| Manage FAQs | - | - | - | ✓ |
| View Notifications | ✓ | ✓ | ✓ | ✓ |
| Manage Staff | - | - | - | ✓ |
| Manage Services | - | - | - | ✓ |
| Manage Clients | - | - | - | ✓ |
| Generate Reports | - | - | - | ✓ |
| Configure Settings | - | - | - | ✓ |

**Legend**:
- ✓ = Full access
- ✓* = Only appointments assigned to them
- ✓** = Only own pending/confirmed appointments
- ✓*** = Only completed appointments
- ✓**** = Only own complaints
- - = No access

---

### 9.2 API Endpoints Summary

#### Public Routes
- `GET /` - Landing page
- `GET /login` - Login page
- `POST /login` - Authenticate user
- `GET /register` - Registration page
- `POST /register` - Create owner account
- `GET /forgot-password` - Password reset request
- `POST /forgot-password` - Send reset email
- `GET /reset-password/{token}` - Password reset form
- `POST /reset-password` - Update password
- `POST /firebase/session` - Firebase authentication

#### Owner Routes (Prefix: `/portal`)
- `GET /portal` - Owner dashboard
- `GET /portal/services` - Browse services
- `GET /portal/services/{service}` - Service details
- `GET /portal/services/{service}/availability` - Check availability
- `GET /portal/appointments` - Appointment list
- `POST /portal/appointments` - Book appointment
- `PATCH /portal/appointments/{appointment}/cancel` - Cancel appointment
- `POST /portal/appointments/{appointment}/review` - Submit review
- `POST /portal/appointments/{appointment}/pay` - Make payment
- `GET /portal/search` - Global search
- `GET /portal/faqs` - Browse FAQs
- `GET /portal/faqs/chat` - FAQ chat interface
- `POST /portal/faqs/ask` - Ask FAQ question
- `GET /portal/complaints` - View complaints
- `POST /portal/complaints` - Submit complaint
- `POST /portal/complaints/{complaint}/messages` - Reply to complaint
- `PATCH /portal/notifications/read` - Mark notifications read
- `GET /portal/account` - Account settings
- `PATCH /portal/account` - Update account
- `POST /portal/dogs` - Register dog
- `PATCH /portal/dogs/{dog}` - Update dog

#### Admin Routes (Prefix: `/admin`)
- `GET /admin` - Admin dashboard
- `GET /admin/staff` - Staff list
- `POST /admin/staff` - Create staff
- `PATCH /admin/staff/{staff}` - Update staff
- `PATCH /admin/staff/{staff}/password` - Reset staff password
- `DELETE /admin/staff/{staff}` - Deactivate staff
- `GET /admin/services` - Service list
- `POST /admin/services` - Create service
- `PATCH /admin/services/{service}` - Update service
- `PATCH /admin/services/{service}/toggle` - Toggle service active
- `GET /admin/faqs` - FAQ management
- `POST /admin/faqs` - Create FAQ
- `PATCH /admin/faqs/{faq}` - Update FAQ
- `PATCH /admin/faqs/{faq}/toggle` - Publish/unpublish FAQ
- `DELETE /admin/faqs/{faq}` - Delete FAQ
- `GET /admin/complaints` - Complaint inbox
- `GET /admin/complaints/{complaint}` - Complaint details
- `POST /admin/complaints/{complaint}/messages` - Reply to complaint
- `PATCH /admin/complaints/{complaint}` - Update complaint status
- `GET /admin/reports` - Generate reports
- `GET /admin/settings` - Clinic settings
- `PATCH /admin/settings` - Update settings
- `PATCH /admin/notifications/read` - Mark notifications read

#### Admin Operations Routes (Prefix: `/admin/operations`)
- `GET /admin/operations` - Operations dashboard
- `PATCH /admin/operations/appointments/{appointment}/confirm` - Confirm appointment
- `PATCH /admin/operations/appointments/{appointment}/cancel` - Cancel appointment
- `PATCH /admin/operations/appointments/{appointment}/complete` - Complete appointment
- `PATCH /admin/operations/appointments/{appointment}/no-show` - Mark no-show

#### Client Management Routes (Prefix: `/owners`)
- `GET /owners` - Client list
- `GET /owners/{owner}` - Client profile
- `POST /owners` - Create client account
- `PATCH /owners/{owner}/deactivate` - Deactivate client
- `PATCH /owners/{owner}/activate` - Activate client

#### Shared Routes
- `GET /dashboard` - Role-based dashboard redirect
- `GET /profile` - Profile management
- `PATCH /profile` - Update profile
- `PUT /password` - Change password
- `POST /logout` - Logout

---

### 9.3 Technology Stack Details

#### Backend
- **Framework**: Laravel 11.x
- **Language**: PHP 8.2+
- **Database**: MySQL 8.0+
- **ORM**: Eloquent
- **Authentication**: Laravel Breeze + Firebase
- **Validation**: Form Requests
- **Scheduling**: Laravel Scheduler
- **Queues**: Laravel Queue

#### Frontend
- **Framework**: Inertia.js
- **UI Library**: React or Vue.js
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Icons**: Heroicons or similar

#### Development Tools
- **Package Manager**: Composer (PHP), npm/yarn (JS)
- **Version Control**: Git
- **Environment**: .env configuration
- **Migrations**: Laravel Migrations
- **Seeders**: Database Seeders

#### Deployment
- **Web Server**: Apache/Nginx
- **Process Manager**: Supervisor (for queues)
- **Cron**: System cron for scheduler
- **Storage**: Local or S3-compatible
- **Cache**: Redis (optional)

---

### 9.4 Future Enhancements

1. **SMS Notifications**
   - Integrate SMS gateway
   - SMS appointment reminders
   - SMS OTP verification

2. **Real Payment Gateway**
   - PayMongo or Stripe integration
   - Online payment processing
   - Automated refunds

3. **Medical Records Module**
   - Complete medical history
   - Prescription management
   - Lab results storage
   - Vaccination records

4. **Advanced Reporting**
   - Custom report builder
   - Scheduled report delivery
   - Data visualization dashboards
   - Export to multiple formats

5. **Mobile Application**
   - Native iOS/Android apps
   - Push notifications
   - Offline functionality
   - Mobile-optimized booking

6. **Video Consultation**
   - Telemedicine integration
   - Video call feature
   - Screen sharing
   - Consultation recording

7. **Inventory Management**
   - Medicine stock tracking
   - Supply ordering
   - Expiry date alerts
   - Usage analytics

8. **Client Portal Enhancements**
   - Pet health trackers
   - Vaccination reminders
   - Weight tracking charts
   - Photo galleries

9. **AI/ML Features**
   - Intelligent appointment scheduling
   - Demand forecasting
   - Chatbot improvements
   - Predictive analytics

10. **Multi-clinic Support**
    - Multi-tenant architecture
    - Clinic switching
    - Centralized admin
    - Franchise management

---

### 9.5 Glossary

| Term | Definition |
|------|------------|
| **Appointment** | A scheduled service booking for a dog |
| **Clinic** | The veterinary practice using the system |
| **Dog Owner** | Client account who registers dogs and books services |
| **Feedback** | Rating and review submitted after service completion |
| **Firebase** | Google's authentication platform used for Google Sign-In |
| **Guard** | Authentication scope (owner or staff) |
| **Inertia.js** | Framework for building SPAs with server-side routing |
| **Middleware** | Security layer that filters HTTP requests |
| **No-Show** | Appointment status when client doesn't arrive |
| **Owner** | Same as Dog Owner; the client role |
| **Portal** | The client-facing web interface |
| **Role** | Permission level (Owner, Admin, Veterinarian, Groomer) |
| **Service** | Bookable clinic offering (e.g., vaccination, grooming) |
| **Slot** | Available time period for appointments |
| **Staff** | Clinic employee (veterinarian, groomer, or admin) |
| **Status** | Current state of an appointment or complaint |
| **Throttle** | Rate limiting to prevent abuse |

---

### 9.6 Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | October 16, 2026 | [Your Name] | Initial FDD creation |

---

## Document End

**Document Prepared By**: [Your Name]  
**Organization**: [Your University/Institution]  
**Purpose**: Thesis Documentation  
**Contact**: [Your Email]

---

**Note for Thesis Use**: This FDD comprehensively documents all features, functions, and technical aspects of the Veterinary Clinic Management System. It is suitable for inclusion in your thesis documentation and provides complete traceability of system requirements, design decisions, and implementation specifications.

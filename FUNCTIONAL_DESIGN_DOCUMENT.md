# Functional Design Document
## Veterinary Clinic Management System - MyVet

| Document item | Value |
|---|---|
| Document title | Functional Design Document - Veterinary Clinic Management System |
| Version | 3.0 - thesis edition |
| Date | October 17, 2026 |
| System name | MyVet Veterinary Clinic Management System |
| Project type | Web-based veterinary clinic management and owner portal |
| Backend | Laravel 11, PHP 8.2+ |
| Frontend | Inertia.js, React, TypeScript, Tailwind CSS, Vite |
| Database | MySQL-compatible relational database |
| Primary users | Dog owners, administrators, veterinarians, groomers, front-desk staff |
| Document purpose | Define the system's implemented behavior, requirements, workflows, data, security, and known limitations for thesis documentation |

> **Implementation note:** This document is based on the current repository implementation. Features marked **Partial** or **Planned** are not to be presented as fully delivered functionality.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Purpose, Scope, and Objectives](#2-purpose-scope-and-objectives)
3. [System Overview and Architecture](#3-system-overview-and-architecture)
4. [Actors and Access Control](#4-actors-and-access-control)
5. [Functional Requirements](#5-functional-requirements)
6. [Detailed Functional Design](#6-detailed-functional-design)
7. [Workflows and Business Rules](#7-workflows-and-business-rules)
8. [Route and Interface Specification](#8-route-and-interface-specification)
9. [Database Architecture](#9-database-architecture)
10. [Security and Data Protection](#10-security-and-data-protection)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Testing and Verification](#12-testing-and-verification)
13. [Limitations and Future Enhancements](#13-limitations-and-future-enhancements)
14. [Glossary](#14-glossary)

---

## 1. Executive Summary

MyVet is a web-based veterinary clinic management system for a dog-focused clinic. It connects owner accounts, dog profiles, services, appointment availability, payments, notifications, ratings, complaints, FAQs, staff operations, and administrative reporting in one application.

The system has two authenticated account stores:

- `dog_owners` for clients who register dogs and use the portal.
- `staff` for administrators, veterinarians, groomers, and front-desk personnel.

The system addresses common clinic problems such as fragmented owner records, duplicated dog information, appointment conflicts, untracked payment proofs, limited appointment visibility, and slow communication between owners and the clinic.

The current system provides:

- Public clinic presentation and authentication.
- Owner registration, login, password reset, optional Google Sign-In, and account management.
- Dog profile creation, editing, photo upload, deactivation, and reactivation.
- Active service browsing, service detail pages, ratings, reviews, and care-team presentation.
- A four-step booking wizard with live availability, dog selection, payment method, payment reference, and proof upload.
- Appointment lists, rescheduling, cancellation by clinic staff, reviews, and payment settlement.
- Clinic-recorded payments through GCash, Maya, Card, and Bank Transfer.
- Owner notifications and administrator notification feeds.
- FAQ browsing and deterministic FAQ matching chat.
- Owner complaint conversations and an administrator complaint inbox.
- Staff, service, FAQ, owner, settings, operations, and read-only reporting modules.

The system deliberately preserves historical records through active-status flags instead of deleting critical entities.

---

## 2. Purpose, Scope, and Objectives

### 2.1 Purpose

This FDD defines what the system does, who can use each function, what data is captured, and what rules govern the system. It is intended to provide traceability between thesis requirements, implementation, routes, database tables, interface pages, and automated tests.

### 2.2 In-scope functionality

The implemented system covers:

1. Owner and staff authentication.
2. Owner account and dog management.
3. Service catalog management and owner service browsing.
4. Appointment availability and booking requests.
5. Appointment operation and status transitions.
6. Payment recording, proof upload, partial payment, settlement, and refund state.
7. Owner and staff notifications.
8. Ratings and feedback for completed appointments.
9. FAQ management and owner FAQ support.
10. Complaint submission, replies, triage, and resolution.
11. Owner-scoped search.
12. Clinic settings.
13. Owner, staff, service, FAQ, complaint, operations, and report administration.

### 2.3 System boundaries

The system includes the clinic database, Laravel application layer, Inertia/React interfaces, validation, authorization, and notification/payment records.

The following are outside the current implementation boundary:

- A real external payment gateway.
- Automated SMS or email delivery infrastructure as a complete scheduled service.
- A true multi-service appointment line-item model.
- Full medical records, prescriptions, laboratory results, or inventory management.
- Mobile-native applications.
- Multi-branch tenancy.

### 2.4 Objectives

| Objective | Expected result |
|---|---|
| Centralize records | Owners, dogs, staff, appointments, payments, and support conversations remain connected. |
| Improve booking | Owners can request a visit using current clinic availability. |
| Reduce conflicts | Availability checks account for opening hours, service duration, and existing visits. |
| Preserve history | Deactivation is used instead of destructive deletion for important records. |
| Improve payment traceability | Payment amount, method, reference, proof, status, and balance are recorded. |
| Improve communication | Notifications, FAQs, complaint threads, and staff responses are available through the portal. |
| Support clinic operations | Staff can manage appointment status, owner records, services, FAQs, complaints, and settings. |
| Support evaluation | Feature tests verify ownership, validation, state transitions, and financial rules. |

---

## 3. System Overview and Architecture

### 3.1 Three-tier architecture

The system follows a three-tier structure:

```text
Presentation Layer
    Inertia.js + React + TypeScript + Tailwind CSS
        |
Application Layer
    Laravel routes, controllers, form requests, policies, services
        |
Data Layer
    MySQL tables, foreign keys, indexes, active flags, payment records
```

### 3.2 Presentation layer

The frontend is an Inertia/React single-page experience. Major UI layers include:

- `OwnerLayout` for owner navigation, account menu, search, notification bell, and floating help panel.
- `StaffLayout` for admin and operations navigation, staff notifications, and console actions.
- Owner pages for dashboard, services, service details, booking, appointments, and account management.
- Staff pages for dashboards, owners, services, FAQs, complaints, reports, settings, and operations.
- Reusable components for panels, forms, modals, status pills, payment dialogs, calendars, appointment lists, and help conversations.

### 3.3 Application layer

Laravel provides:

- Named web routes and middleware.
- Separate owner and staff guards.
- Controllers for owner, admin, staff, and authentication workflows.
- Form request validation.
- Policies for resource ownership.
- Domain services for availability, payments, appointment presentation, FAQ matching, complaints, notifications, reviews, care-team presentation, and search.
- Inertia responses for page data and JSON responses for interactive portal panels.

### 3.4 Data layer

The database uses relational entities with primary keys, foreign keys, indexes, status fields, and active flags. Appointment and payment relationships are preserved so staff can inspect historical activity even when an owner, dog, service, or staff member is no longer active.

### 3.5 Main application areas

| Area | Prefix | Main users | Purpose |
|---|---|---|---|
| Public site | `/` | Guests | Clinic presentation and public service information |
| Authentication | `/login`, `/register`, `/forgot-password` | Guests | Account access and recovery |
| Owner portal | `/portal` | Dog owners | Owner and dog services |
| Admin console | `/admin` | Administrators | Clinic management |
| Operations | `/admin/operations` | Administrators and authorized staff | Appointment state management |
| Owner management | `/owners` | Administrators | Client records and owner history |

---

## 4. Actors and Access Control

### 4.1 Dog owner

A dog owner is a clinic client authenticated through the owner guard.

**Capabilities:**

- Register and maintain an owner account.
- Upload and update an owner profile photo.
- Register, edit, deactivate, and reactivate owned dogs.
- View only owned dogs, appointments, payments, notifications, complaints, and feedback.
- Browse active services and published reviews.
- Request an appointment using the booking wizard.
- Reschedule eligible upcoming appointments.
- Read payment settlement information.
- Submit payment records with proof.
- Review completed visits once.
- Use FAQ and complaint support.

**Restrictions:**

- Cannot access administrator pages.
- Cannot access another owner's data.
- Cannot modify service prices, staff data, clinic settings, or availability rules.
- Cannot change appointment status to Confirmed, Completed, Cancelled, or No-show.
- Cannot cancel an appointment through the current owner portal; cancellation is handled by clinic operations.

### 4.2 Administrator

An administrator is a staff account with the `admin` role.

**Capabilities:**

- Access the admin dashboard and operations dashboard.
- Create, edit, deactivate, and reactivate staff accounts.
- Manage services, categories, service images, duration, prices, and active status.
- Manage owner records and owner account status.
- View owner dogs, appointments, payments, and history.
- Confirm, cancel, complete, and mark appointments as no-show.
- Manage FAQ questions and publication state.
- Manage complaint threads and resolution state.
- Update clinic settings.
- View current reports for accounts, owners, dogs, breeds, and registrations.
- Read notification and payment activity in the console.

**Restriction:** administrators do not edit owner personal details from the staff owner area.

### 4.3 Veterinarian

A veterinarian is a staff account associated with medical services. The service presentation assigns non-grooming services to the veterinarian provider role. Access is limited to the operations capabilities granted by the current middleware and staff role configuration.

### 4.4 Groomer

A groomer is a staff account associated with grooming services. Grooming services are assigned to the groomer provider role in service presentation and care-team data.

### 4.5 Front desk staff

Front-desk staff are supported as staff accounts for operational work. They can work with assigned operational functions but are restricted from administrator-only areas such as reports, service configuration, FAQ administration, and settings.

### 4.6 System actor

The system performs or supports:

- Availability calculations.
- Status-based appointment presentation.
- Payment balance calculations.
- Portal and staff notification creation.
- FAQ matching.
- Ownership and role enforcement.
- Validation and persistence transactions.

---

## 5. Functional Requirements

### 5.1 Requirement status legend

- **Implemented:** available in the current application and represented by code/tests.
- **Partial:** a usable part exists, but the full thesis-level target is not delivered.
- **Planned:** documented as future work and not part of the current release.

### 5.2 Core requirements matrix

| ID | Requirement | Priority | Actor | Status |
|---|---|---:|---|---|
| FR-001 | Owner registration | Critical | Guest | Implemented |
| FR-002 | Owner and staff login | Critical | Owner, staff | Implemented |
| FR-003 | Owner password reset | High | Owner | Implemented |
| FR-004 | Optional Firebase Google Sign-In | Medium | Owner, staff | Partial/configuration dependent |
| FR-005 | Owner account management | High | Owner | Implemented |
| FR-006 | Dog profile creation | Critical | Owner | Implemented |
| FR-007 | Dog profile editing | Critical | Owner | Implemented |
| FR-008 | Dog profile deactivation/reactivation | High | Owner | Implemented |
| FR-009 | Service browsing and search | High | Owner | Implemented |
| FR-010 | Service detail, reviews, and provider information | High | Owner | Implemented |
| FR-011 | Online appointment request | Critical | Owner | Implemented |
| FR-012 | Live appointment availability | Critical | Owner, system | Implemented |
| FR-013 | Appointment rescheduling | High | Owner | Implemented |
| FR-014 | Appointment operation statuses | Critical | Admin | Implemented |
| FR-015 | Appointment cancellation and refund state | High | Admin | Implemented |
| FR-016 | Payment recording | Critical | Owner, admin | Implemented |
| FR-017 | External payment gateway | Medium | Owner | Planned |
| FR-018 | Appointment settlement and partial payments | High | Owner, admin | Implemented |
| FR-019 | Ratings and reviews | Medium | Owner | Implemented |
| FR-020 | Notification records and feeds | High | Owner, staff | Implemented |
| FR-021 | Automated reminder delivery | High | System | Partial/planned deployment workflow |
| FR-022 | FAQ knowledge base | Medium | Owner, admin | Implemented |
| FR-023 | FAQ natural-language matching | Medium | Owner, system | Implemented as deterministic matching, not generative AI |
| FR-024 | Complaint submission and threaded replies | High | Owner, staff | Implemented |
| FR-025 | Owner-scoped global search | Medium | Owner | Implemented |
| FR-026 | Staff management | Critical | Admin | Implemented |
| FR-027 | Service catalog administration | Critical | Admin | Implemented |
| FR-028 | Owner/client management | High | Admin | Implemented |
| FR-029 | Clinic settings | High | Admin | Implemented |
| FR-030 | Business reports and analytics | High | Admin | Partial |
| FR-031 | Medical records and prescriptions | High | Owner, staff | Planned |
| FR-032 | Inventory management | Medium | Admin | Planned |
| FR-033 | Multi-clinic support | Low | Admin | Planned |

---

## 6. Detailed Functional Design

### 6.1 Public landing page

The public landing page presents the clinic identity, service highlights, public clinic information, team information, ratings/testimonials, contact details, and calls to register, sign in, or enter the owner portal.

Public content is not treated as a booking record. Booking requires an authenticated owner account so the appointment can be tied to an owner and an active dog.

### 6.2 Owner registration

**Inputs:**

- First name.
- Last name.
- Email address.
- Password.
- Phone number.
- Address where supported.

**Rules:**

- Email must be valid and unique across owner/staff identities.
- Password is hashed before storage.
- The created owner is authenticated through the owner guard.
- Owners are directed to the owner dashboard after registration.

### 6.3 Login and logout

The login workflow authenticates against the appropriate owner or staff provider. The role-based dashboard redirect sends owners to the owner portal and staff to the appropriate staff experience.

The system does not use persistent remember tokens because the account schema does not include a remember-token column. Logout invalidates the authenticated session.

### 6.4 Password reset and password change

Owner password reset uses the Laravel password reset flow with email delivery and a time-limited reset token. Authenticated users can update their password through the shared profile/password routes.

Staff password reset is administrator-controlled through the staff management area.

### 6.5 Firebase Google Sign-In

When Firebase client configuration is available:

1. The frontend opens the Google account picker.
2. Firebase returns an ID token.
3. The frontend sends the token to `POST /firebase/session`.
4. The backend validates the token and project identity.
5. The system matches the email to an owner or staff record.
6. A normal Laravel session is created.

The Firebase endpoint is throttled. The system does not expose the Google option when client configuration is unavailable.

### 6.6 Owner account management

The owner account page allows an owner to update:

- First name.
- Last name.
- Email.
- Phone number.
- Address.
- Profile photo.

The account page also lists every dog owned by the account, including inactive dogs, so historical records remain visible.

### 6.7 Dog profile management

A dog record stores:

- Owner reference.
- Dog name.
- Breed reference.
- Sex.
- Birth date.
- Weight.
- Color.
- Vaccination flag.
- Photo path.
- Active state.

**Create flow:**

1. Owner opens account settings.
2. Owner selects Add a dog.
3. Owner enters dog information and optionally uploads a photo.
4. `SaveDogRequest` validates the data.
5. The dog is created under the signed-in owner's `owner_id`.
6. The dog appears in the owner account list.

**Edit flow:**

1. Owner opens Edit on an owned dog.
2. Existing values are loaded into the form.
3. Owner updates fields and optionally replaces the photo.
4. The previous photo is removed when a replacement is stored.
5. The policy confirms the dog belongs to the owner.

**Deactivate/reactivate flow:**

1. Owner selects Deactivate or Reactivate.
2. The UI confirms the requested state change.
3. The endpoint authorizes the owner through `DogPolicy`.
4. `is_active` is changed without deleting the row.
5. Inactive dogs remain in account history but are excluded from new booking dog choices.

### 6.8 Service catalog for owners

Owners can browse active services grouped by category. A service may expose:

- Service name.
- Description.
- Category.
- Price.
- Duration.
- Image.
- Average rating.
- Review count.
- Recent published reviews.
- Provider role.
- Related care-team members.

Inactive services are not shown in the active owner catalog, service detail pages, availability responses, or booking wizard.

### 6.9 Service administration

Administrators can:

- View services.
- Create services.
- Edit service details.
- Assign a category.
- Set price and duration.
- Upload/update service images.
- Activate or deactivate a service.

Services are deactivated instead of deleted so historical appointments retain their service relationship.

### 6.10 Booking wizard

The booking wizard is the primary owner booking experience at `/portal/booking`.

**Step 1 - Service and schedule:**

- Service cards are grouped by category.
- The carousel supports category selection and paging.
- Service detail modal shows description, price, duration, category, and selection action.
- The owner selects one primary service.
- The application requests live service availability.
- The owner selects a date from the availability calendar.
- The owner selects a time slot.
- The owner selects an active dog.

**Step 2 - Extras:**

- The owner may choose add-ons such as nail trim, ear cleaning, deworming, flea treatment, and microchipping.
- The owner may add notes for the clinic.
- Add-ons are included in the submitted notes because the current appointment schema supports one primary `service_id`.

**Step 3 - Payment:**

- The owner chooses a configured payment channel.
- The owner enters a payment reference where available.
- The owner uploads a JPG, PNG, or WEBP proof image up to the configured size limit.
- The wizard displays the service/add-on summary and payment amount.

**Step 4 - Confirmation:**

- The request is stored as `Requested`.
- The payment record is created through `PortalPayments`.
- The owner is redirected to a booking-received state.
- Staff notification/operations feeds can identify the requested appointment.

**Booking validation:**

- Service must be active.
- Dog must be active and owned by the signed-in owner.
- Date must be today or later and within the booking window.
- Time must use the accepted time format.
- The slot must still be available when submitted.
- The owner cannot create a duplicate upcoming appointment for the same dog and service.
- Payment must meet the primary service payment rule.

**Known data limitation:** one appointment stores one primary service. A true multi-service appointment requires an appointment line-item table and updated payment settlement logic.

### 6.11 Availability calculation

`BookingAvailability` derives availability from:

- Clinic opening time and closing time.
- Clinic open weekdays.
- Clinic timezone.
- A 60-day booking horizon.
- Service duration.
- Existing appointments that are not Cancelled or No-show.
- Current time for same-day slot filtering.
- Optional ignored appointment ID during rescheduling.

Slots are generated in 30-minute increments and are offered only when the entire service duration fits before closing time.

### 6.12 Appointment management

Appointment statuses used by the current application include:

- `Requested` - owner has submitted a request and the clinic has not confirmed it.
- `Confirmed` - clinic accepted the request.
- `Completed` - service was delivered.
- `Cancelled` - clinic cancelled or declined the appointment.
- `No-show` - owner did not attend.

The owner appointment page separates upcoming visits from history and supports filters for all, completed, and cancelled/no-show records.

The page presents:

- Dog.
- Service.
- Staff member when assigned.
- Date and time.
- Duration and price.
- Status.
- Notes.
- Payment settlement.
- Reschedule action when allowed.
- Payment action when balance remains.
- Review action when the appointment is completed and unrated.

### 6.13 Appointment rescheduling

1. Owner selects reschedule on a requested or confirmed appointment.
2. The system requests service availability while excluding the appointment's current ID.
3. The owner selects a new date and time.
4. The server checks owner ownership, valid status, date, time, and availability.
5. The appointment is updated without creating a new appointment row.

### 6.14 Appointment operations

Administrators manage state transitions through operations actions:

| Transition | Allowed source state | Result |
|---|---|---|
| Confirm | Requested | Confirmed |
| Cancel | Requested or Confirmed | Cancelled |
| Complete | Confirmed and visit time reached | Completed |
| No-show | Confirmed | No-show |

Cancellation may refund recorded payments by changing payment state to Refunded and creates a notification explaining the outcome. Completion cannot happen before the scheduled date/time.

### 6.15 Payment processing and settlement

The application records clinic payment information. It does not connect to GCash, Maya, a card processor, or a bank API.

Configured channels:

- GCash.
- Maya.
- Card.
- Bank Transfer.

A payment contains:

- Appointment.
- Owner.
- Payment method.
- Amount.
- Payment status.
- Reference.
- Payment proof path.
- Paid timestamp.

The payment service calculates:

- Appointment price.
- Total paid.
- Remaining balance.
- Settlement state: unpaid, part, or paid.
- Refunded amount.
- Whether advance partial payment is allowed.
- Latest payment information.

**Payment rules:**

- Requested, Confirmed, and Completed visits may be payable according to the payment service rules.
- Future visits may accept a partial payment.
- Completed visits must be paid in full.
- Payment amount cannot exceed the remaining balance.
- Payment proof is required for owner-submitted payments.
- Unsupported payment methods are rejected.

### 6.16 Notifications

The clinic notification table stores:

- Owner.
- Related appointment, when applicable.
- Channel: SMS, Email, or Push.
- Message.
- Delivery status.
- Scheduled time.
- Sent time.
- Creation time.

Owner notifications are displayed in the portal navigation. Since the table has no per-user read column, the owner read marker is stored in the browser session as the newest notification ID seen.

The staff console displays booking requests and payment activity through its notification feed. Appointment confirmations, cancellations, and payment activity create owner-facing notification records through application services.

### 6.17 Ratings and reviews

Owners can submit one review for a completed appointment.

**Review data:**

- Appointment.
- Owner.
- Staff where applicable.
- Rating from 1 to 5.
- Optional comment.
- Published state.
- Creation/update timestamps.

The owner cannot review an appointment that is not completed and cannot submit a second review for the same appointment. Service pages show published review information.

### 6.18 FAQ knowledge base

Administrators manage FAQ entries with:

- Question.
- Answer.
- Category.
- Published/draft state.
- Updated date.

The owner help panel can browse published FAQs by category. Draft FAQ entries are never returned to owners.

### 6.19 FAQ matching chat

The FAQ chat is a deterministic assistant, not a generative AI model.

1. The owner opens the help panel.
2. The system returns a greeting and suggested published questions.
3. The owner submits a natural-language question.
4. The FAQ assistant normalizes and matches terms against published questions and answers.
5. Matching answers and follow-up questions are returned as JSON.
6. If no suitable answer exists, the panel offers a path to contact the clinic through a complaint.

The conversation may be retained in browser session storage for the current owner/browser session.

### 6.20 Complaint management

Owners can create complaints with:

- Subject.
- Description.
- Priority: Low, Medium, High.
- Optional related appointment.

Owners can list their complaint threads, read staff responses, and reply to an existing thread.

Administrators can:

- Search complaints.
- Filter by waiting/settled state.
- Filter by priority.
- View complaint and client details.
- Reply to the owner.
- Assign the complaint to themselves.
- Change status.
- Change priority.
- Add resolution notes.

Complaint status values are Open, In Progress, Resolved, and Closed. The first staff reply can move a complaint to In Progress. Resolved/Closed records retain their conversation history.

### 6.21 Owner-scoped search

The portal search endpoint returns JSON groups for:

- The signed-in owner's dogs.
- The signed-in owner's appointments.
- Clinic services.

Queries shorter than two characters are not processed. Owner records are scoped in the backend so another client's dog or appointment cannot appear.

### 6.22 Staff management

Administrators can:

- View staff list.
- Create staff accounts.
- Edit staff accounts.
- Set staff role.
- Set professional fields such as specialization, experience, qualifications, and license where applicable.
- Upload staff images.
- Reset staff passwords.
- Deactivate/reactivate staff accounts.

Inactive staff remain available in historical records but are excluded from current care-team/availability presentation where applicable.

### 6.23 Owner/client management

Administrators can:

- Search and paginate owner accounts.
- Filter owners by active status.
- View owner details.
- View owner dogs.
- View appointment and payment history.
- Deactivate/reactivate owner accounts.

Owner personal contact fields are intentionally maintained through the owner portal rather than edited by administrators.

### 6.24 Clinic settings

Administrators can update clinic information used by the application, including clinic identity/contact data and operational booking settings. Availability uses clinic opening time, closing time, open weekdays, and configured timezone.

### 6.25 Reports

The current report page provides reliable read-only figures:

- Total accounts.
- Administrator, front-desk, and owner counts where exposed by the report implementation.
- Total, active, and inactive owners.
- Total and active dogs.
- Six-month owner signup series.
- Dog counts grouped by breed, including Unspecified.

Revenue, appointment trends, staff performance, and service utilization reports are future enhancements.

---

## 7. Workflows and Business Rules

### 7.1 Owner registration workflow

```text
Guest -> Registration form -> Validate unique identity -> Create owner
      -> Authenticate owner -> Owner dashboard
```

### 7.2 Dog lifecycle workflow

```text
Create dog -> Active dog -> Edit details
                         |
                         v
                   Deactivate
                         |
                         v
                Historical/inactive dog
                         |
                         v
                     Reactivate
```

Deactivation never deletes the dog or linked appointments.

### 7.3 Booking workflow

```text
Select active service
        |
Select active dog, date, and available time
        |
Select optional add-ons and notes
        |
Select payment method and upload proof
        |
Server revalidates service, dog, ownership, slot, duplicate booking, and payment
        |
Create Requested appointment + payment record
        |
Notify clinic / show booking received
```

### 7.4 Appointment workflow

```text
Requested -> Confirmed -> Completed
     |           |           |
     +--------> Cancelled    +--> Review/payment history
                 |
                 +--> Payment refund state when applicable

Confirmed -> No-show
```

### 7.5 Rescheduling workflow

```text
Owner chooses eligible visit
        |
Availability excludes current appointment
        |
Owner chooses new date/time
        |
Server confirms ownership, status, date, and free slot
        |
Existing appointment date/time updated
```

### 7.6 Payment workflow

```text
Appointment has outstanding balance
        |
Owner selects channel and amount
        |
Owner uploads proof and optional reference
        |
Server validates owner, appointment state, method, amount, and image
        |
Payment record created as Paid according to current payment service
        |
Settlement recalculated
```

### 7.7 Complaint workflow

```text
Owner creates complaint -> Open
        |
Staff replies/claims -> In Progress
        |
Staff records resolution -> Resolved
        |
Staff closes record -> Closed
```

### 7.8 Data preservation rules

- Dogs are deactivated, not deleted, by owners.
- Services are deactivated, not deleted, by administrators.
- Staff and owner accounts use active states instead of destructive deletion.
- Appointment history remains linked to dogs, owners, services, and staff.
- Payment and complaint records remain associated with their parent records.

---

## 8. Route and Interface Specification

### 8.1 Public and authentication routes

| Method | URI/name | Function |
|---|---|---|
| GET | `/` | Public landing page |
| GET | `/login` | Login form |
| POST | `/login` | Password login |
| GET | `/register` | Owner registration form |
| POST | `/register` | Create owner account |
| GET | `/forgot-password` | Password reset request form |
| POST | `/forgot-password` | Send reset link |
| GET | `/reset-password/{token}` | Reset password form |
| POST | `/reset-password` | Store new password |
| POST | `/firebase/session` | Verify Firebase token and create Laravel session |
| GET | `/dashboard` | Role-based authenticated dashboard redirect |
| POST | `/logout` | Logout |
| GET/PATCH | `/profile` | Shared profile/password access |

### 8.2 Owner routes

| Method | Named route | Purpose |
|---|---|---|
| GET | `owner.dashboard` | Owner dashboard |
| GET | `owner.booking` | Unified booking wizard |
| GET | `owner.services.index` | Active service menu |
| GET | `owner.services.show` | Service detail page |
| GET | `owner.services.availability` | JSON date/time availability |
| GET | `owner.appointments.index` | Owner appointments |
| POST | `owner.appointments.store` | Submit booking request |
| PATCH | `owner.appointments.reschedule` | Reschedule eligible visit |
| POST | `owner.appointments.review` | Submit completed-visit review |
| POST | `owner.payments.store` | Record payment with proof |
| GET/PATCH | `owner.account.edit/update` | Owner account |
| POST | `owner.dogs.store` | Create dog |
| PATCH | `owner.dogs.update` | Update dog |
| PATCH | `owner.dogs.deactivate` | Deactivate dog |
| PATCH | `owner.dogs.activate` | Reactivate dog |
| GET | `owner.search` | Owner-scoped search JSON |
| GET | `owner.faqs` | Published FAQ JSON |
| GET | `owner.faqs.chat` | FAQ chat greeting/suggestions |
| POST | `owner.faqs.ask` | FAQ matching question |
| GET/POST | `owner.complaints.index/store` | Complaint list/create |
| POST | `owner.complaints.reply` | Reply to complaint |
| PATCH | `owner.notifications.read` | Mark owner notifications seen |

### 8.3 Administrator routes

| Area | Functions |
|---|---|
| Admin dashboard | Clinic overview and administrative navigation |
| Staff | List, create, edit, password reset, deactivate/reactivate |
| Services | List, create, edit, active-status toggle |
| FAQs | List, create, edit, publish/unpublish, delete |
| Complaints | Inbox, detail, reply, triage, resolution |
| Reports | Account, owner, dog, breed, signup reports |
| Settings | Clinic settings edit/update |
| Notifications | Mark console notifications read |

### 8.4 Operations routes

| Method | Route | Function |
|---|---|---|
| GET | `/admin/operations` | Operations dashboard |
| PATCH | `/admin/operations/appointments/{appointment}/confirm` | Confirm Requested appointment |
| PATCH | `/admin/operations/appointments/{appointment}/cancel` | Cancel Requested/Confirmed appointment |
| PATCH | `/admin/operations/appointments/{appointment}/complete` | Complete due Confirmed appointment |
| PATCH | `/admin/operations/appointments/{appointment}/no-show` | Mark Confirmed appointment as No-show |

### 8.5 Owner-facing interface pages

| Page/component | Responsibility |
|---|---|
| `Welcome` | Public clinic landing experience |
| `Owner/Dashboard` | Owner greeting, dogs, next visits, metrics |
| `Owner/Services` | Active service menu and care team |
| `Owner/ServiceShow` | Service detail, ratings, reviews, related services |
| `Owner/BookingPage` | Four-step booking wizard |
| `Owner/Appointments` | Upcoming/history visits, filters, rescheduling, reviews, payment modal |
| `Owner/Account` | Contact details, profile photo, dog list, dog status |
| `OwnerLayout` | Owner navbar, search, account menu, notifications, help |
| `PortalHelpPanel` | FAQ browsing/chat and complaints |

### 8.6 Staff-facing interface pages

| Page/component | Responsibility |
|---|---|
| `StaffLayout` | Staff navigation, role-aware menu, notifications |
| Admin dashboard | Clinic management overview |
| Operations dashboard | Appointment and payment activity |
| Staff pages | Staff account management |
| Service pages | Service catalog management |
| Owner pages | Owner list and owner details |
| FAQ pages | FAQ management |
| Complaint pages | Complaint inbox and detail thread |
| Reports page | Current read-only metrics |
| Settings page | Clinic configuration |

---

## 9. Database Architecture

### 9.1 Entity summary

| Entity | Purpose | Important relationships |
|---|---|---|
| `dog_owners` | Owner identities and client contact data | Has many dogs, appointments, payments, complaints, feedback, notifications |
| `staff` | Clinic employee identities | Has roles, appointments, service-provider relationship |
| `dogs` | Dog profiles | Belongs to owner and breed; has appointments |
| `dog_breeds` | Controlled breed list | Referenced by dogs |
| `clinic_info` | Clinic identity, contact, opening configuration | Used by public pages and availability |
| `service_categories` | Service classification | Has many services |
| `services` | Active/inactive clinic offerings | Belongs to category; has appointments |
| `time_slots` | Optional staff slot records | Referenced by appointments; availability is currently derived from clinic hours and visits |
| `appointments` | Primary visit record | Belongs to owner, dog, service, staff, slot, status; has payments and feedback |
| `appointment_status` | Appointment status lookup | Referenced by appointments |
| `payments` | Payment/settlement records | Belongs to appointment, owner, method |
| `payment_methods` | Allowed payment channels | Referenced by payments |
| `ratings_feedback` | Owner rating/comment | Belongs to appointment, owner, staff/service context |
| `notifications` | Clinic notification log | Belongs to owner and optionally appointment |
| `complaints` | Owner support cases | Belongs to owner and optionally appointment/staff |
| `complaint_messages` | Complaint thread messages | Belongs to complaint |
| `faqs` | Questions and answers | Belongs to FAQ category |
| `faq_categories` | FAQ grouping | Has many FAQs |
| `password_reset_tokens` | Password recovery records | Used by authentication flow |

### 9.2 Core fields

#### `dog_owners`

- `owner_id` primary key.
- `first_name`, `last_name`.
- `email` unique identity.
- `password_hash` hashed credential.
- `phone_number`, `address`, `profile_photo_url`.
- `is_active` account state.
- `created_at`, `updated_at`.

#### `staff`

- `staff_id` primary key.
- Name and contact fields.
- Email and hashed password.
- Role: administrator, veterinarian, groomer, or front desk as supported by the application.
- Specialization, qualifications, experience, license, image.
- `is_active` status.

#### `dogs`

- `dog_id` primary key.
- `owner_id` foreign key.
- `dog_name`, `breed_id`, `sex`, `birth_date`, `weight_kg`, `color`.
- `is_vaccinated`, `photo_url`, `is_active`.

#### `appointments`

- `appointment_id` primary key.
- `owner_id`, `dog_id`, `service_id` foreign keys.
- Nullable `staff_id` and `slot_id`.
- `appointment_date`, `appointment_time`.
- `status_id` and nullable `notes`.
- Timestamps.

#### `payments`

- `payment_id` primary key.
- `appointment_id`, `owner_id`, `method_id` foreign keys.
- `amount`, `payment_status`, reference/proof path, `paid_at`.
- Payment states include Pending, Paid, Refunded, and Failed.

#### `notifications`

- `notification_id` primary key.
- `owner_id`, optional `appointment_id`.
- Channel, message, delivery status, scheduled/sent timestamps, creation timestamp.

### 9.3 Relationships

1. One owner has many dogs.
2. One owner has many appointments.
3. One dog has many appointments.
4. One service has many appointments.
5. One staff member may be associated with many appointments.
6. One appointment has many payments.
7. One appointment can have one feedback record.
8. One owner has many complaints and complaint messages through complaints.
9. One owner has many notifications.
10. One category has many services or FAQs.

### 9.4 Preservation strategy

The system uses status fields instead of deletion for historical entities:

- Deactivated owners remain in the database.
- Deactivated dogs remain in the database.
- Deactivated services remain in the database.
- Inactive staff remain linked to historical appointments.
- Payments and complaint threads remain available for auditing and service review.

### 9.5 Current schema limitation

`appointments.service_id` allows one primary service per appointment. The booking UI may display optional add-ons, but they are currently stored in appointment notes rather than a separate billable line-item table. A future multi-service model should introduce an `appointment_services` table with quantity/price snapshots and update payment settlement calculations.

---

## 10. Security and Data Protection

### 10.1 Authentication controls

- Separate owner and staff guards prevent account-type confusion.
- Passwords are hashed through Laravel's authentication model.
- Password reset routes are throttled and token-based.
- Firebase session creation is rate-limited and token-verified.
- Sessions are invalidated on logout.

### 10.2 Authorization controls

- Route middleware applies authentication and role restrictions.
- `DogPolicy` prevents owners from modifying another owner's dog.
- Owner controllers verify appointment/payment/complaint ownership before reading or changing records.
- Staff areas are blocked from owner accounts and restricted staff roles.
- Services, dogs, and accounts use active-state checks before new operations.

### 10.3 Input and upload security

- Form requests validate required fields, types, ranges, enum values, ownership, and foreign-key existence.
- Payment proofs are limited to approved image types and sizes.
- Dog, staff, service, and profile images are validated before storage.
- Eloquent and query builders are used for database access.
- CSRF protection applies to state-changing browser requests.

### 10.4 Privacy and ownership

- An owner can only search and view their own dogs and appointments.
- Owner notifications are scoped to the authenticated owner.
- Staff can see client information only within staff-authorized pages.
- Public service reviews use the application's published review presentation rather than exposing private owner records.

---

## 11. Non-Functional Requirements

### 11.1 Usability

- Responsive owner and staff interfaces support desktop and mobile layouts.
- Forms expose validation messages near the relevant workflow.
- Booking availability is presented visually through a calendar and time-slot controls.
- Destructive or consequential actions such as dog deactivation and FAQ deletion require confirmation.
- Empty states explain what the user can do next.

### 11.2 Performance

- Inertia avoids full-page reloads for normal navigation.
- Search requests are debounced in the owner layout.
- Service, care-team, appointment, and review data use eager loading and domain presentation services.
- Firebase dependencies are loaded lazily when Google Sign-In is used.
- Availability queries use indexed appointment fields and restrict the booking horizon.

### 11.3 Reliability

- Appointment creation and payment creation are executed within a database transaction.
- Booking availability is rechecked server-side after the calendar is displayed.
- Status transitions reject invalid source states.
- Historical records remain available after deactivation.
- Failed frontend availability requests degrade to an unavailable calendar rather than creating an invalid booking.

### 11.4 Maintainability

- Controllers delegate repeated domain behavior to services such as `BookingAvailability`, `PortalPayments`, `OwnerAppointments`, `ComplaintThreads`, and `ServiceReviews`.
- Shared types describe owner, staff, payment, appointment, dog, service, FAQ, and complaint data.
- Feature tests cover critical business rules and cross-owner isolation.
- Named routes avoid hard-coded internal URLs in React pages.

### 11.5 Compatibility

- The application is designed for current desktop and mobile browsers supported by the Vite/React build.
- Date handling uses local date strings for booking days to avoid timezone date shifting.
- Availability uses the configured clinic timezone rather than assuming the server timezone.

---

## 12. Testing and Verification

### 12.1 Test strategy

The repository uses Laravel/Pest feature tests with database refresh behavior and model factories. Tests validate behavior through HTTP routes, Inertia responses, JSON responses, database assertions, storage fakes, authorization responses, and validation errors.

### 12.2 Feature test coverage

| Test area | Verified behavior |
|---|---|
| Owner account | Account page, contact updates, staff restriction, email uniqueness |
| Dog management | Add, validate, edit, ownership isolation, deactivate/reactivate, staff restriction |
| Owner portal | Dashboard data, upcoming preview, service grouping, care team, appointment split, FAQ endpoint, search, notifications |
| Booking | Wizard props, active service filtering, active dog filtering, slot availability, duplicate service prevention, payment proof, deposit/full payment, closed booking behavior |
| Availability | Existing visit conflicts, cancelled/no-show release, service duration, timezone and closed-day rules, rescheduling exclusion |
| Appointments | Owner appointment lists, rescheduling, reviews, cancellation/operation separation, status behavior |
| Payments | Methods, ownership, proof validation, partial payments, settlement, overpayment rejection, completed-visit rules, refunds |
| FAQ chat | Published-only answers, matching, suggestions, unanswered questions, owner-only access, validation |
| Complaints | Owner threads, replies, ownership, staff inbox, filtering, triage, resolution |
| Staff owner management | Owner list, filters, detail records, owner activation state, appointment/payment history |
| Reports | Counts, active/inactive state, six-month signup series, breed totals, role access |
| Admin modules | Staff, service, FAQ, settings, and operations workflows |

### 12.3 Build verification

The frontend is validated using:

```text
npm run build
```

This runs TypeScript compilation followed by the Vite production build.

The backend is validated using focused Pest commands such as:

```text
php artisan test tests/Feature/OwnerDogTest.php
php artisan test tests/Feature/OwnerBookingTest.php
php artisan test tests/Feature/OwnerPaymentTest.php
```

### 12.4 Acceptance criteria

The release is considered functionally acceptable when:

1. Unauthorized users receive Forbidden or Not Found responses according to the route policy.
2. Owners cannot access another owner's data.
3. Inactive dogs cannot be used for new bookings.
4. Inactive services cannot be newly booked.
5. Availability rejects conflicting or closed slots.
6. Invalid appointment status transitions are rejected.
7. Payment amounts, methods, proofs, and balances follow the payment rules.
8. Historical appointments remain visible after dog, owner, service, or staff deactivation.
9. The TypeScript/Vite build succeeds.
10. The relevant feature tests pass.

---

## 13. Limitations and Future Enhancements

### 13.1 Current limitations

1. One appointment has one primary service. Add-ons are notes, not independent billable line items.
2. Payments are clinic-recorded proof submissions; no external payment provider is connected.
3. FAQ assistance uses deterministic matching against published content, not generative AI.
4. Reports currently focus on accounts, owners, dogs, breeds, and signups.
5. Automated reminder scheduling and external delivery depend on deployment services and are not treated as fully verified by this document.
6. Owner cancellation is controlled by clinic operations in the current portal workflow.
7. The system is designed for a single clinic context; multi-branch appointment ownership is not yet modeled.
8. Medical history, prescriptions, laboratory results, inventory, and vaccination schedules are not separate modules.
9. Notification read status is session-based rather than persisted per account.
10. The report module does not currently export PDF or spreadsheet files.

### 13.2 Recommended future enhancements

#### Phase 1 - booking and financial maturity

- Add `appointment_services` line items.
- Snapshot service name, price, and duration at booking time.
- Calculate deposits and balances from all line items.
- Add external payment gateway integration and webhooks.
- Add automatic refund workflow where supported by the gateway.

#### Phase 2 - clinical records

- Add medical record entries per dog.
- Add vaccination and deworming history.
- Add prescriptions and medication records.
- Add laboratory requests and results.
- Add document/photo attachments with access control.

#### Phase 3 - automation and communication

- Add scheduled appointment reminder jobs.
- Integrate an SMS provider.
- Integrate transactional email templates and delivery tracking.
- Persist notification read state per owner.
- Add appointment confirmation links.

#### Phase 4 - analytics and operations

- Add revenue reports.
- Add appointment utilization and no-show reports.
- Add staff workload and service performance reports.
- Add CSV/PDF export.
- Add audit logs for sensitive changes.

#### Phase 5 - platform expansion

- Add multi-clinic/branch support.
- Add species support beyond dogs.
- Add mobile application or installable PWA.
- Add inventory and supply management.
- Add teleconsultation support.

---

## 14. Glossary

| Term | Definition |
|---|---|
| Active dog | A dog with `is_active = true` that may be selected for a new booking |
| Appointment | A scheduled visit connecting an owner, dog, primary service, date, time, and status |
| Booking window | The period into the future for which availability is calculated; currently 60 days |
| Complaint | An owner support case with a subject, description, priority, status, and message thread |
| Dog owner | The client role authenticated against `dog_owners` |
| FAQ | A clinic-authored question and answer that may be published to owners |
| Inertia.js | The server-driven SPA bridge used between Laravel responses and React pages |
| No-show | An appointment status indicating the owner did not attend |
| Owner portal | The authenticated client interface under `/portal` |
| Payment proof | An uploaded image used by the clinic to verify a wallet, card, or bank transfer |
| Requested | The initial state of an owner-submitted booking request |
| Settlement | The calculated service price, paid total, balance, and payment state |
| Staff console | Administrative and operations interface for clinic personnel |
| Soft deactivation | Setting an active flag false while retaining the record and its history |
| Slot | A generated date/time option that fits clinic hours and current appointment conflicts |

---

## 15. Document Traceability Summary

This FDD is traceable to the current implementation through:

- Laravel route definitions in `routes/web.php` and `routes/auth.php`.
- Owner, admin, staff, and authentication controllers under `app/Http/Controllers`.
- Form requests under `app/Http/Requests`.
- Domain services under `app/Services`.
- Eloquent models and migrations under `app/Models` and `database/migrations`.
- Inertia/React pages under `resources/js/Pages`.
- Shared layouts and components under `resources/js/Layouts` and `resources/js/Components`.
- Feature tests under `tests/Feature`.

**Document status:** Thesis-ready current-state specification for the repository observed on October 17, 2026.

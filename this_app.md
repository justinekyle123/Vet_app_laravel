**VETERINARY APPOINTMENT SCHEDULING AND PET CARE SERVICES**

**CHAPTER I**

**SYSTEM OVERVIEW AND SCOPE**

**1.1 Executive Summary and Business Problem Definition**

Veterinary Appointment Scheduling and Pet Care Services (VASPCS) is a relational database built to run the daily operations of a small to mid-sized veterinary clinic. It stores information about dog owners, their dogs, clinic staff, services, appointments, payments, notifications, ratings, and complaints in one connected structure instead of scattered records.

A clinic that still books appointments by phone or paper log runs into predictable trouble once it grows past a handful of regular clients. Two owners can end up booked with the same groomer at the same hour. A dog\'s vaccination status might exist only in a staff member\'s memory. A payment collected at the front desk can go unrecorded if it never makes it into the ledger. None of this is unusual --- it happens whenever scheduling, client records, and billing live in separate, disconnected places instead of one system that keeps them in sync.

Consider a dog owner who brings two dogs to the clinic and books several appointments across different months. If that owner\'s phone number and address are retyped into every appointment record, a single change of address means updating a dozen scattered rows instead of one. The same duplication risk applies to a service\'s price, a staff member\'s specialization, or a dog\'s breed information.

The database addresses this by organizing clinic data into related tables. A dog owner is stored once and referenced by every dog, appointment, payment, and notification tied to that owner. Primary keys give each record a stable identity, foreign keys tie related records together, and constraints stop an appointment from being created without a valid dog, owner, and service.

The overall goal is to give the clinic a single, consistent place to manage owners, dogs, staff schedules, services, appointments, payments, feedback, and complaints, while still leaving room for day-to-day reporting.

The objectives of the proposed system:

1.  To develop an online appointment booking system for dog owners.

2.  To store owner, dog, staff, service, and clinic records in one connected database instead of separate notebooks, spreadsheets, and phone logs.

3.  To track an appointment from booking through completion, including the staff member and time slot assigned to it.

4.  To record payments against appointments and flag which ones are still unpaid.

5.  To send appointment reminders and status updates to dog owners through SMS.

6.  To collect a rating and written feedback after a visit, and to log complaints on a separate track so an unresolved issue is not buried inside a five-star review.

7.  To generate reports on appointments, revenue, and service usage for clinic staff.

8.  To reduce duplicate or inconsistent records for dogs, owners, staff, and appointments.

9.  To keep the schema flexible enough to add services, staff roles, or a second clinic branch later without a redesign.

**1.2 Scope and System Boundaries**

The scope of VASPCS covers the data a single-clinic veterinary practice needs to run its scheduling and front-desk work. Every area described here names the tables that carry it, so the scope can be checked against the schema instead of read as a promise.

Client and pet records sit at the front of the schema. The dog_owners table holds one row per client: name, email, hashed password, phone number, address, and a profile photo link. Email and phone number are both unique, so two accounts cannot claim the same identity, and the front desk can pull up a caller by number. An owner who stops using the clinic is switched to inactive rather than deleted, because their appointment history still matters. Each pet is stored in the dogs table with its name, sex, birth date, weight, coat color, vaccination flag, and photo, linked to its owner. Breed is a reference into dog_breeds rather than free text, which keeps the size category in one place instead of repeating it on every dog. One owner can register several dogs, and each dog belongs to exactly one owner.

The clinic itself, its people, and what it sells are handled next. The clinic_info table carries the address, contact details, opening and closing times, and the days the clinic operates. The staff table holds employees and their role, whether veterinarian, groomer, front desk, or admin, along with specialization and license number for medical staff; a staff member who leaves is marked inactive so their past appointments stay intact. The services table stores what the clinic offers, with a price, an expected duration, and a category drawn from service_categories. Price lives there and nowhere else, so a price change updates one row rather than every appointment that used the service, and a service no longer offered is deactivated instead of removed. The time_slots table is the working calendar: a date, a start and end time, and an availability flag, all tied to a staff member. A unique key across staff, date, and start time stops the same person from being booked into the same hour twice, which is the most common scheduling failure in a paper-based clinic.

Bookings and money move through two connected tables. The appointments table ties an owner, a dog, a service, a staff member, and a time slot to a date and time, with a status drawn from appointment_status. Staff and slot are left nullable so a booking can be taken before the assignment is decided. An appointment is the record everything downstream hangs off, and it moves through pending, confirmed, completed, and cancelled without ever being rewritten as a new row. The payments table records the amount, the method used from payment_methods, the state of the payment, a gateway reference, and when it cleared. A payment always names both the appointment it settles and the owner who made it, and the status column is what the unpaid queue at the front desk is built on, so a visit that was never paid for does not disappear from view.

What happens around a visit is kept on separate tracks. The notifications table queues the reminders and updates sent to owners: the message text, the channel, the delivery state, when it was scheduled, and when it went out. The clinic sends reminders by SMS, which is what most clients here actually read; the database stores and tracks the message, while the sending itself happens outside it. The ratings_feedback table holds one score from 1 to 5 and an optional comment per completed appointment, with the staff member being rated recorded where it applies, and a published flag controlling whether the comment is shown to other clients. One appointment can carry one review, which keeps an average rating from being skewed by repeat submissions. Complaints are stored on their own in the complaints table with a subject, a full description, a priority, a status, the staff member handling it, and resolution notes. Linking to an appointment is optional, since a complaint can be about the clinic in general, and keeping complaints out of the ratings table means an unresolved problem is not buried inside a five-star review.

Two smaller areas round out the scope. The faqs table stores the questions and answers shown to owners, grouped by a category from faq_categories, with a published flag so a draft entry stays hidden; front desk staff use the same list when answering the same question by phone for the fourth time that week. The reports table logs what was generated, by whom, over which date range, and where the output file was written, while the figures themselves are computed from the appointment and payment tables. Across all of these, the database also handles data validation, referential integrity between owners, dogs, staff, and appointments, and indexing on the columns most often filtered or searched, such as appointment date, payment status, and complaint status.

A few limits come with this scope, and they are decisions rather than oversights. The schema assumes one operating branch: staff records name a clinic, but appointments carry no clinic reference, so a second branch would mean adding that column and revisiting the reporting queries. It also assumes dogs, since breeds and profiles are stored for dogs only, and taking in cats or other animals would need a species reference rather than a new table. The unique key on the feedback table allows a single rating per appointment, so an owner cannot revise a review or add a follow-up comment later. The updated_at column shows when a row last changed, not what changed or who changed it, so tracing an edited appointment back to the person who edited it would need a separate audit table. Vaccines, medicines, and grooming supplies are not tracked at all, which means the database cannot say whether a service can actually be delivered on a given day. Each appointment is also entered on its own, with no recurring bookings and no waitlist for an owner hoping a slot frees up. None of this stops the clinic from running on the system as it stands; it is written down here so a later phase knows what it is picking up.

**1.2.1 Functions Included in the Database**

The database is responsible for storing and managing:

-   Dog owner accounts and contact information

-   Dog profiles, including breed, sex, weight, and vaccination status

-   Clinic information such as address, hours, and contact details

-   Staff records and roles (veterinarian, front desk, admin)

-   Services offered and the categories they belong to

-   Staff time slots and availability

-   Appointments and their current status

-   Payments and the methods used to make them

-   Notifications sent to dog owners

-   Ratings and written feedback tied to a completed appointment

-   Complaints raised by dog owners and their resolution

-   Frequently asked questions shown to owners

-   Reports generated by staff

**1.2.2 Functions Outside the Database Scope**

Some functions belong to the application layer rather than the database layer. These include:

-   Website and mobile screens

-   The actual sending of SMS notifications

-   Payment gateway processing itself

-   Front-end form validation and styling

-   User session handling and login token management

The database can hold a reference to these processes a gateway reference on a payment record, for instance, or a scheduled_at timestamp on a notification but the gateway call, the message delivery, and the interface itself happen outside the database.

**1.2.3 System Boundary**

The system can be viewed as having three major layers:

**Presentation Layer → Application Layer → Database Layer**

The presentation layer is what a dog owner or staff member actually sees and clicks through. The application layer takes those requests, applies business logic such as checking whether a time slot is still open, and passes validated operations to the database. The database layer stores and protects the clinic\'s persistent data.

The database is not meant to carry every business rule on its own. It provides a controlled, reliable foundation that the application layer builds on.


The InnoDB storage engine is used for every table because it supports transactions, row-level locking, foreign keys, and crash recovery all of which the clinic needs once appointments, payments, and notifications start referencing one another. MyISAM would have been lighter, but a booking that writes an appointment and a time slot cannot be rolled back on an engine that has no transactions.

The utf8mb4 character set with the utf8mb4_unicode_ci collation is used throughout so the database can store owner names, dog names, and service descriptions in a wide range of characters without truncation errors.


Once created, vet_clinic_db becomes the single repository for the clinic\'s persistent data --- owners, dogs, staff, appointments, and everything derived from them.

**1.4 Actor and User Role Analysis**

The system recognizes four categories of users. Each one works with a different slice of the database, and the role is stored directly on the staff record so access can be checked against it.

**Administrator**

The admin role has the widest access in the system. This user manages clinic information, staff accounts, and the service catalog, and reviews clinic-wide activity.

Typical responsibilities include:

-   Managing staff accounts and roles

-   Managing clinic information (hours, contact details, branch data)

-   Managing the service catalog and service categories

-   Reviewing appointments, payments, and complaints across the clinic

-   Generating reports

**Veterinarian and Groomer**

Veterinarians and groomers are handled as one category because they work from the same two tables. Both are service providers: they are assigned to appointments through staff_id, they work from time slots on the same calendar, and they are rated through the same feedback table. What separates them is the role column on their staff record and the services they are booked against, not a different set of data.

Their shared responsibilities include:

-   Viewing the appointments and time slots assigned to them

-   Updating an appointment\'s status as the visit progresses

-   Marking an appointment as completed

-   Reviewing the feedback left on their appointments

-   Responding to complaints assigned to them

Two columns on the staff record apply mainly to veterinarians. specialization and license_number are filled in for medical staff and usually left empty for groomers, which is why both are nullable. A veterinarian can also set is_vaccinated on a dog after treatment; a groomer has no reason to touch that column.

**Dog Owner**

Dog owners are the clinic\'s clients. They interact with the system mainly through a booking interface, but every action they take is stored against their owner_id.

They can:

-   Create an account and add one or more dogs

-   Browse services and book an appointment

-   View upcoming and past appointments

-   Pay for a service and see the payment status

-   Rate a completed appointment and leave written feedback

-   File a complaint if something went wrong

-   Receive appointment reminders and status updates

Role-based access keeps each user limited to the data their responsibilities call for a groomer has no reason to see clinic-wide revenue, and a dog owner should only ever see their own dogs and appointments.
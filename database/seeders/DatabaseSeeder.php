<?php

namespace Database\Seeders;

use App\Enums\StaffRole;
use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\ClinicInfo;
use App\Models\Dog;
use App\Models\DogBreed;
use App\Models\DogOwner;
use App\Models\Faq;
use App\Models\FaqCategory;
use App\Models\Notification;
use App\Models\PaymentMethod;
use App\Models\RatingFeedback;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Staff;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * All seeded accounts share the password "password" — change the staff
     * passwords before using the app anywhere real.
     */
    public function run(): void
    {
        $clinic = $this->seedClinic();
        $this->seedLookups();
        $this->seedFaqs();

        /*
         * Staff accounts are provisioned here rather than through sign-up:
         * registration is open to dog owners only.
         *
         * Everyone but the administrator is client-facing, so the landing
         * page's care team has faces on a fresh install. The administrator has
         * no portrait on purpose, which exercises the initials fallback.
         */
        $accounts = [
            ['Clinic', 'Administrator', 'admin@example.com', StaffRole::Admin, null, null],
            ['Vet', 'Oncalla', 'vet@example.com', StaffRole::Veterinarian, 'Surgery & dental', $this->staffImage('oncalla')],
            ['Clara', 'Mendoza', 'clara@example.com', StaffRole::Veterinarian, 'Internal medicine', $this->staffImage('mendoza')],
            ['Nina', 'Salvador', 'nina@example.com', StaffRole::Groomer, 'Bath, trim, and coat care', $this->staffImage('salvador')],
        ];

        foreach ($accounts as [$firstName, $lastName, $email, $role, $specialization, $image]) {
            Staff::create([
                'clinic_id' => $clinic->clinic_id,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $email,
                'password_hash' => Hash::make('password'),
                'role' => $role,
                'specialization' => $specialization,
                'background' => $role === StaffRole::Veterinarian ? 'Experienced in companion-animal medicine and preventive care.' : ($role === StaffRole::Groomer ? 'Focused on gentle, breed-aware grooming and coat care.' : null),
                'experience_years' => $role === StaffRole::Admin ? null : 8,
                'qualifications' => $role === StaffRole::Veterinarian ? 'Licensed veterinarian' : ($role === StaffRole::Groomer ? 'Certified professional groomer' : null),
                'image_path' => $image,
            ]);
        }

        // A sample client so the staff console and portal have something to
        // show on a fresh install.
        $owner = DogOwner::create([
            'first_name' => 'Test',
            'last_name' => 'Owner',
            'email' => 'owner@example.com',
            'password_hash' => Hash::make('password'),
            'phone_number' => '09171234567',
            'address' => '1 Bark Street',
        ]);

        $dog = Dog::create([
            'owner_id' => $owner->owner_id,
            'dog_name' => 'Rex',
            'breed_id' => DogBreed::where('breed_name', 'Labrador Retriever')->value('breed_id'),
            'sex' => 'Male',
            'is_active' => true,
        ]);

        $this->seedOwnerHistory($owner, $dog);
        $this->seedClinicHistory();
    }

    /**
     * The clinic's own row, which staff records reference.
     */
    private function seedClinic(): ClinicInfo
    {
        return ClinicInfo::query()->first() ?? ClinicInfo::create([
            'clinic_name' => 'MyVet Animal Clinic',
            'address_line' => '1 Bark Street',
            'city' => 'Springfield',
            'province' => 'Pampanga',
            'zip_code' => '2000',
            'contact_number' => '09170000000',
            'email' => 'hello@myvet.test',
            'opening_time' => '08:00:00',
            'closing_time' => '18:00:00',
            'days_open' => 'Monday-Saturday',
        ]);
    }

    /**
     * The small fixed lists the schema expects to be populated: breeds,
     * service and FAQ categories, payment methods, and appointment statuses.
     */
    private function seedLookups(): void
    {
        $breeds = [
            ['breed_name' => 'Aspin (Mixed Breed)', 'size_category' => 'Medium'],
            ['breed_name' => 'Chihuahua', 'size_category' => 'Toy'],
            ['breed_name' => 'Shih Tzu', 'size_category' => 'Small'],
            ['breed_name' => 'Poodle', 'size_category' => 'Small'],
            ['breed_name' => 'Labrador Retriever', 'size_category' => 'Large'],
            ['breed_name' => 'Golden Retriever', 'size_category' => 'Large'],
            ['breed_name' => 'German Shepherd', 'size_category' => 'Large'],
            ['breed_name' => 'Great Dane', 'size_category' => 'Giant'],
        ];

        foreach ($breeds as $breed) {
            DogBreed::firstOrCreate(['breed_name' => $breed['breed_name']], $breed);
        }

        $categories = [
            ['category_name' => 'Consultation', 'description' => 'Check-ups and general visits'],
            ['category_name' => 'Vaccination', 'description' => 'Immunisation and boosters'],
            ['category_name' => 'Grooming', 'description' => 'Bathing, trimming, and nail care'],
            ['category_name' => 'Surgery', 'description' => 'Procedures performed under anaesthesia'],
            ['category_name' => 'Diagnostics', 'description' => 'Laboratory work and imaging'],
        ];

        foreach ($categories as $category) {
            ServiceCategory::firstOrCreate(['category_name' => $category['category_name']], $category);
        }

        foreach (['Cash', 'Card', 'GCash', 'Bank Transfer'] as $method) {
            PaymentMethod::firstOrCreate(['method_name' => $method]);
        }

        foreach (['Requested', 'Confirmed', 'Completed', 'Cancelled', 'No-show'] as $status) {
            AppointmentStatus::firstOrCreate(['status_name' => $status]);
        }

        foreach (['Bookings', 'Billing', 'Visits', 'Reviews', 'Account', 'Get in touch'] as $name) {
            FaqCategory::firstOrCreate(['category_name' => $name]);
        }
    }

    /**
     * Help questions for the portal's floating FAQ button. Keyed by the
     * category the clinic files them under; a fresh install then has a useful
     * help panel without anyone writing the copy first.
     */
    private function seedFaqs(): void
    {
        $menu = [
            'Bookings' => [
                ['How do I book a visit?', 'Open Services, pick the care your dog needs, then choose a day and time. The front desk confirms every request, and you can follow its status here.'],
                ['Can I cancel a booking?', 'Yes. Any upcoming visit has a Cancel button on the appointments page, as long as the clinic has not already marked it complete.'],
                ['How soon can I book?', 'The calendar only offers days the clinic has free slots on, usually within the next few weeks. For anything urgent, call the front desk.'],
                ['How do I know the clinic has confirmed my booking?', 'Every request starts out as Requested. Once the desk accepts it the visit turns Confirmed and a message arrives in the bell at the top of the page. Your appointments page shows which of the two a visit is in.'],
                ['Can I book for more than one dog at a time?', 'Book one visit per dog. Each visit gets its own slot and its own record, so the vet has time for every dog you bring.'],
                ['Can I book a service again?', 'Yes. Every visit in your history has a Book again button that takes you back to the calendar for the same service.'],
                ['Can I move a booking to another day?', 'Yes. Cancel the visit from your appointments page, which costs nothing, and book the day you want from Services.'],
                ['What if I arrive late or miss a visit?', 'Call the desk as soon as you can and they will tell you whether the slot can still be used. A visit nobody turns up for is marked No-show: it is not charged, but the time is gone and you will need to book again.'],
            ],
            'Visits' => [
                ['What should I bring?', 'Your dog\'s vaccination record if you have it, and any medication they are taking. A leash or carrier keeps everyone safe in the waiting room.'],
                ['How long is a visit?', 'Each service lists its own length on the menu, from a 15-minute booster to a full groom.'],
                ['Can I stay with my dog?', 'For most consultations, yes. For procedures under anaesthesia the team will ask you to wait in reception and will call you when your dog is awake.'],
                ['Will my dog see a veterinarian or a groomer?', 'Vet care and diagnostics are booked with a veterinarian, and grooming with a groomer. Each service on the menu names the member of the team it is booked against.'],
                ['What should I do in an emergency?', 'Call the clinic instead of booking online and the team will tell you whether to come straight in. Booking a normal visit first would only slow your dog down.'],
            ],
            'Billing' => [
                ['When do I pay?', 'Payment is taken at the desk when the visit is finished. The price of each service is shown on the menu before you book.'],
                ['Which payment methods do you accept?', 'Cash, card, GCash, and bank transfer.'],
                ['How much will a visit cost?', 'Every service on the menu shows its own price before you book it, and your appointments page adds up what you have spent on the visits the clinic has completed.'],
                ['Am I charged if I cancel?', 'No. Cancelling an upcoming visit is free, and only visits the clinic has carried out are billed.'],
                ['Can I get a statement of what I have paid?', 'Ask the desk and they can print one. The same figures sit under Your record at the top of your appointments page.'],
            ],
            'Reviews' => [
                ['How do I rate a visit?', 'Once the clinic has marked a visit complete, that row on your appointments page offers a rate button. Choose your stars and add a comment if you want to.'],
                ['Who can see my review?', 'Your review is published on the service it was about, under your first name and the initial of your surname, and the clinic reads it too.'],
                ['Can I change a review after leaving it?', 'A visit can be rated once. If something in a review needs correcting, send the clinic a message from the help button and they will sort it out with you.'],
            ],
            'Account' => [
                ['How do I add another dog?', 'Open \"My account & dogs\" from the profile menu and add the new dog there.'],
                ['I forgot my password.', 'Use the forgot-password link on the sign-in page, or call the front desk and they will help you back in.'],
                ['How do I change my email address or phone number?', 'Your details and your dogs are on the same page: open \"My account & dogs\" from the profile menu and edit them there.'],
                ['What does the Booster due badge mean?', 'It is your dog\'s vaccination flag. Once the clinic has given the booster, tick Vaccinated on the \"My account & dogs\" page and the home page will show the dog as up to date.'],
                ['Where do the messages from the clinic appear?', 'In the bell at the top of every portal page. Opening it lists them newest first and clears the unread count.'],
            ],
            'Get in touch' => [
                ['How do I ask the clinic a question?', 'Use the help button at the bottom-right of any portal page. Ask your question there and it is answered from these pages; the same panel has a Complaints side if you would rather write to a person.'],
                ['How do I complain about a visit?', 'Open the help button, choose Complaints, and write what happened. You can point the complaint at the visit it is about so the desk has the context, and their reply lands in the same thread.'],
                ['How long does a reply to a complaint take?', 'The desk reads complaints during opening hours and answers them in the thread. You will see the reply when you open the help panel, and the thread stays there until the complaint is settled.'],
            ],
        ];

        $categoryIds = FaqCategory::query()->pluck('faq_category_id', 'category_name');

        foreach ($menu as $categoryName => $questions) {
            $categoryId = $categoryIds[$categoryName] ?? null;

            if ($categoryId === null) {
                continue;
            }

            foreach ($questions as [$question, $answer]) {
                Faq::firstOrCreate(
                    ['faq_category_id' => $categoryId, 'question' => $question],
                    ['answer' => $answer, 'is_published' => true],
                );
            }
        }
    }

    /**
     * The sample client's visit history, so the portal's appointments page and
     * notification bell have real records behind them.
     */
    private function seedOwnerHistory(DogOwner $owner, Dog $dog): void
    {
        $services = $this->seedServices();

        $completed = AppointmentStatus::where('status_name', 'Completed')->value('status_id');
        $confirmed = AppointmentStatus::where('status_name', 'Confirmed')->value('status_id');

        $visit = Appointment::create([
            'owner_id' => $owner->owner_id,
            'dog_id' => $dog->dog_id,
            'service_id' => $services['Wellness Exam']->service_id,
            'appointment_date' => now()->subWeeks(6)->toDateString(),
            'appointment_time' => '09:30:00',
            'status_id' => $completed,
            'notes' => 'Healthy; due for a booster next season.',
        ]);

        /*
         * Feedback for that visit, so the landing page's rating and its review
         * count are a real average over real rows.
         */
        RatingFeedback::create([
            'appointment_id' => $visit->appointment_id,
            'owner_id' => $owner->owner_id,
            'staff_id' => Staff::where('role', StaffRole::Veterinarian)->value('staff_id'),
            'rating' => 5,
            'comment' => 'The vet explained everything and Rex stayed calm the whole visit.',
            'is_published' => true,
        ]);

        $boosterOn = now()->addDays(5);

        Appointment::create([
            'owner_id' => $owner->owner_id,
            'dog_id' => $dog->dog_id,
            'service_id' => $services['Core Vaccine Booster']->service_id,
            'appointment_date' => $boosterOn->toDateString(),
            'appointment_time' => '10:00:00',
            'status_id' => $confirmed,
            'notes' => 'Booster visit.',
        ]);

        $this->seedNotification(
            $owner,
            'SMS',
            'Rex is due for a core vaccine booster on '.$boosterOn->format('M j').'.',
            now()->subDay(),
        );

        $this->seedNotification(
            $owner,
            'Email',
            'Welcome to MyVet! Your portal is ready — Rex\'s records live here.',
            now()->subDays(3),
        );
    }

    /**
     * A believable slice of the clinic's past, so the landing page's headline
     * counts — the pets cared for and the average rating — are averages over
     * real rows rather than numbers written into the copy. Each owner here has
     * one completed visit; most leave a published rating, and one draft stays
     * unpublished to prove it is left out of the average.
     */
    private function seedClinicHistory(): void
    {
        $services = Service::query()->where('is_active', true)->pluck('service_id');
        $statusId = AppointmentStatus::where('status_name', 'Completed')->value('status_id');
        $vetId = Staff::where('role', StaffRole::Veterinarian)->value('staff_id');

        /*
         * A fixed mix of ratings, weighted toward happy owners: mostly fives
         * and fours with a couple of threes, which settles the average just
         * above four stars the way a real clinic's would.
         */
        $ratings = [5, 5, 5, 5, 4, 5, 4, 5, 5, 4, 5, 3, 5, 4, 5, 5, 4, 3, 5, 5, 4, 5, 5, 4];

        $bookVisit = function (DogOwner $owner, Dog $dog, int $rating, bool $published) use ($services, $statusId, $vetId): void {
            $visit = Appointment::create([
                'owner_id' => $owner->owner_id,
                'dog_id' => $dog->dog_id,
                'service_id' => $services->random(),
                'staff_id' => $vetId,
                'appointment_date' => now()->subDays(fake()->numberBetween(20, 540))->toDateString(),
                'appointment_time' => '10:00:00',
                'status_id' => $statusId,
            ]);

            RatingFeedback::create([
                'appointment_id' => $visit->appointment_id,
                'owner_id' => $owner->owner_id,
                'staff_id' => $vetId,
                'rating' => $rating,
                'comment' => 'A sample review from the clinic\'s seeded history.',
                'is_published' => $published,
            ]);
        };

        foreach ($ratings as $rating) {
            $owner = DogOwner::factory()->create();
            $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);

            $bookVisit($owner, $dog, $rating, true);
        }

        // An unpublished draft, which must not move the average or the count.
        $owner = DogOwner::factory()->create();
        $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
        $bookVisit($owner, $dog, 1, false);
    }

    /**
     * The service menu the desk books from.
     *
     * Eleven services spread across all five categories, so the booking flow
     * and the landing page's menu have something realistic to work against on
     * a fresh install. "Wellness Exam" and "Core Vaccine Booster" are also
     * referenced by the sample owner's visit history below.
     *
     * @return array<string, Service>
     */
    private function seedServices(): array
    {
        $menu = [
            ['Consultation', 'Wellness Exam', 'A routine nose-to-tail check-up.', 650, 30],
            ['Consultation', 'Senior Pet Consultation', 'A longer visit for older dogs: mobility, dental, and bloodwork review.', 950, 45],
            ['Vaccination', 'Core Vaccine Booster', 'Distemper, parvo, and hepatitis booster.', 850, 15],
            ['Vaccination', 'Anti-rabies Shot', 'A single anti-rabies vaccination.', 450, 15],
            ['Vaccination', 'Kennel Cough Vaccine', 'Bordetella vaccine, recommended before boarding.', 700, 15],
            ['Grooming', 'Full Groom', 'Bath, trim, ear clean, and nail clipping.', 900, 90],
            ['Grooming', 'Nail Trim & Ear Clean', 'A quick tidy-up between full grooms.', 350, 30],
            ['Surgery', 'Spay or Neuter', 'Routine sterilisation under general anaesthesia.', 4500, 120],
            ['Surgery', 'Dental Cleaning & Polishing', 'Scale and polish under anaesthesia, with extractions where needed.', 2800, 60],
            ['Diagnostics', 'Complete Blood Count', 'In-house bloodwork, results the same visit.', 1200, 30],
            ['Diagnostics', 'X-Ray Imaging', 'Digital radiographs, read the same day.', 1800, 30],
        ];

        $services = [];

        foreach ($menu as $index => [$categoryName, $name, $description, $price, $duration]) {
            $services[$name] = Service::create([
                'category_id' => ServiceCategory::where('category_name', $categoryName)->value('category_id'),
                'service_name' => $name,
                'description' => $description,
                'image_path' => $this->serviceImage($index),
                'price' => $price,
                'duration_minutes' => $duration,
            ]);
        }

        return $services;
    }

    /**
     * Demo photography for a seeded service, cycling the clinic's own artwork.
     *
     * `image_path` accepts a full URL, so a fresh install shows pictures
     * without anyone uploading files; real photos replace these from the
     * service screen.
     */
    private function serviceImage(int $index): string
    {
        $artwork = [
            'https://polo-pecan-73837341.figma.site/_assets/v11/3e5158dad63d392ade022e81890edc9f54d750bc.png',
            'https://polo-pecan-73837341.figma.site/_assets/v11/8d44b25186ef45a5789c74668fb781cea4e1ff49.png',
            'https://polo-pecan-73837341.figma.site/_assets/v11/96745c4e72ad5c5208e53a885df797fd82cd854a.png?h=1024',
            'https://polo-pecan-73837341.figma.site/_assets/v11/81bd2e7a66b58f3d8f3ad78fd1ebf01af8dfdee1.png',
            'https://polo-pecan-73837341.figma.site/_assets/v11/76be6ec3a93a703b15e9cc01e764a4e3f9d7d2c0.png',
        ];

        return $artwork[$index % count($artwork)];
    }

    /**
     * A placeholder portrait for a seeded staff member. Real portraits replace
     * these from the staff screen.
     */
    private function staffImage(string $seed): string
    {
        return "https://picsum.photos/seed/myvet-{$seed}/600/800.jpg";
    }

    /**
     * A notification log row. The table has no updated_at and its created_at
     * defaults to now, so the timestamp is set explicitly to keep the seeded
     * feed in a readable order.
     */
    private function seedNotification(
        DogOwner $owner,
        string $channel,
        string $message,
        \DateTimeInterface $createdAt,
    ): void {
        $notification = new Notification([
            'owner_id' => $owner->owner_id,
            'channel' => $channel,
            'message' => $message,
            'status' => 'Sent',
            'sent_at' => $createdAt,
        ]);

        $notification->created_at = $createdAt;
        $notification->save();
    }
}

<?php

namespace Database\Seeders;

use App\Enums\StaffRole;
use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\ClinicInfo;
use App\Models\Dog;
use App\Models\DogBreed;
use App\Models\DogOwner;
use App\Models\FaqCategory;
use App\Models\Notification;
use App\Models\PaymentMethod;
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

        /*
         * Staff accounts are provisioned here rather than through sign-up:
         * registration is open to dog owners only.
         */
        Staff::create([
            'clinic_id' => $clinic->clinic_id,
            'first_name' => 'Clinic',
            'last_name' => 'Administrator',
            'email' => 'admin@example.com',
            'password_hash' => Hash::make('password'),
            'role' => StaffRole::Admin,
        ]);

        Staff::create([
            'clinic_id' => $clinic->clinic_id,
            'first_name' => 'Front',
            'last_name' => 'Desk',
            'email' => 'frontdesk@example.com',
            'password_hash' => Hash::make('password'),
            'role' => StaffRole::FrontDesk,
        ]);

        Staff::create([
            'clinic_id' => $clinic->clinic_id,
            'first_name' => 'Vet',
            'last_name' => 'Oncalla',
            'email' => 'vet@example.com',
            'password_hash' => Hash::make('password'),
            'role' => StaffRole::Veterinarian,
        ]);

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

        foreach (['Bookings', 'Billing', 'Visits', 'Account'] as $name) {
            FaqCategory::firstOrCreate(['category_name' => $name]);
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

        Appointment::create([
            'owner_id' => $owner->owner_id,
            'dog_id' => $dog->dog_id,
            'service_id' => $services['Wellness Exam']->service_id,
            'appointment_date' => now()->subWeeks(6)->toDateString(),
            'appointment_time' => '09:30:00',
            'status_id' => $completed,
            'notes' => 'Healthy; due for a booster next season.',
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
     * The service menu the desk books from.
     *
     * Five services, spread across the consultation, vaccination, grooming,
     * and diagnostics categories, so the booking flow has a realistic menu to
     * work against on a fresh install. "Wellness Exam" and "Core Vaccine
     * Booster" are also referenced by the sample owner's visit history below.
     *
     * @return array<string, Service>
     */
    private function seedServices(): array
    {
        $menu = [
            ['Consultation', 'Wellness Exam', 'A routine nose-to-tail check-up.', 650, 30],
            ['Vaccination', 'Core Vaccine Booster', 'Distemper, parvo, and hepatitis booster.', 850, 15],
            ['Vaccination', 'Anti-rabies Shot', 'A single anti-rabies vaccination.', 450, 15],
            ['Grooming', 'Full Groom', 'Bath, trim, ear clean, and nail clipping.', 900, 90],
            ['Diagnostics', 'Complete Blood Count', 'In-house bloodwork, results the same visit.', 1200, 30],
        ];

        $services = [];

        foreach ($menu as [$categoryName, $name, $description, $price, $duration]) {
            $services[$name] = Service::create([
                'category_id' => ServiceCategory::where('category_name', $categoryName)->value('category_id'),
                'service_name' => $name,
                'description' => $description,
                'price' => $price,
                'duration_minutes' => $duration,
            ]);
        }

        return $services;
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

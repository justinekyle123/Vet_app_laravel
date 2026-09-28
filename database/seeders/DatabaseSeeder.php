<?php

namespace Database\Seeders;

use App\Enums\StaffRole;
use App\Models\AppointmentStatus;
use App\Models\ClinicInfo;
use App\Models\Dog;
use App\Models\DogBreed;
use App\Models\DogOwner;
use App\Models\FaqCategory;
use App\Models\PaymentMethod;
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

        Dog::create([
            'owner_id' => $owner->owner_id,
            'dog_name' => 'Rex',
            'breed_id' => DogBreed::where('breed_name', 'Labrador Retriever')->value('breed_id'),
            'sex' => 'Male',
            'is_active' => true,
        ]);
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
}

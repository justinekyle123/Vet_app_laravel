<?php

namespace Database\Seeders;

use App\Models\Owner;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        /*
         * Registration is open to dog owners only: it always creates an
         * "owner" account with a matching client record. Staff accounts are
         * provisioned here instead of through sign-up.
         *
         * All seeded accounts share the factory password "password" — change
         * the staff passwords before using the app anywhere real.
         */
        $ownerUser = User::factory()->owner()->create([
            'name' => 'Test Owner',
            'email' => 'owner@example.com',
        ]);
        Owner::provisionFor($ownerUser);

        User::factory()->admin()->create([
            'name' => 'Clinic Administrator',
            'email' => 'admin@example.com',
        ]);

        User::factory()->frontDesk()->create([
            'name' => 'Front Desk',
            'email' => 'frontdesk@example.com',
        ]);
    }
}

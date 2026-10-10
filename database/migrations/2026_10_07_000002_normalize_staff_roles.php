<?php

use App\Enums\StaffRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The imported dump predates the role rename: its front-desk row carries an
     * empty string where MySQL refused the value 'front_desk'. Reading that row
     * through the StaffRole enum cast throws, which takes down every page that
     * lists staff. Repair it to admin — the role the front desk was folded
     * into — so the cast always has a valid value.
     */
    public function up(): void
    {
        DB::table('staff')
            ->where(function ($query) {
                $query->whereNull('role')->orWhere('role', '');
            })
            ->update(['role' => StaffRole::Admin->value]);
    }

    /**
     * Irreversible: the empty value is exactly what this repair removes, and
     * the retired front-desk role no longer exists to restore.
     */
    public function down(): void
    {
        //
    }
};

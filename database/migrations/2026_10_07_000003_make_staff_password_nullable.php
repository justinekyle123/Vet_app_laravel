<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Vets and groomers are a care-team profile, not an application account:
     * they do not sign in, so their row carries no credential. The column was
     * not-null when every staff row was expected to log in; it becomes nullable
     * so a profile without a password can be stored.
     */
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->string('password_hash')->nullable()->change();
        });
    }

    /**
     * Irreversible in practice: rows already created without a credential would
     * block a not-null restore, so the column stays nullable.
     */
    public function down(): void
    {
        //
    }
};

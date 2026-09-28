<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->increments('staff_id');
            $table->unsignedInteger('clinic_id');
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email', 150)->unique();
            // Named password_hash rather than users.password: there is no users
            // table, so each staff account carries its own credential.
            $table->string('password_hash');
            $table->string('phone_number', 20)->nullable();
            $table->enum('role', ['veterinarian', 'admin', 'front_desk', 'groomer']);
            $table->string('specialization', 150)->nullable();
            $table->string('license_number', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('clinic_id')->references('clinic_id')->on('clinic_info')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};

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
        Schema::create('clinic_info', function (Blueprint $table) {
            $table->increments('clinic_id');
            $table->string('clinic_name', 150);
            $table->string('address_line');
            $table->string('city', 100);
            $table->string('province', 100);
            $table->string('zip_code', 10)->nullable();
            $table->string('contact_number', 20);
            $table->string('email', 150);
            $table->time('opening_time');
            $table->time('closing_time');
            $table->string('days_open', 100)->default('Monday-Saturday');
            $table->string('logo_url')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_info');
    }
};

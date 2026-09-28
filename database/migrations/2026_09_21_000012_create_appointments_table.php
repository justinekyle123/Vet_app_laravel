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
        Schema::create('appointments', function (Blueprint $table) {
            $table->increments('appointment_id');
            $table->unsignedInteger('owner_id');
            $table->unsignedInteger('dog_id');
            $table->unsignedInteger('service_id');
            $table->unsignedInteger('staff_id')->nullable();
            $table->unsignedInteger('slot_id')->nullable();
            $table->date('appointment_date');
            $table->time('appointment_time');
            $table->unsignedTinyInteger('status_id')->default(1);
            $table->text('notes')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('appointment_date', 'idx_appt_date');
            $table->index('owner_id', 'idx_appt_owner');
            $table->index('status_id', 'idx_appt_status');

            $table->foreign('dog_id')->references('dog_id')->on('dogs')->onDelete('cascade');
            $table->foreign('owner_id')->references('owner_id')->on('dog_owners')->onDelete('cascade');
            $table->foreign('service_id')->references('service_id')->on('services');
            $table->foreign('slot_id')->references('slot_id')->on('time_slots')->onDelete('set null');
            $table->foreign('staff_id')->references('staff_id')->on('staff')->onDelete('set null');
            $table->foreign('status_id')->references('status_id')->on('appointment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};

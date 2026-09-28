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
        // The clinic's own notification log (appointment reminders and the
        // like) — not Laravel's polymorphic notifications table.
        Schema::create('notifications', function (Blueprint $table) {
            $table->increments('notification_id');
            $table->unsignedInteger('owner_id');
            $table->unsignedInteger('appointment_id')->nullable();
            $table->enum('channel', ['SMS', 'Email', 'Push'])->default('SMS');
            $table->string('message', 320);
            $table->enum('status', ['Pending', 'Sent', 'Failed'])->default('Pending');
            $table->dateTime('scheduled_at')->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->dateTime('created_at')->useCurrent();

            $table->index('status', 'idx_notif_status');

            $table->foreign('appointment_id')->references('appointment_id')->on('appointments')->onDelete('cascade');
            $table->foreign('owner_id')->references('owner_id')->on('dog_owners')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};

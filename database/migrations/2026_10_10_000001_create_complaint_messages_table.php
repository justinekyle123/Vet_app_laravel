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
        /*
         * One row per message in a complaint thread: the client's opening
         * message, the clinic's replies, and anything the client adds. Exactly
         * one of owner_id and staff_id is set, which is what tells the two
         * sides of the conversation apart.
         */
        Schema::create('complaint_messages', function (Blueprint $table) {
            $table->increments('message_id');
            $table->unsignedInteger('complaint_id');
            $table->unsignedInteger('owner_id')->nullable();
            $table->unsignedInteger('staff_id')->nullable();
            $table->text('body');
            $table->dateTime('created_at')->useCurrent();

            $table->index('complaint_id', 'idx_complaint_message_thread');

            $table->foreign('complaint_id')->references('complaint_id')->on('complaints')->onDelete('cascade');
            $table->foreign('owner_id')->references('owner_id')->on('dog_owners')->onDelete('set null');
            $table->foreign('staff_id')->references('staff_id')->on('staff')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('complaint_messages');
    }
};

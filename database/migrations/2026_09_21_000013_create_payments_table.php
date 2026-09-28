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
        Schema::create('payments', function (Blueprint $table) {
            $table->increments('payment_id');
            $table->unsignedInteger('appointment_id');
            $table->unsignedInteger('owner_id');
            $table->unsignedTinyInteger('method_id');
            $table->decimal('amount', 10, 2);
            $table->enum('payment_status', ['Pending', 'Paid', 'Refunded', 'Failed'])->default('Pending');
            $table->string('gateway_reference', 150)->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('payment_status', 'idx_payment_status');

            $table->foreign('appointment_id')->references('appointment_id')->on('appointments')->onDelete('cascade');
            $table->foreign('method_id')->references('method_id')->on('payment_methods');
            $table->foreign('owner_id')->references('owner_id')->on('dog_owners')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

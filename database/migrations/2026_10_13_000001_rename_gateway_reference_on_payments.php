<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Online payments are taken by the clinic itself, so the number stored
     * against a payment is the reference the client can quote back — not an
     * identifier handed over by a payment gateway. The column is renamed to
     * say what it now holds; existing values are kept as they are.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->renameColumn('gateway_reference', 'reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->renameColumn('reference', 'gateway_reference');
        });
    }
};

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
        Schema::create('reports', function (Blueprint $table) {
            $table->increments('report_id');
            $table->unsignedInteger('generated_by');
            $table->enum('report_type', ['Appointments', 'Revenue', 'Services', 'Notifications', 'Custom']);
            $table->date('date_from');
            $table->date('date_to');
            $table->string('file_path')->nullable();
            $table->dateTime('generated_at')->useCurrent();

            $table->foreign('generated_by')->references('staff_id')->on('staff')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};

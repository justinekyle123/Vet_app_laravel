<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The marketing page shows a picture for each service and each member of
     * the care team, so both rows carry their own image.
     *
     * The column holds either a path on the public disk
     * ("services/wellness-exam.jpg") or a full URL when the image is hosted
     * elsewhere; null means "no picture yet" and the page falls back to its own
     * artwork or an initials monogram.
     */
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('image_path')->nullable();
        });

        Schema::table('staff', function (Blueprint $table) {
            $table->string('image_path')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });

        Schema::table('staff', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });
    }
};

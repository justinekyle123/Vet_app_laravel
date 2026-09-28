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
        Schema::create('dog_breeds', function (Blueprint $table) {
            $table->smallIncrements('breed_id');
            $table->string('breed_name', 100)->unique();
            $table->enum('size_category', ['Toy', 'Small', 'Medium', 'Large', 'Giant'])
                ->default('Medium');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dog_breeds');
    }
};

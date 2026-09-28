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
        Schema::create('dogs', function (Blueprint $table) {
            $table->increments('dog_id');
            $table->unsignedInteger('owner_id');
            $table->string('dog_name', 100);
            $table->unsignedSmallInteger('breed_id')->nullable();
            $table->enum('sex', ['Male', 'Female', 'Unknown'])->default('Unknown');
            $table->date('birth_date')->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->string('color', 50)->nullable();
            $table->boolean('is_vaccinated')->default(false);
            $table->string('photo_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('owner_id', 'idx_dog_owner');
            $table->foreign('breed_id')->references('breed_id')->on('dog_breeds')->onDelete('set null');
            $table->foreign('owner_id')->references('owner_id')->on('dog_owners')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dogs');
    }
};

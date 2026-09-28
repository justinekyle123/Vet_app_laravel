<?php

namespace App\Models;

use Database\Factories\DogFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A dog registered to an owner.
 *
 * The schema keeps a proper `breed_id` foreign key rather than a free-text
 * breed column, so breed names stay consistent across the clinic.
 */
class Dog extends Model
{
    /** @use HasFactory<DogFactory> */
    use HasFactory;

    protected $table = 'dogs';

    protected $primaryKey = 'dog_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'owner_id',
        'dog_name',
        'breed_id',
        'sex',
        'birth_date',
        'weight_kg',
        'color',
        'is_vaccinated',
        'photo_url',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'weight_kg' => 'decimal:2',
            'is_vaccinated' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(DogOwner::class, 'owner_id', 'owner_id');
    }

    public function breed(): BelongsTo
    {
        return $this->belongsTo(DogBreed::class, 'breed_id', 'breed_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'dog_id', 'dog_id');
    }
}

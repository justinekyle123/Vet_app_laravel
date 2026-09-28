<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A recognised breed, with the size band the clinic uses for dosing.
 *
 * Pure lookup table: the dump gives it no timestamps.
 */
class DogBreed extends Model
{
    protected $table = 'dog_breeds';

    protected $primaryKey = 'breed_id';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'breed_name',
        'size_category',
    ];

    public function dogs(): HasMany
    {
        return $this->hasMany(Dog::class, 'breed_id', 'breed_id');
    }
}

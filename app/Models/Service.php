<?php

namespace App\Models;

use App\Enums\StaffRole;
use App\Models\Concerns\HasImage;
use Database\Factories\ServiceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A bookable clinic service, e.g. a consultation, vaccination, or grooming.
 *
 * Services are deactivated rather than deleted so appointment history that
 * references them stays readable.
 */
class Service extends Model
{
    /** @use HasFactory<ServiceFactory> */
    use HasFactory, HasImage;

    protected $table = 'services';

    protected $primaryKey = 'service_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'category_id',
        'service_name',
        'description',
        'image_path',
        'duration_minutes',
        'price',
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
            'duration_minutes' => 'integer',
            'price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'category_id', 'category_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'service_id', 'service_id');
    }

    /**
     * The staff role the clinic books for this service.
     *
     * Grooming is the one discipline handled by groomers; every other category
     * is medical work and goes to a veterinarian. The owner portal uses this to
     * show the care team the client can expect, and the booking flow uses the
     * same rule, so the two never disagree.
     */
    public function providerRole(): StaffRole
    {
        $category = strtolower((string) $this->category?->category_name);

        return str_contains($category, 'groom')
            ? StaffRole::Groomer
            : StaffRole::Veterinarian;
    }
}

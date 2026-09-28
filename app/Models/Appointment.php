<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * A booking: who is bringing which dog, for what service, and when.
 */
class Appointment extends Model
{
    protected $table = 'appointments';

    protected $primaryKey = 'appointment_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'owner_id',
        'dog_id',
        'service_id',
        'staff_id',
        'slot_id',
        'appointment_date',
        'appointment_time',
        'status_id',
        'notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'appointment_date' => 'date',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(DogOwner::class, 'owner_id', 'owner_id');
    }

    public function dog(): BelongsTo
    {
        return $this->belongsTo(Dog::class, 'dog_id', 'dog_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id', 'service_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id', 'staff_id');
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(TimeSlot::class, 'slot_id', 'slot_id');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(AppointmentStatus::class, 'status_id', 'status_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'appointment_id', 'appointment_id');
    }

    public function feedback(): HasOne
    {
        return $this->hasOne(RatingFeedback::class, 'appointment_id', 'appointment_id');
    }
}

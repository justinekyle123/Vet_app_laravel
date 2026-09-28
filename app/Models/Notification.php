<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A message the clinic sent (or queued) to an owner.
 *
 * This is the clinic's own notification log, not Laravel's polymorphic
 * notifications table: the schema records the channel, body, and delivery
 * state directly against the owner and appointment.
 */
class Notification extends Model
{
    protected $table = 'notifications';

    protected $primaryKey = 'notification_id';

    /** The dump stamps `created_at` on insert and never updates it. */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'owner_id',
        'appointment_id',
        'channel',
        'message',
        'status',
        'scheduled_at',
        'sent_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'sent_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(DogOwner::class, 'owner_id', 'owner_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id', 'appointment_id');
    }
}

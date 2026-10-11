<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A concern raised by an owner, tracked through to resolution.
 */
class Complaint extends Model
{
    /** The statuses a complaint is finished under. */
    public const SETTLED = ['Resolved', 'Closed'];

    protected $table = 'complaints';

    protected $primaryKey = 'complaint_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'owner_id',
        'appointment_id',
        'subject',
        'description',
        'priority',
        'status',
        'assigned_to',
        'resolution_notes',
        'resolved_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
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

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'assigned_to', 'staff_id');
    }

    /**
     * The conversation on this complaint, oldest first.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ComplaintMessage::class, 'complaint_id', 'complaint_id')
            ->orderBy('created_at')
            ->orderBy('message_id');
    }

    /**
     * True once the clinic has answered the complaint for good. A settled
     * thread stays readable on both sides but is no longer waiting on anyone.
     */
    public function isSettled(): bool
    {
        return in_array($this->status, self::SETTLED, true);
    }
}

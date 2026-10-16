<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Money taken (or due) for an appointment.
 */
class Payment extends Model
{
    /** The states the schema allows for `payment_status`. */
    public const STATUS_PENDING = 'Pending';

    public const STATUS_PAID = 'Paid';

    public const STATUS_REFUNDED = 'Refunded';

    public const STATUS_FAILED = 'Failed';

    protected $table = 'payments';

    protected $primaryKey = 'payment_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'appointment_id',
        'owner_id',
        'method_id',
        'amount',
        'payment_status',
        'reference',
        'payment_proof_path',
        'paid_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id', 'appointment_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(DogOwner::class, 'owner_id', 'owner_id');
    }

    public function method(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'method_id', 'method_id');
    }

    public function isPaid(): bool
    {
        return $this->payment_status === self::STATUS_PAID;
    }

    /**
     * The screenshot of this payment, as the desk opens it, or null when the
     * client did not upload one.
     *
     * Relative, like every other image the clinic renders, so it follows
     * whichever host the page is served from rather than the value baked into
     * APP_URL at the time the row was written.
     */
    public function proofUrl(): ?string
    {
        return $this->payment_proof_path === null
            ? null
            : '/storage/'.ltrim($this->payment_proof_path, '/');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The fixed set of appointment states, e.g. Requested, Confirmed, Completed.
 */
class AppointmentStatus extends Model
{
    /**
     * The statuses a booking can still be cancelled from. Once a visit is
     * completed, cancelled, or missed it is history, not something to undo.
     */
    public const CANCELLABLE = ['Requested', 'Confirmed'];

    protected $table = 'appointment_status';

    protected $primaryKey = 'status_id';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'status_name',
    ];

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'status_id', 'status_id');
    }
}

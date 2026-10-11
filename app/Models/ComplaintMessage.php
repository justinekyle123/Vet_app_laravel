<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One message in a complaint thread.
 *
 * A message is written either by the client who raised the complaint or by a
 * member of clinic staff; whichever id is set is the author.
 */
class ComplaintMessage extends Model
{
    protected $table = 'complaint_messages';

    protected $primaryKey = 'message_id';

    /**
     * The thread has a created_at but no updated_at: a message is a record of
     * what was said, not something that gets revised.
     */
    public const UPDATED_AT = null;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'complaint_id',
        'owner_id',
        'staff_id',
        'body',
    ];

    public function complaint(): BelongsTo
    {
        return $this->belongsTo(Complaint::class, 'complaint_id', 'complaint_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(DogOwner::class, 'owner_id', 'owner_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id', 'staff_id');
    }

    /** True when the client wrote this message rather than the clinic. */
    public function isFromOwner(): bool
    {
        return $this->owner_id !== null;
    }
}

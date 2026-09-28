<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A record of a report a staff member generated, and the file it produced.
 */
class Report extends Model
{
    protected $table = 'reports';

    protected $primaryKey = 'report_id';

    /** The dump stamps `generated_at` on insert and never updates it. */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'generated_by',
        'report_type',
        'date_from',
        'date_to',
        'file_path',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_from' => 'date',
            'date_to' => 'date',
            'generated_at' => 'datetime',
        ];
    }

    public function generator(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'generated_by', 'staff_id');
    }
}

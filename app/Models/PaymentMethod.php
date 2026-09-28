<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * How a payment was taken, e.g. Cash, Card, GCash.
 */
class PaymentMethod extends Model
{
    protected $table = 'payment_methods';

    protected $primaryKey = 'method_id';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'method_name',
    ];

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'method_id', 'method_id');
    }
}

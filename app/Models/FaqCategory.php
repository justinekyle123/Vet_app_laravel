<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A grouping of help questions, e.g. Bookings or Billing.
 */
class FaqCategory extends Model
{
    protected $table = 'faq_categories';

    protected $primaryKey = 'faq_category_id';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'category_name',
    ];

    public function faqs(): HasMany
    {
        return $this->hasMany(Faq::class, 'faq_category_id', 'faq_category_id');
    }
}

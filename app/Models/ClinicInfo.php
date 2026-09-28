<?php

namespace App\Models;

use Database\Factories\ClinicInfoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * The clinic's own details. The dump models this as one row in `clinic_info`,
 * so writes go through `current()` rather than creating extra rows.
 */
class ClinicInfo extends Model
{
    /** @use HasFactory<ClinicInfoFactory> */
    use HasFactory;

    protected $table = 'clinic_info';

    protected $primaryKey = 'clinic_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'clinic_name',
        'address_line',
        'city',
        'province',
        'zip_code',
        'contact_number',
        'email',
        'opening_time',
        'closing_time',
        'days_open',
        'logo_url',
    ];

    /**
     * The clinic record, created on first use so a fresh install still renders
     * a complete settings screen.
     */
    public static function current(): self
    {
        return static::query()->first() ?? static::query()->create([
            'clinic_name' => 'MyVet Animal Clinic',
            'address_line' => '',
            'city' => '',
            'province' => '',
            'contact_number' => '',
            'email' => '',
            'opening_time' => '08:00:00',
            'closing_time' => '18:00:00',
            'days_open' => 'Monday-Saturday',
        ]);
    }
}

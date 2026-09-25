<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Clinic-wide configuration, stored one row per key so the managed set can grow
 * without a migration each time.
 *
 * Reads go through `values()`, which layers saved values over `defaults()`. A
 * fresh install therefore renders a complete settings screen with nothing
 * seeded, and adding a new setting never needs a backfill.
 */
class Setting extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * The settings the console manages, with the value each falls back to.
     *
     * @return array<string, string>
     */
    public static function defaults(): array
    {
        return [
            'clinic_name' => 'MyVet Animal Clinic',
            'contact_email' => '',
            'contact_phone' => '',
            'address' => '',
            'city' => '',
            'postal_code' => '',
            'opening_hours' => 'Mon–Fri, 8:00am–6:00pm',
            'appointment_duration' => '30',
            'tax_rate' => '0',
        ];
    }

    /**
     * Every managed setting, saved values layered over the defaults.
     *
     * @return array<string, string>
     */
    public static function values(): array
    {
        $saved = static::query()->pluck('value', 'key')->all();

        // A blank row is a deliberate clear, not "no opinion": drop it so the
        // default shows through instead of an empty string masking it.
        $saved = array_filter($saved, fn ($value) => $value !== null && $value !== '');

        return array_merge(static::defaults(), $saved);
    }

    /**
     * Persist a subset of settings.
     *
     * Keys outside the managed set are ignored, so a stray request field can
     * never write an arbitrary row.
     *
     * @param  array<string, mixed>  $values
     */
    public static function putValues(array $values): void
    {
        foreach (array_intersect_key($values, static::defaults()) as $key => $value) {
            static::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value === null ? null : (string) $value],
            );
        }
    }
}

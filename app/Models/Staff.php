<?php

namespace App\Models;

use App\Enums\StaffRole;
use App\Models\Concerns\HasImage;
use App\Models\Concerns\HasRoles;
use Database\Factories\StaffFactory;
use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A clinic staff member: veterinarian, administrator, front desk, or groomer.
 *
 * Staff sign in against `staff.password_hash`; there is no shared `users`
 * table. A staff member's access is decided by `role`.
 */
class Staff extends Model implements AuthenticatableContract
{
    /** @use HasFactory<StaffFactory> */
    use Authenticatable, HasFactory, HasImage, HasRoles;

    protected $table = 'staff';

    protected $primaryKey = 'staff_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'clinic_id',
        'first_name',
        'last_name',
        'email',
        'password_hash',
        'phone_number',
        'role',
        'specialization',
        'license_number',
        'image_path',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password_hash',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => StaffRole::class,
            'is_active' => 'boolean',
            // The admin password-reset form hands over a plain value; hashing
            // on assignment keeps it that way for every write path.
            'password_hash' => 'hashed',
        ];
    }

    /**
     * Staff hold whatever role their row carries.
     *
     * @return list<string>
     */
    public function roles(): array
    {
        return [$this->role->value];
    }

    /**
     * Authenticate against the dump's password column.
     */
    public function getAuthPassword(): string
    {
        return (string) $this->password_hash;
    }

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    /**
     * The guard this account signs in through.
     */
    public function guardName(): string
    {
        return 'staff';
    }

    /**
     * The dump has no remember-token column, so "remember me" is switched off
     * by never handing out a token.
     */
    public function getRememberToken(): ?string
    {
        return null;
    }

    public function setRememberToken($value): void
    {
        // Nothing to store: there is no column for it.
    }

    /**
     * The clinic this staff member belongs to.
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(ClinicInfo::class, 'clinic_id', 'clinic_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'staff_id', 'staff_id');
    }

    public function timeSlots(): HasMany
    {
        return $this->hasMany(TimeSlot::class, 'staff_id', 'staff_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'generated_by', 'staff_id');
    }

    public function fullName(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
}

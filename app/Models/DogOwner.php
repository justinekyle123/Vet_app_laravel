<?php

namespace App\Models;

use App\Models\Concerns\HasRoles;
use Database\Factories\DogOwnerFactory;
use Illuminate\Auth\Authenticatable;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Notification;

/**
 * A dog owner: the clinic's client and one of the two sign-in identities.
 *
 * Owners live in `dog_owners` and carry their own credential in
 * `password_hash` — there is no shared `users` table.
 */
class DogOwner extends Model implements AuthenticatableContract, CanResetPasswordContract
{
    /** @use HasFactory<DogOwnerFactory> */
    use Authenticatable, CanResetPassword, HasFactory, HasRoles;

    protected $table = 'dog_owners';

    protected $primaryKey = 'owner_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password_hash',
        'phone_number',
        'address',
        'profile_photo_url',
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
            'is_active' => 'boolean',
            // Hashing on assignment keeps a plain password from ever reaching
            // the column; an already-hashed value is left untouched.
            'password_hash' => 'hashed',
        ];
    }

    /**
     * Dog owners hold exactly one role.
     *
     * @return list<string>
     */
    public function roles(): array
    {
        return ['owner'];
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
        return 'owner';
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
     * Send the reset link to an anonymous mail route.
     *
     * The model deliberately does not use Laravel's Notifiable trait: it would
     * claim a `notifications` relationship over the clinic's own notification
     * log, whose columns are unrelated to Laravel's polymorphic table.
     */
    public function sendPasswordResetNotification($token): void
    {
        Notification::route('mail', $this->email)
            ->notify(new ResetPassword($token));
    }

    /**
     * Every dog registered under this owner.
     */
    public function dogs(): HasMany
    {
        return $this->hasMany(Dog::class, 'owner_id', 'owner_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'owner_id', 'owner_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'owner_id', 'owner_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'owner_id', 'owner_id');
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class, 'owner_id', 'owner_id');
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(RatingFeedback::class, 'owner_id', 'owner_id');
    }

    public function faqs(): HasMany
    {
        return $this->hasMany(Faq::class, 'owner_id', 'owner_id');
    }

    public function fullName(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /**
     * Split a single display name into the first and last name the schema
     * stores separately. The second half is empty rather than discarded when
     * only one word is given.
     *
     * @return array{0: string, 1: string}
     */
    public static function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name), 2) ?: [];

        return [$parts[0] ?? '', $parts[1] ?? ''];
    }
}

<?php

namespace App\Models;

use Database\Factories\OwnerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Owner extends Model
{
    /** @use HasFactory<OwnerFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'alternate_phone',
        'address',
        'city',
        'postal_code',
        'notes',
        'is_active',
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
        ];
    }

    /**
     * The login account this client record belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Every pet belonging to this owner.
     */
    public function pets(): HasMany
    {
        return $this->hasMany(Pet::class);
    }

    public function fullName(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /**
     * Ensure the given account has a client record, creating one on first use.
     *
     * Registration handles it up front; this also covers accounts that existed
     * before the link did, so the account page is never left without a record.
     */
    public static function provisionFor(User $user): self
    {
        // Query rather than reading the relation directly: a previously
        // accessed (and cached) null relation would otherwise trick us into
        // trying to insert a second record for the same account.
        $existing = $user->owner()->first();

        if ($existing !== null) {
            $user->setRelation('owner', $existing);

            return $existing;
        }

        [$firstName, $lastName] = self::splitName($user->name);

        $owner = static::create([
            'user_id' => $user->id,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $user->email,
        ]);

        $user->setRelation('owner', $owner);

        return $owner;
    }

    /**
     * Split a display name into a first and last name.
     *
     * @return array{0: string, 1: string}
     */
    private static function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name), 2) ?: [];

        return [$parts[0] ?? '', $parts[1] ?? ''];
    }
}

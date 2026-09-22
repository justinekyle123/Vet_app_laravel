<?php

namespace App\Enums;

/**
 * The roles an authenticated account can hold.
 *
 * Kept as a single column on "users" rather than a roles/permissions pivot:
 * the clinic has a small, fixed set of roles and the spec models access by
 * putting the role directly on the person record.
 */
enum UserRole: string
{
    case Admin = 'admin';
    case FrontDesk = 'front_desk';
    case Owner = 'owner';

    /**
     * Human-readable name for the UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrator',
            self::FrontDesk => 'Front Desk',
            self::Owner => 'Dog Owner',
        };
    }

    /**
     * The raw values, handy for validation rules and migrations.
     *
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $role) => $role->value, self::cases());
    }
}

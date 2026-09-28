<?php

namespace App\Enums;

/**
 * The role held by a clinic staff member.
 *
 * The values are the ENUM members declared on `staff.role` in the database, so
 * the PHP side and the schema stay in step. Dog owners are not staff and have
 * no stored role — they are recognised by their own model instead.
 */
enum StaffRole: string
{
    case Veterinarian = 'veterinarian';
    case Admin = 'admin';
    case FrontDesk = 'front_desk';
    case Groomer = 'groomer';

    /**
     * Human-readable name for the UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Veterinarian => 'Veterinarian',
            self::Admin => 'Administrator',
            self::FrontDesk => 'Front Desk',
            self::Groomer => 'Groomer',
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

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'department_id',
    ];

    /**
     * The department this program belongs to.
     */
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /**
     * Users enrolled in this program.
     */
    public function users()
    {
        return $this->hasMany(User::class, 'program_id');
    }

    /**
     * Students enrolled in this program.
     */
    public function students()
    {
        return $this->hasMany(User::class, 'program_id')
            ->students(); // Uses the students() scope from User model
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class College extends Model
{
    use HasFactory;

    protected $table = 'colleges';

    protected $fillable = ['name', 'code', 'description'];

    public function users()
    {
        return $this->hasMany(User::class, 'college_id');
    }

    public function organizations()
    {
        return $this->hasMany(Organization::class, 'college_id');
    }

    public function courses()
    {
        return $this->hasMany(Course::class, 'college_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = ['college_id', 'name', 'code'];

    public function college()
    {
        return $this->belongsTo(College::class, 'college_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'course_id');
    }
}

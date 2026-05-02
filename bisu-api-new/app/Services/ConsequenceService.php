<?php

namespace App\Services;

use App\Models\ConsequenceRule;
use App\Models\StudentConsequence;
use App\Models\StudentFee;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ConsequenceService
{
    /**
     * Assign a consequence to a student based on a rule.
     * 
     * @param int $userId
     * @param int $ruleId
     * @param int|null $eventId
     * @return StudentConsequence
     * @throws \Exception
     */
    public function assignConsequence(int $userId, int $ruleId, int $eventId = null)
    {
        return DB::transaction(function () use ($userId, $ruleId, $eventId) {
            $rule = ConsequenceRule::findOrFail($ruleId);
            
            // Fix #4: Priority Logic for Event ID
            // If the rule is event-specific, use the rule's event_id.
            // If the rule is org-wide, use the event_id where the student was absent.
            $finalEventId = $rule->event_id ?? $eventId;

            $studentFeeId = null;

            // IF financial: create a record in student_fees
            if ($rule->type === 'financial' && $rule->fee_type_id) {
                // Prevent duplicate fees for the same event and rule
                $fee = StudentFee::firstOrCreate([
                    'organization_id' => $rule->organization_id,
                    'user_id'         => $userId,
                    'fee_type_id'     => $rule->fee_type_id,
                    'event_id'        => $finalEventId, // Optional: track which event caused the fee
                ], [
                    'status'          => 'pending',
                ]);
                $studentFeeId = $fee->id;
            }

            // Fix #3: Prevent duplicate consequence records for the same student, rule, and event
            return StudentConsequence::firstOrCreate([
                'consequence_rule_id'      => $rule->id,
                'user_id'                  => $userId,
                'event_id'                 => $finalEventId,
            ], [
                'type'                     => $rule->type,
                'student_fee_id' => $studentFeeId,
                'status'                   => 'pending',
                'due_date'                 => Carbon::now()->addDays($rule->due_days)->toDateString(),
            ]);
        });

    }

    /**
     * Get all financial consequences for a student.
     * 
     * @param int $userId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getStudentFinancialConsequences(int $userId)
    {
        return StudentConsequence::with(['rule', 'event', 'financialFee.feeType'])
            ->where('user_id', $userId)
            ->where('type', 'financial')
            ->get();
    }

    /**
     * Get all non-financial consequences for a student.
     * 
     * @param int $userId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getStudentNonFinancialConsequences(int $userId)
    {
        return StudentConsequence::with(['rule', 'event'])
            ->where('user_id', $userId)
            ->where('type', '!=', 'financial')
            ->get();
    }

    /**
     * Mark a consequence as completed.
     * 
     * @param int $id
     * @param string|null $notes
     * @return StudentConsequence
     */
    public function markComplete(int $id, string $notes = null)
    {
        return DB::transaction(function () use ($id, $notes) {
            $consequence = StudentConsequence::findOrFail($id);
            
            $consequence->update([
                'status'       => 'completed',
                'completed_at' => now(),
                'notes'        => $notes,
            ]);

            // If it was financial, we might want to update the fee status too
            // Note: In some systems, the fee payment triggers the consequence completion.
            // Here we allow manual completion by an officer.
            if ($consequence->student_fee_id) {
                $fee = StudentFee::find($consequence->student_fee_id);
                if ($fee && $fee->status !== 'paid') {
                    $fee->update(['status' => 'paid']);
                }
            }

            return $consequence;
        });
    }
}

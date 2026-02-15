import { useState, useEffect } from 'react';
import axios from 'axios';
import { QrCode, Calendar, CheckCircle, XCircle, Scan, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

export default function StudentCheckIn() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchCurrentStatus();
    }
  }, [selectedEvent]);

  const fetchUpcomingEvents = async () => {
    try {
      const res = await axios.get('/api/events/filter/upcoming', authH());
      setEvents(res.data);
    } catch (error) {
      toast.error('Failed to load events');
    }
  };

  const fetchCurrentStatus = async () => {
    try {
      const res = await axios.get(`/api/attendance/status/${selectedEvent}`, authH());
      setCurrentStatus(res.data);
    } catch (error) {
      setCurrentStatus(null);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedEvent || !qrCode) {
      toast.error('Please select an event and enter QR code');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/attendance/checkin', {
        event_id: selectedEvent,
        qr_code: qrCode,
      }, authH());

      toast.success('Checked In!', {
        description: res.data.message,
      });
      
      setQrCode('');
      fetchCurrentStatus();
    } catch (error) {
      toast.error('Check-In Failed', {
        description: error.response?.data?.message || 'Invalid QR code or already checked in',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEvent || !qrCode) {
      toast.error('Please enter QR code to check out');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/attendance/checkout', {
        event_id: selectedEvent,
        qr_code: qrCode,
      }, authH());

      toast.success('Checked Out!', {
        description: res.data.message,
      });
      
      setQrCode('');
      fetchCurrentStatus();
    } catch (error) {
      toast.error('Check-Out Failed', {
        description: error.response?.data?.message || 'Not checked in or invalid QR code',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedEventData = events.find(e => e.id === Number(selectedEvent));
  const isCheckedIn = currentStatus?.status === 'checked_in' && currentStatus?.is_active;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <QrCode className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Event Check-In</h1>
        <p className="text-slate-500 text-sm mt-2">Scan QR code or enter manually to mark your attendance</p>
      </div>

      {/* Status Card */}
      {currentStatus && selectedEventData && (
        <Card className={`p-6 border-2 ${
          isCheckedIn 
            ? 'border-emerald-200 bg-emerald-50' 
            : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isCheckedIn 
                ? 'bg-emerald-500' 
                : 'bg-slate-400'
            }`}>
              {isCheckedIn ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <XCircle className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900 mb-1">
                {isCheckedIn ? 'You are Checked In' : 'Not Checked In'}
              </h3>
              <p className="text-sm text-slate-600 mb-3">{selectedEventData.name}</p>
              {isCheckedIn && currentStatus.attendance?.time_in && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    Checked in at{' '}
                    {new Date(currentStatus.attendance.time_in).toLocaleString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Main Check-In Card */}
      <Card className="p-6 border-slate-200">
        <div className="space-y-6">
          {/* Event Selection */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Select Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="border-slate-200 bg-white h-11">
                <SelectValue placeholder="Choose an event to check in..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-80">
                {events.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-sm">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>No upcoming events</p>
                  </div>
                ) : (
                  events.map(event => (
                    <SelectItem key={event.id} value={String(event.id)}>
                      <div className="flex items-center gap-3 py-1">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{event.name}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {new Date(event.event_date).toLocaleDateString()} · {event.event_time}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Event Details */}
          {selectedEventData && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <h4 className="font-semibold text-slate-900 text-sm mb-3">{selectedEventData.name}</h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    {new Date(selectedEventData.event_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{selectedEventData.event_time}</span>
                </div>
                {selectedEventData.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{selectedEventData.venue}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QR Code Input */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">QR Code</Label>
            <div className="relative">
              <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Scan or enter QR code..."
                className="pl-11 h-11 border-slate-200 font-mono"
                disabled={!selectedEvent || loading}
              />
            </div>
            <p className="text-xs text-slate-400">
              Point your camera at the QR code or enter it manually
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isCheckedIn ? (
              <Button
                onClick={handleCheckIn}
                disabled={!selectedEvent || !qrCode || loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-11 font-semibold"
              >
                {loading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CheckCircle className="mr-2 w-5 h-5" />
                    Check In
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleCheckOut}
                disabled={!selectedEvent || !qrCode || loading}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white h-11 font-semibold"
              >
                {loading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <XCircle className="mr-2 w-5 h-5" />
                    Check Out
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Help Card */}
      <Card className="p-4 border-blue-200 bg-blue-50">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 text-sm mb-1">Need Help?</h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              Ask the event organizer to show the QR code. Scan it with your camera or enter the code manually.
              Make sure to check out when leaving the event!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
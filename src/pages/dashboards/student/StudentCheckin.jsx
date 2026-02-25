import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { QrCode, Calendar, CheckCircle, XCircle, Clock, MapPin, Camera, X, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import StudentEvaluationModal from '../../modals/StudentEvaluationModal';

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function StudentCheckIn() {
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [qrCode, setQrCode]               = useState('');
  const [qrData, setQrData]               = useState(null);
  const [loading, setLoading]             = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [showScanner, setShowScanner]     = useState(false);
  const [mode, setMode]                   = useState('checkin');
  const [scannerReady, setScannerReady]   = useState(false);
  const html5QrCodeRef                    = useRef(null);

  // ── Evaluation gate ──
  const [showEvalModal, setShowEvalModal] = useState(false);

  useEffect(() => { fetchOngoingEvents(); }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchCurrentStatus();
      setQrCode('');
      setQrData(null);
      setShowScanner(false);
    }
  }, [selectedEvent]);

  useEffect(() => { return () => { stopScanner(); }; }, []);

  useEffect(() => {
    if (showScanner && scannerReady) initScanner();
  }, [showScanner, scannerReady]);

  const fetchOngoingEvents = async () => {
    try {
      const res = await axios.get('/api/events/upcoming', authH());
      setEvents(res.data);
    } catch { toast.error('Failed to load events'); }
  };

  const fetchCurrentStatus = async () => {
    try {
      const res = await axios.get(`/api/attendance/status/${selectedEvent.id}`, authH());
      setCurrentStatus(res.data);
      setMode(res.data?.status === 'checked_in' && res.data?.is_active ? 'checkout' : 'checkin');
    } catch {
      setCurrentStatus(null);
      setMode('checkin');
    }
  };

  const startScanner = () => {
    setScannerReady(false);
    setShowScanner(true);
    setTimeout(() => setScannerReady(true), 200);
  };

  const initScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        try { await html5QrCodeRef.current.stop(); } catch {}
        html5QrCodeRef.current = null;
      }
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
        (decodedText) => {
          try {
            const parsed = JSON.parse(decodedText);
            setQrCode(parsed.qr_code ?? decodedText);
            setQrData(parsed);
          } catch {
            setQrCode(decodedText);
            setQrData(null);
          }
          toast.success('QR Code scanned!');
          stopScanner();
        },
        () => {}
      );
    } catch (err) {
      console.error('Scanner error:', err);
      toast.error('Camera access denied or not available.');
      setShowScanner(false);
      setScannerReady(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); html5QrCodeRef.current = null; } catch {}
    }
    setShowScanner(false);
    setScannerReady(false);
  };

  const handleCheckIn = async () => {
    if (!selectedEvent || !qrCode) { toast.error('Please scan the QR code first'); return; }
    if (currentStatus?.status === 'checked_in' && currentStatus?.is_active) {
      toast.error('Already Checked In', { description: 'You are already checked in. Please check out instead.' });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/attendance/checkin', { event_id: selectedEvent.id, qr_code: qrCode }, authH());
      toast.success('Checked In!', { description: res.data.message });
      setQrCode(''); setQrData(null);
      fetchCurrentStatus();
    } catch (error) {
      toast.error('Check-In Failed', { description: error.response?.data?.message || 'Invalid QR code or already checked in' });
    } finally { setLoading(false); }
  };

  /**
   * Check if an open evaluation exists for the event and the student hasn't
   * submitted it yet. If so, open the evaluation modal first — the actual
   * checkout API call happens only after onEvaluationDone fires.
   */
  const handleCheckOut = async () => {
    if (!selectedEvent || !qrCode) { toast.error('Please scan the QR code first'); return; }
    if (currentStatus?.status === 'checked_out') {
      toast.error('Already Checked Out', { description: 'You have already checked out from this event.' });
      return;
    }

    // ── Gate: check for pending evaluation ──────────────────────────────
    try {
      const evalRes = await axios.get(`/api/events/${selectedEvent.id}/evaluation`, authH());
      const hasEval       = !!evalRes.data.evaluation;
      const alreadyDone   = evalRes.data.submitted;

      if (hasEval && !alreadyDone) {
        // Force student to evaluate first
        setShowEvalModal(true);
        return;
      }
    } catch {
      // 404 → no evaluation for this event, proceed normally
    }

    // No evaluation required (or already submitted) → checkout directly
    await performCheckOut();
  };

  /** The actual checkout POST — called either directly or after evaluation */
  const performCheckOut = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/attendance/checkout', { event_id: selectedEvent.id, qr_code: qrCode }, authH());
      toast.success('Checked Out!', { description: res.data.message });
      setQrCode(''); setQrData(null);
      fetchCurrentStatus();
    } catch (error) {
      toast.error('Check-Out Failed', { description: error.response?.data?.message || 'Invalid QR code' });
    } finally { setLoading(false); }
  };

  const isCheckedIn     = currentStatus?.status === 'checked_in' && currentStatus?.is_active;
  const isCheckedOut    = currentStatus?.status === 'checked_out';
  const checkInBlocked  = isCheckedIn || isCheckedOut;
  const checkOutBlocked = isCheckedOut;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">

      {/* Header */}
      <div className="text-center pt-2">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
          <QrCode className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Event Attendance</h1>
        <p className="text-slate-500 text-sm mt-1">Select an ongoing event and scan the QR code</p>
      </div>

      {/* Current Status */}
      {currentStatus && selectedEvent && (
        <Card className={`p-4 border-2 ${isCheckedOut ? 'border-blue-200 bg-blue-50' : isCheckedIn ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isCheckedOut ? 'bg-blue-500' : isCheckedIn ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              {isCheckedOut || isCheckedIn
                ? <CheckCircle className="w-5 h-5 text-white" />
                : <XCircle className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm">
                {isCheckedOut ? '✅ Attendance Complete' : isCheckedIn ? '✅ Currently Checked In' : '❌ Not Checked In'}
              </p>
              <p className="text-xs text-slate-500 truncate">{selectedEvent.title}</p>
              {isCheckedIn && currentStatus.attendance?.time_in && (
                <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Since {new Date(currentStatus.attendance.time_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Events List */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">Ongoing Events</h2>
        {events.length === 0 ? (
          <Card className="p-8 text-center border-slate-200">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-500 text-sm">No ongoing events</p>
            <p className="text-xs text-slate-400 mt-1">Check back when an event is marked as ongoing</p>
          </Card>
        ) : (
          events.map(event => (
            <Card
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                selectedEvent?.id === event.id
                  ? 'border-2 border-blue-500 bg-blue-50 shadow-md'
                  : 'border-2 border-slate-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${selectedEvent?.id === event.id ? 'bg-blue-500' : 'bg-slate-100'}`}>
                  <Calendar className={`w-5 h-5 ${selectedEvent?.id === event.id ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm truncate flex-1">{event.title}</h3>
                    <Badge className="bg-green-100 text-green-700 text-[10px] shrink-0">Ongoing</Badge>
                  </div>
                  {event.description && (
                    <p className="text-xs text-slate-600 mb-1.5 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {event.event_time
                        ? new Date(`2000-01-01T${event.event_time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : 'TBA'}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />{event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Action Section */}
      {selectedEvent && (
        <Card className="p-4 sm:p-6 border-slate-200 space-y-4">

          {isCheckedOut && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-sm text-blue-700 font-medium">You have already completed attendance for this event.</p>
            </div>
          )}

          {/* Mode Toggle */}
          {!isCheckedOut && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Action</p>
              <div className="flex rounded-xl overflow-hidden border border-slate-200">
                <button
                  onClick={() => { setMode('checkin'); setQrCode(''); setQrData(null); }}
                  disabled={checkInBlocked}
                  className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'checkin' && !checkInBlocked
                      ? 'bg-emerald-500 text-white'
                      : checkInBlocked
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Check In
                  {checkInBlocked && <span className="text-[10px]">(done)</span>}
                </button>
                <button
                  onClick={() => { setMode('checkout'); setQrCode(''); setQrData(null); }}
                  disabled={checkOutBlocked}
                  className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'checkout' && !checkOutBlocked
                      ? 'bg-orange-500 text-white'
                      : checkOutBlocked
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Check Out
                  {checkOutBlocked && <span className="text-[10px]">(done)</span>}
                </button>
              </div>
              {mode === 'checkout' && !isCheckedIn && !isCheckedOut && (
                <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />Checking out without a prior check-in (late entry).
                </p>
              )}
            </div>
          )}

          {/* Scanned QR Info */}
          {qrCode && !isCheckedOut && (
            <div className={`rounded-xl border-2 p-3 space-y-2 ${mode === 'checkin' ? 'border-emerald-200 bg-emerald-50' : 'border-orange-200 bg-orange-50'}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Scanned QR</p>
                <button onClick={() => { setQrCode(''); setQrData(null); }} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mode === 'checkin' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                  <QrCode className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{qrData?.title ?? selectedEvent.title}</p>
                  <p className="text-xs text-slate-500">QR Code verified</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono break-all border-t border-slate-200 pt-2">{qrCode}</p>
            </div>
          )}

          {/* Evaluation notice (shown when in checkout mode and a QR is scanned) */}
          {mode === 'checkout' && qrCode && !isCheckedOut && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                An evaluation form may be required before checking out. You'll be asked to fill it in after tapping Confirm.
              </p>
            </div>
          )}

          {/* Scanner */}
          {!isCheckedOut && (
            <>
              <div
                id="qr-reader"
                className={`rounded-xl overflow-hidden border-2 border-slate-200 ${showScanner ? 'block' : 'hidden'}`}
              />

              {showScanner ? (
                <Button onClick={stopScanner} variant="outline" className="w-full h-11 border-slate-300">
                  <X className="mr-2 w-5 h-5" /> Cancel Scanning
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={startScanner}
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-base"
                  >
                    <Camera className="mr-2 w-5 h-5" />
                    {qrCode ? 'Rescan QR Code' : 'Open Camera to Scan'}
                  </Button>

                  {qrCode && (
                    mode === 'checkin' ? (
                      <Button
                        onClick={handleCheckIn}
                        disabled={loading || checkInBlocked}
                        className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-base"
                      >
                        {loading ? 'Processing...' : <><CheckCircle className="mr-2 w-5 h-5" />Confirm Check In</>}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleCheckOut}
                        disabled={loading || checkOutBlocked}
                        className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-base"
                      >
                        {loading ? 'Processing...' : <><XCircle className="mr-2 w-5 h-5" />Confirm Check Out</>}
                      </Button>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Help Card */}
      <Card className="p-4 border-blue-200 bg-blue-50">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 text-sm mb-1">How to Check In / Out</h4>
            <ol className="text-xs text-blue-700 leading-relaxed space-y-1">
              <li>1. Select an ongoing event from the list above</li>
              <li>2. Choose <strong>Check In</strong> or <strong>Check Out</strong></li>
              <li>3. Tap "Open Camera to Scan" and allow camera access</li>
              <li>4. Point at the event QR code and tap Confirm</li>
              <li>5. If an evaluation form exists, fill it in before checking out</li>
            </ol>
          </div>
        </div>
      </Card>

      {/* ── Evaluation Gate Modal ── */}
      <StudentEvaluationModal
        open={showEvalModal}
        onClose={() => setShowEvalModal(false)}
        event={selectedEvent}
        onEvaluationDone={() => {
          setShowEvalModal(false);
          performCheckOut();
        }}
      />
    </div>
  );
}
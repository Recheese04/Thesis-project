import { Bell, Calendar, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function StudentAnnouncements() {
  // Mock data - replace with actual API call
  const announcements = [
    {
      id: 1,
      title: 'Upcoming General Assembly - Mandatory',
      content:
        'All members are required to attend the General Assembly on February 20, 2026, at 2:00 PM in the University Auditorium.',
      author: 'Student Council',
      date: '2026-02-14',
      isNew: true,
    },
    {
      id: 2,
      title: 'Clearance Deadline Extended',
      content:
        'The deadline for student clearance has been extended to March 20, 2026.',
      author: 'Student Affairs',
      date: '2026-02-13',
      isNew: true,
    },
    {
      id: 3,
      title: 'Web Development Workshop Registration',
      content:
        'Registration is now open for the 3-day Web Development Workshop (Feb 25-27). Limited slots available.',
      author: 'CS Society',
      date: '2026-02-12',
      isNew: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-600 mt-1">Stay updated with important notices</p>
        </div>
        {announcements.filter((a) => a.isNew).length > 0 && (
          <Badge className="bg-red-500 text-white">
            {announcements.filter((a) => a.isNew).length} New
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card
            key={announcement.id}
            className={announcement.isNew ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      announcement.isNew
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-slate-100'
                    }`}
                  >
                    <Bell
                      className={`w-6 h-6 ${announcement.isNew ? 'text-white' : 'text-slate-400'}`}
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-900">{announcement.title}</h3>
                    {announcement.isNew && (
                      <Badge className="bg-blue-500 text-white">New</Badge>
                    )}
                  </div>
                  <p className="text-slate-700 mb-4">{announcement.content}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{announcement.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        {new Date(announcement.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
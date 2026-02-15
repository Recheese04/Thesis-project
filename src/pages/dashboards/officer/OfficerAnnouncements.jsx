import { useState } from 'react';
import { Bell, Plus, Calendar, User, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function OfficerAnnouncements() {
  // Mock data
  const announcements = [
    {
      id: 1,
      title: 'Upcoming General Assembly',
      content: 'All members are required to attend the General Assembly on February 20, 2026.',
      author: 'Admin',
      date: '2026-02-14',
      isPinned: true,
      views: 42,
    },
    {
      id: 2,
      title: 'Workshop Registration Open',
      content: 'Registration for the Web Development Workshop is now open. Limited slots available.',
      author: 'Admin',
      date: '2026-02-12',
      isPinned: false,
      views: 38,
    },
    {
      id: 3,
      title: 'New Member Orientation',
      content: 'Welcome session for new members will be held on February 22, 2026.',
      author: 'Admin',
      date: '2026-02-10',
      isPinned: false,
      views: 25,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-600 mt-1">Send announcements to organization members</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
          <Plus className="w-4 h-4" />
          Create Announcement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{announcements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pinned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {announcements.filter((a) => a.isPinned).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {announcements.reduce((sum, a) => sum + a.views, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{announcement.title}</h3>
                      {announcement.isPinned && (
                        <Badge className="bg-red-100 text-red-700">Pinned</Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-700 mb-4">{announcement.content}</p>

                  <div className="flex items-center justify-between">
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
                      <Badge variant="outline" className="bg-slate-50">
                        {announcement.views} views
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2 text-red-600">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Announcement Form Placeholder */}
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Create your first announcement</p>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Announcement
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
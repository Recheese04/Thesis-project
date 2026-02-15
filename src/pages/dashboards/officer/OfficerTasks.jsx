import { useState } from 'react';
import { ClipboardList, Plus, Calendar, User, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function OfficerTasks() {
  // Mock data
  const tasks = [
    {
      id: 1,
      title: 'Prepare event materials',
      description: 'Create posters and digital materials for the upcoming workshop',
      assignedTo: 'Sarah Johnson',
      dueDate: '2026-02-18',
      status: 'pending',
      priority: 'high',
    },
    {
      id: 2,
      title: 'Contact venue coordinator',
      description: 'Confirm booking and setup requirements for the auditorium',
      assignedTo: 'Michael Chen',
      dueDate: '2026-02-17',
      status: 'in-progress',
      priority: 'high',
    },
    {
      id: 3,
      title: 'Update social media',
      description: 'Post event announcements on Facebook and Instagram',
      assignedTo: 'Emma Davis',
      dueDate: '2026-02-20',
      status: 'completed',
      priority: 'medium',
    },
  ];

  const pending = tasks.filter((t) => t.status === 'pending');
  const inProgress = tasks.filter((t) => t.status === 'in-progress');
  const completed = tasks.filter((t) => t.status === 'completed');

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
      'in-progress': { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
    };
    const { label, className } = config[status] || config.pending;
    return <Badge className={className}>{label}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const config = {
      high: { label: 'High', className: 'bg-red-50 text-red-700 border-red-200' },
      medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
      low: { label: 'Low', className: 'bg-slate-50 text-slate-600 border-slate-200' },
    };
    const { label, className } = config[priority] || config.medium;
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        {label}
      </Badge>
    );
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const TaskCard = ({ task }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
            </div>
            <p className="text-sm text-slate-600 mb-3">{task.description}</p>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{task.assignedTo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  Due {new Date(task.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold">
              {getInitials(task.assignedTo)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline">
            Edit
          </Button>
          <Button size="sm" variant="outline">
            Reassign
          </Button>
          {task.status !== 'completed' && (
            <Button size="sm" variant="outline" className="text-green-600">
              Mark Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-600 mt-1">Assign and manage member tasks</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
          <Plus className="w-4 h-4" />
          Assign Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-amber-600" />
              <span className="text-3xl font-bold text-slate-900">{pending.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-slate-900">{inProgress.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-slate-900">{completed.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No pending tasks</p>
              </CardContent>
            </Card>
          ) : (
            pending.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4 mt-6">
          {inProgress.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No tasks in progress</p>
              </CardContent>
            </Card>
          ) : (
            inProgress.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completed.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No completed tasks</p>
              </CardContent>
            </Card>
          ) : (
            completed.map((task) => (
              <div key={task.id} className="opacity-70">
                <TaskCard task={task} />
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
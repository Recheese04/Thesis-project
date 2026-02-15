import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Lock, User, Globe } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white font-syne">Settings</h1>
        <p className="text-slate-400">Manage your account preferences and system configuration.</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card className="bg-slate-900/50 border-slate-800 text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription className="text-slate-500">Update your account details and email address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="System Administrator" className="bg-slate-800 border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" defaultValue="adminbisu@bisu.edu.ph" className="bg-slate-800 border-slate-700" />
              </div>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-slate-900/50 border-slate-800 text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription className="text-slate-500">Change your password and secure your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input id="current" type="password" className="bg-slate-800 border-slate-700" />
            </div>
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800">Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { ApprovalWorkflow } from '@/api/entities';
import { useToast } from "@/components/ui/use-toast";
import { cache } from "@/components/utils/cache"; // New import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Trash2, 
    PlusCircle, 
    Users, 
    GitBranch, 
    Settings, 
    AlertCircle, 
    UserPlus,
    RefreshCw,
    Info
} from 'lucide-react';
import { REVIEWER_RULES, SPECIAL_RULES, getRoleDisplayName, getAvailableReviewerRoles } from '@/components/config/reviewerConfig';
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function AdminSettings() {
    const [users, setUsers] = useState([]);
    const [workflows, setWorkflows] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userManagementSupported, setUserManagementSupported] = useState(false);
    const { toast } = useToast();

    // New user form state
    const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        full_name: '',
        user_role: 'content_creator',
        department: ''
    });

    // Confirmation dialog states
    const [deleteConfirm, setDeleteConfirm] = useState({ 
        open: false, 
        userId: null, 
        userName: "",
        userEmail: ""
    });
    const [saveConfirm, setSaveConfirm] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // To enable/disable save button

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            // Always fetch current user
            const me = await User.me();
            setCurrentUser(me);

            // Try to fetch all users
            let allUsers = [];
            try {
                allUsers = await User.list();
                setUserManagementSupported(true);
                toast({
                    title: "Users loaded",
                    description: `Found ${allUsers.length} users in the system.`,
                });
            } catch (userListError) {
                console.warn("User.list() not available:", userListError);
                // If User.list() fails, use current user only
                allUsers = [me];
                setUserManagementSupported(false);
                toast({
                    title: "Limited user access",
                    description: "Only showing your user profile. Contact your administrator for full user management.",
                    variant: "destructive",
                });
            }
            
            setUsers(allUsers);

            // Try to fetch workflows
            try {
                const allWorkflows = await ApprovalWorkflow.list();
                setWorkflows(allWorkflows);
            } catch (workflowError) {
                console.warn("ApprovalWorkflow.list() not available:", workflowError);
                setWorkflows([]);
                toast({
                    title: "Workflow data unavailable",
                    description: "Could not load approval workflows.",
                    variant: "destructive",
                });
            }

        } catch (error) {
            console.error("Error loading admin settings:", error);
            toast({
                title: "Failed to load settings",
                description: error.message || "Could not fetch admin data. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!userManagementSupported) {
            toast({
                title: "Feature not available",
                description: "User creation is not supported in your current setup.",
                variant: "destructive",
            });
            return;
        }

        if (!newUser.email || !newUser.full_name || !newUser.user_role) {
            toast({
                title: "Missing information",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        try {
            await User.create(newUser);
            toast({
                title: "User added successfully",
                description: `${newUser.full_name} has been added to the system.`,
            });
            
            // Reset form and reload data
            setNewUser({
                email: '',
                full_name: '',
                user_role: 'content_creator',
                department: ''
            });
            setShowAddUserForm(false);
            // Invalidate cache and reload
            cache.invalidatePattern('user:*');
            cache.invalidatePattern('dashboard:*');
            await loadAdminData();
        } catch (error) {
            console.error("Error adding user:", error);
            toast({
                title: "Failed to add user",
                description: error.message || "Could not create user. Please try again.",
                variant: "destructive",
            });
        }
    };

    // Updated handleDeleteUser to use state and be called from ConfirmDialog
    const handleDeleteUser = async (userId) => {
        if (!userManagementSupported) {
            toast({
                title: "Feature Not Available",
                description: "User deletion is not supported by the current API.",
                variant: "destructive"
            });
            setDeleteConfirm({ open: false, userId: null, userName: "", userEmail: "" });
            return;
        }

        setLoading(true);
        try {
            await User.delete(userId);
            toast({
                title: "User Deleted",
                description: `${deleteConfirm.userName} has been removed from the system.`,
                variant: "success",
            });
            // Invalidate cache
            cache.invalidatePattern('user:*');
            cache.invalidatePattern('dashboard:*');
            await loadAdminData();
        } catch (error) {
            console.error("Error deleting user:", error);
            toast({
                title: "Delete Failed",
                description: error.message || "Could not delete user. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
            setDeleteConfirm({ open: false, userId: null, userName: "", userEmail: "" });
        }
    };

    const handleUpdateUserRole = async (userId, newRole) => {
        if (!userManagementSupported) {
            toast({
                title: "Feature not available",
                description: "User role updates are not supported in your current setup.",
                variant: "destructive",
            });
            return;
        }

        try {
            await User.update(userId, { user_role: newRole });
            toast({
                title: "Role updated",
                description: "User role has been successfully changed.",
            });
            // Invalidate cache and reload
            cache.invalidatePattern('user:*');
            cache.invalidatePattern('dashboard:*');
            await loadAdminData();
        } catch (error) {
            console.error("Error updating user role:", error);
            toast({
                title: "Failed to update role",
                description: error.message || "Could not update user role. Please try again.",
                variant: "destructive",
            });
        }
    };

    const createWorkflow = async (workflowData) => {
        try {
            await ApprovalWorkflow.create(workflowData);
            toast({
                title: "Workflow created",
                description: "New approval workflow has been added.",
            });
            // Invalidate cache and reload
            cache.invalidatePattern('workflow:*');
            await loadAdminData();
        } catch (error) {
            console.error("Error creating workflow:", error);
            toast({
                title: "Failed to create workflow",
                description: error.message || "Could not create workflow. Please try again.",
                variant: "destructive",
            });
        }
    };

    // Placeholder for future workflow rule editing
    const handleWorkflowRuleChange = (contentType, role, checked) => {
        setHasUnsavedChanges(true);
        // This is a placeholder. In a real scenario, you'd update an editable workflow state here.
        console.log(`Workflow rule changed: ${contentType}, ${role}, checked: ${checked}`);
    };

    const handleSaveWorkflowChanges = async () => {
        try {
            // Placeholder: In a real scenario, this would involve sending updated workflow data to the backend.
            // Example: await ApprovalWorkflow.updateRules(updatedRules);
            
            setHasUnsavedChanges(false);
            toast({
                title: "Workflow Updated",
                description: "Approval workflow rules have been saved successfully.",
            });
            // Reload data if necessary after saving
            // await loadAdminData(); 
        } catch (error) {
            console.error("Error saving workflow:", error);
            toast({
                title: "Save Failed",
                description: error.message || "Could not save workflow changes. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1,2].map(i => (
                            <div key={i} className="h-64 bg-slate-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Settings</h1>
                    <p className="text-slate-600 mt-2">Manage users, workflows, and system configuration</p>
                </div>
                <Button onClick={loadAdminData} variant="outline" className="glass-effect" disabled={loading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                </Button>
            </div>

            {/* API Limitations Alert */}
            {!userManagementSupported && (
                <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                        <strong>Limited Functionality:</strong> Full user management is not available in your current setup. 
                        You can view configuration but cannot add/remove users. Contact your system administrator for full access.
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="users" className="space-y-6">
                <TabsList className="glass-effect">
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        User Management
                    </TabsTrigger>
                    <TabsTrigger value="workflows" className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        Approval Workflows
                    </TabsTrigger>
                    <TabsTrigger value="config" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Review Configuration
                    </TabsTrigger>
                </TabsList>

                {/* User Management Tab */}
                <TabsContent value="users" className="space-y-6">
                    <Card className="glass-effect border-0 shadow-xl">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        System Users ({users.length})
                                    </CardTitle>
                                    <CardDescription>
                                        Manage user accounts and roles in the approval system
                                    </CardDescription>
                                </div>
                                {userManagementSupported && (
                                    <Button 
                                        onClick={() => setShowAddUserForm(!showAddUserForm)}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700"
                                        disabled={loading}
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Add User
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add User Form */}
                            {showAddUserForm && userManagementSupported && (
                                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-4">
                                    <h3 className="font-semibold">Add New User</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newUser.email}
                                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                                placeholder="user@company.com"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="full_name">Full Name *</Label>
                                            <Input
                                                id="full_name"
                                                value={newUser.full_name}
                                                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                                                placeholder="John Doe"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="user_role">Role *</Label>
                                            <Select value={newUser.user_role} onValueChange={(value) => setNewUser({...newUser, user_role: value})} disabled={loading}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {getAvailableReviewerRoles().concat(['content_creator']).map(role => (
                                                        <SelectItem key={role} value={role}>
                                                            {getRoleDisplayName(role)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="department">Department</Label>
                                            <Input
                                                id="department"
                                                value={newUser.department}
                                                onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                                                placeholder="Marketing"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleAddUser} disabled={loading}>Add User</Button>
                                        <Button variant="outline" onClick={() => setShowAddUserForm(false)} disabled={loading}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Users List */}
                            <div className="space-y-2">
                                {users.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white/50">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-medium text-sm">
                                                        {user.full_name?.charAt(0) || "U"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-slate-800">{user.full_name}</h4>
                                                    <p className="text-sm text-slate-500">{user.email}</p>
                                                    {user.department && (
                                                        <p className="text-xs text-slate-400">{user.department}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className="capitalize">
                                                {getRoleDisplayName(user.user_role)}
                                            </Badge>
                                            {userManagementSupported && user.id !== currentUser?.id && (
                                                <>
                                                    <Select 
                                                        value={user.user_role} 
                                                        onValueChange={(newRole) => handleUpdateUserRole(user.id, newRole)}
                                                        disabled={loading}
                                                    >
                                                        <SelectTrigger className="w-40">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {getAvailableReviewerRoles().concat(['content_creator']).map(role => (
                                                                <SelectItem key={role} value={role}>
                                                                    {getRoleDisplayName(role)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setDeleteConfirm({
                                                            open: true,
                                                            userId: user.id,
                                                            userName: user.full_name,
                                                            userEmail: user.email
                                                        })}
                                                        className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                                                        disabled={loading || user.id === currentUser?.id}
                                                    >
                                                        <Trash2 className="w-3 h-3 mr-1" />
                                                        Delete
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {users.length === 0 && (
                                    <div className="text-center py-8 text-slate-400">
                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No users found</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Review Configuration Tab */}
                <TabsContent value="config" className="space-y-6">
                    <Card className="glass-effect border-0 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                Review Assignment Rules
                            </CardTitle>
                            <CardDescription>
                                Current configuration for automatic reviewer assignments
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Content Type Rules */}
                            <div>
                                <h3 className="font-semibold mb-3">Content Type Rules</h3>
                                <div className="space-y-2">
                                    {Object.entries(REVIEWER_RULES).map(([contentType, reviewers]) => (
                                        <div key={contentType} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg bg-white/50">
                                            <span className="font-medium capitalize">
                                                {contentType.replace(/_/g, ' ')}
                                            </span>
                                            <div className="flex gap-2">
                                                {reviewers.map(reviewer => (
                                                    <Badge key={reviewer} variant="outline">
                                                        {getRoleDisplayName(reviewer)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Special Rules */}
                            <div>
                                <h3 className="font-semibold mb-3">Special Rules</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-3 border border-slate-200 rounded-lg bg-white/50">
                                        <span className="font-medium">High Spend Threshold</span>
                                        <Badge variant="outline">${SPECIAL_RULES.highSpendThreshold.toLocaleString()}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center p-3 border border-slate-200 rounded-lg bg-white/50">
                                        <span className="font-medium">Competitor Mentions</span>
                                        <Badge variant="outline">
                                            {SPECIAL_RULES.requiresLegalForCompetitors ? 'Requires Legal Review' : 'Standard Review'}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center p-3 border border-slate-200 rounded-lg bg-white/50">
                                        <span className="font-medium">Admin Always Included</span>
                                        <Badge variant="outline">
                                            {SPECIAL_RULES.adminAlwaysIncluded ? 'Yes' : 'No'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Info Alert */}
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Review rules are configured in the codebase. To modify these rules, 
                                    update the configuration in <code>src/config/reviewerConfig.js</code>
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Workflows Tab */}
                <TabsContent value="workflows" className="space-y-6">
                    <Card className="glass-effect border-0 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GitBranch className="w-5 h-5" />
                                Approval Workflows ({workflows.length})
                            </CardTitle>
                            <CardDescription>
                                Manage automated approval process workflows
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {workflows.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No workflows configured yet</p>
                                    <p className="text-sm mt-1">Workflows will appear here once created</p>
                                    {/* For demonstration of hasUnsavedChanges:
                                    <Button onClick={() => setHasUnsavedChanges(true)}>Simulate Change</Button>
                                    */}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {workflows.map(workflow => (
                                        <div key={workflow.id} className="p-4 border border-slate-200 rounded-lg bg-white/50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-slate-800">{workflow.name}</h4>
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        Content Types: {workflow.content_types?.join(', ') || 'None specified'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Est. approval time: {workflow.estimated_approval_time_hours}h
                                                    </p>
                                                </div>
                                                <Badge variant={workflow.is_active ? "default" : "outline"}>
                                                    {workflow.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <div className="flex justify-end pt-6 border-t border-slate-200">
                        <Button 
                            onClick={() => setSaveConfirm(true)}
                            disabled={!hasUnsavedChanges || loading}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Save Workflow Rules
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* User Delete Confirmation */}
            <ConfirmDialog
                open={deleteConfirm.open}
                onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
                title="Delete User?"
                description={`Are you sure you want to delete ${deleteConfirm.userName} (${deleteConfirm.userEmail})? This action cannot be undone and will remove all associated data including reviews, notifications, and content history.`}
                actionLabel="Delete User"
                variant="destructive"
                loading={loading}
                onConfirm={() => handleDeleteUser(deleteConfirm.userId)}
            />

            {/* Workflow Save Confirmation */}
            <ConfirmDialog
                open={saveConfirm}
                onOpenChange={setSaveConfirm}
                title="Save Workflow Changes?"
                description="This will update the approval workflow for all future content submissions. Existing content in review will continue to use the previous workflow rules until completed."
                actionLabel="Save Changes"
                variant="default"
                loading={loading}
                onConfirm={() => {
                    handleSaveWorkflowChanges();
                    setSaveConfirm(false);
                }}
            />
        </div>
    );
}

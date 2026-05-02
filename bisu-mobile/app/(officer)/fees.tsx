import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet, Modal, ActivityIndicator, RefreshControl, FlatList, useWindowDimensions } from 'react-native';
import api from '../../services/api';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { 
  Plus, Trash2, Tag, DollarSign, FileText, X, 
  Settings, ChevronRight, Info, AlertCircle, ShoppingBag, 
  UserPlus, Calendar
} from 'lucide-react-native';
import EmptyState from '../../components/ui/EmptyState';

export default function OfficerFees() {
    const { isDark } = useTheme();
    const [fees, setFees] = useState<any[]>([]);
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingFee, setEditingFee] = useState<any>(null);

    const { width } = useWindowDimensions();
    const numColumns = width > 800 ? 2 : 1;

    // Theme variables (matching finance.tsx premium look)
    const bg = isDark ? '#0f172a' : '#f8fafc';
    const cardBg = isDark ? '#1e293b' : '#fff';
    const border = isDark ? '#334155' : '#e2e8f0';
    const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';
    const textMuted = isDark ? '#64748b' : '#94a3b8';
    const modalBg = isDark ? '#1e293b' : '#fff';

    // Form state
    const [orgId, setOrgId] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('membership');

    const fetchData = useCallback(async () => {
        try {
            const [feesRes, orgsRes] = await Promise.all([
                api.get('/fee-types'),
                api.get('/profile/my-organizations')
            ]);
            setFees(feesRes.data.fees || []);
            const officerOrgs = (orgsRes.data || [])
                .filter((d: any) => d.designation?.toLowerCase() !== 'member')
                .map((d: any) => d.organization);
            setOrganizations(officerOrgs);
            if (officerOrgs.length > 0 && !orgId) {
                setOrgId(officerOrgs[0].id.toString());
            }
        } catch (error) {
            console.error('Failed to load fees:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [orgId]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const handleSaveFee = async () => {
        if (!name.trim() || !amount.trim() || !orgId) {
            Alert.alert('Validation Error', 'Please fill in all required fields.');
            return;
        }

        setSubmitting(true);
        try {
            if (editingFee) {
                await api.put(`/fee-types/${editingFee.id}`, {
                    name,
                    description,
                    amount,
                    type,
                });
            } else {
                await api.post('/fee-types', {
                    organization_id: orgId,
                    name,
                    description,
                    amount,
                    type,
                });
            }
            
            setModalVisible(false);
            resetForm();
            fetchData();
            Alert.alert('Success', editingFee ? 'Fee category updated.' : 'Fee category added to your catalog.');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to save fee.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingFee(null);
        setName('');
        setDescription('');
        setAmount('');
        setType('membership');
    };

    const openEditModal = (fee: any) => {
        setEditingFee(fee);
        setOrgId(fee.organization_id.toString());
        setName(fee.name);
        setDescription(fee.description || '');
        setAmount(fee.amount.toString());
        setType(fee.type);
        setModalVisible(true);
    };

    const handleDeleteFee = async (id: number) => {
        Alert.alert(
            'Delete Category',
            'This will remove this fee type from your catalog. Future billing will require recreating it. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/fee-types/${id}`);
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete fee type.');
                        }
                    }
                }
            ]
        );
    };

    const getIconForType = (t: string) => {
        switch(t) {
            case 'membership': return <UserPlus size={18} color="#0fa968" />;
            case 'event': return <Calendar size={18} color="#3b82f6" />;
            case 'penalty': return <AlertCircle size={18} color="#ef4444" />;
            case 'merchandise': return <ShoppingBag size={18} color="#f59e0b" />;
            default: return <Tag size={18} color="#8b5cf6" />;
        }
    };

    const getTypeColor = (t: string) => {
        switch(t) {
            case 'membership': return '#0fa968';
            case 'event': return '#3b82f6';
            case 'penalty': return '#ef4444';
            case 'merchandise': return '#f59e0b';
            default: return '#8b5cf6';
        }
    };

    if (loading && !refreshing) {
        return (
            <OfficerPageWrapper activeRoute="finance">
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
                    <ActivityIndicator size="large" color="#0fa968" />
                </View>
            </OfficerPageWrapper>
        );
    }

    return (
        <OfficerPageWrapper activeRoute="finance">
            <View style={{ flex: 1, backgroundColor: bg }}>
                <View style={{ flex: 1, paddingHorizontal: 20 }}>
                    <View style={{ paddingVertical: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ width: 48, height: 48, backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: border, elevation: 2 }}>
                                <Settings size={24} color="#8b5cf6" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 24, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }}>Fee Catalog</Text>
                                <Text style={{ fontSize: 13, color: textSecondary, marginTop: 2 }}>Define reusable billing categories</Text>
                            </View>
                        </View>
                        
                        <TouchableOpacity 
                            onPress={() => { resetForm(); setModalVisible(true); }} 
                            style={{ backgroundColor: '#0fa968', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, elevation: 4 }}
                        >
                            <Plus size={20} color="#fff" />
                            <Text style={{ color: '#fff', marginLeft: 12, fontSize: width > 600 ? 18 : 16, fontWeight: '800' }}>Add New Category</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={fees}
                        key={numColumns}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={numColumns}
                        columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between' } : undefined}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
                        renderItem={({ item: fee }) => (
                            <View style={{
                                backgroundColor: cardBg,
                                padding: 20,
                                borderRadius: 14,
                                marginBottom: 12,
                                flex: 1,
                                width: numColumns > 1 ? '48%' : '100%',
                                borderWidth: 1,
                                borderColor: border,
                                elevation: 2
                            }}>
                                <Text style={{ fontSize: width > 600 ? 20 : 18, fontWeight: '800', color: textPrimary }}>{fee.name}</Text>
                                <Text style={{ fontSize: width > 600 ? 14 : 13, color: textSecondary, marginTop: 4 }}>{fee.description || 'No description provided'}</Text>
                                <Text style={{ fontSize: width > 600 ? 22 : 18, fontWeight: '900', color: '#0fa968', marginTop: 8 }}>₱{parseFloat(fee.amount).toFixed(2)}</Text>
                                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                                    <TouchableOpacity 
                                        onPress={() => openEditModal(fee)}
                                        style={{ width: 40, height: 40, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}
                                    >
                                        <ChevronRight size={18} color="#3b82f6" />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => handleDeleteFee(fee.id)}
                                        style={{ width: 40, height: 40, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Trash2 size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                </View>
            </View>

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: modalBg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '92%', borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: border }}>
                        <View style={{ width: 50, height: 5, backgroundColor: border, borderRadius: 3, alignSelf: 'center', marginBottom: 24 }} />
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                            <View>
                                <Text style={{ fontSize: 22, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }}>{editingFee ? 'Edit Category' : 'New Fee Category'}</Text>
                                <Text style={{ fontSize: 13, color: textSecondary, marginTop: 4 }}>{editingFee ? 'Update the details for this fee' : 'Add details for the new fee type'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ width: 44, height: 44, backgroundColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                                <X size={22} color={textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                                <View style={{ marginBottom: 24, opacity: editingFee ? 0.5 : 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: textSecondary, marginBottom: 10, marginLeft: 4 }}>Organization Context</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {organizations.map(org => (
                                            <TouchableOpacity 
                                                key={org.id}
                                                disabled={!!editingFee}
                                                onPress={() => setOrgId(org.id.toString())}
                                                style={{ 
                                                    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, marginRight: 10,
                                                    backgroundColor: orgId === org.id.toString() ? '#0fa968' : (isDark ? '#334155' : '#f1f5f9'),
                                                    borderWidth: 1,
                                                    borderColor: orgId === org.id.toString() ? '#0fa968' : border,
                                                    elevation: orgId === org.id.toString() ? 2 : 0
                                                }}
                                            >
                                                <Text style={{ fontSize: 14, fontWeight: '800', color: orgId === org.id.toString() ? '#fff' : textSecondary }}>{org.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: textSecondary, marginBottom: 10, marginLeft: 4 }}>Label</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 18, borderWidth: 1, borderColor: border, paddingHorizontal: 18, height: 56 }}>
                                        <Tag size={20} color={textMuted} />
                                        <TextInput
                                            style={{ flex: 1, marginLeft: 14, color: textPrimary, fontSize: 16, fontWeight: '600' }}
                                            value={name}
                                            onChangeText={setName}
                                            placeholder="e.g. Org Shirt / Membership"
                                            placeholderTextColor={textMuted}
                                        />
                                    </View>
                                </View>

                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: textSecondary, marginBottom: 10, marginLeft: 4 }}>Billing Amount</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 18, borderWidth: 1, borderColor: border, paddingHorizontal: 18, height: 56 }}>
                                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#0fa968' }}>₱</Text>
                                        <TextInput
                                            style={{ flex: 1, marginLeft: 14, color: textPrimary, fontSize: 18, fontWeight: '900' }}
                                            value={amount}
                                            onChangeText={setAmount}
                                            keyboardType="numeric"
                                            placeholder="0.00"
                                            placeholderTextColor={textMuted}
                                        />
                                    </View>
                                </View>

                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: textSecondary, marginBottom: 14, marginLeft: 4 }}>Category Type</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                        {['membership', 'event', 'penalty', 'merchandise', 'other'].map(t => {
                                            const active = type === t;
                                            const color = getTypeColor(t);
                                            return (
                                                <TouchableOpacity 
                                                    key={t}
                                                    onPress={() => setType(t)}
                                                    style={{ 
                                                        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 15,
                                                        backgroundColor: active ? color : (isDark ? '#0f172a' : '#fff'),
                                                        borderWidth: 1,
                                                        borderColor: active ? color : border,
                                                        elevation: active ? 2 : 0
                                                    }}
                                                >
                                                    <View style={{ marginRight: 8 }}>{getIconForType(t)}</View>
                                                    <Text style={{ fontSize: 13, fontWeight: '800', textTransform: 'capitalize', color: active ? '#fff' : textSecondary }}>{t}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                <View style={{ marginBottom: 32 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: textSecondary, marginBottom: 10, marginLeft: 4 }}>Details</Text>
                                    <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 18, borderWidth: 1, borderColor: border, paddingHorizontal: 18, paddingVertical: 16 }}>
                                        <TextInput
                                            style={{ height: 100, textAlignVertical: 'top', color: textPrimary, fontSize: 15, lineHeight: 22 }}
                                            value={description}
                                            onChangeText={setDescription}
                                            multiline
                                            placeholder="Explain what this fee is for..."
                                            placeholderTextColor={textMuted}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    onPress={handleSaveFee}
                                    disabled={submitting}
                                    style={{ backgroundColor: '#0fa968', paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#0fa968', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}
                                >
                                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>{editingFee ? 'Update Category' : 'Save to Catalog'}</Text>}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

        </OfficerPageWrapper>
    );
}

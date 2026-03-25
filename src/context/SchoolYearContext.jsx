import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SchoolYearContext = createContext();

const authH = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export function SchoolYearProvider({ children }) {
    const [schoolYears, setSchoolYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState(
        localStorage.getItem('selected_school_year_id') || null
    );
    const [activeYear, setActiveYear] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchYears = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get('/api/school-years', authH());
            const years = response.data;
            setSchoolYears(years);
            
            const active = years.find(y => y.is_active);
            setActiveYear(active);

            if (!selectedYearId && active) {
                setSelectedYearId(active.id);
                localStorage.setItem('selected_school_year_id', active.id);
            }
        } catch (error) {
            console.error('Error fetching school years:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYears();
    }, []);

    const handleSetSelectedYearId = (id) => {
        const yearId = String(id);
        setSelectedYearId(yearId);
        localStorage.setItem('selected_school_year_id', yearId);
    };

    return (
        <SchoolYearContext.Provider value={{ 
            schoolYears, 
            selectedYearId, 
            setSelectedYearId: handleSetSelectedYearId,
            activeYear,
            loading,
            fetchSchoolYears: fetchYears
        }}>
            {children}
        </SchoolYearContext.Provider>
    );
}

export function useSchoolYear() {
    const context = useContext(SchoolYearContext);
    if (!context) {
        throw new Error('useSchoolYear must be used within a SchoolYearProvider');
    }
    return context;
}

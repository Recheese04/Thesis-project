$files = @(
    "events.tsx",
    "attendance.tsx", 
    "evaluations.tsx",
    "documents.tsx",
    "consequences.tsx",
    "my-checkin.tsx",
    "my-events.tsx",
    "my-attendance.tsx",
    "my-obligations.tsx"
)

$basePath = "c:\xampp_new\htdocs\student_org_management\bisu-mobile\app\(officer)"

# Replacements: className patterns -> style equivalents
# Format: [regex_pattern, replacement]
# We use a custom approach: replace className="..." with style={...} using token variables

foreach ($file in $files) {
    $filePath = Join-Path $basePath $file
    if (-not (Test-Path $filePath)) { continue }
    
    $content = Get-Content $filePath -Raw -Encoding UTF8
    
    # --- BACKGROUND & LAYOUT PATTERNS ---
    # bg-slate-50 flex-1
    $content = $content -replace 'className="flex-1 bg-slate-50"', 'style={{ flex: 1, backgroundColor: bg }}'
    $content = $content -replace 'className="bg-slate-50 flex-1"', 'style={{ flex: 1, backgroundColor: bg }}'
    $content = $content -replace 'className="flex-1 bg-slate-100"', 'style={{ flex: 1, backgroundColor: bg }}'
    $content = $content -replace 'className="bg-slate-100 flex-1"', 'style={{ flex: 1, backgroundColor: bg }}'
    $content = $content -replace 'className="flex-1"', 'style={{ flex: 1 }}'
    
    # Loading spinner views
    $content = $content -replace 'className="flex-1 justify-center items-center"', 'style={{ flex: 1, justifyContent: ''center'', alignItems: ''center'', backgroundColor: bg }}'
    
    # ScrollView flex patterns
    $content = $content -replace 'className="flex-1 px-4 pt-4"', 'style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}'
    $content = $content -replace 'className="flex-1 px-4"', 'style={{ flex: 1, paddingHorizontal: 16 }}'
    
    # --- HEADER SECTION ---
    $content = $content -replace 'className="bg-white px-5 pt-5 pb-4 border-b border-slate-100"', 'style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: borderLight }}'
    $content = $content -replace 'className="bg-white px-5 pt-5 pb-4"', 'style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}'
    $content = $content -replace 'className="bg-white px-5 pt-5 pb-4 border-b border-slate-100 flex-row items-center justify-between"', 'style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: borderLight, flexDirection: ''row'', alignItems: ''center'', justifyContent: ''space-between'' }}'
    
    # --- TEXT PATTERNS ---
    # Primary big titles
    $content = $content -replace 'className="text-2xl font-extrabold text-slate-900"', 'style={{ fontSize: 24, fontWeight: ''800'', color: textPrimary }}'
    $content = $content -replace 'className="text-\[22px\] font-extrabold text-slate-900 leading-tight"', 'style={{ fontSize: 22, fontWeight: ''800'', color: textPrimary }}'
    $content = $content -replace 'className="text-\[22px\] font-extrabold text-slate-900"', 'style={{ fontSize: 22, fontWeight: ''800'', color: textPrimary }}'
    $content = $content -replace 'className="text-\[20px\] font-extrabold text-\[#0f2d5e\]"', 'style={{ fontSize: 20, fontWeight: ''800'', color: textPrimary }}'
    
    # Subtitle text  
    $content = $content -replace 'className="text-slate-500 text-sm mt-1"', 'style={{ color: textSecondary, fontSize: 14, marginTop: 4 }}'
    $content = $content -replace 'className="text-slate-500 text-\[11px\] mt-1"', 'style={{ color: textSecondary, fontSize: 11, marginTop: 4 }}'
    $content = $content -replace 'className="text-slate-500 text-\[11px\] mt-0.5"', 'style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}'
    $content = $content -replace 'className="text-\[11px\] text-slate-500 mt-0.5"', 'style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}'
    $content = $content -replace 'className="text-\[11px\] text-slate-500 ml-1"', 'style={{ fontSize: 11, color: textSecondary, marginLeft: 4 }}'
    $content = $content -replace 'className="text-\[11px\] text-slate-500 ml-1.5 flex-1"', 'style={{ fontSize: 11, color: textSecondary, marginLeft: 6, flex: 1 }}'
    
    # Body text colors
    $content = $content -replace 'className="text-\[14px\] font-extrabold text-slate-900 leading-tight mb-1"', 'style={{ fontSize: 14, fontWeight: ''800'', color: textPrimary, marginBottom: 4 }}'
    $content = $content -replace 'className="text-\[14px\] font-extrabold text-slate-800 leading-tight mb-1"', 'style={{ fontSize: 14, fontWeight: ''800'', color: textPrimary, marginBottom: 4 }}'
    $content = $content -replace 'className="text-\[14px\] font-extrabold text-slate-900 leading-tight"', 'style={{ fontSize: 14, fontWeight: ''800'', color: textPrimary }}'
    $content = $content -replace 'className="text-\[14px\] font-extrabold text-slate-900"', 'style={{ fontSize: 14, fontWeight: ''800'', color: textPrimary }}'
    $content = $content -replace 'className="text-\[15px\] font-extrabold text-slate-900 leading-tight"', 'style={{ fontSize: 15, fontWeight: ''800'', color: textPrimary }}'
    $content = $content -replace 'className="text-\[15px\] font-extrabold text-slate-900"', 'style={{ fontSize: 15, fontWeight: ''800'', color: textPrimary }}'
    $content = $content -replace 'className="text-\[15px\] font-extrabold text-slate-800"', 'style={{ fontSize: 15, fontWeight: ''800'', color: textPrimary }}'
    $content = $content -replace 'className="text-\[13px\] font-extrabold text-slate-900 leading-tight mb-0.5"', 'style={{ fontSize: 13, fontWeight: ''800'', color: textPrimary, marginBottom: 2 }}'
    $content = $content -replace 'className="text-\[13px\] font-extrabold text-slate-900 leading-tight"', 'style={{ fontSize: 13, fontWeight: ''800'', color: textPrimary }}'
    
    # Muted text
    $content = $content -replace 'className="text-slate-400 text-xs font-bold mt-2"', 'style={{ color: textMuted, fontSize: 12, fontWeight: ''700'', marginTop: 8 }}'
    $content = $content -replace 'className="text-xs text-slate-500 mt-0.5"', 'style={{ fontSize: 12, color: textSecondary, marginTop: 2 }}'
    $content = $content -replace 'className="text-xs text-slate-500 ml-1"', 'style={{ fontSize: 12, color: textSecondary, marginLeft: 4 }}'
    $content = $content -replace 'className="text-xs text-slate-500"', 'style={{ fontSize: 12, color: textSecondary }}'
    $content = $content -replace 'className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1"', 'style={{ fontSize: 12, fontWeight: ''700'', color: textMuted, textTransform: ''uppercase'', letterSpacing: 1, marginBottom: 12, marginLeft: 4 }}'
    $content = $content -replace 'className="text-\[10px\] text-slate-400"', 'style={{ fontSize: 10, color: textMuted }}'
    $content = $content -replace 'className="text-\[10px\] text-slate-400 font-medium mb-0.5"', 'style={{ fontSize: 10, color: textMuted, fontWeight: ''500'', marginBottom: 2 }}'
    $content = $content -replace 'className="text-\[10px\] text-slate-400 mt-1"', 'style={{ fontSize: 10, color: textMuted, marginTop: 4 }}'
    $content = $content -replace 'className="text-\[10px\] text-slate-400 font-bold uppercase mt-1"', 'style={{ fontSize: 10, color: textMuted, fontWeight: ''700'', textTransform: ''uppercase'', marginTop: 4 }}'
    $content = $content -replace 'className="text-\[10px\] text-slate-500"', 'style={{ fontSize: 10, color: textSecondary }}'
    
    # --- CARD PATTERNS ---
    $content = $content -replace 'className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100 flex-row items-center"', 'style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border, flexDirection: ''row'', alignItems: ''center'' }}'
    $content = $content -replace 'className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm"', 'style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border }}'
    $content = $content -replace 'className="bg-white rounded-\[20px\] border border-slate-200/60 overflow-hidden shadow-sm mb-6"', 'style={{ backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor: border, overflow: ''hidden'', marginBottom: 24 }}'
    $content = $content -replace 'className="bg-white rounded-\[16px\] w-\[48%\] p-4 mb-3 border border-slate-200 shadow-sm"', 'style={{ backgroundColor: cardBg, borderRadius: 16, width: ''48%'', padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border }}'
    $content = $content -replace 'className="bg-white rounded-\[16px\] w-\[48%\] p-4 border border-slate-200 shadow-sm"', 'style={{ backgroundColor: cardBg, borderRadius: 16, width: ''48%'', padding: 16, borderWidth: 1, borderColor: border }}'
    $content = $content -replace 'className="bg-white rounded-\[20px\] border border-slate-200 shadow-sm pt-6 pb-2 mb-8"', 'style={{ backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor: border, paddingTop: 24, paddingBottom: 8, marginBottom: 32 }}'
    $content = $content -replace 'className="bg-white mx-5 rounded-\[20px\] border border-slate-200 shadow-sm pt-6 pb-2 mb-8"', 'style={{ backgroundColor: cardBg, marginHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: border, paddingTop: 24, paddingBottom: 8, marginBottom: 32 }}'
    
    # Stat cards in white
    $content = $content -replace 'className="bg-white border border-slate-200 rounded-xl p-3 flex-1 m-1 shadow-sm"', 'style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 12, padding: 12, flex: 1, margin: 4 }}'
    $content = $content -replace 'className="bg-white border border-slate-200 rounded-xl p-4 flex-1 m-1"', 'style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 12, padding: 16, flex: 1, margin: 4 }}'
    
    # --- CONTAINER/LAYOUT PATTERNS ---
    $content = $content -replace 'className="flex-row items-center mb-4"', 'style={{ flexDirection: ''row'', alignItems: ''center'', marginBottom: 16 }}'
    $content = $content -replace 'className="flex-row items-center mb-1"', 'style={{ flexDirection: ''row'', alignItems: ''center'', marginBottom: 4 }}'
    $content = $content -replace 'className="flex-row items-center"', 'style={{ flexDirection: ''row'', alignItems: ''center'' }}'
    $content = $content -replace 'className="flex-row items-center mt-2 flex-wrap"', 'style={{ flexDirection: ''row'', alignItems: ''center'', marginTop: 8, flexWrap: ''wrap'' }}'
    $content = $content -replace 'className="flex-row items-center mt-4"', 'style={{ flexDirection: ''row'', alignItems: ''center'', marginTop: 16 }}'
    $content = $content -replace 'className="flex-row items-center gap-2"', 'style={{ flexDirection: ''row'', alignItems: ''center'', gap: 8 }}'
    $content = $content -replace 'className="flex-row justify-between items-start"', 'style={{ flexDirection: ''row'', justifyContent: ''space-between'', alignItems: ''flex-start'' }}'
    $content = $content -replace 'className="flex-row items-start flex-1"', 'style={{ flexDirection: ''row'', alignItems: ''flex-start'', flex: 1 }}'
    $content = $content -replace 'className="flex-row items-start justify-between"', 'style={{ flexDirection: ''row'', alignItems: ''flex-start'', justifyContent: ''space-between'' }}'
    $content = $content -replace 'className="flex-row items-center justify-between"', 'style={{ flexDirection: ''row'', alignItems: ''center'', justifyContent: ''space-between'' }}'
    $content = $content -replace 'className="flex-row items-center justify-between mb-2"', 'style={{ flexDirection: ''row'', alignItems: ''center'', justifyContent: ''space-between'', marginBottom: 8 }}'
    $content = $content -replace 'className="flex-row flex-wrap justify-between"', 'style={{ flexDirection: ''row'', flexWrap: ''wrap'', justifyContent: ''space-between'' }}'
    $content = $content -replace 'className="flex-row"', 'style={{ flexDirection: ''row'' }}'
    $content = $content -replace 'className="flex-1 mr-2"', 'style={{ flex: 1, marginRight: 8 }}'
    $content = $content -replace 'className="flex-1 pr-2"', 'style={{ flex: 1, paddingRight: 8 }}'
    $content = $content -replace 'className="flex-1 pr-3"', 'style={{ flex: 1, paddingRight: 12 }}'
    $content = $content -replace 'className="flex-1 ml-2"', 'style={{ flex: 1, marginLeft: 8 }}'
    $content = $content -replace 'className="flex-1"', 'style={{ flex: 1 }}'
    
    # Padding / spacing views
    $content = $content -replace 'className="px-4 py-4"', 'style={{ paddingHorizontal: 16, paddingVertical: 16 }}'
    $content = $content -replace 'className="px-4 py-1.5 bg-white border-b border-slate-100 flex-row justify-end"', 'style={{ paddingHorizontal: 16, paddingVertical: 6, backgroundColor: cardBg, borderBottomWidth: 1, borderBottomColor: borderLight, flexDirection: ''row'', justifyContent: ''flex-end'' }}'
    $content = $content -replace 'className="px-5 pt-8 pb-6"', 'style={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24 }}'
    $content = $content -replace 'className="px-5 mb-6 flex-row flex-wrap justify-between"', 'style={{ paddingHorizontal: 20, marginBottom: 24, flexDirection: ''row'', flexWrap: ''wrap'', justifyContent: ''space-between'' }}'
    $content = $content -replace 'className="px-5"', 'style={{ paddingHorizontal: 20 }}'
    $content = $content -replace 'className="px-4"', 'style={{ paddingHorizontal: 16 }}'
    $content = $content -replace 'className="mb-4"', 'style={{ marginBottom: 16 }}'
    $content = $content -replace 'className="mb-5"', 'style={{ marginBottom: 20 }}'
    $content = $content -replace 'className="mb-6"', 'style={{ marginBottom: 24 }}'
    $content = $content -replace 'className="mb-2 px-1"', 'style={{ marginBottom: 8, paddingHorizontal: 4 }}'
    $content = $content -replace 'className="h-6"', 'style={{ height: 24 }}'
    $content = $content -replace 'className="h-8"', 'style={{ height: 32 }}'
    $content = $content -replace 'className="h-10"', 'style={{ height: 40 }}'
    $content = $content -replace 'className="h-4"', 'style={{ height: 16 }}'
    $content = $content -replace 'className="py-6"', 'style={{ paddingVertical: 24 }}'
    $content = $content -replace 'className="py-10 items-center justify-center"', 'style={{ paddingVertical: 40, alignItems: ''center'', justifyContent: ''center'' }}'
    
    # --- MODAL PATTERNS ---
    $content = $content -replace 'className="bg-white rounded-t-3xl p-5"', 'style={{ backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}'
    $content = $content -replace 'className="bg-white rounded-t-\[24px\] overflow-hidden"', 'style={{ backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: ''hidden'' }}'
    $content = $content -replace 'className="flex-1 justify-end bg-black/50"', 'style={{ flex: 1, justifyContent: ''flex-end'', backgroundColor: ''rgba(0,0,0,0.5)'' }}'
    $content = $content -replace 'className="items-center mb-4"', 'style={{ alignItems: ''center'', marginBottom: 16 }}'
    $content = $content -replace 'className="w-12 h-1.5 bg-slate-200 rounded-full"', 'style={{ width: 48, height: 6, backgroundColor: isDark ? ''#475569'' : ''#e2e8f0'', borderRadius: 3 }}'
    $content = $content -replace 'className="text-sm font-extrabold text-slate-900 mb-4 px-2"', 'style={{ fontSize: 14, fontWeight: ''800'', color: textPrimary, marginBottom: 16, paddingHorizontal: 8 }}'
    
    # Modal action items
    $content = $content -replace 'className="flex-row items-center p-3 mb-1 bg-slate-50 rounded-xl"', 'style={{ flexDirection: ''row'', alignItems: ''center'', padding: 12, marginBottom: 4, backgroundColor: isDark ? ''#0f172a'' : ''#f8fafc'', borderRadius: 12 }}'
    $content = $content -replace 'className="flex-row items-center p-3 mt-2 bg-red-50 rounded-xl"', 'style={{ flexDirection: ''row'', alignItems: ''center'', padding: 12, marginTop: 8, backgroundColor: isDark ? ''rgba(239,68,68,0.1)'' : ''#fef2f2'', borderRadius: 12 }}'
    $content = $content -replace 'className="ml-3 font-semibold text-slate-700"', 'style={{ marginLeft: 12, fontWeight: ''600'', color: textPrimary }}'
    $content = $content -replace 'className="ml-3 font-semibold text-red-600"', 'style={{ marginLeft: 12, fontWeight: ''600'', color: ''#dc2626'' }}'
    
    # --- INPUT / SEARCH PATTERNS ---
    $content = $content -replace 'className="bg-white rounded-xl flex-row items-center px-3 py-3 border border-slate-200 shadow-sm mb-6"', 'style={{ backgroundColor: inputBg, borderRadius: 12, flexDirection: ''row'', alignItems: ''center'', paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: inputBorder, marginBottom: 24 }}'
    
    # --- STATUS BADGE ---
    $content = $content -replace 'className="bg-green-100 px-2 py-1 rounded-md"', 'style={{ backgroundColor: isDark ? ''rgba(16,185,129,0.15)'' : ''#dcfce7'', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}'
    $content = $content -replace 'className="text-\[10px\] font-extrabold text-green-700"', 'style={{ fontSize: 10, fontWeight: ''800'', color: isDark ? ''#6ee7b7'' : ''#15803d'' }}'
    
    # --- PROGRESS BAR ---
    $content = $content -replace 'className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"', 'style={{ height: 6, width: ''100%'', backgroundColor: isDark ? ''#334155'' : ''#f1f5f9'', borderRadius: 3, overflow: ''hidden'' }}'
    $content = $content -replace 'className="h-full bg-blue-600 rounded-full"', 'style={{ height: ''100%'', backgroundColor: ''#2563eb'', borderRadius: 3 }}'
    
    # Footer / border-t sections
    $content = $content -replace 'className="flex-row items-center justify-between mt-4 pt-3 border-t border-slate-50"', 'style={{ flexDirection: ''row'', alignItems: ''center'', justifyContent: ''space-between'', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: borderLight }}'
    
    # text-[11px] font-bold text-slate-800
    $content = $content -replace 'className="text-\[11px\] font-bold text-slate-800"', 'style={{ fontSize: 11, fontWeight: ''700'', color: textPrimary }}'
    $content = $content -replace 'className="text-\[11px\] text-blue-600 mb-2"', 'style={{ fontSize: 11, color: ''#3b82f6'', marginBottom: 8 }}'
    $content = $content -replace 'className="text-\[11px\] font-medium text-slate-500 mb-2"', 'style={{ fontSize: 11, fontWeight: ''500'', color: textSecondary, marginBottom: 8 }}'
    $content = $content -replace 'className="text-\[22px\] font-extrabold text-slate-900 mb-3"', 'style={{ fontSize: 22, fontWeight: ''800'', color: textPrimary, marginBottom: 12 }}'
    $content = $content -replace 'className="text-\[22px\] font-extrabold text-slate-900"', 'style={{ fontSize: 22, fontWeight: ''800'', color: textPrimary }}'
    $content = $content -replace 'className="text-lg font-bold text-slate-900"', 'style={{ fontSize: 18, fontWeight: ''700'', color: textPrimary }}'
    
    # StatCard bg patterns (events stats)
    $content = $content -replace 'className="bg-white"', 'style={{ backgroundColor: cardBg }}'
    
    # Search bar inner
    $content = $content -replace 'className="flex-row items-center flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mr-2"', 'style={{ flexDirection: ''row'', alignItems: ''center'', flex: 1, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }}'
    $content = $content -replace 'className="flex-1 ml-2 text-xs text-slate-800"', 'style={{ flex: 1, marginLeft: 8, fontSize: 12, color: textPrimary }}'
    
    # Table footer
    $content = $content -replace 'className="bg-slate-50 px-4 py-3 border-t border-slate-100"', 'style={{ backgroundColor: footerBg, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: borderLight }}'
    
    # More text patterns
    $content = $content -replace 'className="font-extrabold text-slate-600"', 'style={{ fontWeight: ''800'', color: textSecondary }}'
    $content = $content -replace 'className="text-\[11px\] text-slate-700 font-medium"', 'style={{ fontSize: 11, color: textPrimary, fontWeight: ''500'' }}'
    $content = $content -replace 'className="text-\[10px\] text-slate-400 mt-2 text-center text-emerald-700/80"', 'style={{ fontSize: 10, color: isDark ? ''#6ee7b7'' : ''#059669'', marginTop: 8, textAlign: ''center'' }}'
    $content = $content -replace 'className="text-sm text-slate-700 leading-relaxed"', 'style={{ fontSize: 14, color: textPrimary, lineHeight: 20 }}'
    
    # p-2 -mr-2 (action btn)
    $content = $content -replace 'className="p-2 -mr-2"', 'style={{ padding: 8, marginRight: -8 }}'
    
    # Toolbar filter dropdown
    $content = $content -replace 'className="bg-slate-50 border border-slate-200 rounded-xl px-3 flex-row items-center justify-between h-\[34px\] w-20"', 'style={{ backgroundColor: isDark ? ''#334155'' : ''#f8fafc'', borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 12, flexDirection: ''row'', alignItems: ''center'', justifyContent: ''space-between'', height: 34, width: 80 }}'
    
    # mb-4 border border-slate-100 rounded-[16px] p-4 bg-white shadow-sm mt-1
    $content = $content -replace 'className="mb-4 border border-slate-100 rounded-\[16px\] p-4 bg-white shadow-sm mt-1"', 'style={{ marginBottom: 16, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 16, backgroundColor: cardBg, marginTop: 4 }}'
    
    # flex-row justify-between items-start mb-1
    $content = $content -replace 'className="flex-row justify-between items-start mb-1"', 'style={{ flexDirection: ''row'', justifyContent: ''space-between'', alignItems: ''flex-start'', marginBottom: 4 }}'
    
    # Additional common patterns
    $content = $content -replace 'className="px-5 mb-5"', 'style={{ paddingHorizontal: 20, marginBottom: 20 }}'
    $content = $content -replace 'className="flex-row mr-3"', 'style={{ flexDirection: ''row'', marginRight: 12 }}'
    $content = $content -replace 'className="mt-1"', 'style={{ marginTop: 4 }}'
    $content = $content -replace 'className="mt-4 pt-3 border-t border-slate-100 pb-1"', 'style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: borderLight, paddingBottom: 4 }}'
    
    # --- STAT CARD BACKGROUNDS (events specific) ---
    # These remain colored since they're accent colors
    
    # --- WHITE TEXT ON ACCENT BGs ---
    $content = $content -replace 'className="text-white font-bold text-\[13px\] ml-1.5"', 'style={{ color: ''#fff'', fontWeight: ''700'', fontSize: 13, marginLeft: 6 }}'
    $content = $content -replace 'className="text-white font-bold text-xs ml-1"', 'style={{ color: ''#fff'', fontWeight: ''700'', fontSize: 12, marginLeft: 4 }}'
    $content = $content -replace 'className="text-white font-bold"', 'style={{ color: ''#fff'', fontWeight: ''700'' }}'
    $content = $content -replace 'className="text-slate-600 font-bold"', 'style={{ color: textSecondary, fontWeight: ''700'' }}'
    $content = $content -replace 'className="text-white font-bold text-\[15px\] ml-2"', 'style={{ color: ''#fff'', fontWeight: ''700'', fontSize: 15, marginLeft: 8 }}'
    
    Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
    Write-Output "DONE: $file"
}

Write-Output "`nAll className replacements complete."

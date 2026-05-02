$files = @(
    "events.tsx",
    "attendance.tsx", 
    "evaluations.tsx",
    "documents.tsx",
    "consequences.tsx",
    "my-checkin.tsx",
    "my-attendance.tsx"
)

$basePath = "c:\xampp_new\htdocs\student_org_management\bisu-mobile\app\(officer)"

foreach ($file in $files) {
    $filePath = Join-Path $basePath $file
    if (-not (Test-Path $filePath)) { continue }
    
    $content = Get-Content $filePath -Raw -Encoding UTF8
    
    # --- ADDITIONAL MODAL PATTERNS ---
    $content = $content -replace 'className="bg-white rounded-t-3xl p-5 max-h-\[70%\]"', 'style={{ backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: ''70%'' }}'
    $content = $content -replace 'className="bg-\[#0f2d5e\] px-5 py-5 flex-row items-start justify-between"', 'style={{ backgroundColor: ''#0f2d5e'', paddingHorizontal: 20, paddingVertical: 20, flexDirection: ''row'', alignItems: ''flex-start'', justifyContent: ''space-between'' }}'
    $content = $content -replace 'className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"', 'style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: ''rgba(255,255,255,0.1)'', alignItems: ''center'', justifyContent: ''center'' }}'
    $content = $content -replace 'className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center mr-3"', 'style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: ''rgba(255,255,255,0.2)'', alignItems: ''center'', justifyContent: ''center'', marginRight: 12 }}'
    $content = $content -replace 'className="flex-row items-center flex-1"', 'style={{ flexDirection: ''row'', alignItems: ''center'', flex: 1 }}'
    $content = $content -replace 'className="text-\[17px\] font-extrabold text-white"', 'style={{ fontSize: 17, fontWeight: ''800'', color: ''#fff'' }}'
    $content = $content -replace 'className="text-blue-200 text-xs mt-0.5"', 'style={{ color: ''#93c5fd'', fontSize: 12, marginTop: 2 }}'
    $content = $content -replace 'className="text-blue-100/80 text-xs mt-1 text-center"', 'style={{ color: ''rgba(219,234,254,0.8)'', fontSize: 12, marginTop: 4, textAlign: ''center'' }}'
    
    # --- FORM INPUTS ---
    $content = $content -replace 'className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-\[15px\] text-slate-800"', 'style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: textPrimary }}'
    $content = $content -replace 'className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex-row items-center justify-between"', 'style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: ''row'', alignItems: ''center'', justifyContent: ''space-between'' }}'
    $content = $content -replace 'className="text-xs font-bold text-slate-700 mb-1.5 ml-1"', 'style={{ fontSize: 12, fontWeight: ''700'', color: textPrimary, marginBottom: 6, marginLeft: 4 }}'
    $content = $content -replace 'className="text-red-500"', 'style={{ color: ''#ef4444'' }}'
    
    # date picker text
    $content = $content -replace "className=\{date \? 'text-slate-800 text-\[15px\]' : 'text-slate-400 text-\[15px\]'\}", 'style={{ fontSize: 15, color: date ? textPrimary : textMuted }}'
    $content = $content -replace "className=\{time \? 'text-slate-800 text-\[15px\]' : 'text-slate-400 text-\[15px\]'\}", 'style={{ fontSize: 15, color: time ? textPrimary : textMuted }}'
    $content = $content -replace "className=\{endTime \? 'text-slate-800 text-\[15px\]' : 'text-slate-400 text-\[15px\]'\}", 'style={{ fontSize: 15, color: endTime ? textPrimary : textMuted }}'
    
    # Status chips in form
    $content = $content -replace "className=\{``px-4 py-2 rounded-xl border mr-2 \$\{status === s \? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-200'\}``\}", "style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginRight: 8, backgroundColor: status === s ? (isDark ? 'rgba(37,99,235,0.1)' : '#eff6ff') : inputBg, borderColor: status === s ? '#2563eb' : inputBorder }}"
    $content = $content -replace "className=\{``text-xs font-bold capitalize \$\{status === s \? 'text-blue-700' : 'text-slate-500'\}``\}", "style={{ fontSize: 12, fontWeight: '700', textTransform: 'capitalize', color: status === s ? '#2563eb' : textSecondary }}"
    
    # --- FORM FOOTER ---
    $content = $content -replace 'className="flex-row border-t border-slate-100 bg-slate-50 px-5 pt-3 pb-6 border-b-0"', 'style={{ flexDirection: ''row'', borderTopWidth: 1, borderTopColor: borderLight, backgroundColor: footerBg, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}'
    $content = $content -replace 'className="flex-1 border border-slate-200 py-3.5 rounded-xl items-center mr-2 bg-white"', 'style={{ flex: 1, borderWidth: 1, borderColor: border, paddingVertical: 14, borderRadius: 12, alignItems: ''center'', marginRight: 8, backgroundColor: cardBg }}'
    
    # --- SCROLLVIEW PATTERNS ---
    $content = $content -replace 'className="px-5 py-5"', 'style={{ paddingHorizontal: 20, paddingVertical: 20 }}'
    $content = $content -replace 'className="px-5 py-4"', 'style={{ paddingHorizontal: 20, paddingVertical: 16 }}'
    
    # --- ICON CONTAINERS ---
    $content = $content -replace 'className="w-12 h-12 rounded-2xl bg-\[#0f2d5e\] items-center justify-center shadow-sm shadow-\[#0f2d5e\]/30 mr-3"', 'style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: ''#0f2d5e'', alignItems: ''center'', justifyContent: ''center'', marginRight: 12 }}'
    $content = $content -replace 'className="w-\[38px\] h-\[38px\] rounded-xl bg-\[#0f2d5e\] items-center justify-center shadow-sm mr-3 mt-0.5"', 'style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: ''#0f2d5e'', alignItems: ''center'', justifyContent: ''center'', marginRight: 12, marginTop: 2 }}'
    $content = $content -replace 'className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mr-3"', 'style={{ width: 48, height: 48, backgroundColor: isDark ? ''rgba(37,99,235,0.15)'' : ''#eff6ff'', borderRadius: 24, alignItems: ''center'', justifyContent: ''center'', marginRight: 12 }}'
    $content = $content -replace 'className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center"', 'style={{ width: 48, height: 48, backgroundColor: isDark ? ''rgba(37,99,235,0.15)'' : ''#eff6ff'', borderRadius: 24, alignItems: ''center'', justifyContent: ''center'' }}'
    $content = $content -replace 'className="w-10 h-10 bg-white border border-slate-200 rounded-xl items-center justify-center shadow-sm"', 'style={{ width: 40, height: 40, backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 12, alignItems: ''center'', justifyContent: ''center'' }}'
    $content = $content -replace 'className="w-8 h-8 rounded-xl bg-white/20 items-center justify-center"', 'style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: ''rgba(255,255,255,0.2)'', alignItems: ''center'', justifyContent: ''center'' }}'
    
    # --- BUTTON ---
    $content = $content -replace 'className="flex-row items-center bg-\[#0f2d5e\] px-4 py-2.5 rounded-xl shadow-sm h-10"', 'style={{ flexDirection: ''row'', alignItems: ''center'', backgroundColor: ''#0f2d5e'', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, height: 40 }}'
    $content = $content -replace 'className="px-4 py-2 bg-blue-50 rounded-lg"', 'style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: isDark ? ''rgba(37,99,235,0.1)'' : ''#eff6ff'', borderRadius: 8 }}'
    $content = $content -replace 'className="text-blue-600 font-bold"', 'style={{ color: ''#2563eb'', fontWeight: ''700'' }}'
    
    # --- QR CODE MODAL ---
    $content = $content -replace 'className="bg-white w-\[85%\] rounded-3xl overflow-hidden shadow-2xl pb-1"', 'style={{ backgroundColor: modalBg, width: ''85%'', borderRadius: 24, overflow: ''hidden'', paddingBottom: 4 }}'
    $content = $content -replace 'className="bg-gradient-to-br from-\[#0f2d5e\] to-\[#1e4db7\] p-5 items-center"', 'style={{ backgroundColor: ''#0f2d5e'', padding: 20, alignItems: ''center'' }}'
    $content = $content -replace 'className="text-white font-extrabold text-lg mt-2 tracking-wide"', 'style={{ color: ''#fff'', fontWeight: ''800'', fontSize: 18, marginTop: 8, letterSpacing: 0.5 }}'
    $content = $content -replace 'className="p-6 items-center"', 'style={{ padding: 24, alignItems: ''center'' }}'
    $content = $content -replace 'className="text-slate-800 font-extrabold text-base text-center mb-4 leading-tight"', 'style={{ color: textPrimary, fontWeight: ''800'', fontSize: 16, textAlign: ''center'', marginBottom: 16 }}'
    $content = $content -replace 'className="p-3 bg-slate-50 rounded-2xl border border-slate-200"', 'style={{ padding: 12, backgroundColor: isDark ? ''#0f172a'' : ''#f8fafc'', borderRadius: 16, borderWidth: 1, borderColor: border }}'
    $content = $content -replace 'className="text-\[10px\] font-mono text-slate-400 mt-4 tracking-widest"', 'style={{ fontSize: 10, fontFamily: ''monospace'', color: textMuted, marginTop: 16, letterSpacing: 1 }}'
    $content = $content -replace 'className="border-t border-slate-100 py-4 items-center bg-slate-50/50"', 'style={{ borderTopWidth: 1, borderTopColor: borderLight, paddingVertical: 16, alignItems: ''center'', backgroundColor: footerBg }}'
    $content = $content -replace 'className="text-\[#0f2d5e\] font-extrabold text-\[13px\] uppercase tracking-wider"', 'style={{ color: isDark ? ''#93c5fd'' : ''#0f2d5e'', fontWeight: ''800'', fontSize: 13, textTransform: ''uppercase'', letterSpacing: 0.5 }}'
    
    # --- iOS PICKER ---
    $content = $content -replace 'className="absolute bottom-0 w-full bg-white px-4 pb-8 pt-4 border-t border-slate-200 shadow-2xl z-50"', 'style={{ position: ''absolute'', bottom: 0, width: ''100%'', backgroundColor: modalBg, paddingHorizontal: 16, paddingBottom: 32, paddingTop: 16, borderTopWidth: 1, borderTopColor: border, zIndex: 50 }}'
    $content = $content -replace 'className="flex-row justify-end mb-2"', 'style={{ flexDirection: ''row'', justifyContent: ''flex-end'', marginBottom: 8 }}'
    
    # --- EVENT CARD INNER PATTERNS ---
    $content = $content -replace 'className="flex-row flex-wrap items-center gap-y-1"', 'style={{ flexDirection: ''row'', flexWrap: ''wrap'', alignItems: ''center'' }}'
    $content = $content -replace 'className="flex-row items-center mr-3"', 'style={{ flexDirection: ''row'', alignItems: ''center'', marginRight: 12 }}'
    $content = $content -replace 'className="text-\[11px\] text-slate-500 ml-1"', 'style={{ fontSize: 11, color: textSecondary, marginLeft: 4 }}'
    
    # --- STAT CARDS (colored) ---
    $content = $content -replace 'className="text-\[9px\] font-extrabold text-white/70 uppercase tracking-widest mb-1"', 'style={{ fontSize: 9, fontWeight: ''800'', color: ''rgba(255,255,255,0.7)'', textTransform: ''uppercase'', letterSpacing: 1, marginBottom: 4 }}'
    $content = $content -replace 'className="text-3xl font-extrabold text-white"', 'style={{ fontSize: 28, fontWeight: ''800'', color: ''#fff'' }}'
    $content = $content -replace 'className="text-\[10px\] text-white/70 mt-0.5"', 'style={{ fontSize: 10, color: ''rgba(255,255,255,0.7)'', marginTop: 2 }}'
    $content = $content -replace 'className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10"', 'style={{ position: ''absolute'', right: -20, top: -20, width: 96, height: 96, borderRadius: 48, backgroundColor: ''rgba(255,255,255,0.1)'' }}'
    $content = $content -replace 'className="absolute -right-2 -bottom-8 w-32 h-32 rounded-full bg-white/5"', 'style={{ position: ''absolute'', right: -8, bottom: -32, width: 128, height: 128, borderRadius: 64, backgroundColor: ''rgba(255,255,255,0.05)'' }}'
    $content = $content -replace 'className="flex-row justify-between items-start z-10"', 'style={{ flexDirection: ''row'', justifyContent: ''space-between'', alignItems: ''flex-start'', zIndex: 10 }}'
    
    # overflow hidden with border patterns
    $content = $content -replace 'className="bg-white px-4 py-3 border-b border-slate-100 flex-row items-center justify-between bg-white z-10"', 'style={{ backgroundColor: cardBg, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderLight, flexDirection: ''row'', alignItems: ''center'', justifyContent: ''space-between'', zIndex: 10 }}'
    $content = $content -replace 'className="px-4 py-3 border-b border-slate-100 flex-row items-center justify-between bg-white z-10"', 'style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderLight, flexDirection: ''row'', alignItems: ''center'', justifyContent: ''space-between'', backgroundColor: cardBg, zIndex: 10 }}'
    
    # --- STAT CARD CONTAINERS with dynamic classnames like `bg-[#244b7d]` ---
    # These should stay since bg color is part of the design accent
    # But we need to handle the rounded-[20px] pattern
    $content = $content -replace 'className="rounded-\[20px\] p-4 flex-1 m-1 relative overflow-hidden"', 'style={{ borderRadius: 20, padding: 16, flex: 1, margin: 4, position: ''relative'', overflow: ''hidden'' }}'
    
    # Missing: absolute bottom-3 right-4
    $content = $content -replace 'className="absolute bottom-3 right-4"', 'style={{ position: ''absolute'', bottom: 12, right: 16 }}'
    
    # Submit button dynamic
    $content = $content -replace "className=\{``flex-\[2\] bg-\[#0f2d5e\] py-3.5 rounded-xl items-center flex-row justify-center \$\{submitting \? 'opacity-70' : ''\}``\}", "style={{ flex: 2, backgroundColor: '#0f2d5e', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}"
    
    # Badge with className text-[10px] font-extrabold capitalize ml-1
    $content = $content -replace 'className="text-\[10px\] font-extrabold capitalize ml-1"', 'style={{ fontSize: 10, fontWeight: ''800'', textTransform: ''capitalize'', marginLeft: 4 }}'
    
    # self-start with border
    $content = $content -replace "className=\{``self-start flex-row items-center border px-2 py-0.5 rounded-md mb-2 \$\{getStatusStyle\(ev\.status\)\}``\}", "style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 8, ...getStatusStyle(ev.status) }}"
    
    # -- Stat card with colored bg wrapper --
    # Handle the bgClass variant
    $content = $content -replace "className=\{``rounded-\[20px\] p-4 flex-1 m-1 relative overflow-hidden \$\{bgClass\}``\}", "style={[{ borderRadius: 20, padding: 16, flex: 1, margin: 4, position: 'relative', overflow: 'hidden' }, bgClass]}"
    
    # p-4 border-b patterns with dynamic index
    $content = $content -replace "className=\{``p-4 \$\{!isLast \? 'border-b border-slate-100' : ''\}``\}", "style={{ padding: 16, ...(!isLast ? { borderBottomWidth: 1, borderBottomColor: borderLight } : {}) }}"
    
    # mr-1.5 patterns
    $content = $content -replace 'className="mr-1.5"', 'style={{ marginRight: 6 }}'
    
    Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
    Write-Output "DONE pass2: $file"
}

Write-Output "`nPass 2 complete."

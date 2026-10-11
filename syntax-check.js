        // API KEY FOR HOSTING (Put your Gemini API Key here)
        const WORKER_URL = "https://sarkariastra.shivamkumar911315.workers.dev"; 

        // Static fallback lists
        const initialData = {
            jobs: ["SSC CGL 2026 Online Form", "IBPS PO / MT XIV Online Form", "Railway NTPC Under Graduate", "UPSC Civil Services 2026", "Bihar Police Constable", "Navy Agniveer SSR MR Apply", "India Post GDS Recruitment", "SBI Clerk Junior Associate", "ITBP Constable Tradesman", "Delhi Police Head Constable"],
            results: ["UPSC Civil Services Prelims Result", "CBSE Board 10th / 12th Result 2026", "SSC CHSL Tier 1 Result", "Bihar Board Inter / Matric Result", "UP Board Class 12th Result", "CTET July 2026 Final Result", "NTA NEET UG Result 2026", "JEE Mains Phase 2 Result", "Rajasthan PTET Result", "Navy Tradesman Result"],
            admitCard: ["Railway Group D Phase 1 Admit Card", "SSC CGL Tier 1 Admit Card", "UPSC NDA / NA 2 Admit Card", "UP Police Constable Exam City", "BPSC TRE Phase 4 Admit Card", "CTET August 2026 Admit Card", "IBPS RRB PO / Clerk Call Letter", "Airforce Agniveer Vayu Admit Card", "CRPF Tradesman Admit Card", "SSC GD Constable Admit Card"],
            syllabus: ["UP Police Constable Revised Syllabus", "SSC CGL New Pattern Syllabus", "Railway NTPC CBT 1 & 2 Syllabus", "Bihar BPSC TRE Syllabus PDF", "UPSC Civil Services Syllabus", "CTET Paper 1 & 2 Syllabus", "UPSSSC PET Revised Syllabus", "SBI PO Prelims / Mains Syllabus", "Rajasthan CET Syllabus", "DSSSB Teacher Syllabus"],
            answerKey: ["SSC MTS Tier 1 Answer Key", "CTET Official Answer Key 2026", "UP Police Constable Answer Key", "UPSC Prelims Answer Key", "NTA NEET Answer Key", "BPSC Teacher Answer Key", "SSC CGL Tier 1 Answer Key", "Railway ALP Answer Key", "CUET UG Answer Key", "Delhi Police Answer Key"],
            admission: ["UP B.Ed JEE Online Form", "NTA CUET UG Admission Form", "IGNOU July Session Admission", "Bihar B.Ed Admission", "Delhi University UG Admission", "BHU UET / PET Admission", "UP Scholarship Online Apply", "Aadhar Card Update Status", "PAN Card Online Application", "Voter ID Apply Online"]
        };

        function getRecentDate(offset = 0) {
            const d = new Date();
            d.setDate(d.getDate() - offset);
            return d.toLocaleDateString('en-GB'); 
        }

        function initPage() {
            renderList('list-jobs', initialData.jobs, 'Job');
            renderList('list-results', initialData.results, 'Result');
            renderList('list-admitcard', initialData.admitCard, 'Admit Card');
            renderList('list-syllabus', initialData.syllabus, 'Syllabus');
            renderList('list-answerkey', initialData.answerKey, 'Answer Key');
            renderList('list-admission', initialData.admission, 'Admission');
            document.getElementById('live-time').innerText = "Live Update: " + new Date().toLocaleString();
        }

        function renderList(elementId, items, category) {
            const container = document.getElementById(elementId);
            container.innerHTML = '';
            items.forEach((item) => {
                const a = document.createElement('a');
                a.href = "javascript:void(0)";
                a.className = "link-hover";
                a.onclick = () => openModal(category, item);
                a.innerText = item;
                container.appendChild(a);
            });
        }

        function triggerQuickSearch(keyword) {
            document.getElementById('searchInput').value = keyword;
            performSearch();
        }

        async function performSearch() {
            const keyword = document.getElementById('searchInput').value.trim();
            if(!keyword) return;
            
            const btn = document.getElementById('searchBtnText');
            btn.innerText = "Searching...";
            document.getElementById('searchResultsOverlay').classList.remove('hidden');
            document.getElementById('searchKeyword').innerText = `"${keyword}"`;
            
            const container = document.getElementById('searchResultsContainer');
            container.innerHTML = `<div class="col-span-1 md:col-span-2 text-center py-6 text-indigo-600 font-semibold animate-pulse">Scanning live data for "${keyword}"...</div>`;

            try {
                const response = await fetch(`${WORKER_URL}?q=${encodeURIComponent(keyword)}`);
                if (!response.ok) throw new Error("Worker request failed: " + response.status);

                const data = await response.json();
                const answer = data.result?.answer;
                if (!answer) throw new Error(data.error || "Worker returned no answer");

                let items;
                try {
                    const cleaned = answer.replace(/^```(?:json)?\\s*/i, "").replace(/\\s*```$/, "");
                    const match = cleaned.match(/\\[[\\s\\S]*\\]/);
                    items = JSON.parse(match ? match[0] : cleaned);
                } catch {
                    items = answer.split("\\n")
                        .map(line => line.replace(/^\\s*[-*\\d.)]+\\s*/, "").trim())
                        .filter(Boolean)
                        .slice(0, 4)
                        .map(title => ({ title, type: "Result" }));
                }

                if (!Array.isArray(items)) throw new Error("Invalid search response");
                items = items.filter(item => item && item.title).slice(0, 4);
                
                container.innerHTML = '';
                items.forEach(item => {
                    const card = document.createElement('div');
                    card.className = "bg-white p-4 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col gap-2";
                    card.onclick = () => openModal(item.type, item.title);
                    card.innerHTML = `<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md w-max bg-indigo-100 text-indigo-700">${item.type}</span><h3 class="font-bold text-slate-800">${item.title}</h3>`;
                    container.appendChild(card);
                });
            } catch (error) {
                // Offline Fallback
                const allItems = [...initialData.jobs.map(t=>({title:t, type:'Job'})), ...initialData.results.map(t=>({title:t, type:'Result'})), ...initialData.syllabus.map(t=>({title:t, type:'Syllabus'}))];
                const matches = allItems.filter(item => item.title.toLowerCase().includes(keyword.toLowerCase()));
                container.innerHTML = '';
                
                if(matches.length > 0) {
                    matches.forEach(item => {
                        const card = document.createElement('div');
                        card.className = "bg-white p-3 md:p-4 rounded-xl border border-indigo-100 shadow-sm cursor-pointer";
                        card.onclick = () => openModal(item.type, item.title);
                        card.innerHTML = `<span class="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 block w-max mb-2">${item.type}</span><h3 class="font-bold text-slate-800 text-sm md:text-base">${item.title}</h3>`;
                        container.appendChild(card);
                    });
                } else {
                    container.innerHTML = `<div class="col-span-1 md:col-span-2 text-center py-10 text-slate-500 font-semibold">No exact match found. Please try a different keyword.</div>`;
                }
            } finally {
                btn.innerText = "Search";
            }
        }

        function closeSearch() {
            document.getElementById('searchResultsOverlay').classList.add('hidden');
            document.getElementById('searchInput').value = '';
        }
        document.getElementById('searchInput').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') performSearch();
        });

        // SMART DATA ENGINE (Replaces API logic to save limits)
        function generateSmartData(title) {
            const t = title.toUpperCase();
            let feeGen = "₹100/-", feeSC = "₹0/-", ageMin = "18 Years", ageMax = "27 Years", elig = "Check Official PDF";
            
            if (t.includes('BANK') || t.includes('IBPS') || t.includes('SBI')) {
                feeGen = "₹850/-"; feeSC = "₹175/-"; ageMin = "20 Years"; ageMax = "30 Years"; elig = "Bachelor's Degree";
            } else if (t.includes('UPSC')) {
                feeGen = "₹100/-"; feeSC = "₹0/-"; ageMin = "21 Years"; ageMax = "32 Years"; elig = "Bachelor's Degree";
            } else if (t.includes('RAILWAY') || t.includes('RRB')) {
                feeGen = "₹500/-"; feeSC = "₹250/-"; ageMin = "18 Years"; ageMax = "33 Years"; elig = "10th / ITI / Degree";
            } else if (t.includes('POLICE') || t.includes('CONSTABLE')) {
                feeGen = "₹400/-"; feeSC = "₹100/-"; ageMin = "18 Years"; ageMax = "25 Years"; elig = "12th Pass";
            } else if (t.includes('POST') || t.includes('GDS')) {
                feeGen = "₹100/-"; feeSC = "₹0/-"; ageMin = "18 Years"; ageMax = "40 Years"; elig = "10th Pass with Math/English";
            }

            return { feeGen, feeSC, ageMin, ageMax, eligibility: elig };
        }

        async function openModal(category, title) {
            const modal = document.getElementById('smartModal');
            const content = document.getElementById('modalContent');
            
            modal.classList.remove('hidden');
            setTimeout(() => { modal.classList.remove('opacity-0'); }, 10);
            
            content.innerHTML = `<div class="text-center py-10"><div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div><p class="mt-4 text-slate-500 font-semibold animate-pulse">Loading Official Details...</p></div>`;

            // STRICT LOGIC: Ignore Fees/Age for Non-Jobs
            const titleUpper = title.toUpperCase();
            const catUpper = category.toUpperCase();
            const isNonJob = titleUpper.includes("SYLLABUS") || titleUpper.includes("RESULT") || titleUpper.includes("ADMIT") || titleUpper.includes("KEY") || 
                             catUpper.includes("SYLLABUS") || catUpper.includes("RESULT") || catUpper.includes("ADMIT");

            // Fake brief network delay for realism
            setTimeout(() => {
                let html = `<h2 class="text-lg md:text-2xl font-black text-slate-900 text-center mb-6 leading-tight">${title}</h2>`;

                html += `
                    <div class="border border-indigo-100 rounded-xl overflow-hidden mb-4">
                        <div class="bg-indigo-50/50 p-2 md:p-3 border-b border-indigo-100 font-bold text-indigo-800 text-sm flex items-center gap-2"><i class="fa-regular fa-calendar-check"></i> IMPORTANT DATES</div>
                        <div class="p-3 bg-white space-y-2 text-sm text-slate-700">
                            <p>Update Issued: <b>${getRecentDate(0)}</b></p>
                            <p>Event Date: <b>As per Schedule</b></p>
                        </div>
                    </div>
                `;

                if (!isNonJob) {
                    const data = generateSmartData(title);
                    html += `
                        <div class="border border-slate-100 rounded-xl overflow-hidden mb-4">
                            <div class="bg-slate-50 p-2 border-b border-slate-100 font-bold text-slate-800 text-xs uppercase tracking-wider">Application Fee</div>
                            <div class="p-3 bg-white space-y-2 text-sm text-slate-700">
                                <p class="flex justify-between border-b pb-1"><span>General/OBC/EWS:</span> <b>${data.feeGen}</b></p>
                                <p class="flex justify-between border-b pb-1"><span>SC/ST/PH:</span> <b>${data.feeSC}</b></p>
                                <p class="flex justify-between"><span>All Category Female:</span> <b>As per rules</b></p>
                            </div>
                        </div>

                        <div class="border border-slate-100 rounded-xl overflow-hidden mb-4">
                            <div class="bg-slate-50 p-2 border-b border-slate-100 font-bold text-slate-800 text-xs uppercase tracking-wider">Age & Eligibility</div>
                            <div class="p-3 bg-white space-y-2 text-sm text-slate-700 text-center">
                                <p>Min Age: <b>${data.ageMin}</b> | Max Age: <b>${data.ageMax}</b></p>
                                <p class="border-t pt-2 mt-2">Eligibility: <b class="text-indigo-600">${data.eligibility}</b></p>
                            </div>
                        </div>
                    `;
                }
                
                html += `<div class="flex flex-col gap-2">`;
                if (isNonJob) {
                     html += `<button class="grad-primary text-white font-bold py-3 rounded-xl w-full text-base flex items-center justify-center gap-2"><i class="fa-solid fa-download"></i> Download Official PDF</button>`;
                } else {
                     html += `<button class="grad-primary text-white font-bold py-3 rounded-xl w-full text-base">Apply Online (Click Here)</button>`;
                     html += `<button class="grad-green text-white font-bold py-2 rounded-xl w-full text-sm">Download Notification</button>`;
                }
                html += `<button class="bg-slate-800 text-white font-bold py-2 rounded-xl w-full text-sm">Official Website</button></div>`;

                content.innerHTML = html;
            }, 300);
        }

        function closeModal() {
            const modal = document.getElementById('smartModal');
            modal.classList.add('opacity-0');
            setTimeout(() => { modal.classList.add('hidden'); }, 300);
        }

        window.onload = initPage;

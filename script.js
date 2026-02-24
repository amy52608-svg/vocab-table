document.addEventListener('DOMContentLoaded', () => {
    // State
    let vocabData = [];
    let filteredData = [];

    // DOM Elements
    const vocabBody = document.getElementById('vocabBody');
    const searchInput = document.getElementById('searchInput');
    const yearFilter = document.getElementById('yearFilter');
    const exportBtn = document.getElementById('exportBtn');
    const totalCount = document.getElementById('totalCount');
    const noResults = document.getElementById('noResults');
    const tableEl = document.getElementById('vocabTable');

    // Load Data
    fetch('vocab_data.json')
        .then(response => response.json())
        .then(data => {
            vocabData = data;
            filteredData = [...vocabData];

            // Populate Year Filter Dropdown
            populateYearFilter();

            // Initial Render
            renderTable(filteredData);
        })
        .catch(err => {
            console.error('Failed to load vocabulary data:', err);
            vocabBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--error);">Failed to load data. Please ensure you are running on a local server.</td></tr>';
        });

    function populateYearFilter() {
        // Extract unique years using Set
        const years = [...new Set(vocabData.map(item => String(item['來源年份']).trim()))]
            .filter(y => y)
            .sort((a, b) => b.localeCompare(a)); // Sort descending (e.g., 114 -> 113)

        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });
    }

    function getDifficultyClass(diffStr) {
        if (!diffStr) return '';
        if (diffStr.includes('初級') || diffStr.includes('低') || diffStr.includes('簡單') || diffStr.includes('容易')) return 'easy';
        if (diffStr.includes('中級') || diffStr.includes('中等')) return 'med';
        if (diffStr.includes('高級') || diffStr.includes('難') || diffStr.includes('困難') || diffStr.includes('高')) return 'hard';
        return '';
    }

    function renderTable(dataToRender) {
        vocabBody.innerHTML = '';
        totalCount.textContent = dataToRender.length;

        if (dataToRender.length === 0) {
            tableEl.style.display = 'none';
            noResults.style.display = 'flex';
            return;
        }

        tableEl.style.display = 'table';
        noResults.style.display = 'none';

        // Fragment for performance
        const fragment = document.createDocumentFragment();

        dataToRender.forEach(item => {
            const tr = document.createElement('tr');

            const word = item['單字'] || '';
            const meaning = item['詞性與解釋'] || item['解釋'] || '';
            // Example sentence key varies, find the one with '語境例句' or '例句'
            const sentenceKey = Object.keys(item).find(k => k.includes('例句')) || '';
            const sentence = sentenceKey ? item[sentenceKey] : '';
            const difficulty = item['單字難度'] || '未標示';
            const year = item['來源年份'] || '';

            const diffClass = getDifficultyClass(difficulty);

            tr.innerHTML = `
                <td class="col-word"><span class="word-text">${word}</span></td>
                <td class="col-meaning"><span class="meaning-text">${meaning}</span></td>
                <td class="col-sentence"><span class="sentence-text">${sentence}</span></td>
                <td class="col-difficulty" style="text-align: center;">
                    <span class="badge diff-badge ${diffClass}">${difficulty}</span>
                </td>
                <td class="col-year" style="text-align: center;">
                    <span class="badge year-badge">${year}</span>
                </td>
            `;
            fragment.appendChild(tr);
        });

        vocabBody.appendChild(fragment);
    }

    function applyFilters() {
        const query = searchInput.value.toLowerCase().trim();
        const selectedYear = yearFilter.value;

        filteredData = vocabData.filter(item => {
            // Check Year
            const yearMatch = selectedYear === 'all' || String(item['來源年份']).trim() === selectedYear;

            // Check Search Query (Word, Meaning, Sentence)
            let searchMatch = true;
            if (query) {
                const word = (item['單字'] || '').toLowerCase();
                const meaning = (item['詞性與解釋'] || item['解釋'] || '').toLowerCase();
                const sentenceKey = Object.keys(item).find(k => k.includes('例句')) || '';
                const sentence = sentenceKey ? String(item[sentenceKey]).toLowerCase() : '';

                searchMatch = word.includes(query) || meaning.includes(query) || sentence.includes(query);
            }

            return yearMatch && searchMatch;
        });

        renderTable(filteredData);
    }

    // Event Listeners for Filters
    searchInput.addEventListener('input', applyFilters);
    yearFilter.addEventListener('change', applyFilters);

    // Export to Excel using SheetJS
    exportBtn.addEventListener('click', () => {
        if (filteredData.length === 0) {
            alert('目前沒有資料可以匯出。');
            return;
        }

        // Prepare data for export (clean up keys if needed)
        const exportData = filteredData.map(item => {
            // Extract the actual example sentence dynamically
            const sentenceKey = Object.keys(item).find(k => k.includes('例句')) || '例句';
            return {
                '來源年份': item['來源年份'],
                '單字難度': item['單字難度'],
                '單字': item['單字'],
                '詞性與解釋': item['詞性與解釋'] || item['解釋'],
                '例句': item[sentenceKey]
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Define column widths
        const wscols = [
            { wch: 10 }, // 年份
            { wch: 10 }, // 難度
            { wch: 20 }, // 單字
            { wch: 40 }, // 解釋
            { wch: 80 }  // 例句
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vocabulary");

        // Generate dynamic filename
        const yearStr = yearFilter.value === 'all' ? '全部年份' : `${yearFilter.value}年`;
        const filename = `台大英文單字_${yearStr}_共${filteredData.length}字.xlsx`;

        XLSX.writeFile(workbook, filename);
    });
});

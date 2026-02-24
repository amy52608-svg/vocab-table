import pandas as pd
import json

file_path = r'c:\Users\amy52\SynologyDrive\antigravity\工作區\英文.xlsx'
out_path = r'c:\Users\amy52\SynologyDrive\antigravity\vocab_table\vocab_data.json'

try:
    xls = pd.ExcelFile(file_path)
    all_data = []
    
    for sheet_name in xls.sheet_names:
        # Read without header assumption to see what we actually have
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        
        # We know we want 3 columns: Word, Meaning, Sentence
        # Let's clean the dataframe based on typical layout
        
        cleaned_records = []
        for index, row in df.iterrows():
            row_vals = row.fillna('').astype(str).tolist()
            # Clean up spacing
            row_vals = [str(x).replace('\n', ' ').strip() for x in row_vals]
            
            # Find the first column that has English letters (likely the word)
            word = ''
            meaning = ''
            sentence = ''
            
            # Let's just grab the first 3 non-empty columns as an approximation if headers are a mess
            non_empty_cols = [x for x in row_vals if x]
            
            # Skip rows where the first column contains "單字" or "詞性" (these are header rows)
            if non_empty_cols and '單字' in non_empty_cols[0]:
                continue
                
            if len(non_empty_cols) >= 2:
                # Assume Col 1 is word, Col 2 is meaning, Col 3 (if exists) is sentence
                word = non_empty_cols[0]
                meaning = non_empty_cols[1]
                if len(non_empty_cols) >= 3:
                    sentence = non_empty_cols[2]
                
                # Double check to prevent adding completely junk rows
                # A word usually doesn't have Chinese characters
                import re
                if not re.search(r'[\u4e00-\u9fff]', word) and len(word) > 1:
                    record = {
                        '單字': word,
                        '詞性與解釋': meaning,
                        '例句': sentence,
                        '單字難度': '中等',  # Default
                        '來源年份': sheet_name
                    }
                    cleaned_records.append(record)
                    
        all_data.extend(cleaned_records)
        
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully extracted {len(all_data)} valid words from {len(xls.sheet_names)} sheets.")
except Exception as e:
    print(f"Error: {e}")
